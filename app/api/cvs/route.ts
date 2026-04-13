import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function createAuthedClient(token: string) {
  return createClient(
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
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, supabase };
}

// GET — liste tous les CVs de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: cvs, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ cvs: cvs || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — créer ou mettre à jour un CV
export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { id, title, template, content, form_data } = body;

    const payload = {
      user_id: userId,
      title: title || 'Mon CV',
      template: template || 'classic',
      content: content || '',
      form_data: {
        ...form_data,
        experiences: form_data?.experiences || [],
        education: form_data?.education || [],
        skills: form_data?.skills || '',
      },
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      // Mise à jour
      const { data, error } = await supabase
        .from('cvs')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Création
      const { data, error } = await supabase
        .from('cvs')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ cv: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — supprimer un CV
export async function DELETE(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const { error } = await supabase
      .from('cvs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}