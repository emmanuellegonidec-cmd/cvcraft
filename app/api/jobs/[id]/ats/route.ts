import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// SYSTEM PROMPT — Grille ATS cachée côté serveur (non exposée au user/concurrent)
// ============================================================================
const ATS_SYSTEM_PROMPT = `Tu es un système ATS (Applicant Tracking System) professionnel.
Ta mission : évaluer rigoureusement et de manière REPRODUCTIBLE un CV face à une description de poste,
ET produire une analyse RICHE et DENSE qui donne au candidat une vraie valeur pédagogique.

====================
RÈGLES TOUJOURS
====================
1. Suivre le pipeline en 3 étapes dans l'ordre (extraction → matching → scoring)
2. Utiliser UNIQUEMENT les maximums fixés dans la grille ci-dessous
3. Justifier chaque sous-score par un critère précis de la grille
4. Retourner uniquement du JSON valide, sans markdown ni texte avant ou après
5. Produire une analyse DENSE : minimum 5 points forts, 5 points faibles, 4 recommandations

====================
RÈGLES JAMAIS
====================
1. Ne jamais inventer un contenu absent du CV
2. Ne jamais dépasser les maximums par dimension
3. Ne jamais donner un score "par défaut" sans justification
4. Ne jamais ajuster arbitrairement pour atteindre un score rond
5. Ne jamais confondre "absent" et "à améliorer" dans les erreurs
6. Ne jamais rester vague — chaque point doit être SPÉCIFIQUE au CV analysé

====================
PIPELINE D'ÉVALUATION (3 étapes forcées)
====================

### ÉTAPE 1 — Extraction du JD
Extraire 15 à 20 keywords/expressions-clés de la description du poste.
Classer mentalement en : hard skills / soft skills / outils / domaine.
Ne garder que les termes DISTINCTIFS (exclure "motivé", "rigoureux", "autonome", "polyvalent", "dynamique").

### ÉTAPE 2 — Matching CV ↔ keywords
Pour chaque keyword extrait à l'étape 1 :
- PRÉSENT : le terme exact ou une variante claire figure dans le CV
- ABSENT : aucune trace dans le CV
Calculer : couverture_pct = round((nb_presents / nb_total) × 100)

### ÉTAPE 3 — Scoring par dimension (total /100)
Appliquer STRICTEMENT la grille ci-dessous. Chaque critère vaut les points indiqués, rien d'autre.

====================
GRILLE DE NOTATION — 7 dimensions, total /100
====================

### Dimension 1 — format (max /15)
• PDF contient du texte sélectionnable (pas un scan OCR) : +5
• Pas de tableaux complexes pour structurer le contenu : +4
• Pas d'infos critiques placées dans header/footer du PDF : +3
• Pas de texte mis en image ou SVG : +3

### Dimension 2 — lisibilite_ats (max /15)
• Single-column (pas de sidebar ni layout 2 colonnes) : +5
• Police standard (Arial, Calibri, Helvetica, Times, Georgia) : +4
• Taille de police ≥ 10pt partout : +3
• Caractères ATS-safe (pas d'em-dash —, smart quotes " ", NBSP non normalisés) : +3

### Dimension 3 — infos_obligatoires (max /10)
• Email présent et bien formaté : +3
• Téléphone présent : +2
• Ville / localisation : +2
• LinkedIn : +2
• Titre ou poste visé clair en tête de CV : +1

### Dimension 4 — structure (max /10)
• Headers de section standards reconnaissables (Expérience, Formation, Compétences) : +4
• Ordre canonique : Profil → Expérience → Formation → Compétences : +3
• Hiérarchie visuelle claire (titres > sous-titres > corps) : +3

### Dimension 5 — experiences (max /25)
• Au moins 3 expériences pertinentes au poste visé : +5
• Dates claires au format cohérent (mois/année) : +5
• Verbes d'action en début de bullet (Piloté, Conçu, Développé, Géré...) : +5
• Résultats chiffrés dans ≥ 60% des bullets : +5
• Technologies/outils/méthodes explicites par expérience : +5

### Dimension 6 — competences (max /15)
• Section compétences présente et identifiable : +3
• Au moins 8 compétences listées : +3
• Mélange hard skills + soft skills : +3
• Outils/technologies spécifiques cités (pas juste "maîtrise Office") : +3
• Niveau ou années d'expérience indiqués si pertinent : +3

### Dimension 7 — matching (max /10)
• Couverture keywords : ≥70% → 4 / 60-70% → 3 / 40-60% → 2 / <40% → 0
• Titre du CV cohérent avec le titre du poste : +2
• Expériences les plus récentes en lien direct avec le poste : +2
• Compétences essentielles du JD toutes présentes : +2

====================
CONSIGNES DE RÉDACTION (pour valeur perçue maximale)
====================

POINTS FORTS (5 à 8 items) :
- Chacun doit citer un élément PRÉCIS du CV (ex: "Résultats chiffrés dans 4 expériences sur 5 : +32% CA, -15% churn")
- Éviter les généralités ("bon CV", "bien structuré")
- Mixer : contenu, structure, format, matching

POINTS FAIBLES (5 à 8 items) :
- Chacun doit pointer un élément MANQUANT ou AMÉLIORABLE du CV
- Être précis : pas "le profil est faible" mais "le résumé professionnel fait seulement 2 lignes et ne mentionne pas le secteur visé"
- Mixer : contenu, format, matching

ERREURS (ne laisser aucune catégorie vide si possible) :
- critiques : bloquent le passage ATS (scan, 2 colonnes, texte en image, infos dans footer)
- majeures : impact fort sur le match (keywords manquants critiques, compétences clés absentes)
- mineures : améliorations souhaitables (formatage dates, densité skills, etc.)

RECOMMANDATIONS (4 à 6 items, triées par priorité croissante 1=plus urgent) :
- Chaque recommandation doit être ACTIONNABLE immédiatement
- Format : verbe d'action + cible précise (ex: "Ajouter 'Next.js' dans la section Compétences et dans au moins une expérience pour combler le gap critique")
- Impact : "critique" = sans quoi le CV sera rejeté / "majeur" = gain de match significatif / "mineur" = polish

====================
FORMAT DE RÉPONSE (JSON strict)
====================
{
  "score_global": <somme des 7 sous-scores>,
  "scores": {
    "format": <0-15>,
    "lisibilite_ats": <0-15>,
    "infos_obligatoires": <0-10>,
    "structure": <0-10>,
    "experiences": <0-25>,
    "competences": <0-15>,
    "matching": <0-10>
  },
  "format_pdf_eval": "<ex: 'PDF texte — lisible par les ATS' ou 'Scan OCR détecté — illisible ATS'>",
  "keywords": {
    "extraits_du_poste": ["kw1", "kw2", "..."],
    "presents_dans_cv": ["kw1", "..."],
    "manquants_critiques": ["kw2", "..."],
    "couverture_pct": <0-100>
  },
  "analyse_contenu": {
    "points_forts": ["Point fort 1 très spécifique", "Point fort 2", "...", "Point fort 5 au minimum"],
    "points_faibles": ["Point faible 1 très spécifique", "Point faible 2", "...", "Point faible 5 au minimum"]
  },
  "erreurs": {
    "critiques": ["..."],
    "majeures": ["..."],
    "mineures": ["..."]
  },
  "recommandations": [
    { "priorite": 1, "impact": "critique", "action": "Action concrète et spécifique" },
    { "priorite": 2, "impact": "majeur", "action": "..." },
    { "priorite": 3, "impact": "majeur", "action": "..." },
    { "priorite": 4, "impact": "mineur", "action": "..." }
  ]
}

NE PAS inclure 'analyse_fichier' dans ta réponse — ce champ est calculé côté serveur.
Les recommandations sont triées par priorité croissante (1 = le plus urgent).`

// ============================================================================
// AUTH HELPER
// ============================================================================
async function getAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) {
      const authedClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
      return { user, supabase: authedClient }
    }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

// ============================================================================
// HELPERS — Analyse fichier côté serveur
// ============================================================================
function formatPoids(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function extractFilename(url: string): string {
  try {
    const parts = url.split('?')[0].split('/')
    const last = parts[parts.length - 1]
    return decodeURIComponent(last || 'cv.pdf')
  } catch {
    return 'cv.pdf'
  }
}

function countPdfPages(buffer: Buffer): number {
  try {
    const text = buffer.toString('latin1')
    const matches = text.match(/\/Type\s*\/Page[^s]/g) || []
    return matches.length
  } catch {
    return 0
  }
}

function evaluateStructurePages(nbPages: number): string {
  if (nbPages === 0) return 'Non détecté'
  if (nbPages === 1) return '1 page — format idéal'
  if (nbPages === 2) return '2 pages — dans la norme'
  if (nbPages <= 3) return `${nbPages} pages — acceptable pour profils seniors`
  return `${nbPages} pages — trop long pour un ATS (réduire à 2 max)`
}

// ============================================================================
// POST /api/jobs/[id]/ats
// ============================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await getAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const jobId = params.id

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, description, user_id, cv_url, ats_analysis_count')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 })
    }

    if (!job.cv_url) {
      return NextResponse.json(
        { error: 'Aucun CV trouvé pour cette offre. Veuillez d\'abord uploader votre CV dans la section Documents.' },
        { status: 400 }
      )
    }

    const currentCount = job.ats_analysis_count || 0
    if (currentCount >= 3) {
      return NextResponse.json(
        { error: 'Limite de 3 analyses ATS atteinte pour cette offre.' },
        { status: 429 }
      )
    }

    const cvResponse = await fetch(job.cv_url)
    if (!cvResponse.ok) {
      return NextResponse.json({ error: 'Impossible de télécharger le CV' }, { status: 500 })
    }

    const arrayBuffer = await cvResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    const nbPages = countPdfPages(buffer)
    const poids = formatPoids(arrayBuffer.byteLength)
    const nomFichier = extractFilename(job.cv_url)

    const userPrompt = `Analyse ce CV face à l'offre ci-dessous en suivant le pipeline strict défini dans tes instructions système.

**Poste :** ${job.title}
**Entreprise :** ${job.company || 'Non précisée'}

**Description du poste :**
${job.description || 'Description non disponible — signale-le dans erreurs.majeures et fixe matching à 0.'}

Le CV au format PDF est joint. Applique rigoureusement la grille de notation /100.
Rappel : 
- Compte bien la couverture keywords (étape 2) avant de scorer la dimension matching
- Produis minimum 5 points forts, 5 points faibles et 4 recommandations priorisées
- Chaque point doit être SPÉCIFIQUE au CV analysé (pas de généralités)`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: ATS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            } as any,
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('')

    const clean = rawText.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : clean

    let atsResult: any
    try {
      atsResult = JSON.parse(jsonStr)
    } catch (parseErr) {
      console.error('Parse JSON échoué, texte brut:', rawText)
      return NextResponse.json(
        { error: 'Réponse de l\'IA mal formée. Réessayez.' },
        { status: 500 }
      )
    }

    atsResult.analyse_fichier = {
      format_pdf: atsResult.format_pdf_eval || 'PDF (évaluation indisponible)',
      poids: poids,
      nom_fichier: nomFichier,
      nombre_pages: nbPages,
      structure_pages: evaluateStructurePages(nbPages),
    }
    delete atsResult.format_pdf_eval

    const s = atsResult.scores || {}
    atsResult.score_global =
      (s.format || 0) +
      (s.lisibilite_ats || 0) +
      (s.infos_obligatoires || 0) +
      (s.structure || 0) +
      (s.experiences || 0) +
      (s.competences || 0) +
      (s.matching || 0)

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        ats_result: atsResult,
        ats_analysis_count: currentCount + 1,
      })
      .eq('id', jobId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erreur sauvegarde ats_result:', updateError)
    }

    return NextResponse.json({
      success: true,
      result: atsResult,
      analyses_restantes: 3 - (currentCount + 1),
    })
  } catch (err: any) {
    console.error('Erreur API ATS:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
