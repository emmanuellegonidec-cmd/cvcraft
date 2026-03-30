import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Vérifie admin via Bearer token
async function checkAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.replace('Bearer ', '').trim()
  const adminClient = getAdminClient()

  const { data: { user }, error } = await adminClient.auth.getUser(token)
  if (error || !user?.email) return false

  const { data } = await adminClient
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .single()

  return !!data
}

// GET : récupère un article par ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const adminClient = getAdminClient()
  const { data, error } = await adminClient
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST : crée un article
export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const { title, slug, excerpt, content, cover_image_url, category, published, published_at } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Titre obligatoire' }, { status: 400 })
  if (!slug?.trim()) return NextResponse.json({ error: 'Slug obligatoire' }, { status: 400 })

  const adminClient = getAdminClient()
  const { data, error } = await adminClient
    .from('articles')
    .insert({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt?.trim() ?? null,
      content: content?.trim() ?? null,
      cover_image_url: cover_image_url?.trim() ?? null,
      category: category ?? 'Conseils',
      published: published ?? false,
      published_at: published_at ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH : met à jour un article
export async function PATCH(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const adminClient = getAdminClient()
  const { data, error } = await adminClient
    .from('articles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE : supprime un article
export async function DELETE(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const adminClient = getAdminClient()
  const { error } = await adminClient.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
