'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Conseils', 'CV & Lettre', 'Entretien', 'Reconversion', 'Marché de l\'emploi', 'Témoignage', 'Outils']

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminNewArticlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setForm((f) => ({
      ...f,
      title,
      slug: generateSlug(title),
    }))
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = async (publish: boolean) => {
    if (!form.title.trim()) {
      setError('Le titre est obligatoire.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          published: publish,
          published_at: publish ? new Date().toISOString() : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur lors de la sauvegarde')
      }
      router.push('/admin/articles')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-3xl font-black"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}
        >
          ✍️ Nouvel article
        </h1>
        <button
          onClick={() => router.push('/admin/articles')}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800"
        >
          ← Retour
        </button>
      </div>

      {error && (
        <div
          className="mb-6 px-4 py-3 rounded font-semibold text-sm"
          style={{ backgroundColor: '#fee2e2', color: '#E8151B', border: '1px solid #E8151B' }}
        >
          {error}
        </div>
      )}

      <div
        className="bg-white rounded p-6 space-y-5"
        style={{ border: '2px solid #111', boxShadow: '4px 4px 0px #111' }}
      >
        {/* Titre */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Titre *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={handleTitleChange}
            placeholder="Ex : 5 conseils pour décrocher un entretien après 50 ans"
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none"
            style={{ border: '2px solid #111' }}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Slug (URL)
          </label>
          <input
            type="text"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="genere-automatiquement-depuis-le-titre"
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none"
            style={{ border: '2px solid #111', backgroundColor: '#fafafa' }}
          />
          <p className="text-xs text-gray-400 mt-1">Généré automatiquement. Modifiable si besoin.</p>
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Catégorie
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none"
            style={{ border: '2px solid #111' }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Extrait */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Extrait (résumé court)
          </label>
          <textarea
            name="excerpt"
            value={form.excerpt}
            onChange={handleChange}
            rows={2}
            placeholder="Affiché sur la landing page sous le titre de l'article..."
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none resize-none"
            style={{ border: '2px solid #111' }}
          />
        </div>

        {/* Contenu */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Contenu de l'article
          </label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={14}
            placeholder="Écris ton article ici... (le markdown est supporté : **gras**, # Titre, etc.)"
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none resize-y"
            style={{ border: '2px solid #111', fontFamily: 'monospace' }}
          />
        </div>

        {/* Image de couverture */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            URL de l'image de couverture (optionnel)
          </label>
          <input
            type="text"
            name="cover_image_url"
            value={form.cover_image_url}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none"
            style={{ border: '2px solid #111' }}
          />
        </div>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-6 py-3 font-black text-sm rounded transition-all"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            backgroundColor: '#fff',
            color: '#111',
            border: '2px solid #111',
            boxShadow: '3px 3px 0px #111',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder en brouillon'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-6 py-3 font-black text-sm rounded transition-all"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            backgroundColor: '#F5C400',
            color: '#111',
            border: '2px solid #111',
            boxShadow: '3px 3px 0px #111',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Publication...' : '🚀 Publier maintenant'}
        </button>
      </div>
    </div>
  )
}
