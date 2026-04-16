import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function createAuthedClient(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  );
}

export async function GET(req: NextRequest) {
  const supabase = createAuthedClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('personal_actions')
    .select('id, nom, type, plateforme, date_action, note, job_id, jobs:job_id (title, company)')
    .eq('user_id', user.id)
    .order('date_action', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actions = (data || []).map((a: any) => ({
    id: a.id,
    nom: a.nom,
    type: a.type,
    plateforme: a.plateforme,
    date_action: a.date_action,
    note: a.note,
    job_id: a.job_id,
    job_title: a.jobs?.title || null,
    job_company: a.jobs?.company || null,
  }));

  return NextResponse.json({ actions });
}

export async function POST(req: NextRequest) {
  const supabase = createAuthedClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, nom, type, plateforme, date_action, note, job_id } = body;

  if (id) {
    const { data, error } = await supabase
      .from('personal_actions')
      .update({ nom, type, plateforme, date_action, note, job_id })
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: data });
  } else {
    const { data, error } = await supabase
      .from('personal_actions')
      .insert({ user_id: user.id, nom, type, plateforme, date_action, note, job_id })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: data });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = createAuthedClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase
    .from('personal_actions')
    .delete()
    .eq('id', id).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}