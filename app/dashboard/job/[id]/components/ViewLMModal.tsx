'use client'

import { useState } from 'react'
import { pdf, Document, Page, Text, StyleSheet } from '@react-pdf/renderer'

const FONT = "'Montserrat', sans-serif"

// ────────────────────────────────────────────────────────────────
// Composant React-PDF pour générer la LM en PDF
// (rendu uniquement côté client, format A4 simple)
// ────────────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 90,        // ~3 cm
    paddingBottom: 90,
    paddingHorizontal: 70, // ~2,5 cm
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
    color: '#222',
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
})

function LMPdfDocument({ content }: { content: string }) {
  // On découpe les paragraphes par double saut de ligne (format LM JFMJ)
  // Si le texte n'a pas de double saut de ligne, on le découpe par simple saut de ligne
  const paragraphs = content.includes('\n\n')
    ? content.split('\n\n').map(p => p.trim()).filter(Boolean)
    : content.split('\n').map(p => p.trim()).filter(Boolean)

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {paragraphs.map((p, i) => (
          <Text key={i} style={pdfStyles.paragraph}>{p}</Text>
        ))}
      </Page>
    </Document>
  )
}

// ────────────────────────────────────────────────────────────────
// Fonction utilitaire exportée — déclenche le download PDF
// Utilisée par ViewLMModal ET LinkedLMsSection
// ────────────────────────────────────────────────────────────────
export async function downloadLMAsPDF(content: string, fileName: string): Promise<void> {
  if (!content || typeof window === 'undefined') return
  const safeFileName = (fileName || 'lettre-de-motivation')
    .replace(/[^a-zA-Z0-9-_ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝàáâãäåæçèéêëìíîïðñòóôõöøùúûüý _]/g, '_')
    .substring(0, 100)
    .trim()

  const blob = await pdf(<LMPdfDocument content={content} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeFileName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Petit délai avant de révoquer l'URL pour laisser le temps au navigateur
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ────────────────────────────────────────────────────────────────
// Modale "Voir une LM"
// Affiche le contenu en lecture seule (mais textarea modifiable
// pour copie/édition locale), avec boutons Copier / PDF / Fermer
// ────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
  lmTitle: string
  lmContent: string
  metadata?: {
    tone?: string
    length?: number
    lang?: string
    generatedAt?: string
  }
}

export default function ViewLMModal({
  isOpen,
  onClose,
  lmTitle,
  lmContent,
  metadata,
}: Props) {
  const [editableContent, setEditableContent] = useState(lmContent)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // À l'ouverture, reset du contenu à celui passé en props
  // (au cas où on rouvre avec une LM différente)
  if (isOpen && editableContent !== lmContent && !copied) {
    // synchronise sans effet d'effet infini
    setEditableContent(lmContent)
  }

  if (!isOpen) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editableContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('clipboard error:', e)
    }
  }

  async function handlePdf() {
    setPdfLoading(true)
    try {
      await downloadLMAsPDF(editableContent, lmTitle)
    } catch (e) {
      console.error('PDF error:', e)
      alert("Erreur lors de la génération du PDF. Réessaye.")
    } finally {
      setPdfLoading(false)
    }
  }

  function formatGeneratedAt(iso?: string): string {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
      })
    } catch {
      return ''
    }
  }

  const overlay: React.CSSProperties = {
    background: 'rgba(0,0,0,0.6)',
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  }

  const modalBase: React.CSSProperties = {
    background: '#fff',
    borderRadius: 14,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '2px solid #111',
    boxShadow: '4px 4px 0 #111',
    fontFamily: FONT,
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalBase} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 14px',
          borderBottom: '1.5px solid #F0F0F0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>✉️</span>
              <h2 style={{
                fontSize: 16, fontWeight: 900, color: '#111', margin: 0,
                fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {lmTitle || 'Lettre de motivation'}
              </h2>
            </div>
            {metadata && (
              <p style={{ fontSize: 11, color: '#888', margin: 0, fontFamily: FONT, fontWeight: 600 }}>
                {[
                  formatGeneratedAt(metadata.generatedAt),
                  metadata.tone,
                  metadata.length ? `${metadata.length} mots` : null,
                  metadata.lang,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f0f0f0',
              border: '1.5px solid #ddd',
              color: '#555',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
              padding: '2px 9px',
              lineHeight: '20px',
              borderRadius: 6,
              flexShrink: 0,
              fontFamily: FONT,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, color: '#999', margin: 0, fontFamily: FONT, lineHeight: 1.5 }}>
            💡 Tu peux modifier le texte directement ici avant de copier ou télécharger.
            Les modifications ne sont pas sauvegardées en bibliothèque.
          </p>

          <textarea
            value={editableContent}
            onChange={e => setEditableContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: 360,
              padding: '14px 16px',
              border: '1.5px solid #E5E5E5',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: FONT,
              lineHeight: 1.7,
              color: '#222',
              background: '#FAFAFA',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#F5C400' }}
            onBlur={e => { e.target.style.borderColor = '#E5E5E5' }}
          />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              onClick={onClose}
              style={{
                background: '#F9F9F7',
                color: '#555',
                fontSize: 12,
                fontWeight: 700,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1.5px solid #ddd',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >Fermer</button>

            <button
              onClick={handlePdf}
              disabled={pdfLoading}
              style={{
                background: '#fff',
                color: '#111',
                fontSize: 12,
                fontWeight: 800,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1.5px solid #111',
                cursor: pdfLoading ? 'wait' : 'pointer',
                fontFamily: FONT,
                opacity: pdfLoading ? 0.7 : 1,
              }}
            >{pdfLoading ? '⏳ Génération…' : '⬇️ Télécharger PDF'}</button>

            <button
              onClick={handleCopy}
              style={{
                background: copied ? '#2E7D32' : '#F5C400',
                color: copied ? '#fff' : '#111',
                fontSize: 12,
                fontWeight: 900,
                padding: '9px 18px',
                borderRadius: 8,
                border: '2px solid #111',
                boxShadow: copied ? '2px 2px 0 #111' : '3px 3px 0 #111',
                cursor: 'pointer',
                fontFamily: FONT,
                transition: 'all 0.15s',
              }}
            >{copied ? '✓ Copié !' : '📋 Copier le texte'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
