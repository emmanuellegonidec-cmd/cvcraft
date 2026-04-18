'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import SeoFields from '@/components/admin/SeoFields'

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false })

const CATEGORIES = ['Conseils', 'CV & Lettre', 'Entretien', 'Reconversion', "Marché de l'emploi", 'Témoignage', 'Outils']

function generateSlug(title: string) {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

export default function AdminNewArticlePage() {
  const router = useRouter()
  const tokenRef = useRef<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tokenReady, setTokenReady] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '',
    cover_image_url: '', cover_image_alt: '', category: 'Conseils',
    seo_title: '', seo_description: '',
  })

  useEffect(() => {
    const getToken = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          tokenRef.current = session.access_token
          setTokenReady(true)
        } else {
          setError('Session expirée — reconnecte-toi sur /auth/login')
        }
      } catch {
        setError('Erreur de session — reconnecte-toi')
      }
    }
    getToken()
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setForm(f => ({ ...f, title, slug: generateSlug(title) }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  // Upload image de couverture
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!tokenRef.current) { setError('Token manquant'); return }

    setUploadingCover(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const altText = form.title || file.name.replace(/\.[^/.]+$/, '')
      formData.append('alt', altText)

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenRef.current}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur upload')
      setForm(f => ({ ...f, cover_image_url: data.url, cover_image_alt: altText }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  const handleSave = async (publish: boolean) => {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return }
    if (!tokenRef.current) { setError('Token manquant — reconnecte-toi.'); return }

    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({
          ...form,
          published: publish,
          published_at: publish ? new Date().toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
      setSuccess(publish ? '🎉 Article publié !' : '💾 Brouillon sauvegardé !')
      setTimeout(() => router.push('/admin/articles'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}>✍️ Nouvel article</h1>
        <button onClick={() => router.push('/admin/articles')} className="text-sm font-semibold text-gray-500 hover:text-gray-800">← Retour</button>
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
          <input type="text" value={form.title} onChange={handleTitleChange} placeholder="Ex : 5 conseils pour décrocher un entretien après 50 ans" className="w-full px-4 py-3 rounded text-sm font-medium outline-none" style={{ border: '2px solid #111' }} />
        </div>

        {/* Slug + Catégorie */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Slug (URL)</label>
            <input type="text" name="slug" value={form.slug} onChange={handleChange} className="w-full px-4 py-3 rounded text-sm font-medium outline-none" style={{ border: '2px solid #111', backgroundColor: '#fafafa' }} />
            <p className="text-xs text-gray-400 mt-1">Généré automatiquement depuis le titre.</p>
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
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Extrait (affiché sur la landing page)</label>
          <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2} placeholder="Résumé court affiché sous le titre..." className="w-full px-4 py-3 rounded text-sm font-medium outline-none resize-none" style={{ border: '2px solid #111' }} />
        </div>

        {/* Bloc SEO avec aperçu Google */}
        <SeoFields
          title={form.title}
          excerpt={form.excerpt}
          slug={form.slug}
          seoTitle={form.seo_title}
          seoDescription={form.seo_description}
          onSeoTitleChange={(v) => setForm(f => ({ ...f, seo_title: v }))}
          onSeoDescriptionChange={(v) => setForm(f => ({ ...f, seo_description: v }))}
        />

        {/* Règles images */}
        <div style={{ backgroundColor: '#fffbe6', border: '2px solid #F5C400', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, fontFamily: 'Montserrat, sans-serif' }}>
          <div style={{ fontWeight: 800, color: '#111', marginBottom: 4 }}>📐 Règles pour les images du blog</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: '#555', lineHeight: 1.8 }}>
            <li><strong>Dimensions :</strong> 1200 × 630 px (format 16/9 recommandé)</li>
            <li><strong>Poids max :</strong> 2 MB</li>
            <li><strong>Formats acceptés :</strong> WebP (idéal), JPG, PNG</li>
            <li><strong>Conseil :</strong> utilise <a href="https://squoosh.app" target="_blank" rel="noreferrer" style={{ color: '#E8151B', fontWeight: 700 }}>squoosh.app</a> pour compresser gratuitement avant d&apos;uploader</li>
          </ul>
        </div>

        {/* Image de couverture */}
        <div>
          <label className="block text-sm font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            🖼️ Image de couverture
            <span className="ml-2 text-xs font-normal text-gray-400">1200×630px · JPG/PNG/WebP · max 5MB</span>
          </label>
          <div className="flex items-center gap-3 mb-3">
            <label className="px-4 py-2 rounded text-sm font-black cursor-pointer" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: uploadingCover ? '#f3f4f6' : '#111', color: uploadingCover ? '#888' : '#F5C400', border: '2px solid #111', boxShadow: uploadingCover ? 'none' : '3px 3px 0 #E8151B' }}>
              {uploadingCover ? '⏳ Upload...' : '📁 Uploader une image'}
              <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleCoverUpload} style={{ display: 'none' }} disabled={uploadingCover || !tokenReady} />
            </label>
            <span className="text-xs text-gray-400">ou colle une URL ci-dessous</span>
          </div>
          <input type="text" name="cover_image_url" value={form.cover_image_url} onChange={handleChange} placeholder="https://... (rempli automatiquement après upload)" className="w-full px-4 py-3 rounded text-sm font-medium outline-none mb-2" style={{ border: '2px solid #111' }} />
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Texte alternatif SEO — décrit l&apos;image pour Google</label>
            <input type="text" name="cover_image_alt" value={form.cover_image_alt} onChange={handleChange} placeholder="Ex : Robot ATS filtrant des CV automatiquement" className="w-full px-4 py-2 rounded text-sm font-medium outline-none" style={{ border: '1px solid #ddd', backgroundColor: '#fafafa' }} />
          </div>
          {form.cover_image_url && (
            <div className="mt-3 relative">
              <Image src={form.cover_image_url} alt={form.cover_image_alt || form.title} width={1200} height={200} className="rounded" style={{ objectFit: 'cover', border: '2px solid #111', boxShadow: '3px 3px 0 #111', width: '100%', height: 'auto', maxHeight: 200 }} />
              <button type="button" onClick={() => setForm(f => ({ ...f, cover_image_url: '', cover_image_alt: '' }))} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: '#E8151B', color: '#fff', border: '2px solid #fff' }}>✕</button>
            </div>
          )}
        </div>

        {/* Éditeur */}
        <div>
          <label className="block text-sm font-black mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Contenu de l&apos;article</label>
          <RichEditor
            content={form.content}
            onChange={html => setForm(f => ({ ...f, content: html }))}
            token={tokenRef.current}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => handleSave(false)} disabled={saving || !tokenReady} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#fff', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0px #111', opacity: (saving || !tokenReady) ? 0.6 : 1 }}>
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder en brouillon'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving || !tokenReady} className="px-6 py-3 font-black text-sm rounded" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#F5C400', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0px #111', opacity: (saving || !tokenReady) ? 0.6 : 1 }}>
          {saving ? 'Publication...' : '🚀 Publier maintenant'}
        </button>
      </div>
    </div>
  )
}
