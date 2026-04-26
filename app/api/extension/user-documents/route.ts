import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// CORS — autorise les appels depuis l'extension Chrome (chrome-extension://*)
// ============================================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// ============================================================================
// AUTH HELPER — pattern Bearer + cookies fallback (identique au reste de Jean)
// ============================================================================
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
    const token = authHeader.slice('Bearer '.length);
    const supabase = createAuthedClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ============================================================================
// HELPERS
// ============================================================================
function buildUploadDisplayName(fileName: string, jobTitle?: string, jobCompany?: string): string {
  const prefix = fileName.toLowerCase().startsWith('cv') ? 'CV' : fileName;
  if (!jobTitle) return `${prefix} - Offre supprimee`;
  const parts = [prefix, '-', jobTitle];
  if (jobCompany) parts.push('-', jobCompany);
  return parts.join(' ');
}

const CREATOR_NOT_ANALYZABLE_REASON =
  "Pour analyser un CV Creator, telecharge-le d'abord depuis Mes CV puis upload-le sur cette offre dans la section Documents.";

// ============================================================================
// LOGIQUE CV — recopiee/simplifiee depuis /api/cvs/route.ts
// On ne renvoie que ce dont l'extension a besoin pour la dropdown + l'analyse.
// ============================================================================
async function getCvs(supabase: any, userId: string) {
  // Profil pour recuperer default_cv_ref + display_names custom
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('default_cv_ref, cv_display_names')
    .eq('user_id', userId)
    .maybeSingle();

  const defaultRef: string | null = profile?.default_cv_ref || null;
  const displayNames: Record<string, string> = profile?.cv_display_names || {};

  // CV Creator (non analysables cote extension session 5)
  const { data: creatorCvs } = await supabase
    .from('cvs')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  const creatorList = (creatorCvs || []).map((cv: any) => {
    const ref = `creator:${cv.id}`;
    return {
      ref,
      source: 'creator',
      display_name: displayNames[ref] || cv.title || 'Sans titre',
      is_default: defaultRef === ref,
      is_analyzable: false,
      reason: CREATOR_NOT_ANALYZABLE_REASON,
      updated_at: cv.updated_at,
    };
  });

  // CV uploades (PDF dans le bucket — analysables)
  const { data: folders } = await supabase.storage
    .from('job-documents')
    .list(userId, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  const uploadList: any[] = [];

  if (folders && folders.length > 0) {
    const jobIds = folders
      .filter((f: any) => !f.name.includes('.'))
      .map((f: any) => f.name);
    let jobsMap: Record<string, any> = {};

    if (jobIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, company')
        .in('id', jobIds);
      jobsMap = Object.fromEntries((jobs || []).map((j: any) => [j.id, j]));
    }

    for (const folder of folders) {
      if ((folder as any).name.includes('.')) continue;
      const jobId = (folder as any).name;

      const { data: files } = await supabase.storage
        .from('job-documents')
        .list(`${userId}/${jobId}`, { limit: 100 });

      if (!files) continue;

      for (const file of files) {
        const fname = (file as any).name.toLowerCase();
        // Filtre : fichiers CV uniquement, et seuls les PDF sont analysables par Claude
        if (!fname.startsWith('cv')) continue;
        if (!fname.endsWith('.pdf')) continue;

        const filePath = `${userId}/${jobId}/${(file as any).name}`;
        const ref = `upload:${filePath}`;
        const job = jobsMap[jobId];

        const autoName = buildUploadDisplayName((file as any).name, job?.title, job?.company);

        uploadList.push({
          ref,
          source: 'upload',
          display_name: displayNames[ref] || autoName,
          is_default: defaultRef === ref,
          is_analyzable: true,
          updated_at: (file as any).updated_at || (file as any).created_at,
        });
      }
    }
  }

  // Tri : analysables d'abord, puis par date desc
  const allCvs = [...creatorList, ...uploadList].sort((a, b) => {
    if (a.is_analyzable !== b.is_analyzable) {
      return a.is_analyzable ? -1 : 1;
    }
    const ad = new Date(a.updated_at || 0).getTime();
    const bd = new Date(b.updated_at || 0).getTime();
    return bd - ad;
  });

  return { cvs: allCvs, default_cv_ref: defaultRef };
}

// ============================================================================
// GET /api/extension/user-documents?type=cv|lm|all
// ============================================================================
export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifie' },
      { status: 401, headers: corsHeaders }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || 'cv').toLowerCase();

  try {
    const result: any = {};

    if (type === 'cv' || type === 'all') {
      const cvData = await getCvs(supabase, user.id);
      result.cvs = cvData.cvs;
      result.default_cv_ref = cvData.default_cv_ref;
    }

    if (type === 'lm' || type === 'all') {
      // TODO session 6 : lister les LM (lettres de motivation)
      result.lms = [];
      result.default_lm_ref = null;
    }

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err: any) {
    console.error('GET /api/extension/user-documents error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500, headers: corsHeaders }
    );
  }
}
