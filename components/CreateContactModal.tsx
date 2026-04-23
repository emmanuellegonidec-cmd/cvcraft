'use client'

import { useState, useEffect } from 'react'

const FONT = "'Montserrat', sans-serif"

export interface CreatedContact {
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
  onCreated: (contact: CreatedContact) => void
  // Bandeau violet en haut de la modale : "Ce contact sera lié à : X"
  // (optionnel — ne s'affiche pas si absent)
  linkToLabel?: string | null
  // Si le contact doit aussi être lié à une offre existante en BDD
  jobId?: string | null
  // Pré-remplissage du champ Entreprise
  defaultCompany?: string
}

export default function CreateContactModal({
  isOpen, onClose, onCreated, linkToLabel, jobId, defaultCompany,
}: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFirstName('')
      setLastName('')
      setRole('')
      setCompany(defaultCompany || '')
      setEmail('')
      setPhone('')
      setLinkedin('')
      setError('')
      setSaving(false)
    }
  }, [isOpen, defaultCompany])

  if (!isOpen) return null

  async function save() {
    if (!firstName.trim()) {
      setError('Le prénom est requis.')
      return
    }
    setSaving(true)
    setError('')
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const token = typeof window !== 'undefined' ? (window as any).__jfmj_token : null
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: fullName,
          role: role.trim() || null,
          company: company.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          linkedin: linkedin.trim() || null,
          job_id: jobId || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la création')
      }
      const data = await res.json().catch(() => ({}))
      // L'API peut renvoyer { contact: {...} } ou {...} directement — on gère les 2
      const createdId = data.contact?.id || data.id || null
      if (!createdId) {
        throw new Error('Le contact a été créé mais son identifiant n\'a pas été renvoyé.')
      }
      const contact: CreatedContact = {
        id: createdId,
        name: fullName,
        role: role.trim() || null,
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin: linkedin.trim() || null,
      }
      onCreated(contact)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #E0E0E0', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, fontFamily: FONT, color: '#111',
    background: '#fff', outline: 'none', boxSizing: 'border-box', fontWeight: 500,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: '#888', display: 'block', marginBottom: 5,
    fontFamily: FONT,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '0 20px' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 480, border: '2px solid #111', boxShadow: '4px 4px 0 #7C3AED', maxHeight: '90vh', overflowY: 'auto', fontFamily: FONT }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>Créer une fiche contact</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        {linkToLabel && (
          <div style={{ background: '#F5F0FF', border: '1.5px solid #7C3AED', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#5B21B6', fontFamily: FONT }}>
            Ce contact sera lié à : <strong>{linkToLabel}</strong>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEE2E2', border: '1.5px solid #E8151B', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#E8151B', marginBottom: 14, fontFamily: FONT }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Prénom *</label>
            <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Philippe" autoFocus />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nom</label>
            <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Martin" />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Fonction / Poste</label>
          <input style={inputStyle} value={role} onChange={e => setRole(e.target.value)} placeholder="Ex : DRH, Directeur Marketing..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Entreprise</label>
            <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Téléphone</label>
            <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>LinkedIn</label>
            <input style={inputStyle} value={linkedin} onChange={e => setLinkedin(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>
            Annuler
          </button>
          <button onClick={save} disabled={!firstName.trim() || saving}
            style={{
              flex: 2,
              background: (!firstName.trim() || saving) ? '#eee' : '#7C3AED',
              color: (!firstName.trim() || saving) ? '#aaa' : '#fff',
              fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: 'none',
              cursor: (!firstName.trim() || saving) ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
              boxShadow: (!firstName.trim() || saving) ? 'none' : '2px 2px 0 #111',
            }}>
            {saving ? '...' : 'Créer le contact →'}
          </button>
        </div>
      </div>
    </div>
  )
}
