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
// GET /api/extension/user-documents
// Retourne la liste des CV de l'utilisateur (Creator + uploads).
// Note : la fonctionnalite LM a ete retiree du scope de l'extension
// en session 6 (pivot UX). La LM reste cote Jean web uniquement.
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

    // Récupérer le profil pour la ref CV par défaut
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref')
      .eq('user_id', userId)
      .single();

    const cvs = await getCvs(userId, supabase, profile);

    return NextResponse.json(
      {
        cvs,
        default_cv_ref: profile?.default_cv_ref || null,
      },
      { headers: CORS_HEADERS }
    );
  } catch (e: any) {
    console.error('[user-documents] erreur:', e);
    return NextResponse.json(
      { error: e?.message || 'Erreur inattendue' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}