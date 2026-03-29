'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback } from 'react'

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
}

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="px-2 py-1 rounded text-sm font-bold transition-all"
    style={{
      fontFamily: 'Montserrat, sans-serif',
      backgroundColor: active ? '#F5C400' : 'transparent',
      color: active ? '#111' : '#444',
      border: active ? '1px solid #111' : '1px solid transparent',
    }}
  >
    {children}
  </button>
)

const Divider = () => (
  <div style={{ width: 1, height: 24, backgroundColor: '#ddd', margin: '0 4px' }} />
)

export default function RichEditor({ content, onChange }: RichEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [showCtaInput, setShowCtaInput] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          style: 'color: #E8151B; font-weight: 600; text-decoration: underline;',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Commence à écrire ton article ici...' }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose-editor',
      },
    },
  })

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(
        `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`
      ).run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl, alt: '' }).run()
    setImageUrl('')
    setShowImageInput(false)
  }, [editor, imageUrl])

  const addCta = useCallback(() => {
    if (!editor || !ctaText || !ctaUrl) return
    const ctaHtml = `<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#F5C400;color:#111;font-weight:900;padding:12px 24px;border:2px solid #111;box-shadow:3px 3px 0 #111;text-decoration:none;font-family:Montserrat,sans-serif;border-radius:4px;">${ctaText}</a>`
    editor.chain().focus().insertContent(ctaHtml).run()
    setCtaText('')
    setCtaUrl('')
    setShowCtaInput(false)
  }, [editor, ctaText, ctaUrl])

  if (!editor) return null

  return (
    <div style={{ border: '2px solid #111', borderRadius: 8, overflow: 'hidden' }}>

      {/* Barre d'outils */}
      <div
        className="flex flex-wrap items-center gap-1 p-2"
        style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #111' }}
      >
        {/* Titres */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titre H1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre H2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre H3">H3</ToolbarButton>

        <Divider />

        {/* Formatage */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras"><strong>G</strong></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné"><u>S</u></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré"><s>B</s></ToolbarButton>

        <Divider />

        {/* Alignement */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Aligner à gauche">⬅</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrer">⬛</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Aligner à droite">➡</ToolbarButton>

        <Divider />

        {/* Listes */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">• Liste</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">1. Liste</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">❝</ToolbarButton>

        <Divider />

        {/* Lien */}
        <ToolbarButton onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false); setShowCtaInput(false) }} active={showLinkInput || editor.isActive('link')} title="Insérer un lien">🔗 Lien</ToolbarButton>

        {/* Image */}
        <ToolbarButton onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false); setShowCtaInput(false) }} active={showImageInput} title="Insérer une image">🖼 Image</ToolbarButton>

        {/* CTA */}
        <ToolbarButton onClick={() => { setShowCtaInput(!showCtaInput); setShowLinkInput(false); setShowImageInput(false) }} active={showCtaInput} title="Insérer un bouton CTA">🎯 CTA</ToolbarButton>

        <Divider />

        {/* Annuler / Refaire */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refaire">↪</ToolbarButton>
      </div>

      {/* Input lien */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#fffbe6', borderBottom: '1px solid #F5C400' }}>
          <span className="text-xs font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>URL du lien :</span>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-1 rounded text-sm outline-none"
            style={{ border: '1px solid #ddd' }}
            onKeyDown={e => e.key === 'Enter' && addLink()}
          />
          <button type="button" onClick={addLink} className="px-3 py-1 rounded text-xs font-black" style={{ backgroundColor: '#F5C400', color: '#111', border: '1px solid #111', fontFamily: 'Montserrat, sans-serif' }}>Insérer</button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#555' }}>✕</button>
        </div>
      )}

      {/* Input image */}
      {showImageInput && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#fffbe6', borderBottom: '1px solid #F5C400' }}>
          <span className="text-xs font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>URL de l'image :</span>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-1 rounded text-sm outline-none"
            style={{ border: '1px solid #ddd' }}
            onKeyDown={e => e.key === 'Enter' && addImage()}
          />
          <button type="button" onClick={addImage} className="px-3 py-1 rounded text-xs font-black" style={{ backgroundColor: '#F5C400', color: '#111', border: '1px solid #111', fontFamily: 'Montserrat, sans-serif' }}>Insérer</button>
          <button type="button" onClick={() => setShowImageInput(false)} className="px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#555' }}>✕</button>
        </div>
      )}

      {/* Input CTA */}
      {showCtaInput && (
        <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ backgroundColor: '#fffbe6', borderBottom: '1px solid #F5C400' }}>
          <span className="text-xs font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Bouton CTA :</span>
          <input
            type="text"
            value={ctaText}
            onChange={e => setCtaText(e.target.value)}
            placeholder="Texte du bouton"
            className="px-3 py-1 rounded text-sm outline-none"
            style={{ border: '1px solid #ddd', width: 180 }}
          />
          <input
            type="url"
            value={ctaUrl}
            onChange={e => setCtaUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-1 rounded text-sm outline-none"
            style={{ border: '1px solid #ddd', minWidth: 200 }}
          />
          <button type="button" onClick={addCta} className="px-3 py-1 rounded text-xs font-black" style={{ backgroundColor: '#F5C400', color: '#111', border: '1px solid #111', fontFamily: 'Montserrat, sans-serif' }}>Insérer</button>
          <button type="button" onClick={() => setShowCtaInput(false)} className="px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#555' }}>✕</button>
        </div>
      )}

      {/* Zone d'édition */}
      <style>{`
        .prose-editor {
          min-height: 400px;
          padding: 20px 24px;
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #111;
          outline: none;
        }
        .prose-editor h1 { font-size: 2rem; font-weight: 900; margin: 1.5rem 0 0.75rem; color: #111; letter-spacing: -0.02em; }
        .prose-editor h2 { font-size: 1.5rem; font-weight: 800; margin: 1.25rem 0 0.5rem; color: #111; }
        .prose-editor h3 { font-size: 1.2rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #111; }
        .prose-editor p { margin: 0.75rem 0; }
        .prose-editor strong { font-weight: 800; }
        .prose-editor ul { padding-left: 1.5rem; margin: 0.75rem 0; list-style-type: disc; }
        .prose-editor ol { padding-left: 1.5rem; margin: 0.75rem 0; list-style-type: decimal; }
        .prose-editor li { margin: 0.25rem 0; }
        .prose-editor blockquote { border-left: 4px solid #F5C400; padding: 8px 16px; margin: 1rem 0; background: #fffbe6; font-style: italic; color: #555; }
        .prose-editor a { color: #E8151B; font-weight: 600; text-decoration: underline; }
        .prose-editor img { max-width: 100%; border-radius: 8px; margin: 1rem 0; border: 2px solid #111; }
        .prose-editor .ProseMirror-focused { outline: none; }
        .tiptap p.is-editor-empty:first-child::before { color: #aaa; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
      `}</style>

      <EditorContent editor={editor} />
    </div>
  )
}
