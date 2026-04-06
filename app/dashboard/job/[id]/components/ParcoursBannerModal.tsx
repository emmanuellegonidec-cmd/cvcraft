'use client'

import { useEffect, useState } from 'react'

const FONT = "'Montserrat', sans-serif"

const STATUS_LABELS: Record<string, string> = {
  applied:     'Postulé',
  in_progress: 'En cours',
  offer:       'Offre reçue',
  archived:    'Archivé',
}

// Étapes à afficher selon le statut
const STATUS_STEPS: Record<string, string[]> = {
  applied:     ['Envie de postuler', 'Postulé'],
  in_progress: ['Envie de postuler', 'Postulé', 'Votre étape en cours'],
  offer:       ['Envie de postuler', 'Postulé', 'En cours', 'Offre reçue'],
  archived:    ['Envie de postuler', 'Postulé', 'En cours', 'Archivé'],
}

const STEP_COLORS = ['#CCC', '#1A6FDB', '#B8900A', '#1A7A4A', '#888']

interface Props {
  jobId: string
  status: string
  stepDates: Record<string, string>
}

export default function ParcoursBannerModal({ jobId, status, stepDates }: Props) {
  const [open, setOpen] = useState(false)

  const stepDatesEmpty = Object.keys(stepDates).length === 0
  // Se déclenche si step_dates vide ET status n'est pas to_apply
  const shouldTrigger = stepDatesEmpty && status !== 'to_apply' && status !== 'applied_manually'

  useEffect(() => {
    if (!shouldTrigger) return
    const t = setTimeout(() => setOpen(true), 600)
    return () => clearTimeout(t)
  }, [shouldTrigger])

  // Disparaît si step_dates se remplit
  useEffect(() => {
    if (!stepDatesEmpty) setOpen(false)
  }, [stepDatesEmpty])

  if (!open) return null

  const statusLabel = STATUS_LABELS[status] ?? 'En cours'
  const steps = STATUS_STEPS[status] ?? STATUS_STEPS['in_progress']

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '0 20px', fontFamily: FONT,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '28px 30px',
        width: '100%', maxWidth: 500,
        border: '2px solid #111', boxShadow: '4px 4px 0 #111',
      }}>

        {/* Icône + titre */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, background: '#FEF9E0',
            border: '2px solid #F5C400', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>👋</div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#111', margin: '0 0 6px', fontFamily: FONT }}>
              Le parcours n'est pas encore renseigné
            </h3>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0, fontFamily: FONT }}>
              Cette candidature a été ajoutée directement en{' '}
              <strong style={{ color: '#111' }}>"{statusLabel}"</strong>{' '}
              sans passer par les étapes.
            </p>
          </div>
        </div>

        {/* Explication */}
        <div style={{
          background: '#F9F9F7', borderRadius: 8, padding: '12px 14px',
          marginBottom: 16, border: '1px solid #EBEBEB',
        }}>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.6, fontFamily: FONT }}>
            Pour que Jean vous accompagne vraiment, il faut{' '}
            <strong style={{ color: '#111' }}>repartir du début</strong>{' '}
            et valider chaque étape une par une depuis le parcours de candidature ci-dessous :
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#B8900A', margin: 0, fontFamily: FONT }}>
            {steps.join(' → ')}
          </p>
        </div>

        {/* Étapes visuelles */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          marginBottom: 22, flexWrap: 'wrap',
        }}>
          {steps.map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: STEP_COLORS[i] ?? '#CCC',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: '#555', fontFamily: FONT, fontWeight: 500 }}>
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span style={{ color: '#CCC', fontSize: 12 }}>→</span>
              )}
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 700,
              background: '#F9F9F7', color: '#555',
              border: '1.5px solid #ddd', borderRadius: 9,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Fermer
          </button>
          <button
            onClick={() => {
              setOpen(false)
              const el = document.getElementById('parcours-section')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              flex: 2, padding: '11px 0', fontSize: 13, fontWeight: 800,
              background: '#F5C400', color: '#111',
              border: '2px solid #111', borderRadius: 9,
              cursor: 'pointer', fontFamily: FONT,
              boxShadow: '2px 2px 0 #111',
            }}
          >
            Mettre à jour le parcours →
          </button>
        </div>
      </div>
    </div>
  )
}
