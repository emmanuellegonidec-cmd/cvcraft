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

export default function ActionsSection({ triggerOpen = 0 }: { triggerOpen?: number }) {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Action | null>(null)

  const fetchActions = async () => {
    try {
      const token = (window as any).__jfmj_token
      const res = await fetch('/api/actions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setActions(data)
      }
    } catch (err) {
      console.error('Erreur chargement actions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchActions() }, [])

  useEffect(() => {
    if (triggerOpen > 0) { setSelectedAction(null); setModalOpen(true); }
  }, [triggerOpen])

  const handleDelete = async (id: string) => {
    try {
      const token = (window as any).__jfmj_token
      await fetch(`/api/actions?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setDeleteTarget(null)
      fetchActions()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isPast = (dateStr: string) => new Date(dateStr) < new Date()

  const upcoming = actions.filter(a => !isPast(a.date_debut))
  const past = actions.filter(a => isPast(a.date_debut))

  return (
    <div style={{ border: '2px solid #111', marginBottom: 24, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '2px solid #111',
        background: '#FAFAFA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Actions
          </span>
          <span style={{
            background: '#111', color: '#fff',
            fontSize: 11, fontWeight: 700,
            padding: '1px 7px', borderRadius: 10,
          }}>
            {actions.length}
          </span>
        </div>
        <button
          onClick={() => { setSelectedAction(null); setModalOpen(true) }}
          style={{
            background: '#F5C400', border: '2px solid #111',
            padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12,
            boxShadow: '2px 2px 0 #111',
          }}
        >
          + Ajouter une action
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ fontSize: 13, color: '#888', fontFamily: 'Montserrat, sans-serif' }}>Chargement...</p>
        ) : actions.length === 0 ? (
          <p style={{ fontSize: 13, color: '#888', fontFamily: 'Montserrat, sans-serif', textAlign: 'center', padding: '20px 0' }}>
            Aucune action pour le moment. Ajoutez vos ateliers, formations, rendez-vous...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* À venir */}
            {upcoming.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>À venir</p>
                {upcoming.map(action => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    formatDate={formatDate}
                    onEdit={() => { setSelectedAction(action); setModalOpen(true) }}
                    onDelete={() => setDeleteTarget(action)}
                    past={false}
                  />
                ))}
              </>
            )}

            {/* Passées */}
            {past.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Montserrat, sans-serif', marginTop: 8, marginBottom: 4 }}>Passées</p>
                {past.map(action => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    formatDate={formatDate}
                    onEdit={() => { setSelectedAction(action); setModalOpen(true) }}
                    onDelete={() => setDeleteTarget(action)}
                    past={true}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modale de confirmation suppression */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <div style={{ background: '#fff', border: '2px solid #E8151B', borderRadius: 12, boxShadow: '4px 4px 0 #E8151B', padding: 28, maxWidth: 420, width: '100%', fontFamily: 'Montserrat, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#E8151B', margin: '0 0 8px' }}>Supprimer cette action ?</h3>
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
      />
    </div>
  )
}

function ActionCard({ action, formatDate, onEdit, onDelete, past }: {
  action: Action
  formatDate: (d: string) => string
  onEdit: () => void
  onDelete: () => void
  past: boolean
}) {
  const color = CATEGORIE_COLORS[action.categorie] || '#888'

  return (
    <div style={{
      border: '1.5px solid #111',
      borderLeft: `4px solid ${color}`,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: past ? '#fafafa' : '#fff',
      opacity: past ? 0.75 : 1,
      gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#111' }}>
            {action.nom}
          </span>
          {action.categorie && (
            <span style={{
              background: color, color: '#111',
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', border: '1px solid #111',
            }}>
              {action.categorie}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {action.organisateur && (
            <span style={{ fontSize: 11, color: '#555', fontFamily: 'Montserrat, sans-serif' }}>
              📍 {action.organisateur}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#555', fontFamily: 'Montserrat, sans-serif' }}>
            📅 {formatDate(action.date_debut)}
            {action.date_fin && ` → ${formatDate(action.date_fin)}`}
          </span>
        </div>
        {action.note && (
          <p style={{ fontSize: 11, color: '#777', marginTop: 4, fontFamily: 'Montserrat, sans-serif' }}>{action.note}</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onEdit}
          style={{ background: 'none', border: '1.5px solid #111', padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: '1.5px solid #E8151B', padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: '#E8151B' }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
