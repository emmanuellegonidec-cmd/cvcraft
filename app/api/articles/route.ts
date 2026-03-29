import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET : récupère les articles publiés (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const limit = parseInt(searchParams.get('limit') ?? '6')

  const adminClient = getAdminClient()

  if (slug) {
    // Récupère un article par son slug
    const { data, error } = await adminClient
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  // Récupère les N derniers articles publiés
  const { data, error } = await adminClient
    .from('articles')
    .select('id, title, slug, excerpt, cover_image_url, category, published_at, created_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
