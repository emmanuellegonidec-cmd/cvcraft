'use client'

import { useState } from 'react'
import { JobExchange } from '@/lib/types'

const FONT = "'Montserrat', sans-serif"

interface Props {
  exchanges: JobExchange[]
  currentStepLabel: string
  onAdd: () => void
  onUpdate: (id: string, field: string, value: string) => void
}

/**
 * Bloc "Debrief de l'entretien" affiché dans la Phase APRÈS.
 *
 * Collapsible fermé par défaut. Le header affiche un résumé inline
 * indiquant si un debrief existe déjà ou pas.
 *
 * - Trouve l'échange le plus récent rattaché à l'étape en cours.
 * - Si aucun échange : bouton "+ Créer le debrief" dans le body.
 * - Si un échange existe : 3 textareas (déroulement, questions-réponses,
 *   prochaine étape) liés à cet échange, persistés via onUpdate.
 */
export default function JobInterviewDebrief({
  exchanges, currentStepLabel, onAdd, onUpdate,
}: Props) {
  const [open, setOpen] = useState(false)

  const currentExchange = [...exchanges].reverse().find(
    ex => (ex as any).step_label === currentStepLabel
  )

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #eee',
    borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none',
    background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500,
  }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 76, lineHeight: '1.6' }
  const fieldLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, color: '#888', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em',
    fontFamily: FONT,
  }

  const summary = currentExchange ? 'Debrief en cours' : 'À créer'

  return (
    <div style={{
      background: '#fff', borderRadius: 12, marginBottom: 10,
      border: '1.5px solid #EBEBEB', overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', cursor: 'pointer',
          background: '#fff',
          borderBottom: open ? '1px solid #F0F0F0' : 'none',
        }}
      >
        <span style={{
          fontSize: 11, fontWeight: 800, color: '#555',
          letterSpacing: '1.3px', textTransform: 'uppercase', fontFamily: FONT,
        }}>
          Debrief de l&apos;entretien
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 11, color: currentExchange ? '#666' : '#aaa',
          fontWeight: 600, fontFamily: FONT, marginRight: 10,
          fontStyle: currentExchange ? 'normal' : 'italic',
        }}>
          {summary}
        </span>
        <span style={{
          fontSize: 10, color: '#999', display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
        }}>▼</span>
      </div>

      {open && (
        <div style={{ padding: '14px 18px' }}>
          {!currentExchange ? (
            <div style={{
              background: '#F9F9F7', border: '1.5px dashed #ddd',
              borderRadius: 10, padding: '20px 16px', textAlign: 'center',
            }}>
              <p style={{
                fontSize: 13, color: '#666', margin: '0 0 12px',
                fontFamily: FONT, fontWeight: 500, lineHeight: 1.5,
              }}>
                Pas encore de debrief pour cet entretien.<br />
                Tu peux le remplir maintenant pour garder une trace de ce qui s&apos;est dit.
              </p>
              <button
                onClick={onAdd}
                style={{
                  background: '#111', color: '#F5C400', fontSize: 13,
                  fontWeight: 800, padding: '10px 20px', borderRadius: 9,
                  border: 'none', cursor: 'pointer', fontFamily: FONT,
                  boxShadow: '2px 2px 0 #F5C400',
                }}
              >
                + Créer le debrief
              </button>
            </div>
          ) : (
            <>
              {[
                {
                  field: 'content', label: 'Déroulement & impressions',
                  placeholder: "Comment s'est passé l'échange ?", minHeight: 76,
                },
                {
                  field: 'questions_answers', label: "Questions-réponses de l'entretien",
                  placeholder: "Ce qui a été abordé et ce que j'ai répondu…", minHeight: 90,
                },
                {
                  field: 'next_step', label: 'Prochaine étape annoncée',
                  placeholder: 'Suite du process, délai, contact…', minHeight: 52,
                },
              ].map(({ field, label, placeholder, minHeight }) => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <label style={fieldLabel}>{label}</label>
                  <textarea
                    key={`${currentExchange.id}-${field}`}
                    defaultValue={(currentExchange as any)[field] ?? ''}
                    placeholder={placeholder}
                    onBlur={e => onUpdate(currentExchange.id, field, e.target.value)}
                    style={{ ...ta, minHeight }}
                    onFocus={e => { e.target.style.borderColor = '#F5C400' }}
                  />
                </div>
              ))}
              <p style={{
                fontSize: 11, color: '#888', margin: '6px 0 0',
                fontFamily: FONT, lineHeight: 1.5, fontStyle: 'italic',
              }}>
                Ce debrief est également visible dans l&apos;Historique des échanges plus bas.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
