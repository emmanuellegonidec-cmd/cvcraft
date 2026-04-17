'use client'

import { useState, useEffect } from 'react'

const CATEGORIES = [
  'Atelier',
  'Formation',
  'Coaching',
  'Networking',
  'Rendez-vous conseil',
  'Bilan de compétences',
  'Autre',
]

const STATUTS = [
  { value: 'a_faire', label: 'À faire', color: '#1B4F72' },
  { value: 'fait',    label: 'Fait',    color: '#1A7A4A' },
  { value: 'annule',  label: 'Annulé',  color: '#888' },
]

interface Action {
  id?: string
  nom: string
  organisateur: string
  categorie: string
  date_debut: string
  date_fin: string
  note: string
  statut?: string
}

interface ActionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  action?: Action | null
}

export default function ActionModal({ isOpen, onClose, onSave, action }: ActionModalProps) {
  const [nom, setNom] = useState('')
  const [organisateur, setOrganisateur] = useState('')
  const [categorie, setCategorie] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [note, setNote] = useState('')
  const [statut, setStatut] = useState('a_faire')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (action) {
      setNom(action.nom || '')
      setOrganisateur(action.organisateur || '')
      setCategorie(action.categorie || '')
      const toLocalInput = (s: string) => { const d = new Date(s); const off = d.getTimezoneOffset(); return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16); }
      setDateDebut(action.date_debut ? toLocalInput(action.date_debut) : '')
      setDateFin(action.date_fin ? toLocalInput(action.date_fin) : '')
      setNote(action.note || '')
      setStatut(action.statut || 'a_faire')
    } else {
      setNom('')
      setOrganisateur('')
      setCategorie('')
      setDateDebut('')
      setDateFin('')
      setNote('')
      setStatut('a_faire')
    }
    setError('')
  }, [action, isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!nom.trim()) { setError('Le nom est requis.'); return }
    if (!dateDebut) { setError('La date est requise.'); return }

    setLoading(true)
    setError('')

    try {
      const token = (window as any).__jfmj_token
      const method = action?.id ? 'PUT' : 'POST'
      const toISO = (val: string) => val ? new Date(val).toISOString() : null
      const body: any = {
        nom, organisateur, categorie,
        date_debut: toISO(dateDebut),
        date_fin: dateFin ? toISO(dateFin) : null,
        note,
        statut,
      }
      if (action?.id) body.id = action.id

      const res = await fetch('/api/actions', {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      onSave()
      onClose()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jfmj-calendar-refresh'))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', border: '2px solid #111',
          boxShadow: '4px 4px 0 #111',
          width: '100%', maxWidth: 480, padding: 28,
          borderRadius: 2,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#111' }}>
          {action?.id ? 'Modifier l\'événement' : '+ Ajouter un événement'}
        </h2>

        {error && (
          <div style={{ background: '#ffeaea', border: '1px solid #E8151B', color: '#E8151B', padding: '8px 12px', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nom de l'événement *</label>
            <input
              style={inputStyle}
              placeholder="Ex: Atelier CV Hello Simone"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Organisateur</label>
            <input
              style={inputStyle}
              placeholder="Ex: APEC, Hello Simone, Pôle Emploi..."
              value={organisateur}
              onChange={e => setOrganisateur(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Catégorie</label>
            <select style={inputStyle} value={categorie} onChange={e => setCategorie(e.target.value)}>
              <option value="">-- Choisir une catégorie --</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date et heure de début *</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Date et heure de fin</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
              />
            </div>
          </div>

          {/* Sélecteur de statut */}
          <div>
            <label style={labelStyle}>Statut</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatut(s.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '2px solid #111',
                    background: statut === s.value ? s.color : '#fff',
                    color: statut === s.value ? '#fff' : '#111',
                    cursor: 'pointer',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Note</label>
            <textarea
              style={{ ...inputStyle, height: 80, resize: 'vertical' }}
              placeholder="Informations complémentaires..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', border: '2px solid #111',
              background: '#fff', cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '8px 20px', border: '2px solid #111',
              background: '#F5C400', cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13,
              boxShadow: '2px 2px 0 #111',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#555',
  marginBottom: 5,
  fontFamily: 'Montserrat, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid #111',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 13,
  color: '#111',
  background: '#fff',
  outline: 'none',
  borderRadius: 0,
}
