'use client'

interface SeoFieldsProps {
  title: string
  excerpt: string
  slug: string
  seoTitle: string
  seoDescription: string
  onSeoTitleChange: (value: string) => void
  onSeoDescriptionChange: (value: string) => void
}

// --- Couleur du compteur selon la longueur ---
function titleColor(len: number): string {
  if (len === 0) return '#999'
  if (len > 65) return '#E8151B' // rouge — Google tronque
  if (len > 60) return '#F59E0B' // orange — limite
  if (len < 30) return '#F59E0B' // orange — trop court
  return '#16a34a' // vert — zone idéale
}

function descColor(len: number): string {
  if (len === 0) return '#999'
  if (len > 170) return '#E8151B'
  if (len > 160) return '#F59E0B'
  if (len < 130) return '#F59E0B'
  return '#16a34a'
}

function titleMessage(len: number): string {
  if (len === 0) return 'vide — le titre principal sera utilisé'
  if (len > 65) return '⚠️ trop long — Google va tronquer'
  if (len > 60) return '⚠️ limite'
  if (len < 30) return 'un peu court'
  return '✓ longueur idéale'
}

function descMessage(len: number): string {
  if (len === 0) return 'vide — l\'extrait sera utilisé'
  if (len > 170) return '⚠️ trop long — Google va tronquer'
  if (len > 160) return '⚠️ limite'
  if (len < 130) return 'un peu court'
  return '✓ longueur idéale'
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.substring(0, max - 1).trimEnd() + '…'
}

export default function SeoFields({
  title,
  excerpt,
  slug,
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: SeoFieldsProps) {
  const titleLen = seoTitle.length
  const descLen = seoDescription.length

  // Valeurs affichées dans l'aperçu Google — avec fallback identique à celui du frontend
  const previewTitle = (seoTitle.trim() || title.trim() || 'Titre de votre article')
  const previewDesc = (seoDescription.trim() || excerpt.trim() || 'Description de votre article...')
  const previewSlug = slug.trim() || 'slug-article'

  return (
    <div style={{
      background: '#fffbe6',
      border: '2px solid #F5C400',
      borderRadius: 10,
      padding: 20,
      fontFamily: 'Montserrat, sans-serif',
    }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#111', marginBottom: 4 }}>
        🔍 SEO — Comment ton article apparaîtra sur Google
      </div>
      <div style={{ fontSize: 11, color: '#777', marginBottom: 16, lineHeight: 1.5 }}>
        Ces 2 champs sont optionnels. Laisse-les vides pour utiliser le titre principal et l&apos;extrait.
      </div>

      {/* Titre SEO */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, fontWeight: 800 }}>
            Titre SEO <span style={{ fontWeight: 500, color: '#888' }}>(balise &lt;title&gt; affichée dans Google)</span>
          </label>
          <span style={{ fontSize: 11, fontWeight: 700, color: titleColor(titleLen), whiteSpace: 'nowrap' }}>
            {titleLen} car. — {titleMessage(titleLen)}
          </span>
        </div>
        <input
          type="text"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
          placeholder="Laisser vide pour utiliser le titre principal"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: `2px solid ${titleLen > 65 ? '#E8151B' : '#111'}`,
            fontSize: 13,
            fontFamily: 'Montserrat, sans-serif',
            outline: 'none',
          }}
        />
        <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
          Idéal : 30–60 caractères · mot-clé principal en début · ajoute 2026 si pertinent
        </div>
      </div>

      {/* Description SEO */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, fontWeight: 800 }}>
            Méta-description SEO <span style={{ fontWeight: 500, color: '#888' }}>(texte sous le titre dans Google)</span>
          </label>
          <span style={{ fontSize: 11, fontWeight: 700, color: descColor(descLen), whiteSpace: 'nowrap' }}>
            {descLen} car. — {descMessage(descLen)}
          </span>
        </div>
        <textarea
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value)}
          placeholder="Laisser vide pour utiliser l'extrait"
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: `2px solid ${descLen > 170 ? '#E8151B' : '#111'}`,
            fontSize: 13,
            fontFamily: 'Montserrat, sans-serif',
            outline: 'none',
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
          Idéal : 140–160 caractères · résume l&apos;intérêt concret pour le lecteur
        </div>
      </div>

      {/* Aperçu Google */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Aperçu dans Google
        </div>
        <div style={{
          background: '#fff',
          border: '1px solid #dadce0',
          borderRadius: 8,
          padding: '14px 18px',
          fontFamily: 'Arial, sans-serif',
        }}>
          {/* Site + URL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#F5C400',
              border: '1px solid #111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 900,
              color: '#111',
              flexShrink: 0,
              fontFamily: 'Montserrat, sans-serif',
            }}>J</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
              <span style={{ fontSize: 14, color: '#202124', fontWeight: 500 }}>Jean Find My Job</span>
              <span style={{ fontSize: 12, color: '#4d5156', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                https://jeanfindmyjob.fr &rsaquo; blog &rsaquo; {truncate(previewSlug, 35)}
              </span>
            </div>
          </div>
          {/* Titre */}
          <div style={{
            fontSize: 20,
            color: '#1a0dab',
            lineHeight: 1.3,
            marginTop: 6,
            fontWeight: 400,
            cursor: 'pointer',
          }}>
            {truncate(previewTitle, 60)}
          </div>
          {/* Description */}
          <div style={{
            fontSize: 14,
            color: '#4d5156',
            lineHeight: 1.58,
            marginTop: 4,
          }}>
            {truncate(previewDesc, 160)}
          </div>
        </div>
      </div>
    </div>
  )
}
