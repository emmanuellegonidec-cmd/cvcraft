import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const createAuthedClient = async () => {
  return createServerClient()
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthedClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    let userId = user?.id

    if (!userId && token) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: { user: tokenUser } } = await adminClient.auth.getUser(token)
      userId = tokenUser?.id
    }

    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', userId)
      .order('date_debut', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthedClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    let userId = user?.id

    if (!userId && token) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: { user: tokenUser } } = await adminClient.auth.getUser(token)
      userId = tokenUser?.id
    }

    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { nom, organisateur, categorie, date_debut, date_fin, note } = body

    if (!nom || !date_debut) {
      return NextResponse.json({ error: 'Nom et date requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('actions')
      .insert([{ user_id: userId, nom, organisateur, categorie, date_debut, date_fin, note }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAuthedClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    let userId = user?.id

    if (!userId && token) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: { user: tokenUser } } = await adminClient.auth.getUser(token)
      userId = tokenUser?.id
    }

    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { id, nom, organisateur, categorie, date_debut, date_fin, note } = body

    const { data, error } = await supabase
      .from('actions')
      .update({ nom, organisateur, categorie, date_debut, date_fin, note })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAuthedClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    let userId = user?.id

    if (!userId && token) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: { user: tokenUser } } = await adminClient.auth.getUser(token)
      userId = tokenUser?.id
    }

    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
