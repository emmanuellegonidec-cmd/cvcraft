'use client'

const FONT = "'Montserrat', sans-serif"

const REASONS = [
  { id: 'refus_recruteur', label: '❌ Refus recruteur', desc: 'Le recruteur n\'a pas retenu ma candidature' },
  { id: 'refus_candidat',  label: '🙋 Refus de ma part', desc: 'J\'ai décliné l\'offre' },
  { id: 'sans_reponse',    label: '🔇 Sans réponse', desc: 'Aucun retour après relances' },
  { id: 'offre_expiree',   label: '⏱ Offre expirée', desc: 'Le poste n\'est plus disponible' },
  { id: 'abandon',         label: '🚪 Abandon', desc: 'J\'ai arrêté le processus' },
  { id: 'autre',           label: '💬 Autre', desc: 'Autre raison' },
]

interface Props {
  archivedReason: string | null
  archivedNote: string | null
  onPatch: (field: string, value: any) => void
  onJobChange: (field: string, value: any) => void
}

export default function JobArchivedDetails({ archivedReason, archivedNote, onPatch, onJobChange }: Props) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderBottom: '1.5px solid #eee' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#111', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#aaa', flexShrink: 0, fontFamily: FONT }}>
          ✕
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#111', fontFamily: FONT }}>
          Raison de l&apos;archivage
        </span>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* Choix prédéfinis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {REASONS.map(r => {
            const isSelected = archivedReason === r.id
            return (
              <button
                key={r.id}
                onClick={() => {
                  const val = isSelected ? null : r.id
                  onJobChange('archived_reason', val)
                  onPatch('archived_reason', val)
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? '#111' : '#E0E0E0'}`,
                  background: isSelected ? '#111' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: FONT,
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '2px 2px 0 #F5C400' : 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? '#F5C400' : '#111', marginBottom: 3, fontFamily: FONT }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: isSelected ? '#aaa' : '#888', fontFamily: FONT, lineHeight: 1.4 }}>
                  {r.desc}
                </div>
              </button>
            )
          })}
        </div>

        {/* Note libre */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT }}>
            Précisions / Notes (optionnel)
          </label>
          <textarea
            value={archivedNote || ''}
            onChange={e => onJobChange('archived_note', e.target.value || null)}
            onBlur={e => onPatch('archived_note', e.target.value || null)}
            placeholder="Ex : Poste finalement non pourvu, manque d'expérience sur X, salaire insuffisant..."
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid #E0E0E0', borderRadius: 8,
              fontSize: 13, fontWeight: 500, fontFamily: FONT,
              color: '#111', background: '#fff', outline: 'none',
              resize: 'vertical', minHeight: 90, lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#111' }}
            onBlur={e => { onPatch('archived_note', e.target.value || null); e.target.style.borderColor = '#E0E0E0' }}
          />
        </div>

      </div>
    </div>
  )
}
