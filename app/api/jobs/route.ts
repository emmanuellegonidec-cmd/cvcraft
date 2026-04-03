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

async function getAuth(req: NextRequest): Promise<{ userId: string | null; supabase: any }> {
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

export async function GET(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function POST(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;

  if (id) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ job: data });
  } else {
    const { data, error } = await supabase
      .from('jobs')
      .insert({ ...fields, user_id: userId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ job: data });
  }
}

// ✅ PATCH — mise à jour partielle (status, sub_status, notes, dates…)
// Si le status change → on enregistre automatiquement stage_changed_at
export async function PATCH(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

  const body = await req.json();
  const now = new Date().toISOString();

  // Si le status ou sub_status change, on enregistre la date du changement d'étape
  const stageUpdate = (body.status !== undefined || body.sub_status !== undefined)
    ? { stage_changed_at: now }
    : {};

  // Si on passe en "in_progress" (entretien), on met à jour interview_at
  // seulement si interview_at n'est pas déjà renseigné
  let interviewUpdate = {};
  if (body.status === 'in_progress') {
    // On vérifie si interview_at est déjà renseigné
    const { data: existing } = await supabase
      .from('jobs')
      .select('interview_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (existing && !existing.interview_at) {
      interviewUpdate = { interview_at: now };
    }
  }

  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...body,
      ...stageUpdate,
      ...interviewUpdate,
      updated_at: now,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}

export async function DELETE(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
