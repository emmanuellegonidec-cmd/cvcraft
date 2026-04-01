'use client'

import { useState } from 'react'
import { JobExchange, ExchangeType, EXCHANGE_TYPE_LABELS } from '@/lib/types'

const FONT = "'Montserrat', sans-serif"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  exchanges: JobExchange[]
  onAdd: () => void
  onUpdate: (id: string, field: string, value: string) => void
  onDelete: (id: string) => void
}

export default function JobExchanges({ exchanges, onAdd, onUpdate, onDelete }: Props) {
  const [openExchanges, setOpenExchanges] = useState<Set<string>>(() => {
    if (exchanges.length > 0) return new Set([exchanges[exchanges.length - 1].id])
    return new Set()
  })

  const toggle = (id: string) => {
    setOpenExchanges(prev => {
      const next = new Set(Array.from(prev))
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500 }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80, lineHeight: '1.6' }
  const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 14, display: 'block', fontFamily: FONT }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }}>
      <span style={sectionLabel}>Synthèse des échanges</span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exchanges.map((ex, idx) => {
          const isOpen = openExchanges.has(ex.id)
          const isLatest = idx === exchanges.length - 1
          return (
            <div key={ex.id} style={{ border: `1.5px solid ${isLatest ? '#F5C400' : '#EBEBEB'}`, borderRadius: 10, overflow: 'hidden' }}>
              <div onClick={() => toggle(ex.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isLatest ? '#FFFDE7' : '#F9F9F7', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', color: '#F5C400', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: FONT }}>{idx + 1}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: 0, fontFamily: FONT }}>{ex.title}</p>
                    <p style={{ fontSize: 11, color: '#888', margin: 0, fontFamily: FONT, fontWeight: 500 }}>{ex.step_label && `${ex.step_label} · `}{formatDate(ex.exchange_date)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ background: '#F5C400', color: '#111', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, fontFamily: FONT }}>{EXCHANGE_TYPE_LABELS[ex.exchange_type]}</span>
                  <span style={{ fontSize: 10, color: '#bbb', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: 14, borderTop: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10, marginBottom: 12 }}>
                    {[
                      { field: 'title', label: 'Titre', type: 'text', val: ex.title },
                      { field: 'exchange_type', label: 'Type', type: 'select', val: ex.exchange_type },
                      { field: 'exchange_date', label: 'Date', type: 'date', val: ex.exchange_date },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={{ ...sectionLabel, marginBottom: 5 }}>{f.label}</label>
                        {f.type === 'select' ? (
                          <select defaultValue={f.val} onChange={e => onUpdate(ex.id, f.field, e.target.value)} style={{ ...inp, background: '#fff' }}>
                            {(Object.entries(EXCHANGE_TYPE_LABELS) as [ExchangeType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} defaultValue={f.val} style={inp}
                            onFocus={e => { e.target.style.borderColor = '#F5C400' }}
                            onBlur={e => { e.target.style.borderColor = '#eee'; onUpdate(ex.id, f.field, e.target.value) }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {[
                    { field: 'content', label: 'Déroulement & impressions', placeholder: "Comment s'est passé l'échange ?" },
                    { field: 'questions', label: 'Questions posées', placeholder: 'Ce qui a été abordé...' },
                    { field: 'answers', label: 'Mes réponses & points à améliorer', placeholder: "Ce que j'ai bien dit, ce que je reformulerais..." },
                    { field: 'next_step', label: 'Prochaine étape annoncée', placeholder: 'Suite du process, délai, contact...' },
                  ].map(({ field, label, placeholder }) => (
                    <div key={field} style={{ marginBottom: 10 }}>
                      <label style={{ ...sectionLabel, marginBottom: 5 }}>{label}</label>
                      <textarea defaultValue={(ex as any)[field] ?? ''} placeholder={placeholder}
                        onBlur={e => onUpdate(ex.id, field, e.target.value)}
                        style={{ ...ta, minHeight: field === 'next_step' ? 52 : 76 }}
                        onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
                    </div>
                  ))}

                  <button onClick={() => onDelete(ex.id)}
                    style={{ background: 'none', border: 'none', color: '#E8151B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, padding: 0, marginTop: 4 }}>
                    Supprimer cet échange
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={onAdd}
        style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', background: '#F9F9F7', border: '1.5px dashed #ddd', color: '#888', fontSize: 13, fontWeight: 700, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', marginTop: 8, fontFamily: FONT }}
        onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = '#F5C400'; el.style.color = '#111'; el.style.background = '#FFFDE7' }}
        onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = '#ddd'; el.style.color = '#888'; el.style.background = '#F9F9F7' }}>
        <span style={{ width: 19, height: 19, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>+</span>
        Ajouter un échange
      </button>
    </div>
  )
}
