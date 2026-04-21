'use client'

import { JobExchange } from '@/lib/types'

const FONT = "'Montserrat', sans-serif"

interface Props {
  exchanges: JobExchange[]
  currentStepLabel: string
  onAdd: () => void
  onUpdate: (id: string, field: string, value: string) => void
}

/**
 * Bloc "Debrief de l'entretien" affiché dans la Phase 2.
 *
 * - Trouve l'échange le plus récent rattaché à l'étape en cours (step_label).
 * - Si aucun échange pour cette étape : affiche un CTA "+ Créer le debrief".
 * - Si un échange existe : affiche 3 textareas (déroulement, questions-réponses,
 *   prochaine étape) liés à cet échange. Les modifications sont persistées via
 *   onUpdate (même mécanisme que dans l'Historique des échanges).
 *
 * Le même échange reste visible dans "Historique des échanges" plus bas, avec
 * le surligné jaune du latest. Ce n'est pas un doublon : Phase 2 = vue action
 * focus sur l'étape en cours, Historique = vue journal cumulatif.
 */
export default function JobInterviewDebrief({
  exchanges, currentStepLabel, onAdd, onUpdate,
}: Props) {

  // Trouve le dernier échange rattaché à l'étape en cours.
  // Ordre : on parcourt depuis la fin (les plus récents ajoutés à la fin de l'array).
  const currentExchange = [...exchanges].reverse().find(
    ex => (ex as any).step_label === currentStepLabel
  )

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 14,
    border: '1.5px solid #EBEBEB',
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: '#555', display: 'block',
    marginBottom: 14, fontFamily: FONT,
  }

  const fieldLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#888', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em',
    fontFamily: FONT,
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1.5px solid #ddd',
    borderRadius: 7, fontSize: 13, fontWeight: 500, fontFamily: FONT,
    color: '#111', outline: 'none', background: '#fff',
    boxSizing: 'border-box' as const,
  }

  const ta: React.CSSProperties = {
    ...inp, resize: 'vertical', minHeight: 76, lineHeight: '1.6',
  }

  // ─── ÉTAT VIDE : aucun échange pour cette étape ─────────────────────────
  if (!currentExchange) {
    return (
      <div style={card}>
        <span style={sectionLabel}>🎙️ Debrief de l&apos;entretien</span>
        <div style={{
          background: '#F9F9F7',
          border: '1.5px dashed #ddd',
          borderRadius: 10,
          padding: '24px 20px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 13, color: '#888', margin: '0 0 14px',
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
      </div>
    )
  }

  // ─── ÉTAT REMPLI : affiche les 3 champs de l'échange ────────────────────
  const fields: { field: string; label: string; placeholder: string; minHeight: number }[] = [
    {
      field: 'content',
      label: 'Déroulement & impressions',
      placeholder: "Comment s'est passé l'échange ?",
      minHeight: 76,
    },
    {
      field: 'questions_answers',
      label: "Questions-réponses de l'entretien",
      placeholder: "Ce qui a été abordé et ce que j'ai répondu…",
      minHeight: 90,
    },
    {
      field: 'next_step',
      label: 'Prochaine étape annoncée',
      placeholder: 'Suite du process, délai, contact…',
      minHeight: 52,
    },
  ]

  return (
    <div style={card}>
      <span style={sectionLabel}>🎙️ Debrief de l&apos;entretien</span>
      {fields.map(({ field, label, placeholder, minHeight }) => (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ ...fieldLabel, marginBottom: 5 }}>{label}</label>
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
    </div>
  )
}
