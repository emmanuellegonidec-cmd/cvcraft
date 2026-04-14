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

// ── MODALE MODIFICATION ──────────────────────────────────────────────────────
function EditModal({ contact, onClose, onSaved }: {
  contact: Contact; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: contact.name || '', role: contact.role || '',
    company: contact.company || '', email: contact.email || '',
    phone: contact.phone || '', linkedin: contact.linkedin || '',
    job_manual: contact.job_manual || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const Field = ({ label, k, placeholder = '' }: { label: string; k: keyof typeof form; placeholder?: string }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5, fontFamily: FONT }}>{label}</label>
      <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '2px solid #111', borderRadius: 6, fontSize: 14, fontWeight: 600, fontFamily: FONT, color: '#111', outline: 'none', boxSizing: 'border-box' as const }} />
    </div>
  )

  async function handleSave() {
    if (!form.name.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('contacts').update({
        name: form.name.trim(), role: form.role.trim() || null,
        company: form.company.trim() || null, email: form.email.trim() || null,
        phone: form.phone.trim() || null, linkedin: form.linkedin.trim() || null,
        job_manual: form.job_manual.trim() || null,
      }).eq('id', contact.id)
      if (err) throw err
      onSaved(); onClose()
    } catch { setError('Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, boxShadow: '6px 6px 0 #111', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111', fontFamily: FONT }}>Modifier le contact</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>
        <Field label="Nom *" k="name" placeholder="Prénom Nom" />
        <Field label="Rôle / Poste" k="role" placeholder="ex : DRH, Talent Acquisition…" />
        <Field label="Entreprise" k="company" placeholder="ex : Maison Lenôtre" />
        <Field label="Email" k="email" placeholder="prenom.nom@entreprise.fr" />
        <Field label="Téléphone" k="phone" placeholder="+33 6 00 00 00 00" />
        <Field label="LinkedIn" k="linkedin" placeholder="https://linkedin.com/in/…" />
        <Field label="Offre associée" k="job_manual" placeholder="ex : Responsable Marketing ESCP" />
        {error && <div style={{ background: '#FEE2E2', border: '1px solid #E8151B', borderRadius: 6, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#E8151B', marginBottom: 16, fontFamily: FONT }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 11, background: '#F5C400', border: '2px solid #111', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, boxShadow: '3px 3px 0 #111' }}>
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

  const btn: React.CSSProperties = {
    padding: '5px 10px', border: '2px solid #111', borderRadius: 6,
    fontSize: 12, fontWeight: 800, cursor: 'pointer', background: '#fff', color: '#111',
    boxShadow: '2px 2px 0 #111', whiteSpace: 'nowrap' as const, fontFamily: FONT,
  }

  // Cellule header
  const th: React.CSSProperties = {
    fontSize: 12, fontWeight: 800, color: '#888',
    textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: FONT,
    padding: '12px 12px',
  }

  // Cellule données
  const td: React.CSSProperties = {
    padding: '20px 12px',
    borderTop: '1px solid #F0F0F0',
    overflow: 'hidden',
  }

  return (
    <div style={{ fontFamily: FONT }}>

      {/* BARRE DE RECHERCHE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '2px solid #111', borderRadius: 8, padding: '10px 16px', marginBottom: 12, boxShadow: '3px 3px 0 #111' }}>
        <span style={{ fontSize: 15, color: '#888' }}>🔍</span>
        <input type="text" placeholder="Rechercher par nom, entreprise, poste…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, fontWeight: 600, fontFamily: FONT, color: '#111', background: 'transparent' }} />
        <span style={{ fontSize: 13, color: '#888', fontWeight: 700, fontFamily: FONT }}>{filtered.length} contact{filtered.length > 1 ? 's' : ''}</span>
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 0 }}>✕</button>}
      </div>

      {/* TABLEAU UNIQUE — header + lignes dans le même display:grid */}
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, boxShadow: '3px 3px 0 #111', overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 150px minmax(150px,400px) 90px 140px auto',
          alignItems: 'center',
        }}>

          {/* ── EN-TÊTES ── */}
          <div style={{ ...th, background: '#F5F5F0' }}>Nom / Rôle</div>
          <div style={{ ...th, background: '#F5F5F0' }}>Entreprise</div>
          <div style={{ ...th, background: '#F5F5F0' }}>Offre associée</div>
          <div style={{ ...th, background: '#F5F5F0', textAlign: 'center' as const }}>Échanges</div>
          <div style={{ ...th, background: '#F5F5F0' }}>Téléphone</div>
          <div style={{ background: '#F5F5F0', padding: '12px 12px' }} />

          {/* Ligne de séparation header */}
          <div style={{ gridColumn: '1 / -1', borderBottom: '2px solid #111' }} />

          {/* ── LIGNES DE DONNÉES ── */}
          {filtered.map((c, i) => {
            const av = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const count = c.notes_count ?? 0
            return [
              

              // Nom + rôle
              <div key={`nm-${c.id}`} style={td}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                {c.role && <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginTop: 2, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.role}</div>}
              </div>,

              // Entreprise
              <div key={`co-${c.id}`} style={td}>
                {c.company
                  ? <span style={{ display: 'inline-block', background: '#111', color: '#F5C400', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, fontFamily: FONT, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</span>
                  : <span style={{ fontSize: 13, color: '#ccc', fontFamily: FONT }}>—</span>}
              </div>,

              // Offre associée
              <div key={`jo-${c.id}`} style={td}>
                {c.job_manual
                  ? <span style={{ fontSize: 12, color: '#555', fontWeight: 700, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>💼 {c.job_manual}</span>
                  : <span style={{ fontSize: 13, color: '#ccc', fontFamily: FONT }}>—</span>}
              </div>,

              // Échanges
              <div key={`ex-${c.id}`} style={{ ...td, textAlign: 'center' as const }}>
                {count > 0
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F5F5F0', border: '1.5px solid #ddd', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 800, color: '#111', fontFamily: FONT }}>💬 {count}</span>
                  : <span style={{ fontSize: 13, color: '#ccc', fontFamily: FONT }}>—</span>}
              </div>,

              // Téléphone
              <div key={`ph-${c.id}`} style={td}>
                {c.phone
                  ? <span style={{ fontSize: 12, color: '#555', fontWeight: 600, fontFamily: FONT, whiteSpace: 'nowrap' }}>📞 {c.phone}</span>
                  : <span style={{ fontSize: 13, color: '#ccc', fontFamily: FONT }}>—</span>}
              </div>,

              // Boutons : Email · LinkedIn · Modifier · Supprimer
              <div key={`bt-${c.id}`} style={{ ...td, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                {c.email && <button onClick={() => window.open('mailto:' + c.email)} style={btn}>Email</button>}
                {c.linkedin && <button onClick={() => window.open(c.linkedin!)} style={btn}>LinkedIn</button>}
                <button onClick={() => setEditContact(c)} style={{ ...btn, background: '#F5C400', padding: '5px 10px', fontSize: 15 }}>✏️</button>
                <button onClick={() => onDeleteContact(c.id)} style={{ ...btn, border: '2px solid #E8151B', color: '#E8151B', boxShadow: '2px 2px 0 #E8151B', background: '#fff', padding: '5px 10px', fontWeight: 900, fontSize: 14 }}>✕</button>
              </div>,
            ]
          })}

          {filtered.length === 0 && search && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#888', fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
              Aucun contact trouvé pour &quot;{search}&quot;
            </div>
          )}

        </div>
      </div>

      {/* AJOUTER */}
      <div onClick={onAddContact}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', borderRadius: 8, padding: 14, marginTop: 10, cursor: 'pointer', color: '#aaa', fontSize: 13, fontWeight: 700, fontFamily: FONT }}
        onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#111'; el.style.color = '#111' }}
        onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#ccc'; el.style.color = '#aaa' }}>
        + Ajouter un contact
      </div>

      {editContact && <EditModal contact={editContact} onClose={() => setEditContact(null)} onSaved={() => { setEditContact(null); onRefresh?.() }} />}
    </div>
  )
}
