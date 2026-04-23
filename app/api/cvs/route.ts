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

// Construit un titre lisible pour un CV uploadé
// Ex: "CV - Chargée de projet web — Maison Lenôtre"
// Fallback si l'offre a été supprimée : "CV - Offre supprimée"
function buildUploadTitle(fileName: string, jobTitle?: string, jobCompany?: string): string {
  const prefix = fileName.toLowerCase().startsWith('cv') ? 'CV' : fileName;
  if (!jobTitle) return `${prefix} - Offre supprimée`;
  const parts = [prefix, '-', jobTitle];
  if (jobCompany) parts.push('—', jobCompany);
  return parts.join(' ');
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuth(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref, cv_display_names')
      .eq('user_id', user.id)
      .maybeSingle();

    const defaultRef: string | null = profile?.default_cv_ref || null;
    const displayNames: Record<string, string> = profile?.cv_display_names || {};

    // CV Creator
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

    // CV uploadés (bucket)
    const { data: folders } = await supabase.storage
      .from('job-documents')
      .list(user.id, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    const uploadList: any[] = [];

    if (folders && folders.length > 0) {
      const jobIds = folders.filter((f: any) => !f.name.includes('.')).map((f: any) => f.name);
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
          .list(`${user.id}/${jobId}`, { limit: 100 });

        if (!files) continue;

        for (const file of files) {
          const fname = (file as any).name.toLowerCase();
          if (!fname.startsWith('cv')) continue;

          const filePath = `${user.id}/${jobId}/${(file as any).name}`;
          const ref = `upload:${filePath}`;
          const job = jobsMap[jobId];

          // NOUVEAU : on construit un titre enrichi qui intègre déjà l'offre liée
          const autoTitle = buildUploadTitle((file as any).name, job?.title, job?.company);

          uploadList.push({
            ref,
            source: 'upload' as const,
            title: autoTitle,
            display_name: displayNames[ref] || null,
            created_at: (file as any).created_at,
            updated_at: (file as any).updated_at || (file as any).created_at,
            is_default: defaultRef === ref,
            metadata: {
              job_id: jobId,
              job_title: job?.title || 'Offre supprimée',
              job_company: job?.company || '',
              file_path: filePath,
              file_name: (file as any).name,
              file_size: (file as any).metadata?.size || 0,
            },
          });
        }
      }
    }

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

// POST — création ou mise à jour d'un CV Creator
// Body attendu : { id?, title, template, content, form_data }
// - Si id fourni → UPDATE de la ligne existante (vérif user_id = user.id)
// - Si id absent → INSERT d'une nouvelle ligne
// Renvoie { cv: { id, title, template, created_at, updated_at } }
export async function POST(req: NextRequest) {
  const { supabase, user } = await getAuth(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, title, template, content, form_data } = body || {};

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title requis' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // UPDATE d'un CV existant
    if (id) {
      const { data, error } = await supabase
        .from('cvs')
        .update({
          title: title.trim(),
          template: template || null,
          content: content || '',
          form_data: form_data || {},
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, title, template, created_at, updated_at')
        .maybeSingle();

      if (error) {
        console.error('POST /api/cvs update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        // Soit l'id n'existe pas, soit il n'appartient pas à l'utilisateur
        return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });
      }

      return NextResponse.json({ cv: data });
    }

    // INSERT d'un nouveau CV
    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: user.id,
        title: title.trim(),
        template: template || null,
        content: content || '',
        form_data: form_data || {},
        created_at: now,
        updated_at: now,
      })
      .select('id, title, template, created_at, updated_at')
      .single();

    if (error) {
      console.error('POST /api/cvs insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cv: data });
  } catch (err: any) {
    console.error('POST /api/cvs error:', err);
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

    if (ref.startsWith('upload:')) {
      const filePath = ref.slice('upload:'.length);
      if (!filePath.startsWith(user.id + '/')) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
      }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_cv_ref, cv_display_names')
      .eq('user_id', user.id)
      .maybeSingle();

    const updates: any = {};

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

    if (is_default === true) {
      updates.default_cv_ref = ref;
    } else if (is_default === false && profile?.default_cv_ref === ref) {
      updates.default_cv_ref = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune mise à jour spécifiée' }, { status: 400 });
    }

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
