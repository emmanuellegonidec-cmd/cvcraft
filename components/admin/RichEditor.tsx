'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback, useRef } from 'react'

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  token?: string
}

// --- Fix HTTPS : force https:// sur les liens/images vers jeanfindmyjob.fr ---
// Cible uniquement notre propre domaine, laisse intacts les liens externes en http://
function normalizeInternalLinksHTML(html: string): string {
  if (!html) return html
  return html
    .replace(/href=(["'])http:\/\/(www\.)?jeanfindmyjob\.fr/gi, 'href=$1https://$2jeanfindmyjob.fr')
    .replace(/src=(["'])http:\/\/(www\.)?jeanfindmyjob\.fr/gi, 'src=$1https://$2jeanfindmyjob.fr')
}

// Idem pour une URL seule (utilisé dans les inputs lien/image/CTA)
function normalizeInternalUrl(url: string): string {
  if (!url) return url
  return url.replace(/^http:\/\/(www\.)?jeanfindmyjob\.fr/i, 'https://$1jeanfindmyjob.fr')
}

const ToolbarButton = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} title={title} className="px-2 py-1 rounded text-sm font-bold transition-all" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: active ? '#F5C400' : 'transparent', color: active ? '#111' : '#444', border: active ? '1px solid #111' : '1px solid transparent' }}>
    {children}
  </button>
)

const Divider = () => <div style={{ width: 1, height: 24, backgroundColor: '#ddd', margin: '0 4px' }} />

export default function RichEditor({ content, onChange, token }: RichEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [showCtaInput, setShowCtaInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  // Popup alt SEO après upload
  const [pendingImageUrl, setPendingImageUrl] = useState('')
  const [pendingAlt, setPendingAlt] = useState('')
  const [showAltPopup, setShowAltPopup] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const altPopupRef = useRef<HTMLDivElement>(null)
  const altInputRef = useRef<HTMLInputElement>(null)
  const uploadErrorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { style: 'max-width:100%;border-radius:8px;margin:1.5rem auto;border:2px solid #111;box-shadow:4px 4px 0 #111;display:block;' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          style: 'color:#1A6FDB;font-weight:600;text-decoration:underline;',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Commence à écrire ton article ici...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(normalizeInternalLinksHTML(editor.getHTML())),
    editorProps: { attributes: { class: 'prose-editor' } },
  })

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return
    const safeUrl = normalizeInternalUrl(linkUrl)
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: safeUrl }).run()
    }
    setLinkUrl(''); setShowLinkInput(false)
  }, [editor, linkUrl])

  const addImageFromUrl = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: normalizeInternalUrl(imageUrl), alt: imageAlt || '' }).run()
    setImageUrl(''); setImageAlt(''); setShowImageInput(false)
  }, [editor, imageUrl, imageAlt])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    setUploading(true); setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''))
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `Erreur upload (${res.status})`)
      if (!data.url) throw new Error('URL manquante dans la réponse')
      // Ouvre le popup pour saisir le alt SEO
      setPendingImageUrl(data.url)
      setPendingAlt(data.alt || '')
      setShowAltPopup(true)
      // Scroll auto vers le popup pour qu'il soit visible même si on était en bas de l'éditeur
      setTimeout(() => {
        altPopupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        altInputRef.current?.focus()
      }, 100)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Erreur inconnue')
      setTimeout(() => {
        uploadErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const insertImageWithAlt = useCallback(() => {
    if (!editor || !pendingImageUrl) return
    editor.chain().focus().setImage({ src: pendingImageUrl, alt: pendingAlt }).run()
    setPendingImageUrl(''); setPendingAlt(''); setShowAltPopup(false)
  }, [editor, pendingImageUrl, pendingAlt])

  const addCta = useCallback(() => {
    if (!editor || !ctaText || !ctaUrl) return
    const safeUrl = normalizeInternalUrl(ctaUrl)
    const ctaHtml = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#F5C400;color:#111;font-weight:900;padding:12px 24px;border:2px solid #111;box-shadow:3px 3px 0 #111;text-decoration:none;font-family:Montserrat,sans-serif;border-radius:4px;">${ctaText}</a>`
    editor.chain().focus().insertContent(ctaHtml).run()
    setCtaText(''); setCtaUrl(''); setShowCtaInput(false)
  }, [editor, ctaText, ctaUrl])

  if (!editor) return null

  return (
    <div style={{ border: '2px solid #111', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2" style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #111' }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras"><strong>G</strong></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné"><u>S</u></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré"><s>B</s></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Gauche">⬅</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centre">⬛</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Droite">➡</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Puces">• Liste</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numérotée">1. Liste</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">❝</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false); setShowCtaInput(false) }} active={showLinkInput || editor.isActive('link')} title="Lien externe">🔗 Lien</ToolbarButton>
        <ToolbarButton onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false); setShowCtaInput(false) }} active={showImageInput} title="Image par URL">🌐 URL img</ToolbarButton>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Uploader une image (nom SEO généré automatiquement)" className="px-2 py-1 rounded text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: 'transparent', color: '#444', border: '1px solid transparent' }}>
          {uploading ? '⏳ Upload...' : '📁 Upload'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" onChange={handleFileUpload} style={{ display: 'none' }} />
        <ToolbarButton onClick={() => { setShowCtaInput(!showCtaInput); setShowLinkInput(false); setShowImageInput(false) }} active={showCtaInput} title="Bouton CTA">🎯 CTA</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refaire">↪</ToolbarButton>
      </div>

      {/* Erreur upload */}
      {uploadError && (
        <div ref={uploadErrorRef} className="px-3 py-2 text-xs font-semibold" style={{ backgroundColor: '#fee2e2', color: '#E8151B', borderBottom: '1px solid #E8151B' }}>
          ❌ {uploadError}
        </div>
      )}

      {/* Popup alt SEO après upload */}
      {showAltPopup && (
        <div ref={altPopupRef} className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #16a34a' }}>
          <span className="text-xs font-black" style={{ color: '#16a34a', fontFamily: 'Montserrat, sans-serif' }}>✅ Image uploadée — Texte alternatif SEO :</span>
          <input
            ref={altInputRef}
            type="text"
            value={pendingAlt}
            onChange={e => setPendingAlt(e.target.value)}
            placeholder="Ex : Robot ATS filtrant des CV automatiquement"
            className="flex-1 px-3 py-1 rounded text-sm outline-none"
            style={{ border: '1px solid #16a34a', minWidth: 250 }}
            onKeyDown={e => e.key === 'Enter' && insertImageWithAlt()}
          />
          <button type="button" onClick={insertImageWithAlt} className="px-3 py-1 rounded text-xs font-black" style={{ backgroundColor: '#16a34a', color: '#fff', border: '1px solid #16a34a', fontFamily: 'Montserrat, sans-serif' }}>
            Insérer
          </button>
          <button type="button" onClick={() => { setPendingImageUrl(''); setPendingAlt(''); setShowAltPopup(false) }} className="px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#555' }}>
            Annuler
          </button>
        </div>
      )}

      {/* Input lien */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#fffbe6', borderBottom: '1px solid #F5C400' }}>
          <span className="text-xs font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>URL :</span>
          <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-1 rounded text-sm outline-none" style={{ border: '1px solid #ddd' }} onKeyDown={e => e.key === 'Enter' && addLink()} />
          <button type="button" onClick={addLink} className="px-3 py-1 rounded text-xs font-black" style={{ backgroundColor: '#F5C400', color: '#111', border: '1px solid #111', fontFamily: 'Montserrat, sans-serif' }}>Insérer</button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#555' }}>✕</button>
        </div>
      )}

      {/* Input image URL */}
      {showImageInput && (
        <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ backgroundColor: '#fffbe6', borderBottom: '1px solid #F5C400' }}>
          <span className="text-xs font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Image :</span>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-1 rounded text-sm outline-none" style={{ border: '1px solid #ddd', minWidth: 200 }} />
          <input type="text" value={imageAlt} onChange={e => setImageAlt(e.target.value)} placeholder="Texte alt SEO (important !)" className="px-3 py-1 rounded text-sm outline-none" style={{ border: '1px solid #ddd', width: 200 }} />
          <button type="button" onClick={addImageFromUrl} className="px-3 py-1 rounded text-xs font-black" style={{ backgroundColor: '#F5C400', color: '#111', border: '1px solid #111', fontFamily: 'Montserrat, sans-serif' }}>Insérer</button>
          <button type="button" onClick={() => setShowImageInput(false)} className="px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#555' }}>✕</button>
        </div>
      )}

      {/* Input CTA */}
      {showCtaInput && (
        <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ backgroundColor: '#fffbe6', borderBottom: '1px solid #F5C400' }}>
          <span className="text-xs font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>CTA :</span>
          <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Texte du bouton" className="px-3 py-1 rounded text-sm outline-none" style={{ border: '1px solid #ddd', width: 180 }} />
          <input type="url" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://..." className="flex-1 px-3 py-1 rounded text-sm outline-none" style={{ border: '1px solid #ddd', minWidth: 200 }} />
          <button type="button" onClick={addCta} className="px-3 py-1 rounded text-xs font-black" style={{ backgroundColor: '#F5C400', color: '#111', border: '1px solid #111', fontFamily: 'Montserrat, sans-serif' }}>Insérer</button>
          <button type="button" onClick={() => setShowCtaInput(false)} className="px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#555' }}>✕</button>
        </div>
      )}

      {/* Zone d'édition */}
      <style>{`
        .prose-editor{min-height:500px;padding:24px 28px;font-family:'Montserrat',sans-serif;font-size:15px;line-height:1.7;color:#111;outline:none;}
        .prose-editor h1{font-size:2rem;font-weight:900;margin:1.5rem 0 0.75rem;color:#111;letter-spacing:-0.02em;}
        .prose-editor h2{font-size:1.5rem;font-weight:800;margin:1.25rem 0 0.5rem;color:#111;}
        .prose-editor h3{font-size:1.2rem;font-weight:700;margin:1rem 0 0.5rem;color:#111;}
        .prose-editor p{margin:0.75rem 0;}
        .prose-editor strong{font-weight:800;}
        .prose-editor ul{padding-left:1.5rem;margin:0.75rem 0;list-style-type:disc;}
        .prose-editor ol{padding-left:1.5rem;margin:0.75rem 0;list-style-type:decimal;}
        .prose-editor li{margin:0.25rem 0;}
        .prose-editor blockquote{border-left:4px solid #F5C400;padding:8px 16px;margin:1rem 0;background:#fffbe6;font-style:italic;color:#555;}
        .prose-editor a{color:#1A6FDB;font-weight:600;text-decoration:underline;}
        .prose-editor img{max-width:100%;border-radius:8px;margin:1rem 0;border:2px solid #111;box-shadow:4px 4px 0 #111;display:block;}
        .prose-editor .ProseMirror-focused{outline:none;}
        .tiptap p.is-editor-empty:first-child::before{color:#aaa;content:attr(data-placeholder);float:left;height:0;pointer-events:none;}
      `}</style>
      <EditorContent editor={editor} />
      <div className="px-4 py-2 text-xs" style={{ backgroundColor: '#fafafa', borderTop: '1px solid #eee', color: '#888' }}>
        💡 <strong>📁 Upload</strong> = image uploadée sur Supabase (nom SEO + alt SEO demandé) · <strong>🌐 URL img</strong> = image externe · Taille recommandée : <strong>1200×630px</strong>
      </div>
    </div>
  )
}
