'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type RgpdConsentModalProps = {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  documentType?: 'CV' | 'lettre de motivation' | 'document'
}

export default function RgpdConsentModal({
  isOpen,
  onClose,
  onAccept,
  documentType = 'CV',
}: RgpdConsentModalProps) {
  const [checked, setChecked] = useState(false)

  // Reset la case à chaque ouverture (puisque la modale s'affiche à CHAQUE upload)
  useEffect(() => {
    if (isOpen) setChecked(false)
  }, [isOpen])

  if (!isOpen) return null

  const handleAccept = () => {
    if (!checked) return
    onAccept()
  }

  // Gère l'accord singulier/pluriel
  const docLabel = documentType === 'lettre de motivation' ? 'Votre lettre' : `Votre ${documentType}`
  const docLabelGenre = documentType === 'lettre de motivation' ? 'stockée' : 'stocké'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        fontFamily: 'Montserrat, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '2px solid #111',
          borderRadius: 16,
          boxShadow: '4px 4px 0 #111',
          maxWidth: 560,
          width: '100%',
          padding: 28,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: 22, fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>
          🔒 Protection de vos données
        </h2>

        <p style={{ margin: '0 0 14px 0', fontSize: 14, color: '#333', lineHeight: 1.6 }}>
          {docLabel} sera {docLabelGenre} dans un <strong>espace sécurisé</strong> : base de données chiffrée <strong>AES-256</strong>, hébergée en <strong>Union Européenne</strong> (Supabase, conforme RGPD).
        </p>

        <p style={{ margin: '0 0 14px 0', fontSize: 14, color: '#333', lineHeight: 1.6 }}>
          <strong>Durée de conservation</strong> : vos documents sont conservés <strong>2 ans après votre dernière connexion</strong>, conformément aux recommandations de la CNIL (délibération n°2002-017) et à l'<strong>article 5(1)(e) du RGPD</strong>.
        </p>

        <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#333', lineHeight: 1.6 }}>
          <strong>Vos droits</strong> : vous pouvez à tout moment <strong>consulter, modifier ou supprimer</strong> vos données depuis votre profil (articles 15 à 22 du RGPD).
        </p>

        <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#555', lineHeight: 1.5 }}>
          Pour plus d'informations, consultez notre{' '}
          <Link href="/confidentialite" target="_blank" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>
            politique de confidentialité
          </Link>.
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 14,
            background: '#FAFAFA',
            border: '2px solid #111',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: '#111', lineHeight: 1.5 }}>
            J'ai lu et j'accepte les{' '}
            <Link href="/confidentialite" target="_blank" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>
              mentions légales
            </Link>{' '}
            concernant le traitement de mes données personnelles.
          </span>
        </label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#fff',
              color: '#111',
              border: '2px solid #111',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleAccept}
            disabled={!checked}
            style={{
              padding: '10px 20px',
              background: checked ? '#111' : '#CCC',
              color: checked ? '#F5C400' : '#888',
              border: '2px solid #111',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 800,
              cursor: checked ? 'pointer' : 'not-allowed',
              fontFamily: 'Montserrat, sans-serif',
              boxShadow: checked ? '3px 3px 0 #E8151B' : 'none',
              transition: 'all 0.12s',
            }}
          >
            Accepter et continuer →
          </button>
        </div>
      </div>
    </div>
  )
}
