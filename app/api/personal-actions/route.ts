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
    .select('id, nom, type, plateforme, date_action, heure_action, note, job_id, statut, contact_ids, jobs:job_id (title, company)')
    .eq('user_id', user.id)
    .order('date_action', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actions = (data || []).map((a: any) => ({
    id: a.id,
    nom: a.nom,
    type: a.type,
    plateforme: a.plateforme,
    date_action: a.date_action,
    heure_action: a.heure_action,
    note: a.note,
    job_id: a.job_id,
    statut: a.statut || 'a_faire',
    contact_ids: a.contact_ids || [],
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
  const { id, nom, type, plateforme, date_action, heure_action, note, job_id, statut, contact_ids } = body;

  if (id) {
    // Mise à jour : on ne met à jour que les champs présents dans le body
    const updateData: any = {};
    if (nom !== undefined) updateData.nom = nom;
    if (type !== undefined) updateData.type = type;
    if (plateforme !== undefined) updateData.plateforme = plateforme;
    if (date_action !== undefined) updateData.date_action = date_action;
    if (heure_action !== undefined) updateData.heure_action = heure_action || null;
    if (note !== undefined) updateData.note = note;
    if (job_id !== undefined) updateData.job_id = job_id;
    if (statut !== undefined) updateData.statut = statut;
    if (contact_ids !== undefined) updateData.contact_ids = contact_ids;

    const { data, error } = await supabase
      .from('personal_actions')
      .update(updateData)
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: data });
  } else {
    const insertData: any = {
      user_id: user.id,
      nom, type, plateforme, date_action,
      heure_action: heure_action || null,
      note, job_id,
      statut: statut || 'a_faire',
    };
    if (Array.isArray(contact_ids)) insertData.contact_ids = contact_ids;

    const { data, error } = await supabase
      .from('personal_actions')
      .insert(insertData)
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
