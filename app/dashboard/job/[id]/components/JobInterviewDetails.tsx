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
  // Nouveaux champs JSONB par étape
  interview_preparations?: Record<string, string> | null
  interview_syntheses?: Record<string, string> | null
  follow_up_dates?: Record<string, string> | null
  follow_up_enabled?: Record<string, boolean> | null
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

// Ajoute 28 jours (4 semaines) à une date ISO et renvoie au format YYYY-MM-DD
function addFourWeeks(isoDate: string): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + 28)
  return d.toISOString().slice(0, 10)
}

function todayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['jan.','fév.','mar.','avr.','mai','juin','juil.','aoû.','sep.','oct.','nov.','déc.']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

export default function JobInterviewDetails({
  job, contacts, onPatch, onJobChange,
  onCreateContact, currentStepNum, currentStepLabel, currentStepId
}: Props) {
  const [open, setOpen] = useState(true)

  // Contact spécifique à cette étape (nouveau système JSON)
  const interviewContacts = job.interview_contacts || {}
  const stepContactId = interviewContacts[currentStepId] || job.interview_contact_id || ''
  const selectedContact = contacts.find(c => c.id === stepContactId)

  // Valeurs par étape pour les nouveaux champs
  const preparations = job.interview_preparations || {}
  const syntheses = job.interview_syntheses || {}
  const followUpDates = job.follow_up_dates || {}
  const followUpEnabled = job.follow_up_enabled || {}

  const stepPreparation = preparations[currentStepId] || ''
  const stepSynthesis = syntheses[currentStepId] || ''
  const stepFollowUpDate = followUpDates[currentStepId] || ''
  // par défaut activé si pas encore défini
  const stepFollowUpEnabled = followUpEnabled[currentStepId] !== false

  function handleContactChange(contactId: string) {
    const updated = { ...interviewContacts, [currentStepId]: contactId || '' }
    onJobChange('interview_contacts', updated)
    onPatch('interview_contacts', updated)
  }

  function handlePreparationChange(text: string) {
    const updated = { ...preparations, [currentStepId]: text }
    onJobChange('interview_preparations', updated)
  }
  function handlePreparationBlur(text: string) {
    const updated = { ...preparations, [currentStepId]: text }
    onPatch('interview_preparations', updated)
  }

  function handleSynthesisChange(text: string) {
    const updated = { ...syntheses, [currentStepId]: text }
    onJobChange('interview_syntheses', updated)
  }
  function handleSynthesisBlur(text: string) {
    const updated = { ...syntheses, [currentStepId]: text }
    onPatch('interview_syntheses', updated)
  }

  function handleFollowUpDateChange(date: string) {
    const updated = { ...followUpDates, [currentStepId]: date }
    onJobChange('follow_up_dates', updated)
    onPatch('follow_up_dates', updated)
  }

  function handleFollowUpToggle(enabled: boolean) {
    const updated = { ...followUpEnabled, [currentStepId]: enabled }
    onJobChange('follow_up_enabled', updated)
    onPatch('follow_up_enabled', updated)

    // Si on active ET qu'il n'y a pas encore de date : on calcule par défaut
    if (enabled && !stepFollowUpDate) {
      const baseDate = job.interview_at ? job.interview_at.slice(0, 10) : todayISO()
      const defaultDate = addFourWeeks(baseDate)
      const updatedDates = { ...followUpDates, [currentStepId]: defaultDate }
      onJobChange('follow_up_dates', updatedDates)
      onPatch('follow_up_dates', updatedDates)
    }
  }

  // Statut de la relance pour l'affichage
  function getFollowUpStatus(): 'overdue' | 'soon' | 'ok' | null {
    if (!stepFollowUpEnabled || !stepFollowUpDate) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const followUp = new Date(stepFollowUpDate); followUp.setHours(0, 0, 0, 0)
    const diffDays = Math.round((followUp.getTime() - today.getTime()) / 86400000)
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 3) return 'soon'
    return 'ok'
  }
  const followUpStatus = getFollowUpStatus()

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1.5px solid #ddd',
    borderRadius: 7, fontSize: 13, fontWeight: 600, fontFamily: FONT,
    color: '#111', outline: 'none', background: '#fff',
    boxSizing: 'border-box' as const,
  }

  const ta: React.CSSProperties = {
    ...inp, resize: 'vertical', minHeight: 90, lineHeight: '1.6',
    fontWeight: 500,
  }

  const label: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#888', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em',
    fontFamily: FONT,
  }

  const sectionHeader: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, color: '#111', display: 'block',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em',
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
          <div style={{ marginBottom: 20 }}>
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

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Préparation d'entretien — texte libre par étape              */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 18, paddingTop: 16, borderTop: '1.5px solid #F0F0F0' }}>
            <label style={sectionHeader}>📝 Préparation d&apos;entretien</label>
            <textarea
              defaultValue={stepPreparation}
              onChange={e => handlePreparationChange(e.target.value)}
              onBlur={e => handlePreparationBlur(e.target.value)}
              placeholder="Ce que je veux préparer avant le RDV : points à mettre en avant, questions à poser, exemples STAR, recherches sur l'entreprise…"
              style={ta}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }}
            />
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Synthèse post-entretien — texte libre par étape              */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 18 }}>
            <label style={sectionHeader}>✉️ Synthèse post-entretien</label>
            <p style={{ fontSize: 11, color: '#888', margin: '0 0 6px', fontFamily: FONT, lineHeight: 1.5 }}>
              Le message que tu envoies au recruteur après le RDV (remerciements, rappel des points clés, enjeux compris…).
            </p>
            <textarea
              defaultValue={stepSynthesis}
              onChange={e => handleSynthesisChange(e.target.value)}
              onBlur={e => handleSynthesisBlur(e.target.value)}
              placeholder="Bonjour [nom],&#10;&#10;Merci pour notre échange d'aujourd'hui concernant le poste de…"
              style={{ ...ta, minHeight: 110 }}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }}
            />
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Programmer une relance                                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div style={{
            padding: '14px 16px',
            background: followUpStatus === 'overdue' ? '#FFF0F0'
                      : followUpStatus === 'soon' ? '#FFFDE7'
                      : '#F9F9F7',
            border: `1.5px solid ${
              followUpStatus === 'overdue' ? '#E8151B'
              : followUpStatus === 'soon' ? '#F5C400'
              : '#E0E0E0'
            }`,
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: stepFollowUpEnabled ? 10 : 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={stepFollowUpEnabled}
                  onChange={e => handleFollowUpToggle(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#111' }}
                />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT }}>
                  🔔 Programmer une relance
                </span>
              </label>
              {stepFollowUpEnabled && followUpStatus === 'overdue' && (
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#E8151B', padding: '3px 8px', borderRadius: 20, fontFamily: FONT, whiteSpace: 'nowrap' }}>
                  ⚠️ À relancer
                </span>
              )}
              {stepFollowUpEnabled && followUpStatus === 'soon' && (
                <span style={{ fontSize: 10, fontWeight: 800, color: '#B8900A', background: '#FFFDE7', border: '1.5px solid #F5C400', padding: '2px 8px', borderRadius: 20, fontFamily: FONT, whiteSpace: 'nowrap' }}>
                  ⏰ Bientôt
                </span>
              )}
            </div>

            {stepFollowUpEnabled && (
              <div>
                <label style={{ ...label, marginBottom: 5 }}>Date de relance</label>
                <input
                  type="date"
                  value={stepFollowUpDate}
                  onChange={e => handleFollowUpDateChange(e.target.value)}
                  style={{
                    ...inp,
                    borderColor: followUpStatus === 'overdue' ? '#E8151B'
                              : followUpStatus === 'soon' ? '#F5C400'
                              : '#ddd',
                    color: followUpStatus === 'overdue' ? '#E8151B' : '#111',
                    fontWeight: 700,
                  }}
                />
                <p style={{ fontSize: 11, color: '#888', margin: '6px 0 0', fontFamily: FONT, lineHeight: 1.5 }}>
                  {stepFollowUpDate
                    ? (followUpStatus === 'overdue'
                        ? `Date dépassée — un badge "À relancer" apparaît sur la carte du kanban.`
                        : followUpStatus === 'soon'
                          ? `Dans moins de 3 jours.`
                          : `Prévue le ${formatDisplayDate(stepFollowUpDate)}.`)
                    : `Par défaut : date de l'entretien + 4 semaines. Modifiable.`}
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
