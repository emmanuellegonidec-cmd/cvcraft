'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase'

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false })

const CATEGORIES = ['Conseils', 'CV & Lettre', 'Entretien', 'Reconversion', "Marché de l'emploi", 'Témoignage', 'Outils']

export default function AdminEditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tokenReady, setTokenReady] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    cover_image_alt: '',
    category: 'Conseils',
    published: false,
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        ;(window as unknown as Record<string, unknown>).__admin_token = session.access_token
        setTokenReady(true)
      } else {
        setError('Session expirée — reconnecte-toi sur /auth/login')
      }

      try {
        const res = await fetch(`/api/admin/articles?id=${articleId}`)
        if (!res.ok) throw new Error('Article introuvable')
        const data = await res.json()
        setForm({
          title: data.title ?? '',
          slug: data.slug ?? '',
          excerpt: data.excerpt ?? '',
          content: data.content ?? '',
          cover_image_url: data.cover_image_url ?? '',
          cover_image_alt: data.cover_image_alt ?? '',
          category: data.category ?? 'Conseils',
          published: data.published ?? false,
        })
      } catch {
        setError("Impossible de charger l'article.")
      } finally {
        setLoading(false)
      }
    }
    if (articleId) init()
  }, [articleId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  // Upload image de couverture
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const token = (window as unknown as Record<string, unknown>).__admin_token as string
    if (!token) { setError('Token manquant'); return }

    setUploadingCover(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      // Nom alt SEO = titre de l'article ou nom du fichier
      const altText = form.title || file.name.replace(/\.[^/.]+$/, '')
      formData.append('alt', altText)

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur upload')

      setForm(f => ({
        ...f,
        cover_image_url: data.url,
        cover_image_alt: altText,
      }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return }
    const token = (window as unknown as Record<string, unknown>).__admin_token as string
    if (!token) { setError('Token manquant — reconnecte-toi.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const body: Record<string, unknown> = { ...form, id: articleId }
      if (publish !== undefined) {
        body.published = publish
        if (publish && !form.published) body.published_at = new Date().toISOString()
        if (!publish) body.published_at = null
      }
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erreur') }
      setSuccess(publish === true ? '🎉 Article publié !' : publish === false ? '📝 Article dépublié' : '💾 Sauvegardé !')
      setTimeout(() => router.push('/admin/articles'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const token = (window as unknown as Record<string, unknown>).__admin_token as string
    if (!token) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/articles?id=${articleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      router.push('/admin/articles')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setDeleting(false)
    }
  }

  const token = typeof window !== 'undefined'
    ? (window as unknown as Record<string, unknown>).__admin_token as string
    : ''

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 font-semibold">Chargement...</div>
    </div>
  )

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}>
          ✍️ Éditer l'article
        </h1>
        <button onClick={() => router.push('/admin/articles')} className="text-sm font-semibold text-gray-500 hover:text-gray-800">
          ← Retour
        </button>
      </div>

      {/* Statut */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-bold text-gray-500">Statut :</span>
        <span className="px-3 py-1 rounded text-xs font-black" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: form.published ? '#F5C400' : '#f3f4f6', color: form.published ? '#111' : '#888', border: form.published ? '1px solid #111' : '1px solid #ddd' }}>
          {form.published ? '✅ Publié' : '📝 Brouillon'}
        </span>
      </div>

      {!tokenReady && !error && (
        <div className="mb-4 px-4 py-3 rounded text-sm font-semibold" style={{ backgroundColor: '#fffbe6', border: '1px solid #F5C400', color: '#B8900A' }}>
          ⏳ Chargement de la session...
        </div>
      )}
      {error && <div className="mb-6 px-4 py-3 rounded font-semibold text-sm" style={{ backgroundColor: '#fee2e2', color: '#E8151B', border: '1px solid #E8151B' }}>❌ {error}</div>}
      {success && <div className="mb-6 px-4 py-3 rounded font-semibold text-sm" style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #16a34a' }}>{success}</div>}

      <div className="bg-white rounded p-6 space-y-5 mb-6" style={{ border: '2px solid #111', boxShadow: '4px 4px 0px #111' }}>

        {/* Titre */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Titre *</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-3 rounded text-sm font-medium outline-none" style={{ border: '2px solid #111' }} />
        </div>

        {/* Slug + Catégorie */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Slug (URL)</label>
            <input type="text" name="slug" value={form.slug} onChange={handleChange} className="w-full px-4 py-3 rounded text-sm font-medium outline-none" style={{ border: '2px solid #111', backgroundColor: '#fafafa' }} />
          </div>
          <div>
            <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Catégorie</label>
            <select name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-3 rounded text-sm font-medium outline-none" style={{ border: '2px solid #111' }}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Extrait */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Extrait</label>
          <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded text-sm font-medium outline-none resize-none" style={{ border: '2px solid #111' }} />
        </div>

        {/* Image de couverture */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            🖼️ Image de couverture
            <span className="ml-2 text-xs font-normal text-gray-400">1200×630px recommandé · JPG/PNG/WebP · max 5MB</span>
          </label>

          {/* Upload depuis ordinateur */}
          <div className="flex items-center gap-3 mb-3">
            <label
              className="px-4 py-2 rounded text-sm font-black cursor-pointer"
              style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: uploadingCover ? '#f3f4f6' : '#111', color: uploadingCover ? '#888' : '#F5C400', border: '2px solid #111', boxShadow: uploadingCover ? 'none' : '3px 3px 0 #E8151B' }}
            >
              {uploadingCover ? '⏳ Upload...' : '📁 Uploader une image'}
              <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleCoverUpload} style={{ display: 'none' }} disabled={uploadingCover} />
            </label>
            <span className="text-xs text-gray-400">ou colle une URL ci-dessous</span>
          </div>

          <input
            type="text"
            name="cover_image_url"
            value={form.cover_image_url}
            onChange={handleChange}
            placeholder="https://... (rempli automatiquement après upload)"
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none mb-2"
            style={{ border: '2px solid #111' }}
          />

          {/* Alt SEO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Texte alternatif (SEO) — décrit l'image pour Google</label>
            <input
              type="text"
              name="cover_image_alt"
              value={form.cover_image_alt}
              onChange={handleChange}
              placeholder="Ex : Robot ATS filtrant des CV automatiquement"
              className="w-full px-4 py-2 rounded text-sm font-medium outline-none"
              style={{ border: '1px solid #ddd', backgroundColor: '#fafafa' }}
            />
          </div>

          {form.cover_image_url && (
            <div className="mt-3 relative">
              <img
                src={form.cover_image_url}
                alt={form.cover_image_alt || form.title}
                className="rounded"
                style={{ maxHeight: 200, objectFit: 'cover', border: '2px solid #111', boxShadow: '3px 3px 0 #111', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, cover_image_url: '', cover_image_alt: '' }))}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{ backgroundColor: '#E8151B', color: '#fff', border: '2px solid #fff' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Éditeur */}
        <div>
          <label className="block text-sm font-black mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Contenu de l'article
            <span className="ml-2 text-xs font-normal text-gray-400">📁 Upload = image depuis votre ordinateur (nom SEO auto) · 🌐 URL img = image externe</span>
          </label>
          {!loading && (
            <RichEditor
              content={form.content}
              onChange={html => setForm(f => ({ ...f, content: html }))}
              token={token}
            />
          )}
        </div>
      </div>

      {/* Boutons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={() => handleSave()} disabled={saving || !tokenReady} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#fff', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0px #111', opacity: (saving || !tokenReady) ? 0.6 : 1 }}>
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
          {form.published ? (
            <button onClick={() => handleSave(false)} disabled={saving} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#f3f4f6', color: '#555', border: '2px solid #ddd', opacity: saving ? 0.6 : 1 }}>
              Dépublier
            </button>
          ) : (
            <button onClick={() => handleSave(true)} disabled={saving || !tokenReady} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#F5C400', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0px #111', opacity: (saving || !tokenReady) ? 0.6 : 1 }}>
              🚀 Publier
            </button>
          )}
        </div>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-3 font-bold text-sm rounded" style={{ backgroundColor: '#fee2e2', color: '#E8151B', border: '2px solid #E8151B' }}>
            🗑️ Supprimer
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-red-600">Confirmer la suppression ?</span>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 font-black text-sm rounded" style={{ backgroundColor: '#E8151B', color: '#fff', border: '2px solid #E8151B', opacity: deleting ? 0.6 : 1 }}>
              {deleting ? '...' : 'Oui, supprimer'}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 font-bold text-sm rounded" style={{ backgroundColor: '#f3f4f6', color: '#555', border: '2px solid #ddd' }}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
