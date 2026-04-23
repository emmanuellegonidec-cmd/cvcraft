'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

export interface PickableContact {
  id: string
  name: string
  role: string | null
  company: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  excludeIds?: string[]
  onPick: (contact: PickableContact) => void
  onCreateNew: () => void
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.slice(0, 2) || '??').toUpperCase()
}

export default function ContactPicker({ isOpen, onClose, excludeIds = [], onPick, onCreateNew }: Props) {
  const [contacts, setContacts] = useState<PickableContact[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSearch('')
    setLoading(true)
    ;(async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const { data } = await supabase.from('contacts')
        .select('id, name, role, company, email, phone, linkedin')
        .eq('user_id', session.user.id)
        .order('name')
      setContacts((data || []) as PickableContact[])
      setLoading(false)
    })()
  }, [isOpen])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const excluded = new Set(excludeIds)
    return contacts
      .filter(c => !excluded.has(c.id))
      .filter(c => !q ||
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q)
      )
  }, [contacts, search, excludeIds])

  if (!isOpen) return null

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, border: '2px solid #111', boxShadow: '4px 4px 0 #111', maxHeight: '85vh', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>Ajouter un contact</h3>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>✕</button>
        </div>

        <div style={{ padding: '14px 20px 0' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Rechercher par nom ou entreprise..."
            style={{ width: '100%', padding: '10px 12px', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }}
            autoFocus
          />
        </div>

        <div style={{ padding: '14px 20px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: FONT }}>
            Mes contacts existants {!loading && `(${filtered.length})`}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 8px' }}>
          {loading ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', fontSize: 12, color: '#888', fontFamily: FONT }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '20px 8px', textAlign: 'center', fontSize: 12, color: '#aaa', fontFamily: FONT }}>
              {search ? `Aucun contact ne correspond à "${search}"` : 'Aucun contact existant'}
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id}
                onClick={() => { onPick(c); onClose() }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2 }}
                onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
                onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#111', color: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.role}{c.role && c.company ? ' — ' : ''}{c.company}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 20px 20px', borderTop: '1.5px dashed #CCC' }}>
          <button onClick={() => { onCreateNew(); onClose() }}
            style={{ width: '100%', background: '#F5C400', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0 #111', borderRadius: 8, padding: '11px', fontFamily: FONT, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
            + Créer un nouveau contact
          </button>
        </div>
      </div>
    </div>
  )
}
