'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

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

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    category: 'Conseils',
    published: false,
  })

  useEffect(() => {
    const fetchArticle = async () => {
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
          category: data.category ?? 'Conseils',
          published: data.published ?? false,
        })
      } catch {
        setError("Impossible de charger l'article.")
      } finally {
        setLoading(false)
      }
    }
    if (articleId) fetchArticle()
  }, [articleId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return }
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = { ...form, id: articleId }
      if (publish !== undefined) {
        body.published = publish
        if (publish && !form.published) body.published_at = new Date().toISOString()
        if (!publish) body.published_at = null
      }
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erreur') }
      router.push('/admin/articles')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/articles?id=${articleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      router.push('/admin/articles')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setDeleting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 font-semibold">Chargement...</div></div>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}>
          ✍️ Éditer l'article
        </h1>
        <button onClick={() => router.push('/admin/articles')} className="text-sm font-semibold text-gray-500 hover:text-gray-800">← Retour</button>
      </div>

      {error && <div className="mb-6 px-4 py-3 rounded font-semibold text-sm" style={{ backgroundColor: '#fee2e2', color: '#E8151B', border: '1px solid #E8151B' }}>{error}</div>}

      {/* Statut */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-bold text-gray-500">Statut :</span>
        <span className="px-3 py-1 rounded text-xs font-black" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: form.published ? '#F5C400' : '#f3f4f6', color: form.published ? '#111' : '#888', border: form.published ? '1px solid #111' : '1px solid #ddd' }}>
          {form.published ? '✅ Publié' : '📝 Brouillon'}
        </span>
      </div>

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

        {/* Éditeur rich text */}
        <div>
          <label className="block text-sm font-black mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Contenu de l'article</label>
          {!loading && (
            <RichEditor content={form.content} onChange={html => setForm(f => ({ ...f, content: html }))} />
          )}
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>URL image de couverture</label>
          <input type="text" name="cover_image_url" value={form.cover_image_url} onChange={handleChange} placeholder="https://..." className="w-full px-4 py-3 rounded text-sm font-medium outline-none" style={{ border: '2px solid #111' }} />
          {form.cover_image_url && <img src={form.cover_image_url} alt="Aperçu" className="mt-2 rounded" style={{ maxHeight: 200, objectFit: 'cover', border: '2px solid #111' }} />}
        </div>
      </div>

      {/* Boutons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={() => handleSave()} disabled={saving} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#fff', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0px #111', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
          {form.published ? (
            <button onClick={() => handleSave(false)} disabled={saving} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#f3f4f6', color: '#555', border: '2px solid #ddd', opacity: saving ? 0.6 : 1 }}>
              Dépublier
            </button>
          ) : (
            <button onClick={() => handleSave(true)} disabled={saving} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#F5C400', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0px #111', opacity: saving ? 0.6 : 1 }}>
              🚀 Publier
            </button>
          )}
        </div>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-3 font-bold text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#fee2e2', color: '#E8151B', border: '2px solid #E8151B' }}>
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
