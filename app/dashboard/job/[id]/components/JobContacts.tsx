'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

export interface JobContactEnriched {
  id: string
  name: string
  role: string | null
  company: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  notes_count: number
  last_note_date: string | null
}

interface Step { id: string; label: string; num: number }

interface Props {
  contacts: JobContactEnriched[]
  interviewContacts: Record<string, string>
  allSteps: Step[]
  onAddContact: () => void
  onContactsChanged: () => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return "aujourd'hui"
  if (diff === 1) return 'hier'
  if (diff < 7) return `il y a ${diff} jours`
  if (diff < 30) return `il y a ${Math.floor(diff / 7)} sem.`
  if (diff < 365) return `il y a ${Math.floor(diff / 30)} mois`
  const years = Math.floor(diff / 365)
  return `il y a ${years} an${years > 1 ? 's' : ''}`
}

function findLinkedStep(
  contactId: string,
  interviewContacts: Record<string, string>,
  allSteps: Step[],
): Step | null {
  for (const [stepId, cId] of Object.entries(interviewContacts ?? {})) {
    if (cId === contactId) {
      return allSteps.find(s => s.id === stepId) ?? null
    }
  }
  return null
}

// ─── Edit modal (avec bouton supprimer) ────────────────────────────────────
function EditContactModal({
  contact, onClose, onSaved,
}: {
  contact: JobContactEnriched
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: contact.name,
    role: contact.role || '',
    company: contact.company || '',
    email: contact.email || '',
    phone: contact.phone || '',
    linkedin: contact.linkedin || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('contacts').update({
        name: form.name.trim(),
        role: form.role.trim() || null,
        company: form.company.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        linkedin: form.linkedin.trim() || null,
      }).eq('id', contact.id)
      if (err) throw err
      onSaved()
      onClose()
    } catch { setError('Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from('contacts').delete().eq('id', contact.id)
      onSaved()
      onClose()
    } finally { setDeleting(false) }
  }

  const fl: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#888',
    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5,
    fontFamily: FONT,
  }
  const fi: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '2px solid #111', borderRadius: 6,
    fontSize: 14, fontWeight: 600, fontFamily: FONT, color: '#111',
    outline: 'none', boxSizing: 'border-box',
  }

  if (showDeleteConfirm) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: 20,
      }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: 28,
          width: '100%', maxWidth: 420, border: '2px solid #E8151B',
          boxShadow: '4px 4px 0 #E8151B', fontFamily: FONT,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#E8151B', margin: '0 0 8px', fontFamily: FONT }}>
              Supprimer ce contact ?
            </h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0, fontFamily: FONT }}>
              <strong>{contact.name}</strong> sera définitivement supprimé, ainsi que toutes les notes associées.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowDeleteConfirm(false)} style={{
              flex: 1, background: '#F9F9F7', color: '#555',
              fontSize: 13, fontWeight: 700, padding: '10px 0',
              borderRadius: 9, border: '1.5px solid #ddd',
              cursor: 'pointer', fontFamily: FONT,
            }}>Annuler</button>
            <button onClick={handleDelete} disabled={deleting} style={{
              flex: 1, background: '#E8151B', color: '#fff',
              fontSize: 13, fontWeight: 800, padding: '10px 0',
              borderRadius: 9, border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: FONT,
            }}>{deleting ? '…' : 'Supprimer'}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: '#fff', border: '2px solid #111', borderRadius: 12,
        boxShadow: '6px 6px 0 #111', width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px',
        fontFamily: FONT,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 22,
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111', fontFamily: FONT }}>
            Modifier le contact
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20,
            cursor: 'pointer', color: '#888',
          }}>✕</button>
        </div>

        {([
          { label: 'Nom *', k: 'name', placeholder: 'Prénom Nom' },
          { label: 'Rôle / Poste', k: 'role', placeholder: 'ex : DRH, Directeur Marketing…' },
          { label: 'Entreprise', k: 'company', placeholder: '' },
          { label: 'Email', k: 'email', placeholder: 'prenom.nom@entreprise.fr' },
          { label: 'Téléphone', k: 'phone', placeholder: '+33 6 00 00 00 00' },
          { label: 'LinkedIn', k: 'linkedin', placeholder: 'https://linkedin.com/in/…' },
        ] as const).map(f => (
          <div key={f.k} style={{ marginBottom: 14 }}>
            <label style={fl}>{f.label}</label>
            <input
              value={(form as Record<string, string>)[f.k]}
              onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
              placeholder={f.placeholder}
              style={fi}
            />
          </div>
        ))}

        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #E8151B', borderRadius: 6,
            padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#E8151B',
            marginBottom: 16, fontFamily: FONT,
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            padding: '11px 14px', background: '#fff',
            border: '2px solid #E8151B', borderRadius: 8,
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
            color: '#E8151B', fontFamily: FONT,
          }}>🗑 Supprimer</button>
          <button onClick={onClose} style={{
            flex: 1, minWidth: 100, padding: 11, background: '#fff',
            border: '2px solid #111', borderRadius: 8,
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
          }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, minWidth: 140, padding: 11, background: '#F5C400',
            border: '2px solid #111', borderRadius: 8,
            fontSize: 14, fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: FONT, boxShadow: '3px 3px 0 #111',
          }}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Card contact ───────────────────────────────────────────────────────────
function ContactCard({
  contact, linkedStep, onEdit,
}: {
  contact: JobContactEnriched
  linkedStep: Step | null
  onEdit: () => void
}) {
  const hasEmail = !!contact.email
  const hasPhone = !!contact.phone
  const hasLinkedin = !!contact.linkedin

  const infoBits: string[] = []
  if (linkedStep) infoBits.push(`Lié à l'étape ${linkedStep.num} — ${linkedStep.label}`)
  if (contact.last_note_date) {
    infoBits.push(
      `Dernier échange ${formatRelativeDate(contact.last_note_date)}` +
      (contact.notes_count > 1 ? ` (${contact.notes_count})` : ''),
    )
  } else if (contact.notes_count > 0) {
    infoBits.push(`${contact.notes_count} échange${contact.notes_count > 1 ? 's' : ''}`)
  }

  const ibtnBase: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 900, fontFamily: FONT,
  }
  const ibtnActive: React.CSSProperties = {
    ...ibtnBase, background: '#fff', border: '2px solid #111',
    color: '#111', cursor: 'pointer',
  }
  const ibtnDisabled: React.CSSProperties = {
    ...ibtnBase, background: '#FAFAFA', border: '2px solid #E0E0E0',
    color: '#BBB', cursor: 'not-allowed',
  }

  return (
    <div
      onClick={onEdit}
      style={{
        border: '1.5px solid #EBEBEB', borderRadius: 8,
        background: '#fff', padding: '14px 16px',
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111' }}
      onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#EBEBEB' }}
    >
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 1fr auto',
        gap: 14, alignItems: 'center',
      }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#111', color: '#F5C400',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, fontFamily: FONT,
        }}>
          {getInitials(contact.name)}
        </div>

        {/* Milieu : nom, rôle + entreprise, ligne info discrète */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 900, color: '#111',
            fontFamily: FONT, marginBottom: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{contact.name}</div>
          <div style={{
            fontSize: 12, color: '#555', fontWeight: 600, fontFamily: FONT,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {[contact.role, contact.company].filter(Boolean).join(' · ') || (
              <span style={{ color: '#bbb' }}>—</span>
            )}
          </div>
          {infoBits.length > 0 && (
            <div style={{
              fontSize: 11, color: '#888', fontWeight: 500,
              fontFamily: FONT, marginTop: 7,
            }}>{infoBits.join(' · ')}</div>
          )}
        </div>

        {/* Actions directes : @, TEL, in — clic stop propagation */}
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => { if (hasEmail) window.open('mailto:' + contact.email) }}
            disabled={!hasEmail}
            title={hasEmail ? `Envoyer un email à ${contact.email}` : 'Aucun email enregistré'}
            style={{ ...(hasEmail ? ibtnActive : ibtnDisabled), fontSize: 13 }}
          >@</button>
          <button
            type="button"
            onClick={() => { if (hasPhone) window.open('tel:' + (contact.phone || '').replace(/\s/g, '')) }}
            disabled={!hasPhone}
            title={hasPhone ? `Appeler ${contact.phone}` : 'Aucun téléphone enregistré'}
            style={{ ...(hasPhone ? ibtnActive : ibtnDisabled), fontSize: 10 }}
          >TEL</button>
          <button
            type="button"
            onClick={() => { if (hasLinkedin) window.open(contact.linkedin!, '_blank') }}
            disabled={!hasLinkedin}
            title={hasLinkedin ? 'Ouvrir LinkedIn' : 'Aucun profil LinkedIn'}
            style={{ ...(hasLinkedin ? ibtnActive : ibtnDisabled), fontSize: 11 }}
          >in</button>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────
export default function JobContacts({
  contacts, interviewContacts, allSteps,
  onAddContact, onContactsChanged,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [editContact, setEditContact] = useState<JobContactEnriched | null>(null)

  const count = contacts.length

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      marginBottom: 14, border: '1.5px solid #EBEBEB', fontFamily: FONT,
    }}>
      {/* Header — clic pour ouvrir/fermer */}
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: '#555', fontFamily: FONT,
          }}>Contacts</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 22, height: 20, padding: '0 7px',
            background: '#F5F5F0', color: '#111',
            fontSize: 11, fontWeight: 800, borderRadius: 20, fontFamily: FONT,
          }}>{count}</span>
        </div>
        <span style={{
          fontSize: 11, color: '#111', fontWeight: 900, fontFamily: FONT,
          display: 'inline-block', transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
        }}>▼</span>
      </div>

      {isOpen && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #F0F0F0' }}>
          {/* Bouton Ajouter */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              onClick={onAddContact}
              style={{
                background: '#F5C400', color: '#111',
                border: '2px solid #111', borderRadius: 8,
                padding: '8px 14px', fontSize: 12, fontWeight: 800,
                letterSpacing: '0.5px', cursor: 'pointer', fontFamily: FONT,
                boxShadow: '3px 3px 0 #111',
              }}
            >+ Ajouter un contact</button>
          </div>

          {count === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px 10px',
              color: '#888', fontSize: 13, fontWeight: 500,
              fontFamily: FONT, lineHeight: 1.6,
            }}>
              Aucun contact pour cette offre.<br />
              Ajoute la personne qui t&apos;a transmis l&apos;offre, le recruteur, ou ton futur manager.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {contacts.map(c => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  linkedStep={findLinkedStep(c.id, interviewContacts, allSteps)}
                  onEdit={() => setEditContact(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {editContact && (
        <EditContactModal
          contact={editContact}
          onClose={() => setEditContact(null)}
          onSaved={() => { setEditContact(null); onContactsChanged() }}
        />
      )}
    </div>
  )
}
