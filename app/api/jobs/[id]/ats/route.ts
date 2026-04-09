import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const ATS_SYSTEM_PROMPT = `Tu es un système ATS (Applicant Tracking System) avancé utilisé par des recruteurs professionnels.

Ta mission est d'analyser un CV de manière rigoureuse, structurée et objective afin d'évaluer :
1. Sa lisibilité pour un ATS
2. La qualité et richesse de son contenu
3. Sa conformité à des critères standards de CV professionnel
4. Sa pertinence par rapport au poste cible fourni

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown, sans backticks.

Format de réponse :
{
  "score_global": 74,
  "scores": {
    "format": 12,
    "lisibilite_ats": 10,
    "infos_obligatoires": 8,
    "structure": 7,
    "experiences": 22,
    "competences": 8,
    "matching": 7
  },
  "analyse_fichier": {
    "format_pdf": "✅",
    "poids": "< 200ko",
    "nom_fichier": "✅",
    "structure_pages": "✅"
  },
  "analyse_contenu": {
    "points_forts": ["Point fort 1", "Point fort 2"],
    "points_faibles": ["Point faible 1", "Point faible 2"]
  },
  "erreurs": {
    "critiques": ["Erreur critique 1"],
    "majeures": ["Erreur majeure 1"],
    "mineures": ["Erreur mineure 1"]
  },
  "recommandations": ["Recommandation 1", "Recommandation 2"]
}`

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

    // Récupérer le job avec sa description et le chemin du CV
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, description, user_id, cv_url')
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

    // Télécharger le CV depuis Supabase Storage (bucket job-documents)
    const { data: fileData, error: fileError } = await supabase.storage
      .from('job-documents')
      .download(job.cv_url)

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'Impossible de lire le CV : ' + fileError?.message }, { status: 500 })
    }

    // Convertir en base64
    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Construire le prompt avec la description du poste
    const userPrompt = `Analyse ce CV par rapport au poste suivant :

**Poste :** ${job.title}
**Entreprise :** ${job.company || 'Non précisée'}

**Description du poste :**
${job.description || 'Description non disponible'}

Voici le CV à analyser (fichier PDF ci-joint).`

    // Appel Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
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
    const atsResult = JSON.parse(clean)

    // Sauvegarder dans jobs.ats_result
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ ats_result: atsResult })
      .eq('id', jobId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erreur sauvegarde ats_result:', updateError)
    }

    return NextResponse.json({ success: true, result: atsResult })
  } catch (err: any) {
    console.error('Erreur API ATS:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
