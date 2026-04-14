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

  return (
    <div style={{ fontFamily: FONT }}>

      {/* BARRE DE RECHERCHE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: '2px solid #111', borderRadius: 8,
        padding: '10px 14px', marginBottom: 20,
        boxShadow: '3px 3px 0 #111',
      }}>
        <span style={{ fontSize: 16, color: '#888' }}>🔍</span>
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
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: '#888', fontFamily: FONT, padding: 0,
            }}
          >✕</button>
        )}
      </div>

      {/* COMPTEUR */}
      {search && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 12 }}>
          {filtered.length} contact{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </div>
      )}

      {/* LISTE HORIZONTALE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {filtered.map((c, i) => {
          const avatarStyle = AVATAR_COLORS[i % AVATAR_COLORS.length]
          const initials = getInitials(c.name)

          return (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: '#fff', border: '2px solid #111',
                borderRadius: 10, padding: '14px 18px',
                boxShadow: '3px 3px 0 #111',
              }}
            >
              {/* AVATAR */}
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: avatarStyle.bg, border: '2px solid #111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, color: avatarStyle.color,
                flexShrink: 0, fontFamily: FONT,
              }}>
                {initials}
              </div>

              {/* INFOS */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontFamily: FONT }}>
                  {c.name}
                </div>
                {c.role && (
                  <div style={{ fontSize: 12, color: '#555', fontWeight: 600, marginTop: 1, fontFamily: FONT }}>
                    {c.role}
                  </div>
                )}
                {c.company && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      display: 'inline-block', background: '#111', color: '#F5C400',
                      fontSize: 11, fontWeight: 800, padding: '3px 10px',
                      borderRadius: 20, fontFamily: FONT,
                    }}>
                      {c.company}
                    </span>
                  </div>
                )}
                {c.job_manual && (
                  <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginTop: 5, fontFamily: FONT }}>
                    💼 <span style={{ color: '#111', fontWeight: 700 }}>{c.job_manual}</span>
                  </div>
                )}
                {c.phone && (
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginTop: 4, fontFamily: FONT }}>
                    📞 {c.phone}
                  </div>
                )}
              </div>

              {/* BOUTONS */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {c.email && (
                  <button
                    onClick={() => window.open('mailto:' + c.email)}
                    style={{
                      padding: '7px 12px', border: '2px solid #111', borderRadius: 6,
                      fontSize: 11, fontWeight: 800, cursor: 'pointer',
                      background: '#fff', color: '#111',
                      boxShadow: '2px 2px 0 #111', fontFamily: FONT,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Email
                  </button>
                )}
                {c.linkedin && (
                  <button
                    onClick={() => window.open(c.linkedin!)}
                    style={{
                      padding: '7px 12px', border: '2px solid #111', borderRadius: 6,
                      fontSize: 11, fontWeight: 800, cursor: 'pointer',
                      background: '#fff', color: '#111',
                      boxShadow: '2px 2px 0 #111', fontFamily: FONT,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    LinkedIn
                  </button>
                )}
                <button
                  onClick={() => onDeleteContact(c.id)}
                  style={{
                    padding: '7px 12px', border: '2px solid #E8151B', borderRadius: 6,
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: '#fff', color: '#E8151B',
                    boxShadow: '2px 2px 0 #E8151B', fontFamily: FONT,
                    whiteSpace: 'nowrap',
                  }}
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
            Aucun contact trouvé pour "{search}"
          </div>
        )}

        {/* CARTE AJOUTER */}
        <div
          onClick={onAddContact}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed #ccc', borderRadius: 10, padding: 20,
            cursor: 'pointer', color: '#aaa', fontSize: 13, fontWeight: 700,
            fontFamily: FONT, transition: 'all 0.15s',
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
