import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────
// Route appelée par l'extension Chrome pour lister les CV de l'utilisateur.
//
// Mise à jour quick win B (29 avril 2026) :
// - Filtrage des CV "fantômes" : on ignore les dossiers de jobs qui n'existent
//   plus dans la table `jobs` (offre supprimée par l'utilisateur). Ces CV
//   restent visibles côté page profil web (où ils peuvent être réutilisés
//   ou promus en référents), mais sont cachés dans la dropdown extension
//   pour offrir une sélection propre et utile.
// - Les CV référents (dossier `_reference/`) restent toujours affichés,
//   indépendamment de tout job parent (par définition ils n'en ont pas).
//
// Mise à jour session 9bis-bis :
// - Retourne 2 listes : `favorites` (CV avec is_favorite = true) + `all` (tous, antéchronologique)
// - Inclut les CV référents (dossier _reference du bucket)
// - Filtre les CV Creator (non analysables côté serveur, marqués is_analyzable: false)
// - Pas de pré-sélection automatique : `default_cv_ref` exposé pour info mais l'extension l'ignore
// ─────────────────────────────────────────────────────────────────────────

function createAuthedClient(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function buildUploadDisplayName(fileName: string, jobTitle?: string, jobCompany?: string): string {
  const prefix = fileName.toLowerCase().startsWith('cv') ? 'CV' : fileName;
  if (!jobTitle) return `${prefix} - Offre supprimée`;
  const parts = [prefix, '-', jobTitle];
  if (jobCompany) parts.push('—', jobCompany);
  return parts.join(' ');
}

export async function GET(req: NextRequest) {
  // ─── Auth ───
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const token = authHeader.slice('Bearer '.length);
  const supabase = createAuthedClient(token);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Token invalide' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    // ─── Profil ───
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref, cv_display_names, cv_references, cv_favorites')
      .eq('user_id', user.id)
      .maybeSingle();

    const defaultRef: string | null = profile?.default_cv_ref || null;
    const displayNames: Record<string, string> = profile?.cv_display_names || {};
    const referenceRefs: string[] = Array.isArray(profile?.cv_references) ? profile.cv_references : [];
    const favoriteRefs: string[] = Array.isArray(profile?.cv_favorites) ? profile.cv_favorites : [];

    // ─── CV Creator (non analysables côté serveur) ───
    const { data: creatorCvs } = await supabase
      .from('cvs')
      .select('id, title, template, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    const creatorList = (creatorCvs || []).map((cv: any) => {
      const ref = `creator:${cv.id}`;
      return {
        ref,
        source: 'creator' as const,
        display_name: displayNames[ref] || cv.title || 'Sans titre',
        is_default: defaultRef === ref,
        is_reference: referenceRefs.includes(ref),
        is_favorite: favoriteRefs.includes(ref),
        is_analyzable: false, // Les CV Creator ne sont pas analysables côté serveur
        analysis_blocker: 'Les CV Creator ne sont pas encore analysables depuis l\'extension. Utilise un CV uploadé en PDF.',
        created_at: cv.created_at,
        updated_at: cv.updated_at,
      };
    });

    // ─── CV uploadés (bucket) ───
    const { data: folders } = await supabase.storage
      .from('job-documents')
      .list(user.id, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    const uploadList: any[] = [];

    if (folders && folders.length > 0) {
      const folderNames = folders
        .filter((f: any) => !f.name.includes('.'))
        .map((f: any) => f.name);

      const jobIds = folderNames.filter((n: string) => n !== '_reference');

      let jobsMap: Record<string, any> = {};

      if (jobIds.length > 0) {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title, company')
          .in('id', jobIds);
        jobsMap = Object.fromEntries((jobs || []).map((j: any) => [j.id, j]));
      }

      for (const folderName of folderNames) {
        const isReferenceFolder = folderName === '_reference';

        // 🆕 Quick win B — Filtrer les CV "fantômes"
        // Si ce n'est pas un CV référent ET que le job parent n'existe plus
        // dans la table `jobs`, on saute le dossier entier. Ces CV restent
        // visibles côté page profil web (gestion globale) — ce filtrage ne
        // s'applique qu'à la dropdown de l'extension, qui sert à choisir un
        // CV pour analyse, pas à gérer les CV.
        if (!isReferenceFolder && !jobsMap[folderName]) {
          continue;
        }

        const { data: files } = await supabase.storage
          .from('job-documents')
          .list(`${user.id}/${folderName}`, { limit: 100 });

        if (!files) continue;

        for (const file of files) {
          const fname = (file as any).name.toLowerCase();
          if (!fname.startsWith('cv')) continue;

          const filePath = `${user.id}/${folderName}/${(file as any).name}`;
          const ref = `upload:${filePath}`;

          let autoDisplayName: string;

          if (isReferenceFolder) {
            // CV référent uploadé : on prend le nom personnalisé (toujours présent à l'upload)
            autoDisplayName = displayNames[ref] || 'CV référent';
          } else {
            const job = jobsMap[folderName];
            autoDisplayName = displayNames[ref] || buildUploadDisplayName((file as any).name, job?.title, job?.company);
          }

          uploadList.push({
            ref,
            source: 'upload' as const,
            display_name: autoDisplayName,
            is_default: defaultRef === ref,
            is_reference: isReferenceFolder || referenceRefs.includes(ref),
            is_favorite: favoriteRefs.includes(ref),
            is_analyzable: true,
            analysis_blocker: null,
            created_at: (file as any).created_at,
            updated_at: (file as any).updated_at || (file as any).created_at,
          });
        }
      }
    }

    // ─── Tri global antéchronologique ───
    const allCvs = [...creatorList, ...uploadList].sort((a, b) => {
      const ad = new Date(a.updated_at || a.created_at).getTime();
      const bd = new Date(b.updated_at || b.created_at).getTime();
      return bd - ad;
    });

    // ─── Constitution des 2 listes ───
    const favorites = allCvs.filter(cv => cv.is_favorite);

    return NextResponse.json(
      {
        cvs: allCvs, // legacy : compatibilité avec l'ancien format de l'extension
        favorites,
        all: allCvs,
        default_cv_ref: defaultRef, // info, mais l'extension n'auto-sélectionne plus
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('GET /api/extension/user-documents error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
