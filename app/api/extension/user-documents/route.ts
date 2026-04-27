import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// ──────────────────────────────────────────────────────────────────
// CORS — autoriser les appels depuis l'extension Chrome
// ──────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ──────────────────────────────────────────────────────────────────
// Auth : Bearer token (pattern projet, identique aux autres routes extension)
// ──────────────────────────────────────────────────────────────────
function createAuthedClient(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

async function getAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createAuthedClient(token);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return { userId: user.id, supabase };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, supabase };
}

// ──────────────────────────────────────────────────────────────────
// Helpers display name
// ──────────────────────────────────────────────────────────────────
function getJobLabel(job: any): string {
  if (!job) return 'Offre supprimée';
  const title = job.title || 'Sans titre';
  const company = job.company ? ` — ${job.company}` : '';
  return `${title}${company}`;
}

// ──────────────────────────────────────────────────────────────────
// Récupération des CV (Creator + uploads)
// ──────────────────────────────────────────────────────────────────
async function getCvs(userId: string, supabase: any, profile: any) {
  const cvs: any[] = [];

  // Creator CVs
  const { data: creatorCvs } = await supabase
    .from('cvs')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (creatorCvs && creatorCvs.length) {
    for (const cv of creatorCvs) {
      cvs.push({
        ref: `creator:${cv.id}`,
        source: 'creator',
        display_name: cv.title || 'CV sans titre',
        is_analyzable: false,
        is_default: profile?.default_cv_ref === `creator:${cv.id}`,
      });
    }
  }

  // Uploaded CVs (bucket job-documents → user_id/job_id/cv*.pdf)
  const { data: storageList } = await supabase.storage
    .from('job-documents')
    .list(userId, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

  if (storageList && storageList.length) {
    for (const folder of storageList) {
      // Chaque entrée du niveau 1 est un job_id (dossier)
      if (!folder.name) continue;
      const { data: jobFiles } = await supabase.storage
        .from('job-documents')
        .list(`${userId}/${folder.name}`, { limit: 50 });

      if (!jobFiles) continue;

      for (const f of jobFiles) {
        // On ne garde que les fichiers cv*.pdf
        if (!f.name.toLowerCase().startsWith('cv') || !f.name.toLowerCase().endsWith('.pdf')) continue;

        const filePath = `${userId}/${folder.name}/${f.name}`;
        // Trouver le job lié pour le display name
        const { data: linkedJob } = await supabase
          .from('jobs')
          .select('title, company')
          .eq('id', folder.name)
          .eq('user_id', userId)
          .maybeSingle();

        cvs.push({
          ref: `upload:${filePath}`,
          source: 'upload',
          display_name: `CV - ${getJobLabel(linkedJob)}`,
          is_analyzable: true,
          is_default: profile?.default_cv_ref === `upload:${filePath}`,
        });
      }
    }
  }

  return cvs;
}

// ──────────────────────────────────────────────────────────────────
// Récupération des LM (table lms generated + uploads bucket)
// ──────────────────────────────────────────────────────────────────
async function getLms(userId: string, supabase: any, profile: any) {
  const lms: any[] = [];

  // 1. LM générées (table lms, template = 'generated')
  const { data: generatedLms } = await supabase
    .from('lms')
    .select('id, title, content, form_data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (generatedLms && generatedLms.length) {
    for (const lm of generatedLms) {
      lms.push({
        ref: `generated:${lm.id}`,
        source: 'generated',
        display_name: lm.title || 'LM sans titre',
        // Une LM generated a son content texte, on peut générer le PDF côté serveur
        is_downloadable: !!lm.content,
        is_default: profile?.default_lm_ref === `generated:${lm.id}`,
        // Métadonnées utiles pour l'extension
        metadata: {
          tone: lm.form_data?.tone || null,
          length: lm.form_data?.length || null,
          lang: lm.form_data?.lang || null,
          generatedAt: lm.created_at,
        },
      });
    }
  }

  // 2. LM uploadées (bucket job-documents → user_id/job_id/lm*.pdf)
  const { data: storageList } = await supabase.storage
    .from('job-documents')
    .list(userId, { limit: 100 });

  if (storageList && storageList.length) {
    for (const folder of storageList) {
      if (!folder.name) continue;
      const { data: jobFiles } = await supabase.storage
        .from('job-documents')
        .list(`${userId}/${folder.name}`, { limit: 50 });

      if (!jobFiles) continue;

      for (const f of jobFiles) {
        if (!f.name.toLowerCase().startsWith('lm') || !f.name.toLowerCase().endsWith('.pdf')) continue;

        const filePath = `${userId}/${folder.name}/${f.name}`;
        const { data: linkedJob } = await supabase
          .from('jobs')
          .select('title, company')
          .eq('id', folder.name)
          .eq('user_id', userId)
          .maybeSingle();

        lms.push({
          ref: `upload:${filePath}`,
          source: 'upload',
          display_name: `LM - ${getJobLabel(linkedJob)}`,
          is_downloadable: true,
          is_default: profile?.default_lm_ref === `upload:${filePath}`,
          metadata: null,
        });
      }
    }
  }

  return lms;
}

// ──────────────────────────────────────────────────────────────────
// GET /api/extension/user-documents?type=cv|lm|all
// ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'all').toLowerCase();

    if (type !== 'cv' && type !== 'lm' && type !== 'all') {
      return NextResponse.json(
        { error: "Paramètre 'type' invalide. Attendu : cv | lm | all" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Récupérer le profil pour les refs par défaut
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref, default_lm_ref')
      .eq('user_id', userId)
      .single();

    const result: any = {};

    if (type === 'cv' || type === 'all') {
      result.cvs = await getCvs(userId, supabase, profile);
      result.default_cv_ref = profile?.default_cv_ref || null;
    }

    if (type === 'lm' || type === 'all') {
      result.lms = await getLms(userId, supabase, profile);
      result.default_lm_ref = profile?.default_lm_ref || null;
    }

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (e: any) {
    console.error('[user-documents] erreur:', e);
    return NextResponse.json(
      { error: e?.message || 'Erreur inattendue' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
