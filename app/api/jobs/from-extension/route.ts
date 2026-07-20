import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// CORS : l'extension Chrome appelle cette route depuis chrome-extension://[id]
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Client Supabase authentifié avec le Bearer token de l'utilisateur
function createAuthedClient(token: string) {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ============================================================
// Session 11 — Extraction du salaire par l'IA depuis la description.
//
// Pourquoi : les jobboards (LinkedIn en tête) affichent souvent une ESTIMATION
// de salaire calculée par la plateforme, que l'extension scrape par erreur à la
// place du vrai salaire écrit par le recruteur. Le vrai salaire, lui, est écrit
// en texte libre dans la description ("Budget: 80k€ fixe (+8k€ de variable)").
//
// Principe : au moment de l'import, on demande à Claude de relire la description
// et d'en extraire UNIQUEMENT le salaire réellement écrit par le recruteur.
// - Un salaire est trouvé  -> il REMPLACE celui envoyé par l'extension.
// - Aucun salaire trouvé   -> champs salaire VIDES (on n'affiche jamais l'estimation).
//
// Garde-fou : si l'appel IA échoue (réseau, clé, timeout...), l'import continue
// quand même (salaire vide). On ne bloque JAMAIS un import à cause du salaire.
//
// Point de passage commun : cette route reçoit TOUS les sites (France Travail,
// WTJ, LinkedIn, APEC, et Indeed/HelloWork à venir). La correction vaut donc
// pour l'ensemble des jobboards, sans mise à jour de l'extension.
// ============================================================

type ExtractedFromDescription = {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  // Session 12 : la présentation de l'entreprise est souvent noyée dans la
  // description du poste. L'IA la recopie VERBATIM (sans jamais la réécrire)
  // pour la placer dans le champ entreprise. La description reste inchangée.
  companyPassage: string | null; // texte entreprise recopié tel quel, ou null si rien
  // Session 13 : type de contrat déduit de la description UNIQUEMENT s'il y est
  // écrit clairement. Corrige le cas APEC où l'extension attrapait un mauvais
  // contrat (ex: "Alternance" pioché ailleurs sur la page pour une offre CDI).
  contractType: string | null;
};

const EMPTY_EXTRACTION: ExtractedFromDescription = {
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  salaryPeriod: null,
  companyPassage: null,
  contractType: null,
};

// Session 11 : conversion robuste vers un nombre.
// L'IA peut renvoyer le montant comme un nombre (80000) ou comme du texte
// ("80000", "80 000", "80 000 €", "80k", "80K€"). On accepte tous ces cas.
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }

  let s = value.trim().toLowerCase();
  if (!s) return null;

  // Gestion du suffixe "k" (milliers) : "80k" -> 80000
  const hasK = /\d\s*k/.test(s);

  // On ne garde que les chiffres, la virgule et le point (on retire €, espaces, "k"...).
  s = s.replace(/[^0-9.,]/g, '');
  if (!s) return null;

  // Virgule décimale française -> point.
  s = s.replace(',', '.');

  let n = parseFloat(s);
  if (!isFinite(n)) return null;

  if (hasK) n = n * 1000;

  return Math.round(n);
}

async function extractFromDescription(
  description: string | null | undefined
): Promise<ExtractedFromDescription> {
  // Pas de description exploitable -> rien à analyser.
  if (!description || description.trim().length < 20) {
    return EMPTY_EXTRACTION;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Pas de clé configurée : on n'invente rien.
    return EMPTY_EXTRACTION;
  }

  const prompt =
    'Tu es un assistant spécialisé dans la lecture d\'offres d\'emploi.\n\n'
    + 'Voici le texte d\'une offre d\'emploi (description du poste) :\n'
    + '"""\n'
    + description + '\n'
    + '"""\n\n'
    + 'Tu dois EXTRAIRE trois choses depuis ce texte, sans JAMAIS le réécrire.\n\n'
    + '1) LE SALAIRE réellement écrit par le recruteur :\n'
    + '- N\'extrais un salaire QUE s\'il est explicitement écrit dans le texte. Sinon, valeurs null. N\'invente jamais.\n'
    + '- "80k€", "80 k€", "80K" signifient 80000. Convertis en nombre entier (ex: 80000).\n'
    + '- Si une fourchette est donnée (ex: "45 à 55 k€"), remplis min et max.\n'
    + '- Si un montant fixe est donné SANS variable (ex: "Budget: 80k€ fixe"), mets-le dans min et laisse max à null.\n'
    + '- Si un fixe ET un variable/bonus sont donnés (ex: "80k€ fixe (+8k€ de variable)"), mets le FIXE dans min et le TOTAL fixe+variable dans max. Exemple -> min 80000, max 88000.\n'
    + '- currency : "EUR", "USD" ou "GBP" selon le symbole (€, $, £). Par défaut "EUR" si un montant est trouvé sans symbole.\n'
    + '- period : "YEAR" (par an), "MONTH" (par mois), "DAY" (par jour) ou "HOUR" (par heure). Par défaut "YEAR".\n\n'
    + '2) LA PRÉSENTATION DE L\'ENTREPRISE si elle est présente dans le texte (qui est l\'entreprise, son activité, son secteur, sa taille, ses valeurs, ses chiffres clés).\n'
    + 'RÈGLE ABSOLUE : recopie ce passage MOT POUR MOT, exactement comme dans le texte ci-dessus, caractère pour caractère. Ne le reformule pas, ne le résume pas, ne corrige aucune faute, ne change aucun espace ni ponctuation. Si tu n\'es pas sûr, renvoie null.\n'
    + 'Ne recopie QUE la partie qui parle de l\'entreprise, PAS les missions du poste ni le profil recherché. Si aucune présentation d\'entreprise n\'est présente, renvoie null.\n\n'
    + '3) LE TYPE DE CONTRAT du poste, UNIQUEMENT s\'il est clairement écrit dans le texte :\n'
    + '- Valeurs possibles : "CDI", "CDD", "Stage", "Alternance", "Freelance", "Intérim", "Temporaire".\n'
    + '- Ne le déduis QUE du contrat proposé pour CE poste. Ignore les mentions d\'autres contrats qui ne concernent pas le poste (ex: "vous encadrerez des alternants" ne veut PAS dire que le poste est en alternance).\n'
    + '- Si le type de contrat n\'est pas clairement écrit, renvoie null (surtout ne devine pas).\n\n'
    + 'Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après :\n'
    + '{\n'
    + '  "salaryMin": nombre ou null,\n'
    + '  "salaryMax": nombre ou null,\n'
    + '  "salaryCurrency": "EUR" ou "USD" ou "GBP" ou null,\n'
    + '  "salaryPeriod": "YEAR" ou "MONTH" ou "DAY" ou "HOUR" ou null,\n'
    + '  "companyPassage": "le passage entreprise recopié mot pour mot" ou null,\n'
    + '  "contractType": "CDI" ou "CDD" ou "Stage" ou "Alternance" ou "Freelance" ou "Intérim" ou "Temporaire" ou null\n'
    + '}';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return EMPTY_EXTRACTION;

    const data = await response.json();

    const textBlock =
      data?.content
        ?.filter((b: { type: string }) => b.type === 'text')
        ?.at(-1)?.text ?? '';

    const cleaned = textBlock.replace(/```json|```/g, '').trim();
    if (!cleaned) return EMPTY_EXTRACTION;

    const parsed = JSON.parse(cleaned);

    // --- Salaire ---
    // L'IA peut renvoyer le montant comme nombre (80000) ou texte ("80 000", "80k").
    const min = toNumber(parsed.salaryMin);
    const max = toNumber(parsed.salaryMax);

    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    let salaryCurrency: string | null = null;
    let salaryPeriod: string | null = null;

    if (min !== null || max !== null) {
      salaryMin = min;
      salaryMax = max;
      salaryCurrency =
        parsed.salaryCurrency === 'EUR' ||
        parsed.salaryCurrency === 'USD' ||
        parsed.salaryCurrency === 'GBP'
          ? parsed.salaryCurrency
          : 'EUR';
      salaryPeriod =
        parsed.salaryPeriod === 'YEAR' ||
        parsed.salaryPeriod === 'MONTH' ||
        parsed.salaryPeriod === 'DAY' ||
        parsed.salaryPeriod === 'HOUR'
          ? parsed.salaryPeriod
          : 'YEAR';
    }

    // --- Passage entreprise (verbatim) ---
    const companyPassage =
      typeof parsed.companyPassage === 'string' &&
      parsed.companyPassage.trim().length >= 20
        ? parsed.companyPassage.trim()
        : null;

    // --- Type de contrat (validé contre la liste autorisée) ---
    const allowedContracts = [
      'CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim', 'Temporaire',
    ];
    const contractType =
      typeof parsed.contractType === 'string' &&
      allowedContracts.includes(parsed.contractType)
        ? parsed.contractType
        : null;

    return {
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      companyPassage,
      contractType,
    };
  } catch {
    // Toute erreur (réseau, JSON invalide...) -> rien, l'import continue.
    return EMPTY_EXTRACTION;
  }
}

// Préflight CORS (envoyé automatiquement par Chrome avant le POST)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification via Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Non connecté (token manquant)' },
        { status: 401, headers: CORS_HEADERS }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createAuthedClient(token);

    // 2. Récupérer l'utilisateur depuis le token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Token invalide ou expiré' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 3. Parser le body
    const body = await request.json();
    const {
      source,
      externalId,
      url,
      title,
      company,
      location,
      contractType,
      workSchedule,
      workingHours,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      description,
      requirements,
      companyDescription,
      postedAt,
      educationLevel,
      qualification,
      industry,
      skills,
      // Session 10 Bloc 1 : nouveau champ texte construit côté scrapers
      // (concaténation des champs secondaires : Durée / Posté le / Expérience /
      // Qualification / Formation / Secteur). Modifiable par l'utilisateur dans
      // le sidepanel avant envoi.
      informationsComplementaires,
    } = body;

    // 4. Validation minimale
    if (!externalId || !title) {
      return NextResponse.json(
        { ok: false, error: 'Champs obligatoires manquants : externalId, title' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 5. Vérifier si la carte existe déjà (dédoublonnage)
    const { data: existing, error: existingError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('external_job_id', externalId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: 'Erreur vérification doublon : ' + existingError.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    if (existing) {
      return NextResponse.json(
        { ok: true, jobId: existing.id, status: 'already_exists' },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // 5 bis. Extraction par l'IA depuis la description (salaire + entreprise).
    // Le salaire REMPLACE celui de l'extension (souvent une estimation fausse).
    // Le passage entreprise est recopié verbatim par l'IA (jamais réécrit) et
    // placé dans son champ dédié. La description du poste reste inchangée.
    const ai = await extractFromDescription(description);

    const finalSalaryMin = ai.salaryMin;
    const finalSalaryMax = ai.salaryMax;
    const finalSalaryCurrency = ai.salaryCurrency;
    const finalSalaryPeriod = ai.salaryPeriod;

    // Description entreprise :
    // - on garde en priorité celle envoyée par l'extension (bloc dédié fiable),
    // - sinon on prend le passage entreprise repéré dans la description.
    const extensionCompanyDesc =
      companyDescription && String(companyDescription).trim()
        ? companyDescription
        : null;
    const finalCompanyDescription = extensionCompanyDesc ?? ai.companyPassage;

    // Session 12 (mode "Copier") : la description du poste n'est JAMAIS modifiée.
    // Le passage entreprise est seulement RECOPIÉ dans son champ dédié ci-dessus ;
    // il reste aussi dans la description, telle que le recruteur l'a écrite.
    const finalDescription = description || null;

    // Session 13 : type de contrat.
    // - Si l'IA a trouvé un contrat clairement écrit dans la description -> il PRIME
    //   (corrige le cas APEC où l'extension attrape un mauvais contrat sur la page).
    // - Sinon on garde le contrat scrapé par l'extension (fiable sur les autres sites).
    const finalContractType = ai.contractType ?? contractType ?? null;

    // 6. Calcul de la confiance d'extraction (ratio de champs importants remplis)
    const importantFields = [
      title,
      company,
      location,
      finalContractType,
      finalSalaryMin,
      finalDescription,
      postedAt,
    ];
    const filledFields = importantFields.filter(
      (f) => f != null && f !== ''
    ).length;
    const confidence = filledFields / importantFields.length;

    // 7. Insertion de la carte
    const { data: inserted, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        external_job_id: externalId,
        source_url: url || null,
        source_platform: source || 'France Travail',
        title,
        company: company || null,
        location: location || null,
        job_type: finalContractType || null,
        employment_type: workSchedule || null,
        working_hours: workingHours || null,
        // Session 11 : salaire issu de l'analyse IA de la description.
        salary_min: finalSalaryMin ?? null,
        salary_max: finalSalaryMax ?? null,
        currency: finalSalaryCurrency || 'EUR',
        salary_period: finalSalaryPeriod || null,
        // Session 12 : description nettoyée du passage entreprise + entreprise déplacée.
        description: finalDescription || null,
        requirements: requirements || null,
        company_description: finalCompanyDescription || null,
        posted_at: postedAt || null,
        education_level: educationLevel || null,
        qualification: qualification || null,
        industry: industry || null,
        skills: skills && skills.length > 0 ? skills : null,
        // Session 10 Bloc 1 : persistance du champ texte multi-lignes
        informations_complementaires: informationsComplementaires || null,
        status: 'to_apply',
        import_status: 'imported_extension',
        parser_name: 'jfmj-extension',
        parser_version: '0.9.12',
        extraction_confidence: confidence,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: 'Erreur création carte : ' + insertError.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { ok: true, jobId: inserted.id, status: 'created' },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'Erreur serveur : ' + (err?.message || 'inconnue') },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
