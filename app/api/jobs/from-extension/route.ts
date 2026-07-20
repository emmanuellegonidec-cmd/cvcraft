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

type ExtractedSalary = {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
};

const EMPTY_SALARY: ExtractedSalary = {
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  salaryPeriod: null,
};

async function extractSalaryFromDescription(
  description: string | null | undefined
): Promise<ExtractedSalary> {
  // Pas de description exploitable -> rien à analyser.
  if (!description || description.trim().length < 20) {
    return EMPTY_SALARY;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Pas de clé configurée : on n'invente rien, salaire vide.
    return EMPTY_SALARY;
  }

  const prompt =
    'Tu es un assistant spécialisé dans la lecture d\'offres d\'emploi.\n\n'
    + 'Voici le texte d\'une offre d\'emploi (description du poste) :\n'
    + '"""\n'
    + description + '\n'
    + '"""\n\n'
    + 'Ta seule tâche : trouver le salaire RÉELLEMENT ÉCRIT par le recruteur dans ce texte.\n\n'
    + 'Règles strictes :\n'
    + '- N\'extrais un salaire QUE s\'il est explicitement écrit dans le texte ci-dessus.\n'
    + '- Si aucun salaire n\'est écrit, réponds avec des valeurs null. N\'invente jamais de fourchette.\n'
    + '- "80k€", "80 k€", "80K" signifient 80000. Convertis toujours en nombre entier (ex: 80000).\n'
    + '- Si une fourchette est donnée (ex: "45 à 55 k€"), remplis min et max.\n'
    + '- Si un seul montant fixe est donné (ex: "Budget: 80k€ fixe"), mets-le dans min et laisse max à null.\n'
    + '- Ignore le variable / bonus / primes : ne compte que le fixe. ("80k€ fixe (+8k€ variable)" -> min 80000, max null).\n'
    + '- currency : "EUR", "USD" ou "GBP" selon le symbole (€, $, £). Par défaut "EUR" si un montant est trouvé sans symbole.\n'
    + '- period : "YEAR" (par an), "MONTH" (par mois), "DAY" (par jour) ou "HOUR" (par heure). Par défaut "YEAR" pour un salaire annuel.\n\n'
    + 'Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après :\n'
    + '{\n'
    + '  "salaryMin": nombre ou null,\n'
    + '  "salaryMax": nombre ou null,\n'
    + '  "salaryCurrency": "EUR" ou "USD" ou "GBP" ou null,\n'
    + '  "salaryPeriod": "YEAR" ou "MONTH" ou "DAY" ou "HOUR" ou null\n'
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
        max_tokens: 300,
        thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return EMPTY_SALARY;

    const data = await response.json();

    const textBlock =
      data?.content
        ?.filter((b: { type: string }) => b.type === 'text')
        ?.at(-1)?.text ?? '';

    const cleaned = textBlock.replace(/```json|```/g, '').trim();
    if (!cleaned) return EMPTY_SALARY;

    const parsed = JSON.parse(cleaned);

    // Normalisation défensive : on ne garde que des nombres valides.
    const min =
      typeof parsed.salaryMin === 'number' && isFinite(parsed.salaryMin)
        ? parsed.salaryMin
        : null;
    const max =
      typeof parsed.salaryMax === 'number' && isFinite(parsed.salaryMax)
        ? parsed.salaryMax
        : null;

    // Aucun montant exploitable -> salaire vide (currency/period seuls n'ont pas de sens).
    if (min === null && max === null) {
      return EMPTY_SALARY;
    }

    const currency =
      parsed.salaryCurrency === 'EUR' ||
      parsed.salaryCurrency === 'USD' ||
      parsed.salaryCurrency === 'GBP'
        ? parsed.salaryCurrency
        : 'EUR';

    const period =
      parsed.salaryPeriod === 'YEAR' ||
      parsed.salaryPeriod === 'MONTH' ||
      parsed.salaryPeriod === 'DAY' ||
      parsed.salaryPeriod === 'HOUR'
        ? parsed.salaryPeriod
        : 'YEAR';

    return {
      salaryMin: min,
      salaryMax: max,
      salaryCurrency: currency,
      salaryPeriod: period,
    };
  } catch {
    // Toute erreur (réseau, JSON invalide...) -> salaire vide, l'import continue.
    return EMPTY_SALARY;
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

    // 5 bis. Session 11 : extraction du salaire par l'IA depuis la description.
    // Le résultat REMPLACE le salaire envoyé par l'extension (souvent une
    // estimation fausse de la plateforme). Rien trouvé -> salaire vide.
    const aiSalary = await extractSalaryFromDescription(description);
    const finalSalaryMin = aiSalary.salaryMin;
    const finalSalaryMax = aiSalary.salaryMax;
    const finalSalaryCurrency = aiSalary.salaryCurrency;
    const finalSalaryPeriod = aiSalary.salaryPeriod;

    // 6. Calcul de la confiance d'extraction (ratio de champs importants remplis)
    const importantFields = [
      title,
      company,
      location,
      contractType,
      finalSalaryMin,
      description,
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
        job_type: contractType || null,
        employment_type: workSchedule || null,
        working_hours: workingHours || null,
        // Session 11 : salaire issu de l'analyse IA de la description.
        salary_min: finalSalaryMin ?? null,
        salary_max: finalSalaryMax ?? null,
        currency: finalSalaryCurrency || 'EUR',
        salary_period: finalSalaryPeriod || null,
        description: description || null,
        requirements: requirements || null,
        company_description: companyDescription || null,
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
