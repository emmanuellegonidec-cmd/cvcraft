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
    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createAuthedClient(token);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return { userId: user.id, userEmail: user.email, supabase };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, userEmail: user?.email ?? null, supabase };
}

// GET — récupérer le profil
export async function GET(req: NextRequest) {
  const { userId, userEmail, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data, email: userEmail });
}

// POST — créer ou mettre à jour le profil (upsert)
export async function POST(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await req.json();

  // Champs autorisés
  const allowed = [
    'first_name', 'last_name',
    'current_title', 'target_title', 'sector', 'experience_level',
    'city', 'region', 'mobility',
    'summary', 'key_skills', 'languages',
    'availability', 'contract_types', 'salary_expectation',
  ];

  const payload: Record<string, unknown> = { user_id: userId };
  for (const key of allowed) {
    if (key in body) payload[key] = body[key];
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data });
}

// DELETE — supprimer le compte complet (profil + données + auth user)
export async function DELETE(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Les suppressions en cascade via RLS/FK nettoient jobs, contacts, etc.
  // On supprime l'utilisateur auth — Supabase cascade sur les tables liées
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Supprimer les fichiers Storage
  try {
    const { data: files } = await supabase.storage
      .from('job-documents')
      .list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from('job-documents').remove(paths);
    }
  } catch (_) {
    // Non bloquant
  }

  // Supprimer le user auth (cascade FK supprime le reste)
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    // Fallback : supprimer seulement le profil si pas de service role key
    await supabase.from('user_profiles').delete().eq('user_id', userId);
    return NextResponse.json({ 
      warning: 'Profil supprimé, mais suppression du compte auth nécessite SUPABASE_SERVICE_ROLE_KEY',
    });
  }

  return NextResponse.json({ success: true });
}
