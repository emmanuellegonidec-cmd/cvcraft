import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const admin = getAdminClient()
  const { data: { user } } = await admin.auth.getUser(token)
  return user?.id ?? null
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('actions')
      .select('*')
      .eq('user_id', userId)
      .order('date_debut', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Assure que toutes les actions ont un statut (défaut a_faire)
    const actions = (data || []).map((a: any) => ({ ...a, statut: a.statut || 'a_faire' }))
    return NextResponse.json(actions)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { nom, organisateur, categorie, date_debut, date_fin, note, statut } = body

    if (!nom || !date_debut) {
      return NextResponse.json({ error: 'Nom et date requis' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('actions')
      .insert([{
        user_id: userId,
        nom, organisateur, categorie, date_debut, date_fin, note,
        statut: statut || 'a_faire',
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { id, nom, organisateur, categorie, date_debut, date_fin, note, statut } = body

    // Mise à jour partielle : on ne met à jour que les champs présents dans le body
    const updateData: any = {}
    if (nom !== undefined) updateData.nom = nom
    if (organisateur !== undefined) updateData.organisateur = organisateur
    if (categorie !== undefined) updateData.categorie = categorie
    if (date_debut !== undefined) updateData.date_debut = date_debut
    if (date_fin !== undefined) updateData.date_fin = date_fin
    if (note !== undefined) updateData.note = note
    if (statut !== undefined) updateData.statut = statut

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('actions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const admin = getAdminClient()
    const { error } = await admin
      .from('actions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
