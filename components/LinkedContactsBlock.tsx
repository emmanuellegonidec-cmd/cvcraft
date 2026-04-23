'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import ContactPicker, { PickableContact } from './ContactPicker'
import CreateContactModal, { CreatedContact } from './CreateContactModal'

const FONT = "'Montserrat', sans-serif"

interface LinkedContact {
  id: string
  name: string
  role: string | null
  company: string | null
}

interface Props {
  contactIds: string[]
  onChange: (ids: string[]) => void
  // Passé à CreateContactModal — bandeau "Ce contact sera lié à : X"
  linkToLabel?: string
  // Passé à CreateContactModal — pré-remplit le champ Entreprise
  defaultCompany?: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.slice(0, 2) || '??').toUpperCase()
}

export default function LinkedContactsBlock({ contactIds, onChange, linkToLabel, defaultCompany }: Props) {
  const [linked, setLinked] = useState<LinkedContact[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (contactIds.length === 0) { setLinked([]); return }
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase.from('contacts')
        .select('id, name, role, company')
        .in('id', contactIds)
      // On préserve l'ordre d'insertion (l'ordre de contactIds)
      const map = new Map<string, LinkedContact>()
      ;(data || []).forEach((c: any) => map.set(c.id, c as LinkedContact))
      const ordered: LinkedContact[] = []
      for (const id of contactIds) {
        const c = map.get(id)
        if (c) ordered.push(c)
      }
      setLinked(ordered)
    })()
  }, [contactIds])

  function handlePick(contact: PickableContact) {
    if (contactIds.includes(contact.id)) return
    onChange([...contactIds, contact.id])
  }

  function handleCreated(contact: CreatedContact) {
    onChange([...contactIds, contact.id])
  }

  function handleRemove(id: string) {
    onChange(contactIds.filter(x => x !== id))
  }

  return (
    <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 14, fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          👥 Contacts liés
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          {linked.length} contact{linked.length !== 1 ? 's' : ''}
        </div>
      </div>

      {linked.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {linked.map(c => (
            <div key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#111', color: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                {initials(c.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.role}{c.role && c.company ? ' — ' : ''}{c.company}
                </div>
              </div>
              <button type="button" onClick={() => handleRemove(c.id)}
                style={{ background: 'none', border: 'none', color: '#E8151B', fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '4px 8px' }}
                title="Retirer ce contact">✕</button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setPickerOpen(true)}
        style={{ background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0 #111', borderRadius: 8, padding: '9px 14px', fontFamily: FONT, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#F5C400', border: '2px solid #111', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>+</span>
        Ajouter un contact
      </button>

      <ContactPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={contactIds}
        onPick={handlePick}
        onCreateNew={() => { setPickerOpen(false); setCreateOpen(true) }}
      />

      <CreateContactModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
        linkToLabel={linkToLabel}
        defaultCompany={defaultCompany}
      />
    </div>
  )
}
