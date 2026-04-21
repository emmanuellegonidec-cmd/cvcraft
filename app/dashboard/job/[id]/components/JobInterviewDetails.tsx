'use client'

import { useState } from 'react'

const FONT = "'Montserrat', sans-serif"

interface Job {
  id: string
  interview_at: string | null
  interview_time: string | null
  interview_time_end: string | null
  interview_type: string | null
  interview_location: string | null
  interview_link: string | null
  interview_phone: string | null
  interview_contacts: Record<string, string> | null
  interview_contact_id: string | null
  interview_preparations: Record<string, string> | null
  interview_syntheses: Record<string, string> | null
  follow_up_dates: Record<string, string> | null
  follow_up_enabled: Record<string, boolean> | null
}

interface ContactMin { id: string; name: string; role?: string | null; company?: string | null }

interface Props {
  job: Job
  contacts: ContactMin[]
  onPatch: (field: string, value: any) => void
  onJobChange: (field: string, value: any) => void
  onCreateContact: () => void
  currentStepId: string
  currentStepLabel: string
  section: 'logistics' | 'preparation' | 'followup'
}

function formatDateFR(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function typeLabel(t: string | null): string {
  if (t === 'phone') return 'Téléphone'
  if (t === 'visio') return 'Visio'
  if (t === 'rdv') return 'Présentiel'
  return ''
}
function buildLogisticsSummary(job: Job): string {
  const parts: string[] = []
  if (job.interview_at) parts.push(formatDateFR(job.interview_at))
  if (job.interview_time) {
    const timeBit = job.interview_time_end ? `${job.interview_time} – ${job.interview_time_end}` : job.interview_time
    parts.push(timeBit)
  }
  if (job.interview_type) parts.push(typeLabel(job.interview_type))
  return parts.join(' · ')
}

function Collapsible({
  title, summary, open, onToggle, children,
}: {
  title: string
  summary?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, marginBottom: 10,
      border: '1.5px solid #EBEBEB', overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', cursor: 'pointer',
          background: '#fff',
          borderBottom: open ? '1px solid #F0F0F0' : 'none',
        }}
      >
        <span style={{
          fontSize: 11, fontWeight: 800, color: '#555',
          letterSpacing: '1.3px', textTransform: 'uppercase',
          fontFamily: FONT, flexShrink: 0,
        }}>
          {title}
        </span>
        <div style={{ flex: 1 }} />
        {summary && (
          <span style={{
            fontSize: 11, color: '#666', fontWeight: 600,
            fontFamily: FONT, marginRight: 10,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {summary}
          </span>
        )}
        <span style={{
          fontSize: 10, color: '#999',
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform .2s',
        }}>▼</span>
      </div>
      {open && <div style={{ padding: '14px 18px' }}>{children}</div>}
    </div>
  )
}

export default function JobInterviewDetails({
  job, contacts, onPatch, onJobChange, onCreateContact, currentStepId, currentStepLabel, section,
}: Props) {

  const [logisticsOpen, setLogisticsOpen] = useState(false)
  const [preparationOpen, setPreparationOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [relanceOpen, setRelanceOpen] = useState(false)

  const interviewContacts = job.interview_contacts ?? {}
  const preparations = job.interview_preparations ?? {}
  const syntheses = job.interview_syntheses ?? {}
  const followUpDates = job.follow_up_dates ?? {}
  const followUpEnabled = job.follow_up_enabled ?? {}

  const contactIdForStep = interviewContacts[currentStepId] ?? ''
  const preparationValue = preparations[currentStepId] ?? ''
  const synthesisValue = syntheses[currentStepId] ?? ''
  const followUpDate = followUpDates[currentStepId] ?? ''
  const followUpIsEnabled = followUpEnabled[currentStepId] !== false

  const inp: React.CSSProperties = {
    width: '100%', border: '1.5px solid #eee', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, fontFamily: FONT, outline: 'none',
    background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500,
  }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 76, lineHeight: '1.6' }
  const fieldLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, color: '#888', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em',
    fontFamily: FONT,
  }

  // ─── SECTION LOGISTICS ─────────────────────────────────────────────
  if (section === 'logistics') {
    const summary = buildLogisticsSummary(job) || 'Non renseigné'
    const updateInterviewContact = (newContactId: string) => {
      const next = { ...interviewContacts, [currentStepId]: newContactId }
      onJobChange('interview_contacts', next)
      onPatch('interview_contacts', next)
    }

    return (
      <Collapsible
        title="Logistique du RDV"
        summary={summary}
        open={logisticsOpen}
        onToggle={() => setLogisticsOpen(v => !v)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={fieldLabel}>Date</label>
            <input type="date" defaultValue={job.interview_at ? job.interview_at.split('T')[0] : ''}
              onBlur={e => onPatch('interview_at', e.target.value || null)} style={inp}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
          </div>
          <div>
            <label style={fieldLabel}>Début</label>
            <input type="time" defaultValue={job.interview_time ?? ''}
              onBlur={e => onPatch('interview_time', e.target.value || null)} style={inp}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
          </div>
          <div>
            <label style={fieldLabel}>Fin</label>
            <input type="time" defaultValue={job.interview_time_end ?? ''}
              onBlur={e => onPatch('interview_time_end', e.target.value || null)} style={inp}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>Type d&apos;entretien</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'phone', label: 'Téléphone' }, { id: 'visio', label: 'Visio' }, { id: 'rdv', label: 'Présentiel' }].map(t => {
              const active = job.interview_type === t.id
              return (
                <button key={t.id} onClick={() => onPatch('interview_type', t.id)}
                  style={{
                    flex: 1, padding: '8px 6px', fontSize: 12, fontWeight: 700,
                    borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
                    border: `2px solid ${active ? '#F5C400' : '#E0E0E0'}`,
                    background: active ? '#FFFDE7' : '#fff',
                    color: active ? '#111' : '#888', transition: 'all 0.15s',
                  }}>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {job.interview_type === 'rdv' && (
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Adresse</label>
            <input defaultValue={job.interview_location ?? ''}
              onBlur={e => onPatch('interview_location', e.target.value || null)}
              placeholder="Adresse de l'entretien" style={inp}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
          </div>
        )}
        {job.interview_type === 'visio' && (
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Lien visio</label>
            <input defaultValue={job.interview_link ?? ''}
              onBlur={e => onPatch('interview_link', e.target.value || null)}
              placeholder="https://..." style={inp}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
          </div>
        )}
        {job.interview_type === 'phone' && (
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>Numéro de téléphone</label>
            <input defaultValue={job.interview_phone ?? ''}
              onBlur={e => onPatch('interview_phone', e.target.value || null)}
              placeholder="+33..." style={inp}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
          </div>
        )}

        <div>
          <label style={fieldLabel}>Contact pour cet entretien ({currentStepLabel})</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={contactIdForStep} onChange={e => updateInterviewContact(e.target.value)}
              style={{ ...inp, flex: 1, background: '#fff' }}>
              <option value="">— Aucun —</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.role ? ` – ${c.role}` : ''}{c.company ? ` (${c.company})` : ''}
                </option>
              ))}
            </select>
            <button onClick={onCreateContact}
              style={{
                background: '#111', color: '#F5C400', fontSize: 12,
                fontWeight: 800, padding: '8px 14px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontFamily: FONT,
                whiteSpace: 'nowrap', boxShadow: '2px 2px 0 #F5C400',
              }}>
              + Nouveau
            </button>
          </div>
          {contactIdForStep && (() => {
            const c = contacts.find(c => c.id === contactIdForStep)
            if (!c) return null
            return (
              <p style={{ fontSize: 11, color: '#555', marginTop: 7, fontFamily: FONT, fontWeight: 600 }}>
                {c.name}{c.role ? ` – ${c.role}` : ''}{c.company ? ` · ${c.company}` : ''}
              </p>
            )
          })()}
        </div>
      </Collapsible>
    )
  }

  // ─── SECTION PREPARATION ───────────────────────────────────────────
  if (section === 'preparation') {
    const updatePreparation = (val: string) => {
      const next = { ...preparations, [currentStepId]: val }
      onJobChange('interview_preparations', next)
      onPatch('interview_preparations', next)
    }
    return (
      <Collapsible
        title="Mes notes de préparation"
        open={preparationOpen}
        onToggle={() => setPreparationOpen(v => !v)}
      >
        <p style={{ fontSize: 11, color: '#666', marginBottom: 8, fontFamily: FONT, fontWeight: 500, lineHeight: 1.5 }}>
          Ce que tu veux retenir de ton travail de préparation (points à mettre en avant, questions à poser, exemples STAR, recherches sur l&apos;entreprise…).
        </p>
        <textarea
          key={`prep-${currentStepId}`}
          defaultValue={preparationValue}
          onBlur={e => updatePreparation(e.target.value)}
          placeholder="Points à mettre en avant, questions à poser, exemples STAR, recherches sur l'entreprise..."
          style={{ ...ta, minHeight: 120 }}
          onFocus={e => { e.target.style.borderColor = '#F5C400' }}
        />
      </Collapsible>
    )
  }

  // ─── SECTION FOLLOWUP — 2 collapsibles : email + relance ───────────
  if (section === 'followup') {
    const updateSynthesis = (val: string) => {
      const next = { ...syntheses, [currentStepId]: val }
      onJobChange('interview_syntheses', next)
      onPatch('interview_syntheses', next)
    }
    const updateFollowUpDate = (val: string) => {
      const next = { ...followUpDates, [currentStepId]: val }
      onJobChange('follow_up_dates', next)
      onPatch('follow_up_dates', next)
    }
    const updateFollowUpEnabled = (val: boolean) => {
      const next = { ...followUpEnabled, [currentStepId]: val }
      onJobChange('follow_up_enabled', next)
      onPatch('follow_up_enabled', next)
    }

    const relanceSummary = followUpIsEnabled
      ? (followUpDate ? formatDateFR(followUpDate) : 'À planifier')
      : 'Désactivée'

    return (
      <>
        <Collapsible
          title="Email de remerciement"
          open={emailOpen}
          onToggle={() => setEmailOpen(v => !v)}
        >
          <p style={{ fontSize: 11, color: '#666', marginBottom: 8, fontFamily: FONT, fontWeight: 500, lineHeight: 1.5 }}>
            Le message que tu envoies au recruteur après le RDV (remerciements, rappel des points clés, enjeux compris…).
          </p>
          <textarea
            key={`email-${currentStepId}`}
            defaultValue={synthesisValue}
            onBlur={e => updateSynthesis(e.target.value)}
            placeholder="Bonjour [nom], merci pour notre échange d'aujourd'hui concernant le poste de..."
            style={{ ...ta, minHeight: 140 }}
            onFocus={e => { e.target.style.borderColor = '#F5C400' }}
          />
        </Collapsible>

        <Collapsible
          title="Relance à programmer"
          summary={relanceSummary}
          open={relanceOpen}
          onToggle={() => setRelanceOpen(v => !v)}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
            <input type="checkbox" checked={followUpIsEnabled}
              onChange={e => updateFollowUpEnabled(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111', fontFamily: FONT }}>
              Activer la relance
            </span>
          </label>
          {followUpIsEnabled && (
            <div>
              <label style={fieldLabel}>Date de relance</label>
              <input type="date" defaultValue={followUpDate}
                onBlur={e => updateFollowUpDate(e.target.value)}
                style={{ ...inp, maxWidth: 220 }}
                onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
              <p style={{ fontSize: 11, color: '#666', marginTop: 7, fontFamily: FONT, fontWeight: 500, lineHeight: 1.5 }}>
                Par défaut 4 semaines après le RDV. Tu peux ajuster cette date à tout moment.
              </p>
            </div>
          )}
        </Collapsible>
      </>
    )
  }

  return null
}
