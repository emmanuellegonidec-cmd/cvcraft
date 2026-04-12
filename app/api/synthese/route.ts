import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function createAuthedClient(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | null = null;

    if (token) {
      const client = createAuthedClient(token);
      const { data } = await client.auth.getUser();
      userId = data.user?.id ?? null;
    }

    if (!userId) {
     const serverClient = await createClient();
const { data } = await serverClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const supabase = createAuthedClient(token || '');
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const status = searchParams.get('status');

    let query = supabase
      .from('jobs')
      .select('id, title, company, status, sub_status, created_at, location, salary')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    if (status && status !== 'all') query = query.eq('status', status);

    const { data: jobs, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const jobIds = (jobs || []).map((j: { id: string }) => j.id);
    let actions: Record<string, { label: string; is_done: boolean; due_date: string | null }[]> = {};

    if (jobIds.length > 0) {
      const { data: actionsData } = await supabase
        .from('job_step_actions')
        .select('job_id, label, is_done, due_date')
        .in('job_id', jobIds);

      (actionsData || []).forEach((a: { job_id: string; label: string; is_done: boolean; due_date: string | null }) => {
        if (!actions[a.job_id]) actions[a.job_id] = [];
        actions[a.job_id].push({ label: a.label, is_done: a.is_done, due_date: a.due_date });
      });
    }

    const result = (jobs || []).map((job: { id: string; title: string; company: string; status: string; sub_status: string; created_at: string; location: string; salary: string }) => ({
      ...job,
      actions: actions[job.id] || [],
    }));

    return NextResponse.json({ jobs: result });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}