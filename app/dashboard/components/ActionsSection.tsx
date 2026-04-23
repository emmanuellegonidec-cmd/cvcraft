'use client'

import { useState, useEffect } from 'react'
import ActionModal from './ActionModal'

interface Action {
  id: string
  nom: string
  organisateur: string
  categorie: string
  date_debut: string
  date_fin: string
  note: string
  statut: string
  contact_ids?: string[]
}

interface Contact {
  id: string
  prenom?: string
  nom?: string
  first_name?: string
  last_name?: string
  name?: string
  email?: string
}

const CATEGORIE_COLORS: Record<string, string> = {
  'Atelier': '#F5C400',
  'Formation': '#1B4F72',
  'Coaching': '#E8151B',
  'Networking': '#2ecc71',
  'Rendez-vous conseil': '#9b59b6',
  'Bilan de compétences': '#e67e22',
  'Autre': '#888',
}

function getContactDisplay(c: Contact | undefined) {
  if (!c) return null
  const first = c.prenom ?? c.first_name ?? ''
  const last = c.nom ?? c.last_name ?? c.name ?? ''
  const fullName = `${first} ${last}`.trim() || c.email || 'Contact'
  const initials = (
    (first.charAt(0) || '') + (last.charAt(0) || '')
  ).toUpperCase() || fullName.charAt(0).toUpperCase() || '?'
  return { fullName, initials }
}

function getEffectiveStatus(a: Action): 'fait' | 'annule' | 'a_faire' | 'en_retard' {
  if (a.statut === 'fait') return 'fait'
  if (a.statut === 'annule') return 'annule'
  const now = new Date()
  const eventEnd = new Date(a.date_fin || a.date_debut)
  if (eventEnd < now) return 'en_retard'
  return 'a_faire'
}

export default function ActionsSection({
  triggerOpen = 0,
  onCountChange,
  compact = false,
  initialDateTime = null,
}: {
  triggerOpen?: number
  onCountChange?: (count: number) => void
  compact?: boolean
  initialDateTime?: { date: string; heure?: string } | null
}) {
  const [actions, setActions] = useState<Action[]>([])
  const [contactsMap, setContactsMap] = useState<Record<string, Contact>>({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Action | null>(null)

  function getToken() {
    return typeof window !== 'undefined' ? (window as any).__jfmj_token : null
  }

  const fetchActions = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/actions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setActions(data)
        onCountChange?.(data.length)
      }
    } catch (err) {
      console.error('Erreur chargement événements:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/contacts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data: Contact[] = await res.json()
        const map: Record<string, Contact> = {}
        data.forEach((c) => { map[c.id] = c })
        setContactsMap(map)
      }
    } catch (err) {
      console.error('Erreur chargement contacts:', err)
    }
  }

  useEffect(() => {
    fetchActions()
    fetchContacts()
  }, [])

  useEffect(() => {
    const handler = () => {
      fetchActions()
      fetchContacts()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('jfmj-calendar-refresh', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('jfmj-calendar-refresh', handler)
      }
    }
  }, [])

  useEffect(() => {
    if (triggerOpen > 0) { setSelectedAction(null); setModalOpen(true) }
  }, [triggerOpen])

  const handleDelete = async (id: string) => {
    try {
      const token = getToken()
      await fetch(`/api/actions?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setDeleteTarget(null)
      fetchActions()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jfmj-calendar-refresh'))
      }
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const quickChangeStatus = async (action: Action, newStatut: string) => {
    try {
      const token = getToken()
      await fetch('/api/actions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: action.id, statut: newStatut }),
      })
      fetchActions()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jfmj-calendar-refresh'))
      }
    } catch (err) {
      console.error('Erreur changement statut:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isPast = (dateStr: string) => new Date(dateStr) < new Date()

  const filteredActions = compact
    ? actions.filter(a => a.statut !== 'fait' && a.statut !== 'annule')
    : actions

  const upcoming = filteredActions.filter(a => !isPast(a.date_debut))
  const past = filteredActions.filter(a => isPast(a.date_debut))

  const isEmpty = filteredActions.length === 0
  const emptyText = compact
    ? 'Tout est à jour ! Aucun événement en attente ou en retard.'
    : 'Aucun événement pour le moment. Ajoutez vos ateliers, formations, rendez-vous...'

  return (
    <div style={{ padding: 16 }}>
      {loading ? (
        <p style={{ fontSize: 13, color: '#888', fontFamily: 'Montserrat, sans-serif' }}>Chargement...</p>
      ) : isEmpty ? (
        <p style={{ fontSize: 13, color: '#888', fontFamily: 'Montserrat, sans-serif', textAlign: 'center', padding: '20px 0' }}>
          {compact && '✅ '}{emptyText}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcoming.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>À venir</p>
              {upcoming.map(action => (
                <ActionCard
                  key={action.id}
                  action={action}
                  contactsMap={contactsMap}
                  formatDate={formatDate}
                  onEdit={() => { setSelectedAction(action); setModalOpen(true) }}
                  onDelete={() => setDeleteTarget(action)}
                  onQuickStatus={(s) => quickChangeStatus(action, s)}
                />
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', marginTop: 8, marginBottom: 4 }}>
                {compact ? 'En retard' : 'Passées'}
              </p>
              {past.map(action => (
                <ActionCard
                  key={action.id}
                  action={action}
                  contactsMap={contactsMap}
                  formatDate={formatDate}
                  onEdit={() => { setSelectedAction(action); setModalOpen(true) }}
                  onDelete={() => setDeleteTarget(action)}
                  onQuickStatus={(s) => quickChangeStatus(action, s)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <div style={{ background: '#fff', border: '2px solid #E8151B', borderRadius: 12, boxShadow: '4px 4px 0 #E8151B', padding: 28, maxWidth: 420, width: '100%', fontFamily: 'Montserrat, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#E8151B', margin: '0 0 8px' }}>Supprimer cet événement ?</h3>
              <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.6 }}><strong>{deleteTarget.nom}</strong></p>
              {deleteTarget.organisateur && <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>{deleteTarget.organisateur}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, background: '#fff', border: '2px solid #ccc', borderRadius: 8, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>Annuler</button>
              <button onClick={() => handleDelete(deleteTarget.id)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 800, background: '#E8151B', color: '#fff', border: '2px solid #E8151B', borderRadius: 8, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchActions}
        action={selectedAction}
        initialDateTime={selectedAction ? null : initialDateTime}
      />
    </div>
  )
}

function ActionCard({ action, contactsMap, formatDate, onEdit, onDelete, onQuickStatus }: {
  action: Action
  contactsMap: Record<string, Contact>
  formatDate: (d: string) => string
  onEdit: () => void
  onDelete: () => void
  onQuickStatus: (s: string) => void
}) {
  const color = CATEGORIE_COLORS[action.categorie] || '#888'
  const effectiveStatus = getEffectiveStatus(action)
  const isDone = effectiveStatus === 'fait'
  const isCancelled = effectiveStatus === 'annule'
  const isLate = effectiveStatus === 'en_retard'

  const borderLeft = isLate ? `4px solid #E8151B` : `4px solid ${color}`
  const opacity = isDone ? 0.65 : isCancelled ? 0.55 : 1

  const linkedContacts = (action.contact_ids || [])
    .map((id) => contactsMap[id])
    .filter((c): c is Contact => Boolean(c))

  return (
    <div style={{
      border: '1.5px solid #111',
      borderLeft,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#fff',
      opacity,
      gap: 12,
    }}>
      <button
        onClick={() => onQuickStatus(isDone ? 'a_faire' : 'fait')}
        title={isDone ? 'Marquer comme à faire' : 'Marquer comme fait'}
        style={{
          width: 26, height: 26, minWidth: 26, borderRadius: '50%',
          border: '2px solid ' + (isDone ? '#1A7A4A' : '#CCC'),
          background: isDone ? '#1A7A4A' : '#fff',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {isDone ? '✓' : ''}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#111' }}>
            {action.nom}
          </span>
          {action.categorie && (
            <span style={{ background: color, color: '#111', fontSize: 10, fontWeight: 700, padding: '2px 8px', border: '1px solid #111' }}>
              {action.categorie}
            </span>
          )}
          {isLate && (
            <span style={{ background: '#E8151B', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🔴 En retard
            </span>
          )}
          {isDone && (
            <span style={{ background: '#1A7A4A', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✓ Fait
            </span>
          )}
          {isCancelled && (
            <span style={{ background: '#888', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Annulé
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {action.organisateur && (
            <span style={{ fontSize: 11, color: '#555', fontFamily: 'Montserrat, sans-serif' }}>📍 {action.organisateur}</span>
          )}
          <span style={{ fontSize: 11, color: '#555', fontFamily: 'Montserrat, sans-serif' }}>
            📅 {formatDate(action.date_debut)}{action.date_fin && ` → ${formatDate(action.date_fin)}`}
          </span>
        </div>

        {linkedContacts.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#888', marginRight: 2, fontFamily: 'Montserrat, sans-serif' }}>👥</span>
            {linkedContacts.map((c) => {
              const info = getContactDisplay(c)
              if (!info) return null
              return (
                <span
                  key={c.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#fff',
                    border: '1.5px solid #111',
                    padding: '2px 8px 2px 2px',
                    borderRadius: 20,
                  }}
                >
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#F5C400',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 900,
                    color: '#111',
                    fontFamily: 'Montserrat, sans-serif',
                  }}>
                    {info.initials}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#111', fontFamily: 'Montserrat, sans-serif' }}>
                    {info.fullName}
                  </span>
                </span>
              )
            })}
          </div>
        )}

        {action.note && (
          <p style={{ fontSize: 11, color: '#777', marginTop: 4, fontFamily: 'Montserrat, sans-serif' }}>{action.note}</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onEdit} style={{ background: 'none', border: '1.5px solid #111', padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>✏️</button>
        <button onClick={onDelete} style={{ background: 'none', border: '1.5px solid #E8151B', padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: '#E8151B' }}>🗑</button>
      </div>
    </div>
  )
}
