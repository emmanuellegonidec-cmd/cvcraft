import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

function slugifyFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const base = filename
    .replace(/\.[^/.]+$/, '') // retire l'extension
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9\s-]/g, '') // retire les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // espaces → tirets
    .replace(/-+/g, '-') // tirets multiples → un seul
    .slice(0, 80) // max 80 caractères
  const timestamp = Date.now()
  return `${base}-${timestamp}.${ext}`
}

export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const altText = formData.get('alt') as string ?? ''

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // Vérifie le type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté. Utilise JPG, PNG, WebP ou GIF.' }, { status: 400 })
    }

    // Vérifie la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image trop lourde (max 5MB).' }, { status: 400 })
    }

    // Génère un nom de fichier SEO-friendly
    const seoFilename = slugifyFilename(file.name)
    const filePath = `articles/${seoFilename}`

    // Upload vers Supabase Storage
    const adminClient = getAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from('article-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Récupère l'URL publique
    const { data: { publicUrl } } = adminClient.storage
      .from('article-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      filename: seoFilename,
      alt: altText,
    })

  } catch (error) {
    console.error('Erreur upload image:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
