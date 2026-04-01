'use client'

const FONT = "'Montserrat', sans-serif"

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  telephone: '📞 Téléphone', visio: '💻 Visio', presentiel: '🏢 Présentiel',
}

interface Contact {
  id: string; name: string; role?: string | null; company?: string | null
}

interface Job {
  interview_at: string | null
  interview_time: string | null
  interview_time_end: string | null
  interview_type: string | null
  interview_contact_id: string | null
  interview_location: string | null
  interview_link: string | null
  interview_phone: string | null
}

interface Props {
  job: Job
  contacts: Contact[]
  onPatch: (field: string, value: any) => void
  onJobChange: (field: string, value: any) => void
}

export default function JobInterviewDetails({ job, contacts, onPatch, onJobChange }: Props) {
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: '#B8900A', marginBottom: 14,
    display: 'block', fontFamily: FONT,
  }

  const selectedContact = contacts.find(c => c.id === job.interview_contact_id)

  return (
    <div style={{ background: '#FEF9E0', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '2px solid #F5C400', boxShadow: '2px 2px 0 #F5C400' }}>
      <span style={sectionLabel}>📅 Détails de l&apos;entretien</span>

      {/* Date / Heure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Date', type: 'date', field: 'interview_at', value: job.interview_at ? job.interview_at.slice(0, 10) : '' },
          { label: 'Début', type: 'time', field: 'interview_time', value: job.interview_time || '' },
          { label: 'Fin', type: 'time', field: 'interview_time_end', value: job.interview_time_end || '' },
        ].map(({ label, type, field, value }) => (
          <div key={field}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <input
              type={type}
              className="interview-inp"
              value={value}
              onChange={e => onJobChange(field, e.target.value || null)}
              onBlur={e => onPatch(field, e.target.value || null)}
            />
          </div>
        ))}
      </div>

      {/* Type */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Type d&apos;entretien</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['telephone', 'visio', 'presentiel'] as const).map(t => (
            <button
              key={t}
              className={`interview-type-btn${job.interview_type === t ? ' active' : ''}`}
              onClick={() => onPatch('interview_type', job.interview_type === t ? null : t)}
            >
              {INTERVIEW_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Téléphone */}
      {job.interview_type === 'telephone' && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📞 Numéro de téléphone</label>
          <input type="tel" className="interview-inp" placeholder="Ex : +33 6 12 34 56 78"
            value={job.interview_phone || ''}
            onChange={e => onJobChange('interview_phone', e.target.value || null)}
            onBlur={e => onPatch('interview_phone', e.target.value || null)} />
        </div>
      )}

      {/* Visio */}
      {job.interview_type === 'visio' && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>💻 Lien de la visio</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="url" className="interview-inp" placeholder="https://meet.google.com/..."
              value={job.interview_link || ''}
              onChange={e => onJobChange('interview_link', e.target.value || null)}
              onBlur={e => onPatch('interview_link', e.target.value || null)} />
            {job.interview_link && (
              <button onClick={() => window.open(job.interview_link!, '_blank')}
                style={{ flexShrink: 0, background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                Rejoindre →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Présentiel */}
      {job.interview_type === 'presentiel' && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🏢 Adresse</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" className="interview-inp" placeholder="Ex : 12 rue de la Paix, 75001 Paris"
              value={job.interview_location || ''}
              onChange={e => onJobChange('interview_location', e.target.value || null)}
              onBlur={e => onPatch('interview_location', e.target.value || null)} />
            {job.interview_location && (
              <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.interview_location!)}`, '_blank')}
                style={{ flexShrink: 0, background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                Maps →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contact */}
      <div>
        <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>👤 Contact pour l&apos;entretien</label>
        <select className="interview-inp" value={job.interview_contact_id || ''} onChange={e => onPatch('interview_contact_id', e.target.value || null)}>
          <option value="">— Aucun contact —</option>
          {contacts.map(c => (
            <option key={c.id} value={c.id}>{c.name}{c.role ? ` – ${c.role}` : ''}{c.company ? ` (${c.company})` : ''}</option>
          ))}
        </select>
        {selectedContact && (
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#B8900A' }}>
            👤 {selectedContact.name}{selectedContact.role ? ` – ${selectedContact.role}` : ''}{selectedContact.company ? ` · ${selectedContact.company}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
