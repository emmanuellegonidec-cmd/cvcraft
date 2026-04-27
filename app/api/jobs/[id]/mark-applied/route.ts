import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// CORS headers - l'extension Chrome appelle cette route depuis un autre domaine
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Pré-flight CORS (obligatoire pour les requêtes cross-origin)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Crée un client Supabase authentifié avec le token Bearer de l'utilisateur
function createAuthedClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentification - récupérer le token Bearer
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing token' },
        { status: 401, headers: corsHeaders }
      )
    }
    const token = authHeader.replace('Bearer ', '')
    const supabase = createAuthedClient(token)

    // 2. Vérifier que le token est valide et récupérer l'utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    const jobId = params.id

    // 3. Lire le body (cvRef et lmRef sont optionnels)
    const body = await request.json().catch(() => ({}))
    const cvRef = body.cvRef || null
    const lmRef = body.lmRef || null

    // 4. Vérifier que le job existe ET appartient à l'utilisateur
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404, headers: corsHeaders }
      )
    }

    // 5. Mettre à jour le statut de la candidature
    const updateData: Record<string, any> = {
      status: 'applied',
      sub_status: 'applied',
      applied_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update job error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job', details: updateError.message },
        { status: 500, headers: corsHeaders }
      )
    }

    // 6. Créer une action de relance à J+7
    const deadlineDate = new Date()
    deadlineDate.setDate(deadlineDate.getDate() + 7)
    const deadlineISO = deadlineDate.toISOString().split('T')[0] // YYYY-MM-DD

    const { error: actionError } = await supabase
      .from('job_step_actions')
      .insert({
        user_id: user.id,
        job_id: jobId,
        step_id: 'applied',
        title: 'Relancer le recruteur',
        sub: 'Si pas de réponse, envoyer une relance polie',
        icon: '📨',
        position: 1000,
        is_custom: true,
        type: 'action',
        is_done: false,
        deadline_date: deadlineISO,
      })

    // Si la création de relance échoue, on ne fait pas échouer toute la requête
    // car la mise à jour du statut est la priorité
    if (actionError) {
      console.error('Create relance action error:', actionError)
    }

    // 7. Réponse succès
    return NextResponse.json(
      {
        ok: true,
        jobId,
        status: 'applied',
        sub_status: 'applied',
        relance_date: deadlineISO,
        relance_created: !actionError,
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Mark applied error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}