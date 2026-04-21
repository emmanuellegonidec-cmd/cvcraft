'use client'

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
  currentStepLabel: string
  currentStepId: string
  /**
   * Quelle partie du bloc afficher :
   * - 'logistics'    : date / heure / type / lieu / contact           (Phase 1)
   * - 'preparation'  : notes de préparation                           (Phase 1)
   * - 'followup'     : email de remerciement + relance à programmer   (Phase 2)
   */
  section: 'logistics' | 'preparation' | 'followup'
}

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
  onCreateContact, currentStepLabel, currentStepId, section,
}: Props) {

  // Contact spécifique à cette étape
  const interviewContacts = job.interview_contacts || {}
  const stepContactId = interviewContacts[currentStepId] || job.interview_contact_id || ''
  const selectedContact = contacts.find(c => c.id === stepContactId)

  // Valeurs par étape pour les champs JSONB
  const preparations = job.interview_preparations || {}
  const syntheses = job.interview_syntheses || {}
  const followUpDates = job.follow_up_dates || {}
  const followUpEnabled = job.follow_up_enabled || {}

  const stepPreparation = preparations[currentStepId] || ''
  const stepSynthesis = syntheses[currentStepId] || ''
  const stepFollowUpDate = followUpDates[currentStepId] || ''
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

    if (enabled && !stepFollowUpDate) {
      const baseDate = job.interview_at ? job.interview_at.slice(0, 10) : todayISO()
      const defaultDate = addFourWeeks(baseDate)
      const updatedDates = { ...followUpDates, [currentStepId]: defaultDate }
      onJobChange('follow_up_dates', updatedDates)
      onPatch('follow_up_dates', updatedDates)
    }
  }

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

  // ───── Styles communs ─────
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    marginBottom: 14, border: '1.5px solid #EBEBEB',
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: '#555', display: 'block',
    marginBottom: 14, fontFamily: FONT,
  }

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

  const fieldLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#888', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em',
    fontFamily: FONT,
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 'logistics' : Logistique du RDV (date, heure, type, lieu, contact)
  // ═════════════════════════════════════════════════════════════════════════
  if (section === 'logistics') {
    return (
      <div style={card}>
        <span style={sectionLabel}>📋 Logistique du RDV</span>

        {/* Date / Début / Fin */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Date',  type: 'date', field: 'interview_at',        value: job.interview_at ? job.interview_at.slice(0, 10) : '' },
            { label: 'Début', type: 'time', field: 'interview_time',      value: job.interview_time || '' },
            { label: 'Fin',   type: 'time', field: 'interview_time_end',  value: job.interview_time_end || '' },
          ].map(({ label: lbl, type, field, value }) => (
            <div key={field}>
              <label style={fieldLabel}>{lbl}</label>
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
          <label style={fieldLabel}>Type d&apos;entretien</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'telephone',  label: '📞 Téléphone' },
              { id: 'visio',      label: '💻 Visio' },
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
            <label style={fieldLabel}>Adresse</label>
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
            <label style={fieldLabel}>Lien visio</label>
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
            <label style={fieldLabel}>Numéro de téléphone</label>
            <input value={job.interview_phone || ''} style={inp}
              onChange={e => onJobChange('interview_phone', e.target.value || null)}
              onBlur={e => onPatch('interview_phone', e.target.value || null)}
              placeholder="+33 6 00 00 00 00" />
          </div>
        )}

        {/* Contact pour cet entretien */}
        <div>
          <label style={fieldLabel}>👤 Contact pour cet entretien ({currentStepLabel})</label>
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
    )
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 'preparation' : Mes notes de préparation
  // ═════════════════════════════════════════════════════════════════════════
  if (section === 'preparation') {
    return (
      <div style={card}>
        <span style={sectionLabel}>📝 Mes notes de préparation</span>
        <p style={{ fontSize: 11, color: '#888', margin: '0 0 8px', fontFamily: FONT, lineHeight: 1.5 }}>
          Ce que tu veux retenir de ton travail de préparation (points à mettre en avant, questions à poser, exemples STAR, recherches sur l&apos;entreprise…).
        </p>
        <textarea
          key={`prep-${currentStepId}`}
          defaultValue={stepPreparation}
          onChange={e => handlePreparationChange(e.target.value)}
          onBlur={e => handlePreparationBlur(e.target.value)}
          placeholder="Points à mettre en avant, questions à poser, exemples STAR, recherches sur l'entreprise…"
          style={ta}
          onFocus={e => { e.target.style.borderColor = '#F5C400' }}
        />
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 'followup' : Email de remerciement + Relance à programmer
  // ═════════════════════════════════════════════════════════════════════════
  if (section === 'followup') {
    return (
      <>
        {/* Email de remerciement */}
        <div style={card}>
          <span style={sectionLabel}>✉️ Email de remerciement</span>
          <p style={{ fontSize: 11, color: '#888', margin: '0 0 8px', fontFamily: FONT, lineHeight: 1.5 }}>
            Le message que tu envoies au recruteur après le RDV (remerciements, rappel des points clés, enjeux compris…).
          </p>
          <textarea
            key={`synth-${currentStepId}`}
            defaultValue={stepSynthesis}
            onChange={e => handleSynthesisChange(e.target.value)}
            onBlur={e => handleSynthesisBlur(e.target.value)}
            placeholder="Bonjour [nom],&#10;&#10;Merci pour notre échange d'aujourd'hui concernant le poste de…"
            style={{ ...ta, minHeight: 110 }}
            onFocus={e => { e.target.style.borderColor = '#F5C400' }}
          />
        </div>

        {/* Relance à programmer */}
        <div style={{
          padding: '14px 16px',
          marginBottom: 14,
          background: followUpStatus === 'overdue' ? '#FFF0F0'
                    : followUpStatus === 'soon' ? '#FFFDE7'
                    : '#F9F9F7',
          border: `1.5px solid ${
            followUpStatus === 'overdue' ? '#E8151B'
            : followUpStatus === 'soon' ? '#F5C400'
            : '#E0E0E0'
          }`,
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: stepFollowUpEnabled ? 10 : 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
              <input
                type="checkbox"
                checked={stepFollowUpEnabled}
                onChange={e => handleFollowUpToggle(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#111' }}
              />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: FONT }}>
                🔔 Relance à programmer
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
              <label style={{ ...fieldLabel, marginBottom: 5 }}>Date de relance</label>
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
      </>
    )
  }

  return null
}
