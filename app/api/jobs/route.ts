import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Récupère le user depuis le token Bearer OU depuis les cookies
async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return { user, token };
  }

  // Fallback cookies
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user, token: null };
}

export async function GET(req: NextRequest) {
  const { user } = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function POST(req: NextRequest) {
  const { user } = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const supabase = await createClient();
  const body = await req.json();
  const { id, ...fields } = body;

  if (id) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ job: data });
  } else {
    const { data, error } = await supabase
      .from('jobs')
      .insert({ ...fields, user_id: user.id })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ job: data });
  }
}

export async function DELETE(req: NextRequest) {
  const { user } = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const supabase = await createClient();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
