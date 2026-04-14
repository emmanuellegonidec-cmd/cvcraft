'use client'

import { useState, useMemo } from 'react'

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
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export default function ContactsView({ contacts, onAddContact, onDeleteContact }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return contacts
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q)
    )
  }, [contacts, search])

  const colStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, color: '#888',
    textTransform: 'uppercase', letterSpacing: '1px', fontFamily: FONT,
  }

  const btnStyle: React.CSSProperties = {
    padding: '5px 10px', border: '2px solid #111', borderRadius: 5,
    fontSize: 10, fontWeight: 800, cursor: 'pointer',
    background: '#fff', color: '#111',
    boxShadow: '1px 1px 0 #111', whiteSpace: 'nowrap' as const,
    fontFamily: FONT,
  }

  const btnRedStyle: React.CSSProperties = {
    ...btnStyle,
    border: '2px solid #E8151B', color: '#E8151B',
    boxShadow: '1px 1px 0 #E8151B',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '46px 220px 1fr 180px auto',
    alignItems: 'center',
    gap: 14,
  }

  return (
    <div style={{ fontFamily: FONT }}>

      {/* BARRE DE RECHERCHE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: '2px solid #111', borderRadius: 8,
        padding: '9px 14px', marginBottom: 14,
        boxShadow: '3px 3px 0 #111',
      }}>
        <span style={{ fontSize: 14, color: '#888' }}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher par nom, entreprise, poste…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: 'none', outline: 'none', flex: 1,
            fontSize: 13, fontWeight: 600, fontFamily: FONT,
            color: '#111', background: 'transparent',
          }}
        />
        <span style={{ fontSize: 11, color: '#888', fontWeight: 700, fontFamily: FONT }}>
          {filtered.length} contact{filtered.length > 1 ? 's' : ''}
        </span>
        {search && (
          <button onClick={() => setSearch('')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 15, color: '#888', fontFamily: FONT, padding: 0,
          }}>✕</button>
        )}
      </div>

      {/* EN-TÊTES COLONNES */}
      <div style={{ ...gridStyle, padding: '0 16px 6px' }}>
        <div />
        <div style={colStyle}>Nom</div>
        <div style={colStyle}>Entreprise</div>
        <div style={colStyle}>Offre associée</div>
        <div />
      </div>

      {/* LIGNES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((c, i) => {
          const avatarStyle = AVATAR_COLORS[i % AVATAR_COLORS.length]
          const initials = getInitials(c.name)

          return (
            <div key={c.id} style={{
              ...gridStyle,
              background: '#fff', border: '2px solid #111',
              borderRadius: 8, padding: '10px 16px',
              boxShadow: '2px 2px 0 #111',
            }}>
              {/* AVATAR */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: avatarStyle.bg, border: '2px solid #111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, color: avatarStyle.color,
                flexShrink: 0, fontFamily: FONT,
              }}>
                {initials}
              </div>

              {/* NOM + RÔLE */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#111', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </div>
                {c.role && (
                  <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginTop: 2, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.role}
                  </div>
                )}
              </div>

              {/* ENTREPRISE */}
              <div style={{ minWidth: 0 }}>
                {c.company ? (
                  <span style={{
                    display: 'inline-block', background: '#111', color: '#F5C400',
                    fontSize: 10, fontWeight: 800, padding: '2px 9px',
                    borderRadius: 20, fontFamily: FONT, whiteSpace: 'nowrap',
                  }}>
                    {c.company}
                  </span>
                ) : c.phone ? (
                  <span style={{ fontSize: 11, color: '#888', fontWeight: 600, fontFamily: FONT }}>
                    📞 {c.phone}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#ccc', fontFamily: FONT }}>—</span>
                )}
              </div>

              {/* OFFRE ASSOCIÉE */}
              <div style={{ minWidth: 0 }}>
                {c.job_manual ? (
                  <span style={{ fontSize: 11, color: '#555', fontWeight: 600, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    💼 {c.job_manual}
                  </span>
                ) : c.phone && c.company ? (
                  <span style={{ fontSize: 11, color: '#888', fontWeight: 600, fontFamily: FONT }}>
                    📞 {c.phone}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#ccc', fontFamily: FONT }}>—</span>
                )}
              </div>

              {/* BOUTONS */}
              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                {c.email && (
                  <button onClick={() => window.open('mailto:' + c.email)} style={btnStyle}>
                    Email
                  </button>
                )}
                {c.linkedin && (
                  <button onClick={() => window.open(c.linkedin!)} style={btnStyle}>
                    LinkedIn
                  </button>
                )}
                <button onClick={() => onDeleteContact(c.id)} style={btnRedStyle}>
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
            color: '#888', fontSize: 13, fontWeight: 700, fontFamily: FONT,
          }}>
            Aucun contact trouvé pour &quot;{search}&quot;
          </div>
        )}

        {/* AJOUTER */}
        <div
          onClick={onAddContact}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed #ccc', borderRadius: 8, padding: 14,
            cursor: 'pointer', color: '#aaa', fontSize: 12, fontWeight: 700,
            fontFamily: FONT,
          }}
          onMouseOver={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = '#111'
            el.style.color = '#111'
          }}
          onMouseOut={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = '#ccc'
            el.style.color = '#aaa'
          }}
        >
          + Ajouter un contact
        </div>
      </div>
    </div>
  )
}
