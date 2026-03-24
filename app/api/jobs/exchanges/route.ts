// app/api/jobs/exchanges/route.ts
// CRUD des échanges liés à une offre (job_exchanges)
// Pattern auth identique aux autres routes : Bearer token + cookies fallback

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function createAuthedClient(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

async function getAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    const supabase = createAuthedClient(token)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return { userId: user.id, supabase }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { userId: user?.id ?? null, supabase }
}

// GET /api/jobs/exchanges?job_id=xxx
// Récupère tous les échanges d'un job, triés par date
export async function GET(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const jobId = req.nextUrl.searchParams.get('job_id')
    if (!jobId) return NextResponse.json({ error: 'job_id requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('job_exchanges')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .order('exchange_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/jobs/exchanges]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/jobs/exchanges
// Crée un nouvel échange
export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const { job_id, title, exchange_type, exchange_date, step_label, content, questions, answers, next_step } = body

    if (!job_id) return NextResponse.json({ error: 'job_id requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('job_exchanges')
      .insert({
        job_id,
        user_id: userId,
        title: title || 'Échange',
        exchange_type: exchange_type || 'autre',
        exchange_date: exchange_date || new Date().toISOString().split('T')[0],
        step_label: step_label || null,
        content: content || null,
        questions: questions || null,
        answers: answers || null,
        next_step: next_step || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/jobs/exchanges]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH /api/jobs/exchanges?id=xxx
// Met à jour un échange existant
export async function PATCH(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const exchangeId = req.nextUrl.searchParams.get('id')
    if (!exchangeId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const body = await req.json()
    const { title, exchange_type, exchange_date, step_label, content, questions, answers, next_step } = body

    const { data, error } = await supabase
      .from('job_exchanges')
      .update({
        ...(title !== undefined && { title }),
        ...(exchange_type !== undefined && { exchange_type }),
        ...(exchange_date !== undefined && { exchange_date }),
        ...(step_label !== undefined && { step_label }),
        ...(content !== undefined && { content }),
        ...(questions !== undefined && { questions }),
        ...(answers !== undefined && { answers }),
        ...(next_step !== undefined && { next_step }),
      })
      .eq('id', exchangeId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[PATCH /api/jobs/exchanges]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/jobs/exchanges?id=xxx
// Supprime un échange
export async function DELETE(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const exchangeId = req.nextUrl.searchParams.get('id')
    if (!exchangeId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const { error } = await supabase
      .from('job_exchanges')
      .delete()
      .eq('id', exchangeId)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/jobs/exchanges]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
