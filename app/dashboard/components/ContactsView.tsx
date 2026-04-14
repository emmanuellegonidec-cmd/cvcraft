'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

interface Contact {
  id: string
  name: string
  role?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  linkedin?: string | null
  job_manual?: string | null
  job_id?: string | null
  notes_count?: number | null
}

interface Props {
  contacts: Contact[]
  onAddContact: () => void
  onDeleteContact: (id: string) => void
  onRefresh?: () => void
}

const AVATAR_COLORS = [
  { bg: '#111', color: '#F5C400' },
  { bg: '#F5C400', color: '#111' },
  { bg: '#E8151B', color: '#fff' },
]

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

// ── MODALE MODIFICATION ─────────────────────────────────────────────────────
function EditModal({ contact, onClose, onSaved }: {
  contact: Contact
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: contact.name || '',
    role: contact.role || '',
    company: contact.company || '',
    email: contact.email || '',
    phone: contact.phone || '',
    linkedin: contact.linkedin || '',
    job_manual: contact.job_manual || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const field = (label: string, key: keyof typeof form, placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5, fontFamily: FONT }}>
        {label}
      </label>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px',
          border: '2px solid #111', borderRadius: 6,
          fontSize: 14, fontWeight: 600, fontFamily: FONT, color: '#111',
          outline: 'none', boxSizing: 'border-box' as const,
        }}
      />
    </div>
  )

  async function handleSave() {
    if (!form.name.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('contacts')
        .update({
          name: form.name.trim(),
          role: form.role.trim() || null,
          company: form.company.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          linkedin: form.linkedin.trim() || null,
          job_manual: form.job_manual.trim() || null,
        })
        .eq('id', contact.id)
      if (err) throw err
      onSaved()
      onClose()
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
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
        {/* EN-TÊTE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111', fontFamily: FONT }}>
            Modifier le contact
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20,
            cursor: 'pointer', color: '#888', fontFamily: FONT,
          }}>✕</button>
        </div>

        {/* CHAMPS */}
        {field('Nom *', 'name', 'Prénom Nom')}
        {field('Rôle / Poste', 'role', 'ex : DRH, Talent Acquisition…')}
        {field('Entreprise', 'company', 'ex : Maison Lenôtre')}
        {field('Email', 'email', 'prenom.nom@entreprise.fr')}
        {field('Téléphone', 'phone', '+33 6 00 00 00 00')}
        {field('LinkedIn', 'linkedin', 'https://linkedin.com/in/…')}
        {field('Offre associée', 'job_manual', 'ex : Responsable Marketing ESCP')}

        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #E8151B', borderRadius: 6,
            padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#E8151B',
            marginBottom: 16, fontFamily: FONT,
          }}>
            {error}
          </div>
        )}

        {/* BOUTONS */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', background: '#fff',
            border: '2px solid #111', borderRadius: 8,
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
          }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '11px', background: '#F5C400',
            border: '2px solid #111', borderRadius: 8,
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            fontFamily: FONT, boxShadow: '3px 3px 0 #111',
          }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function ContactsView({ contacts, onAddContact, onDeleteContact, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [editContact, setEditContact] = useState<Contact | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return contacts
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q)
    )
  }, [contacts, search])

  const colLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, color: '#888',
    textTransform: 'uppercase', letterSpacing: '1px', fontFamily: FONT,
  }

  const gridCols: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '52px 1.8fr 1.2fr 1.4fr 110px auto',
    alignItems: 'center',
    gap: 16,
  }

  const btnBase: React.CSSProperties = {
    padding: '6px 12px', border: '2px solid #111', borderRadius: 6,
    fontSize: 12, fontWeight: 800, cursor: 'pointer',
    background: '#fff', color: '#111',
    boxShadow: '2px 2px 0 #111', whiteSpace: 'nowrap' as const,
    fontFamily: FONT,
  }

  return (
    <div style={{ fontFamily: FONT }}>

      {/* BARRE DE RECHERCHE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: '2px solid #111', borderRadius: 8,
        padding: '10px 16px', marginBottom: 16,
        boxShadow: '3px 3px 0 #111',
      }}>
        <span style={{ fontSize: 15, color: '#888' }}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher par nom, entreprise, poste…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: 'none', outline: 'none', flex: 1,
            fontSize: 14, fontWeight: 600, fontFamily: FONT,
            color: '#111', background: 'transparent',
          }}
        />
        <span style={{ fontSize: 12, color: '#888', fontWeight: 700, fontFamily: FONT }}>
          {filtered.length} contact{filtered.length > 1 ? 's' : ''}
        </span>
        {search && (
          <button onClick={() => setSearch('')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: '#888', fontFamily: FONT, padding: 0,
          }}>✕</button>
        )}
      </div>

      {/* EN-TÊTES COLONNES */}
      <div style={{ ...gridCols, padding: '0 16px 8px' }}>
        <div />
        <div style={colLabel}>Nom / Rôle</div>
        <div style={colLabel}>Entreprise</div>
        <div style={colLabel}>Offre associée</div>
        <div style={colLabel}>Échanges</div>
        <div />
      </div>

      {/* LIGNES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((c, i) => {
          const av = AVATAR_COLORS[i % AVATAR_COLORS.length]
          return (
            <div key={c.id} style={{
              ...gridCols,
              background: '#fff', border: '2px solid #111',
              borderRadius: 8, padding: '12px 16px',
              boxShadow: '2px 2px 0 #111',
            }}>

              {/* AVATAR */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: av.bg, border: '2px solid #111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, color: av.color,
                flexShrink: 0, fontFamily: FONT,
              }}>
                {getInitials(c.name)}
              </div>

              {/* NOM + RÔLE */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </div>
                {c.role && (
                  <div style={{ fontSize: 12, color: '#555', fontWeight: 600, marginTop: 3, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.role}
                  </div>
                )}
                {c.email && (
                  <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginTop: 2, fontFamily: FONT }}>
                    {c.email}
                  </div>
                )}
              </div>

              {/* ENTREPRISE */}
              <div style={{ minWidth: 0 }}>
                {c.company ? (
                  <span style={{
                    display: 'inline-block', background: '#111', color: '#F5C400',
                    fontSize: 11, fontWeight: 800, padding: '3px 10px',
                    borderRadius: 20, fontFamily: FONT, whiteSpace: 'nowrap',
                  }}>
                    {c.company}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#ccc', fontFamily: FONT }}>—</span>
                )}
                {c.phone && (
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 4, fontFamily: FONT }}>
                    📞 {c.phone}
                  </div>
                )}
              </div>

              {/* OFFRE ASSOCIÉE */}
              <div style={{ minWidth: 0 }}>
                {c.job_manual ? (
                  <span style={{
                    fontSize: 12, color: '#555', fontWeight: 700, fontFamily: FONT,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
                  }}>
                    💼 {c.job_manual}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#ccc', fontFamily: FONT }}>—</span>
                )}
              </div>

              {/* ÉCHANGES */}
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: (c.notes_count ?? 0) > 0 ? '#F5F5F0' : '#fafafa',
                  border: `1.5px solid ${(c.notes_count ?? 0) > 0 ? '#ddd' : '#eee'}`,
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: 13, fontWeight: 800,
                  color: (c.notes_count ?? 0) > 0 ? '#111' : '#ccc',
                  fontFamily: FONT,
                }}>
                  💬 {c.notes_count ?? 0}
                </span>
              </div>

              {/* BOUTONS */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setEditContact(c)}
                  style={{ ...btnBase, background: '#F5C400', boxShadow: '2px 2px 0 #111' }}
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => onDeleteContact(c.id)}
                  style={{ ...btnBase, border: '2px solid #E8151B', color: '#E8151B', boxShadow: '2px 2px 0 #E8151B', background: '#fff' }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          )
        })}

        {/* AUCUN RÉSULTAT */}
        {filtered.length === 0 && search && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: '#888', fontSize: 14, fontWeight: 700, fontFamily: FONT,
          }}>
            Aucun contact trouvé pour &quot;{search}&quot;
          </div>
        )}

        {/* AJOUTER */}
        <div
          onClick={onAddContact}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed #ccc', borderRadius: 8, padding: 16,
            cursor: 'pointer', color: '#aaa', fontSize: 13, fontWeight: 700,
            fontFamily: FONT,
          }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#111'; el.style.color = '#111' }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#ccc'; el.style.color = '#aaa' }}
        >
          + Ajouter un contact
        </div>
      </div>

      {/* MODALE MODIFICATION */}
      {editContact && (
        <EditModal
          contact={editContact}
          onClose={() => setEditContact(null)}
          onSaved={() => { setEditContact(null); onRefresh?.() }}
        />
      )}
    </div>
  )
}
