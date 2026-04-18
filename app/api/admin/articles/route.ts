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

// --- Fix HTTPS : filet de sécurité côté API ---
// Force https:// sur tous les liens et images qui pointent vers jeanfindmyjob.fr
// Couvre les cas de copier-coller depuis ailleurs (où l'éditeur n'a pas intercepté)
function normalizeInternalLinksHTML(html: string | null | undefined): string | null {
  if (!html) return html ?? null
  return html
    .replace(/href=(["'])http:\/\/(www\.)?jeanfindmyjob\.fr/gi, 'href=$1https://$2jeanfindmyjob.fr')
    .replace(/src=(["'])http:\/\/(www\.)?jeanfindmyjob\.fr/gi, 'src=$1https://$2jeanfindmyjob.fr')
}

function normalizeInternalUrl(url: string | null | undefined): string | null {
  if (!url) return url ?? null
  return url.replace(/^http:\/\/(www\.)?jeanfindmyjob\.fr/i, 'https://$1jeanfindmyjob.fr')
}

// Convertit les chaînes vides en null pour que les fallback SQL fonctionnent
function emptyToNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
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
  const {
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    cover_image_alt,
    category,
    published,
    published_at,
    seo_title,
    seo_description,
  } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Titre obligatoire' }, { status: 400 })
  if (!slug?.trim()) return NextResponse.json({ error: 'Slug obligatoire' }, { status: 400 })

  const adminClient = getAdminClient()
  const { data, error } = await adminClient
    .from('articles')
    .insert({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt?.trim() ?? null,
      content: normalizeInternalLinksHTML(content?.trim() ?? null),
      cover_image_url: normalizeInternalUrl(cover_image_url?.trim() ?? null),
      cover_image_alt: emptyToNull(cover_image_alt),
      category: category ?? 'Conseils',
      published: published ?? false,
      published_at: published_at ?? null,
      seo_title: emptyToNull(seo_title),
      seo_description: emptyToNull(seo_description),
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

  // Applique les transformations uniquement sur les champs envoyés
  const sanitized: Record<string, unknown> = { ...updates }

  if (sanitized.content !== undefined) {
    sanitized.content = normalizeInternalLinksHTML(sanitized.content as string | null)
  }
  if (sanitized.cover_image_url !== undefined) {
    sanitized.cover_image_url = normalizeInternalUrl(sanitized.cover_image_url as string | null)
  }
  // Champs SEO : string vide → null pour que le fallback frontend fonctionne
  if (sanitized.seo_title !== undefined) {
    sanitized.seo_title = emptyToNull(sanitized.seo_title)
  }
  if (sanitized.seo_description !== undefined) {
    sanitized.seo_description = emptyToNull(sanitized.seo_description)
  }

  const adminClient = getAdminClient()
  const { data, error } = await adminClient
    .from('articles')
    .update({ ...sanitized, updated_at: new Date().toISOString() })
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
