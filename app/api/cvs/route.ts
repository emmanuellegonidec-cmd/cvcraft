import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuth(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    // 1. Profil : default_cv_ref + cv_display_names
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref, cv_display_names')
      .eq('user_id', user.id)
      .maybeSingle();

    const defaultRef: string | null = profile?.default_cv_ref || null;
    const displayNames: Record<string, string> = profile?.cv_display_names || {};

    // 2. CV créés via le CV Creator (table cvs)
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
        title: cv.title || 'Sans titre',
        display_name: displayNames[ref] || null,
        created_at: cv.created_at,
        updated_at: cv.updated_at,
        is_default: defaultRef === ref,
        metadata: {
          template: cv.template,
          cv_id: cv.id,
        },
      };
    });

    // 3. CV uploadés dans le bucket job-documents (sous {user_id}/{job_id}/)
    const { data: folders } = await supabase.storage
      .from('job-documents')
      .list(user.id, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    const uploadList: any[] = [];

    if (folders && folders.length > 0) {
      // Récupérer les infos des jobs pour afficher titre + entreprise
      const jobIds = folders.filter((f: any) => !f.name.includes('.')).map((f: any) => f.name);
      let jobsMap: Record<string, any> = {};

      if (jobIds.length > 0) {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title, company')
          .in('id', jobIds);
        jobsMap = Object.fromEntries((jobs || []).map((j: any) => [j.id, j]));
      }

      // Pour chaque dossier d'offre, lister les fichiers et filtrer les CV
      for (const folder of folders) {
        if ((folder as any).name.includes('.')) continue; // pas un dossier

        const jobId = (folder as any).name;
        const { data: files } = await supabase.storage
          .from('job-documents')
          .list(`${user.id}/${jobId}`, { limit: 100 });

        if (!files) continue;

        for (const file of files) {
          const fname = (file as any).name.toLowerCase();
          // On filtre les CV : nom commence par "cv"
          // (exclut lm.pdf, lettre.pdf, motivation.pdf, etc.)
          if (!fname.startsWith('cv')) continue;

          const filePath = `${user.id}/${jobId}/${(file as any).name}`;
          const ref = `upload:${filePath}`;
          const job = jobsMap[jobId];

          uploadList.push({
            ref,
            source: 'upload' as const,
            title: (file as any).name,
            display_name: displayNames[ref] || null,
            created_at: (file as any).created_at,
            updated_at: (file as any).updated_at || (file as any).created_at,
            is_default: defaultRef === ref,
            metadata: {
              job_id: jobId,
              job_title: job?.title || 'Offre supprimée',
              job_company: job?.company || '',
              file_path: filePath,
              file_size: (file as any).metadata?.size || 0,
            },
          });
        }
      }
    }

    // 4. Merger et trier par date de mise à jour décroissante
    const allCvs = [...creatorList, ...uploadList].sort((a, b) => {
      const ad = new Date(a.updated_at || a.created_at).getTime();
      const bd = new Date(b.updated_at || b.created_at).getTime();
      return bd - ad;
    });

    return NextResponse.json({ cvs: allCvs, default_ref: defaultRef });
  } catch (err: any) {
    console.error('GET /api/cvs error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getAuth(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const body = await req.json();
    const { ref, display_name, is_default } = body;

    if (!ref || typeof ref !== 'string') {
      return NextResponse.json({ error: 'ref requis' }, { status: 400 });
    }
    if (!ref.startsWith('creator:') && !ref.startsWith('upload:')) {
      return NextResponse.json({ error: 'ref invalide' }, { status: 400 });
    }

    // Sécurité upload : le path doit commencer par user.id
    if (ref.startsWith('upload:')) {
      const filePath = ref.slice('upload:'.length);
      if (!filePath.startsWith(user.id + '/')) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    }

    // Lire le profil existant
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref, cv_display_names')
      .eq('user_id', user.id)
      .maybeSingle();

    const updates: any = {};

    // Mise à jour display_name
    if (display_name !== undefined) {
      const currentNames = { ...(profile?.cv_display_names || {}) };
      const cleaned = typeof display_name === 'string' ? display_name.trim() : '';
      if (cleaned === '') {
        delete currentNames[ref];
      } else {
        currentNames[ref] = cleaned;
      }
      updates.cv_display_names = currentNames;
    }

    // Mise à jour is_default
    if (is_default === true) {
      updates.default_cv_ref = ref;
    } else if (is_default === false && profile?.default_cv_ref === ref) {
      updates.default_cv_ref = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune mise à jour spécifiée' }, { status: 400 });
    }

    // Upsert : crée le profil s'il n'existe pas, sinon met à jour
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });

    if (error) {
      console.error('PATCH /api/cvs error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PATCH /api/cvs error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getAuth(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');

    if (!ref) return NextResponse.json({ error: 'ref requis' }, { status: 400 });

    if (ref.startsWith('creator:')) {
      const cvId = ref.slice('creator:'.length);
      const { error } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cvId)
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (ref.startsWith('upload:')) {
      const filePath = ref.slice('upload:'.length);
      // Sécurité : vérifier que le path commence bien par user.id
      if (!filePath.startsWith(user.id + '/')) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
      const { error } = await supabase.storage
        .from('job-documents')
        .remove([filePath]);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'ref invalide' }, { status: 400 });
    }

    // Nettoyer les références dans user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref, cv_display_names')
      .eq('user_id', user.id)
      .maybeSingle();

    const cleanupUpdates: any = {};

    if (profile?.default_cv_ref === ref) {
      cleanupUpdates.default_cv_ref = null;
    }

    const names = profile?.cv_display_names || {};
    if (names[ref]) {
      const newNames = { ...names };
      delete newNames[ref];
      cleanupUpdates.cv_display_names = newNames;
    }

    if (Object.keys(cleanupUpdates).length > 0) {
      await supabase
        .from('user_profiles')
        .update(cleanupUpdates)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/cvs error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
