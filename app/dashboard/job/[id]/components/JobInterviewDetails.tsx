'use client'

import { useState } from 'react'

const FONT = "'Montserrat', sans-serif"

interface Contact {
  id: string
  name: string
  role?: string | null
  company?: string | null
}

interface Job {
  interview_at: string | null
  interview_time: string | null
  interview_time_end: string | null
  interview_type: string | null
  interview_contact_id: string | null
  interview_contacts: Record<string, string> | null
  interview_location: string | null
  interview_link: string | null
  interview_phone: string | null
}

interface Props {
  job: Job
  contacts: Contact[]
  onPatch: (field: string, value: any) => void
  onJobChange: (field: string, value: any) => void
  onCreateContact: () => void
  currentStepNum: number
  currentStepLabel: string
  currentStepId: string
}

export default function JobInterviewDetails({
  job, contacts, onPatch, onJobChange,
  onCreateContact, currentStepNum, currentStepLabel, currentStepId
}: Props) {
  const [open, setOpen] = useState(true)

  // Contact spécifique à cette étape (nouveau système JSON)
  // Fallback sur l'ancien champ interview_contact_id si pas encore migré
  const interviewContacts = job.interview_contacts || {}
  const stepContactId = interviewContacts[currentStepId] || job.interview_contact_id || ''
  const selectedContact = contacts.find(c => c.id === stepContactId)

  function handleContactChange(contactId: string) {
    // Sauvegarde dans le JSON par étape
    const updated = { ...interviewContacts, [currentStepId]: contactId || '' }
    onJobChange('interview_contacts', updated)
    onPatch('interview_contacts', updated)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1.5px solid #ddd',
    borderRadius: 7, fontSize: 13, fontWeight: 600, fontFamily: FONT,
    color: '#111', outline: 'none', background: '#fff',
    boxSizing: 'border-box' as const,
  }

  const label: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#888', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em',
    fontFamily: FONT,
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', cursor: 'pointer', background: '#fff', borderBottom: open ? '1.5px solid #eee' : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#F5C400', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#111', flexShrink: 0, fontFamily: FONT }}>
            {currentStepNum}
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#111', fontFamily: FONT }}>
            📅 Détails de l&apos;entretien
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', fontFamily: FONT }}>
            — {currentStepLabel}
          </span>
        </div>
        <span style={{ fontSize: 14, color: '#bbb', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </div>

      {open && (
        <div style={{ padding: '20px 24px' }}>

          {/* Date / Heure début / Heure fin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Date', type: 'date', field: 'interview_at', value: job.interview_at ? job.interview_at.slice(0, 10) : '' },
              { label: 'Début', type: 'time', field: 'interview_time', value: job.interview_time || '' },
              { label: 'Fin', type: 'time', field: 'interview_time_end', value: job.interview_time_end || '' },
            ].map(({ label: lbl, type, field, value }) => (
              <div key={field}>
                <label style={label}>{lbl}</label>
                <input
                  type={type}
                  value={value}
                  style={inp}
                  onChange={e => onJobChange(field, e.target.value || null)}
                  onBlur={e => onPatch(field, e.target.value || null)}
                />
              </div>
            ))}
          </div>

          {/* Type d'entretien */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Type d&apos;entretien</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'telephone', label: '📞 Téléphone' },
                { id: 'visio',     label: '💻 Visio' },
                { id: 'presentiel', label: '🏢 Présentiel' },
              ].map(t => (
                <button key={t.id}
                  onClick={() => onPatch('interview_type', job.interview_type === t.id ? null : t.id)}
                  style={{
                    flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 700, borderRadius: 7, fontFamily: FONT,
                    border: `2px solid ${job.interview_type === t.id ? '#111' : '#E0E0E0'}`,
                    background: job.interview_type === t.id ? '#F5C400' : '#fff',
                    color: '#111', cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lieu / Lien / Téléphone selon type */}
          {job.interview_type === 'presentiel' && (
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Adresse</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={job.interview_location || ''} style={{ ...inp, flex: 1 }}
                  onChange={e => onJobChange('interview_location', e.target.value || null)}
                  onBlur={e => onPatch('interview_location', e.target.value || null)}
                  placeholder="Adresse de l'entretien" />
                {job.interview_location && (
                  <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.interview_location!)}`, '_blank')}
                    style={{ flexShrink: 0, background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT }}>
                    Maps →
                  </button>
                )}
              </div>
            </div>
          )}

          {job.interview_type === 'visio' && (
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Lien visio</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={job.interview_link || ''} style={{ ...inp, flex: 1 }}
                  onChange={e => onJobChange('interview_link', e.target.value || null)}
                  onBlur={e => onPatch('interview_link', e.target.value || null)}
                  placeholder="https://meet.google.com/..." />
                {job.interview_link && (
                  <button onClick={() => window.open(job.interview_link!, '_blank')}
                    style={{ flexShrink: 0, background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT }}>
                    Rejoindre →
                  </button>
                )}
              </div>
            </div>
          )}

          {job.interview_type === 'telephone' && (
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Numéro de téléphone</label>
              <input value={job.interview_phone || ''} style={inp}
                onChange={e => onJobChange('interview_phone', e.target.value || null)}
                onBlur={e => onPatch('interview_phone', e.target.value || null)}
                placeholder="+33 6 00 00 00 00" />
            </div>
          )}

          {/* Contact — spécifique à cette étape */}
          <div>
            <label style={label}>👤 Contact pour cet entretien ({currentStepLabel})</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={stepContactId}
                onChange={e => handleContactChange(e.target.value)}
                style={{ ...inp, flex: 1 }}
              >
                <option value="">— Aucun contact —</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.role ? ` – ${c.role}` : ''}{c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </select>
              <button onClick={onCreateContact}
                style={{ flexShrink: 0, background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', boxShadow: '2px 2px 0 #F5C400' }}>
                + Nouveau
              </button>
            </div>
            {selectedContact && (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#B8900A', fontFamily: FONT }}>
                👤 {selectedContact.name}{selectedContact.role ? ` – ${selectedContact.role}` : ''}{selectedContact.company ? ` · ${selectedContact.company}` : ''}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
