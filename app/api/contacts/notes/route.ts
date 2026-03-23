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
    if (!error && user) return { userId: user.id, supabase };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, supabase };
}

export async function GET(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const contactId = req.nextUrl.searchParams.get('contact_id');
  if (!contactId) return NextResponse.json({ error: 'contact_id manquant' }, { status: 400 });

  const { data, error } = await supabase
    .from('contact_notes')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data });
}

export async function POST(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const body = await req.json();
  const { contact_id, date, type, contenu } = body;

  const { data, error } = await supabase
    .from('contact_notes')
    .insert({ contact_id, date, type, contenu, user_id: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

export async function DELETE(req: NextRequest) {
  const { userId, supabase } = await getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

  const { error } = await supabase
    .from('contact_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
