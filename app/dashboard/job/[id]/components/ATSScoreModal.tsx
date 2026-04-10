'use client'

import { useState, useEffect } from 'react'

interface ATSResult {
  score_global: number
  scores: {
    format: number
    lisibilite_ats: number
    infos_obligatoires: number
    structure: number
    experiences: number
    competences: number
    matching: number
  }
  analyse_contenu: {
    points_forts: string[]
    points_faibles: string[]
  }
  erreurs: {
    critiques: string[]
    majeures: string[]
    mineures: string[]
  }
  recommandations: string[]
}

interface ATSScoreModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  existingResult: ATSResult | null
  analysisCount: number
  onResultSaved: (result: ATSResult, newCount: number) => void
}

const MAX_ANALYSES = 3
const FONT = "'Montserrat', sans-serif"

export default function ATSScoreModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  existingResult,
  analysisCount,
  onResultSaved,
}: ATSScoreModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ATSResult | null>(existingResult)
  const [count, setCount] = useState(analysisCount)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('Lecture du CV...')

  useEffect(() => {
    setResult(existingResult)
    setCount(analysisCount)
  }, [existingResult, analysisCount, isOpen])

  if (!isOpen) return null

  const scoreColor = (score: number, max: number) => {
    const pct = score / max
    if (pct >= 0.75) return '#22a322'
    if (pct >= 0.5) return '#cc9900'
    return '#E8151B'
  }

  const circleCircumference = 213.6
  const circleOffset = result
    ? circleCircumference - (result.score_global / 100) * circleCircumference
    : circleCircumference

  const globalLabel = (score: number) => {
    if (score >= 80) return 'Excellent niveau de compatibilité'
    if (score >= 65) return 'Bon niveau de compatibilité'
    if (score >= 50) return 'Niveau moyen — améliorations recommandées'
    return 'Niveau insuffisant — révision nécessaire'
  }

  const handleAnalyse = async () => {
    if (count >= MAX_ANALYSES) return
    setLoading(true)
    setError(null)
    setProgress(0)

    const messages = [
      'Lecture du CV...',
      "Analyse de l'offre...",
      'Calcul du score ATS...',
      'Génération des recommandations...',
    ]
    let msgIdx = 0
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 1.5, 90)
        if (next > msgIdx * 25 && msgIdx < messages.length) {
          setProgressMsg(messages[msgIdx])
          msgIdx++
        }
        return next
      })
    }, 80)

    try {
      const token = (window as any).__jfmj_token
      const res = await fetch(`/api/jobs/${jobId}/ats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      clearInterval(interval)
      setProgress(100)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'analyse")
      }

      const data = await res.json()
      const newCount = count + 1
      setResult(data.result)
      setCount(newCount)
      onResultSaved(data.result, newCount)
    } catch (err: any) {
      clearInterval(interval)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const subScores = result ? [
    { label: 'Format', val: result.scores.format, max: 15 },
    { label: 'Lisibilité', val: result.scores.lisibilite_ats, max: 15 },
    { label: 'Structure', val: result.scores.structure, max: 10 },
    { label: 'Expériences', val: result.scores.experiences, max: 30 },
    { label: 'Compétences', val: result.scores.competences, max: 10 },
    { label: 'Matching', val: result.scores.matching, max: 10 },
  ] : []

  const essaisRestants = MAX_ANALYSES - count

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#f5f5f3', border: '2.5px solid #111', boxShadow: '6px 6px 0 #111',
        width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto',
        fontFamily: FONT, borderRadius: 12,
      }}>

        {/* Header */}
        <div style={{ background: '#111', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: '9px 9px 0 0' }}>
          <span style={{ color: '#F5C400', fontWeight: 800, fontSize: 12, letterSpacing: '1.5px' }}>SCORE ATS</span>
          <span style={{ color: '#fff', fontSize: 12, opacity: 0.6, flex: 1 }}>{jobTitle}</span>
          {count > 0 && (
            <span style={{ color: essaisRestants > 0 ? '#aaa' : '#E8151B', fontSize: 10, fontWeight: 700 }}>
              {essaisRestants > 0 ? `${essaisRestants} essai${essaisRestants > 1 ? 's' : ''} restant${essaisRestants > 1 ? 's' : ''}` : 'Limite atteinte'}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', marginLeft: 8 }}>✕</button>
        </div>

        <div style={{ padding: '16px' }}>

          {/* État vide */}
          {!result && !loading && (
            <div style={{ background: '#fff', borderRadius: 10, padding: '24px 20px', textAlign: 'center', border: '0.5px solid #e0e0e0' }}>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
                Analysez votre CV par rapport à cette offre pour obtenir un score de compatibilité et des recommandations personnalisées.
              </p>
              {error && (
                <div style={{ background: '#fff5f5', border: '1.5px solid #E8151B', padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#E8151B', borderRadius: 6 }}>
                  {error}
                </div>
              )}
              <button onClick={handleAnalyse} style={{
                background: '#F5C400', border: '2px solid #111', boxShadow: '3px 3px 0 #111',
                padding: '10px 24px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT, borderRadius: 8,
              }}>
                Analyser mon CV pour ce poste →
              </button>
              <p style={{ fontSize: 11, color: '#999', marginTop: 10 }}>Utilise votre CV uploadé + la description du poste</p>
            </div>
          )}

          {/* Chargement */}
          {loading && (
            <div style={{ background: '#fff', borderRadius: 10, padding: '24px 20px', textAlign: 'center', border: '0.5px solid #e0e0e0' }}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>{progressMsg}</p>
              <div style={{ background: '#e5e5e5', height: 8, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#F5C400', borderRadius: 4, transition: 'width 0.1s linear' }} />
              </div>
              <p style={{ fontSize: 11, color: '#999' }}>Analyse en cours...</p>
            </div>
          )}

          {/* Résultat */}
          {result && !loading && (
            <>
              {/* Score global avec cercle */}
              <div style={{ background: '#111', borderRadius: 10, padding: '18px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
                  <svg viewBox="0 0 80 80" style={{ width: 84, height: 84, transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#333" strokeWidth="8" />
                    <circle cx="40" cy="40" r="34" fill="none"
                      stroke={scoreColor(result.score_global, 100)}
                      strokeWidth="8"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={circleOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: scoreColor(result.score_global, 100), lineHeight: 1 }}>{result.score_global}</span>
                    <span style={{ fontSize: 9, color: '#888', fontWeight: 600 }}>/100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#F5C400', fontWeight: 800, letterSpacing: '1.5px', marginBottom: 4 }}>SCORE ATS</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{globalLabel(result.score_global)}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {result.erreurs.critiques.length > 0 && (
                      <span style={{ background: '#E8151B', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        {result.erreurs.critiques.length} critique{result.erreurs.critiques.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {result.erreurs.majeures.length > 0 && (
                      <span style={{ background: '#cc9900', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        {result.erreurs.majeures.length} majeure{result.erreurs.majeures.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {result.erreurs.mineures.length > 0 && (
                      <span style={{ background: '#555', color: '#aaa', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        {result.erreurs.mineures.length} mineure{result.erreurs.mineures.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {result.erreurs.critiques.length === 0 && result.erreurs.majeures.length === 0 && (
                      <span style={{ background: '#22a322', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Aucun problème critique</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sous-scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
                {subScores.map((s) => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '0.5px solid #e0e0e0' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#999', letterSpacing: '1px', marginBottom: 5, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(s.val, s.max), marginBottom: 5 }}>
                      {s.val}<span style={{ fontSize: 10, fontWeight: 400, color: '#aaa' }}>/{s.max}</span>
                    </div>
                    <div style={{ background: '#e8e8e8', height: 5, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((s.val / s.max) * 100)}%`, background: scoreColor(s.val, s.max), borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Points forts / faibles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#f0faf0', borderRadius: 8, padding: 12, border: '0.5px solid #a5d6a7' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#2E7D32', letterSpacing: '1px', marginBottom: 8 }}>POINTS FORTS</div>
                  {result.analyse_contenu.points_forts.map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#2E7D32', display: 'flex', gap: 6, marginBottom: 4, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 800, flexShrink: 0 }}>+</span><span>{p}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff5f5', borderRadius: 8, padding: 12, border: '0.5px solid #ffcdd2' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#c62828', letterSpacing: '1px', marginBottom: 8 }}>POINTS FAIBLES</div>
                  {result.analyse_contenu.points_faibles.map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#c62828', display: 'flex', gap: 6, marginBottom: 4, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 800, flexShrink: 0 }}>-</span><span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommandations */}
              <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '0.5px solid #e0e0e0', marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#999', letterSpacing: '1.5px', marginBottom: 10 }}>RECOMMANDATIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.erreurs.critiques.map((r, i) => (
                    <div key={`c-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: '#fff5f5', borderLeft: '3px solid #E8151B', borderRadius: '0 6px 6px 0' }}>
                      <span style={{ background: '#E8151B', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1 }}>CRITIQUE</span>
                      <span style={{ fontSize: 11, lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                  {result.erreurs.majeures.map((r, i) => (
                    <div key={`m-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: '#fffae0', borderLeft: '3px solid #F5C400', borderRadius: '0 6px 6px 0' }}>
                      <span style={{ background: '#F5C400', color: '#111', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1 }}>MAJEURE</span>
                      <span style={{ fontSize: 11, lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                  {result.erreurs.mineures.map((r, i) => (
                    <div key={`mn-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: '#f5f5f5', borderLeft: '3px solid #bbb', borderRadius: '0 6px 6px 0' }}>
                      <span style={{ background: '#ddd', color: '#555', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1 }}>MINEURE</span>
                      <span style={{ fontSize: 11, lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                {essaisRestants > 0 ? (
                  <button onClick={handleAnalyse} style={{
                    flex: 1, background: '#fff', border: '1.5px solid #111',
                    padding: 9, fontSize: 11, fontWeight: 800,
                    cursor: 'pointer', fontFamily: FONT, borderRadius: 8,
                  }}>
                    Ré-analyser ({essaisRestants} restant{essaisRestants > 1 ? 's' : ''})
                  </button>
                ) : (
                  <div style={{
                    flex: 1, background: '#f5f5f5', border: '1.5px solid #ddd',
                    padding: 9, fontSize: 11, fontWeight: 700,
                    borderRadius: 8, textAlign: 'center', color: '#999',
                  }}>
                    Limite de 3 analyses atteinte
                  </div>
                )}
                <button onClick={onClose} style={{
                  flex: 1, background: '#111', color: '#F5C400',
                  border: '2px solid #111', padding: 9,
                  fontSize: 11, fontWeight: 800,
                  cursor: 'pointer', fontFamily: FONT, borderRadius: 8,
                }}>
                  Fermer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
