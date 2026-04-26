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
      postedAt,
      educationLevel,
      qualification,
      industry,
      skills,
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

    // 6. Calcul de la confiance d'extraction (ratio de champs importants remplis)
    const importantFields = [
      title,
      company,
      location,
      contractType,
      salaryMin,
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
        salary_min: salaryMin ?? null,
        salary_max: salaryMax ?? null,
        currency: salaryCurrency || 'EUR',
        salary_period: salaryPeriod || null,
        description: description || null,
        posted_at: postedAt || null,
        education_level: educationLevel || null,
        qualification: qualification || null,
        industry: industry || null,
        skills: skills && skills.length > 0 ? skills : null,
        status: 'to_apply',
        import_status: 'imported_extension',
        parser_name: 'jfmj-extension',
        parser_version: '0.4.0',
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