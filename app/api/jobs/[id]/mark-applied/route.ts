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

    // 3. Lire le body (cvRef et lmRef sont optionnels, conservés pour compat)
    const body = await request.json().catch(() => ({}))
    const cvRef = body.cvRef || null
    const lmRef = body.lmRef || null

    // 4. Vérifier que le job existe ET appartient à l'utilisateur
    //    On lit aussi step_dates pour fusionner les dates des étapes (#7)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, user_id, step_dates')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404, headers: corsHeaders }
      )
    }

    // 5. Calculer le step_dates mis à jour (#7 — valider les étapes du parcours)
    //    - to_apply : on écrit la date du jour SEULEMENT si elle est vide,
    //      pour ne pas écraser une saisie manuelle faite côté Jean web.
    //      Logique : un clic sur "J'ai postulé" depuis l'extension implique
    //      que l'étape "Envie de postuler" est de facto déjà passée.
    //    - applied : on écrit toujours la date du jour.
    const todayISO = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const currentStepDates =
      ((job as any).step_dates as Record<string, string>) || {}
    const updatedStepDates: Record<string, string> = {
      ...currentStepDates,
      to_apply: currentStepDates.to_apply || todayISO,
      applied: todayISO,
    }

    // 6. Mettre à jour le statut de la candidature + step_dates
    const updateData: Record<string, any> = {
      status: 'applied',
      sub_status: 'applied',
      applied_at: new Date().toISOString(),
      step_dates: updatedStepDates,
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

    // 7. Réponse succès
    //    NB session 9bis #1 : la création auto de relance J+7 a été retirée.
    //    L'utilisatrice ajoute désormais ses relances manuellement depuis Jean.
    return NextResponse.json(
      {
        ok: true,
        jobId,
        status: 'applied',
        sub_status: 'applied',
        applied_date: todayISO,
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