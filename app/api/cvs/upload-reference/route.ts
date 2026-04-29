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

// Slugifie un nom personnalisé pour le nom de fichier dans le bucket
// Ex: "CV Marketing Senior 2026" → "cv-marketing-senior-2026"
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// POST /api/cvs/upload-reference
// Body : multipart/form-data avec :
//   - file : le fichier PDF
//   - display_name : le nom personnalisé (obligatoire)
//
// Action :
//   1. Upload le PDF dans bucket job-documents → {user_id}/_reference/{timestamp}_{slug}.pdf
//   2. Ajoute la ref correspondante à user_profiles.cv_references
//   3. Stocke le display_name dans user_profiles.cv_display_names
//
// Retourne : { success: true, ref, file_path }
export async function POST(req: NextRequest) {
  const { supabase, user } = await getAuth(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const displayName = formData.get('display_name');

    // ─── Validations ───
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 });
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Nom du CV requis' }, { status: 400 });
    }

    const cleanedName = displayName.trim();

    if (cleanedName.length > 100) {
      return NextResponse.json({ error: 'Nom trop long (100 caractères max)' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 });
    }

    // Limite 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (5 Mo max)' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
    }

    // ─── Upload dans le bucket ───
    const timestamp = Date.now();
    const slug = slugify(cleanedName) || 'cv-reference';
    const fileName = `cv-${timestamp}-${slug}.pdf`;
    const filePath = `${user.id}/_reference/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('job-documents')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('POST /api/cvs/upload-reference upload error:', uploadError);
      return NextResponse.json({ error: 'Erreur upload : ' + uploadError.message }, { status: 500 });
    }

    const ref = `upload:${filePath}`;

    // ─── Mise à jour user_profiles ───
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('cv_references, cv_display_names')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentRefs: string[] = Array.isArray(profile?.cv_references) ? [...profile.cv_references] : [];
    if (!currentRefs.includes(ref)) {
      currentRefs.push(ref);
    }

    const currentNames: Record<string, string> = { ...(profile?.cv_display_names || {}) };
    currentNames[ref] = cleanedName;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          cv_references: currentRefs,
          cv_display_names: currentNames,
        },
        { onConflict: 'user_id' }
      );

    if (profileError) {
      // En cas d'échec de la mise à jour profile, on supprime le fichier qu'on vient d'uploader
      // pour rester cohérent (rollback)
      console.error('POST /api/cvs/upload-reference profile error:', profileError);
      await supabase.storage.from('job-documents').remove([filePath]);
      return NextResponse.json({ error: 'Erreur profil : ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ref,
      file_path: filePath,
      display_name: cleanedName,
    });
  } catch (err: any) {
    console.error('POST /api/cvs/upload-reference exception:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}