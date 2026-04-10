'use client'

import { useState, useEffect  } from 'react'

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
  onResultSaved: (result: ATSResult) => void
}

export default function ATSScoreModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  existingResult,
  onResultSaved,
}: ATSScoreModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
const [result, setResult] = useState<ATSResult | null>(existingResult)

useEffect(() => {
  setResult(existingResult)
}, [existingResult, isOpen])

  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('Lecture du CV...')

  if (!isOpen) return null

  const scoreColor = (score: number, max: number) => {
    const pct = score / max
    if (pct >= 0.75) return '#22a322'
    if (pct >= 0.5) return '#cc9900'
    return '#E8151B'
  }

  const handleAnalyse = async () => {
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
        throw new Error(data.error || 'Erreur lors de l\'analyse')
      }

      const data = await res.json()
      setResult(data.result)
      onResultSaved(data.result)
    } catch (err: any) {
      clearInterval(interval)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const scoreBarStyle = (score: number, max: number) => ({
    width: `${Math.round((score / max) * 100)}%`,
    background: scoreColor(score, max),
    height: '100%',
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          border: '2.5px solid #111',
          boxShadow: '6px 6px 0 #111',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '88vh',
          overflowY: 'auto',
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ background: '#111', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#F5C400', fontWeight: 800, fontSize: '13px', letterSpacing: '1.5px' }}>
            SCORE ATS
          </span>
          <span style={{ color: '#fff', fontSize: '12px', opacity: 0.7, flex: 1 }}>{jobTitle}</span>
          {result && (
            <span style={{ color: '#F5C400', fontWeight: 800, fontSize: '22px' }}>
              {result.score_global}/100
            </span>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', marginLeft: '8px' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* État : pas encore analysé */}
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px', lineHeight: 1.6 }}>
                Analysez votre CV par rapport à cette offre pour obtenir un score de compatibilité et des recommandations personnalisées.
              </p>
              {error && (
                <div style={{ background: '#fff5f5', border: '1.5px solid #E8151B', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#E8151B' }}>
                  {error}
                </div>
              )}
              <button
                onClick={handleAnalyse}
                style={{
                  background: '#F5C400',
                  border: '2px solid #111',
                  boxShadow: '3px 3px 0 #111',
                  padding: '10px 24px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Analyser mon CV pour ce poste →
              </button>
              <p style={{ fontSize: '11px', color: '#999', marginTop: '10px' }}>
                Utilise votre CV uploadé + la description du poste
              </p>
            </div>
          )}

          {/* État : chargement */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '14px' }}>{progressMsg}</p>
              <div style={{ background: '#e5e5e5', height: '10px', border: '1.5px solid #111', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#F5C400', transition: 'width 0.1s linear' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#999' }}>Analyse en cours...</p>
            </div>
          )}

          {/* État : résultat */}
          {result && !loading && (
            <>
              {/* Score global */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '2px solid #111' }}>
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1, color: scoreColor(result.score_global, 100) }}>
                    {result.score_global}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>/ 100</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: '#e5e5e5', height: '12px', border: '1.5px solid #111', marginBottom: '10px' }}>
                    <div style={{ height: '100%', width: `${result.score_global}%`, background: scoreColor(result.score_global, 100) }} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {result.erreurs.critiques.length === 0 && (
                      <span style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 700, border: '1.5px solid #111', background: '#d4f5d4' }}>✅ Aucun critique</span>
                    )}
                    {result.erreurs.critiques.length > 0 && (
                      <span style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 700, border: '1.5px solid #E8151B', background: '#ffd4d4' }}>
                        ❌ {result.erreurs.critiques.length} critique{result.erreurs.critiques.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {result.erreurs.majeures.length > 0 && (
                      <span style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 700, border: '1.5px solid #cc9900', background: '#fff9cc' }}>
                        ⚠️ {result.erreurs.majeures.length} majeure{result.erreurs.majeures.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sous-scores */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: '#888', marginBottom: '10px' }}>DÉTAIL DES SCORES</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Format fichier', val: result.scores.format, max: 15 },
                    { label: 'Lisibilité ATS', val: result.scores.lisibilite_ats, max: 15 },
                    { label: 'Expériences', val: result.scores.experiences, max: 30 },
                    { label: 'Compétences', val: result.scores.competences, max: 10 },
                    { label: 'Structure', val: result.scores.structure, max: 10 },
                    { label: 'Matching métier', val: result.scores.matching, max: 10 },
                  ].map((s) => (
                    <div key={s.label} style={{ border: '1.5px solid #111', padding: '8px 10px', background: '#fafafa' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>{s.label}</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: scoreColor(s.val, s.max), marginBottom: '4px' }}>
                        {s.val}<span style={{ fontSize: '10px', fontWeight: 400, color: '#999' }}>/{s.max}</span>
                      </div>
                      <div style={{ background: '#e5e5e5', height: '6px', border: '1px solid #ccc' }}>
                        <div style={scoreBarStyle(s.val, s.max)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points forts / faibles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div style={{ border: '1.5px solid #111', padding: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#22a322', marginBottom: '8px', letterSpacing: '1px' }}>POINTS FORTS</div>
                  {result.analyse_contenu.points_forts.map((p, i) => (
                    <div key={i} style={{ fontSize: '11px', display: 'flex', gap: '6px', marginBottom: '5px' }}>
                      <span>✅</span><span>{p}</span>
                    </div>
                  ))}
                </div>
                <div style={{ border: '1.5px solid #111', padding: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#E8151B', marginBottom: '8px', letterSpacing: '1px' }}>POINTS FAIBLES</div>
                  {result.analyse_contenu.points_faibles.map((p, i) => (
                    <div key={i} style={{ fontSize: '11px', display: 'flex', gap: '6px', marginBottom: '5px' }}>
                      <span>⚠️</span><span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommandations */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: '#888', marginBottom: '10px' }}>RECOMMANDATIONS</div>
                {result.erreurs.critiques.map((r, i) => (
                  <div key={`c-${i}`} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', border: '1.5px solid #E8151B', background: '#fff5f5', marginBottom: '6px' }}>
                    <span style={{ padding: '1px 6px', fontSize: '10px', fontWeight: 700, border: '1.5px solid #E8151B', background: '#E8151B', color: '#fff', flexShrink: 0 }}>CRITIQUE</span>
                    <span style={{ fontSize: '11px' }}>{r}</span>
                  </div>
                ))}
                {result.erreurs.majeures.map((r, i) => (
                  <div key={`m-${i}`} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', border: '1.5px solid #cc9900', background: '#fffae0', marginBottom: '6px' }}>
                    <span style={{ padding: '1px 6px', fontSize: '10px', fontWeight: 700, border: '1.5px solid #111', background: '#F5C400', color: '#111', flexShrink: 0 }}>MAJEURE</span>
                    <span style={{ fontSize: '11px' }}>{r}</span>
                  </div>
                ))}
                {result.erreurs.mineures.map((r, i) => (
                  <div key={`mn-${i}`} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', border: '1.5px solid #bbb', background: '#f9f9f9', marginBottom: '6px' }}>
                    <span style={{ padding: '1px 6px', fontSize: '10px', fontWeight: 700, border: '1.5px solid #bbb', background: '#eee', flexShrink: 0 }}>MINEURE</span>
                    <span style={{ fontSize: '11px' }}>{r}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAnalyse}
                  style={{
                    flex: 1,
                    background: '#f5f5f5',
                    border: '1.5px solid #111',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ↩ Ré-analyser
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    background: '#111',
                    color: '#F5C400',
                    border: '2px solid #111',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
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
