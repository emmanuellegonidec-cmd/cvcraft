'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JobExchange, ExchangeType, EXCHANGE_TYPE_LABELS } from '@/lib/types'

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface Job {
  id: string
  title: string
  company: string
  location: string
  job_type: string
  status: string
  sub_status: string
  description: string
  notes: string
  source_url: string
  cv_sent: boolean
  cover_letter_sent: boolean
  cv_url: string | null
  cover_letter_url: string | null
  interview_summary: string
  ats_score: number | null
  ats_keywords: { present: string[]; missing: string[] } | null
  created_at: string
}

// ─── Config étapes ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'to_apply',           label: 'Envie de postuler',        num: 1 },
  { id: 'applied',            label: 'Postulé',                  num: 2 },
  { id: 'phone_interview',    label: 'Entretien téléphonique',   num: 3 },
  { id: 'hr_interview',       label: 'Entretien RH',             num: 4 },
  { id: 'manager_interview',  label: 'Entretien manager',        num: 5 },
  { id: 'offer',              label: 'Offre reçue',              num: 6 },
]

interface StepAction {
  icon: string
  title: string
  sub: string
  type: 'included' | 'action' | 'new'
}

const STEP_ACTIONS: Record<string, { desc: string; actions: StepAction[] }> = {
  to_apply: {
    desc: "Vous avez repéré cette offre. Vérifiez votre compatibilité et préparez vos documents avant de postuler.",
    actions: [
      { icon: '🎯', title: 'Vérifier le score ATS', sub: 'Compatibilité CV / offre', type: 'action' },
      { icon: '📄', title: 'Préparer mon CV', sub: 'Adapter à ce poste', type: 'action' },
      { icon: '✉️', title: 'Rédiger ma LM', sub: 'Personnalisée pour cette offre', type: 'action' },
      { icon: '🔍', title: "Rechercher l'entreprise", sub: 'Actualités, culture, équipe', type: 'action' },
      { icon: '📅', title: 'Fixer une deadline', sub: 'Date limite de candidature', type: 'action' },
    ],
  },
  applied: {
    desc: "Votre dossier est envoyé. Gardez une trace de ce que vous avez transmis et programmez une relance.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Envoyé à cette étape', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Envoyée à cette étape', type: 'included' },
      { icon: '🔔', title: 'Programmer une relance', sub: 'Dans 7 à 10 jours', type: 'action' },
      { icon: '📋', title: 'Confirmer la réception', sub: 'Email de confirmation reçu ?', type: 'action' },
    ],
  },
  phone_interview: {
    desc: "Préparez un pitch de 2 minutes et vos questions. CV et LM sont déjà transmis — inutile de les renvoyer.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '🎯', title: 'Préparer mon pitch', sub: '2 min chrono', type: 'action' },
      { icon: '❓', title: 'Mes questions', sub: 'À poser au recruteur', type: 'action' },
      { icon: '📅', title: 'Ajouter un rappel', sub: "Date & heure de l'appel", type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  hr_interview: {
    desc: "L'entretien RH explore votre personnalité et vos motivations. Préparez des exemples concrets avec la méthode STAR.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '🧠', title: 'Méthode STAR', sub: 'Préparer mes exemples', type: 'new' },
      { icon: '💬', title: 'Questions RH types', sub: 'Points forts, faiblesse...', type: 'new' },
      { icon: '🏢', title: "Connaître l'entreprise", sub: 'Valeurs, actualités, équipe', type: 'action' },
      { icon: '❓', title: 'Mes questions RH', sub: 'Culture, équipe, mobilité', type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  manager_interview: {
    desc: "L'entretien manager est plus technique. Montrez votre expertise métier et votre compréhension des enjeux du poste.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '📊', title: 'Portfolio / cas pratique', sub: 'Exemples chiffrés', type: 'new' },
      { icon: '🔬', title: 'Analyse du poste', sub: 'Enjeux, priorités, KPIs', type: 'new' },
      { icon: '👥', title: 'Références professionnelles', sub: 'Prévenir ses contacts', type: 'new' },
      { icon: '❓', title: 'Mes questions manager', sub: 'Équipe, objectifs, style', type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  offer: {
    desc: "Félicitations ! Prenez le temps d'analyser l'offre avant de répondre. Négociez si nécessaire.",
    actions: [
      { icon: '📑', title: 'Analyser le contrat', sub: 'Salaire, avantages, conditions', type: 'new' },
      { icon: '⚖️', title: 'Comparer les offres', sub: 'Si vous avez plusieurs pistes', type: 'new' },
      { icon: '💰', title: 'Négocier le salaire', sub: 'Conseils & arguments', type: 'new' },
      { icon: '📅', title: 'Date de prise de poste', sub: 'Préavis, disponibilité', type: 'action' },
      { icon: '✅', title: "Accepter l'offre", sub: 'Confirmer par écrit', type: 'action' },
      { icon: '❌', title: 'Refuser poliment', sub: 'Garder le contact', type: 'action' },
    ],
  },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getToken(): string | null {
  if (typeof window !== 'undefined') return (window as any).__jfmj_token ?? null
  return null
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [exchanges, setExchanges] = useState<JobExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [openExchanges, setOpenExchanges] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const notesTimer = useRef<NodeJS.Timeout | null>(null)

  // ── Chargement ─────────────────────────────────────────────────────────────

  const loadJob = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single()
    if (data) {
      setJob(data)
      setNotes(data.notes ?? '')
    }
  }, [jobId])

  const loadExchanges = useCallback(async () => {
    const res = await fetch(`/api/jobs/exchanges?job_id=${jobId}`, { headers: authHeaders() })
    if (res.ok) {
      const data: JobExchange[] = await res.json()
      setExchanges(data)
      // Ouvrir le dernier échange par défaut
      if (data.length > 0) setOpenExchanges(new Set([data[data.length - 1].id]))
    }
  }, [jobId])

  useEffect(() => {
    Promise.all([loadJob(), loadExchanges()]).finally(() => setLoading(false))
  }, [loadJob, loadExchanges])

  // ── Notes (autosave) ───────────────────────────────────────────────────────

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      await fetch(`/api/jobs?id=${jobId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ notes: val }),
      })
    }, 800)
  }

  // ── Étape du parcours ──────────────────────────────────────────────────────

  const currentStepId = job?.sub_status || job?.status || 'to_apply'
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStepId)

  const handleStepClick = async (stepId: string) => {
    if (!job) return
    const isGlobalStatus = ['to_apply', 'applied', 'offer'].includes(stepId)
    const patch: Record<string, string> = {
      sub_status: stepId,
      status: isGlobalStatus ? stepId : 'in_progress',
    }
    await fetch(`/api/jobs?id=${jobId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(patch),
    })
    setJob(prev => prev ? { ...prev, ...patch } : prev)
  }

  // ── Échanges ───────────────────────────────────────────────────────────────

  const toggleExchange = (id: string) => {
    setOpenExchanges(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addExchange = async () => {
    const step = STEPS.find(s => s.id === currentStepId)
    const res = await fetch('/api/jobs/exchanges', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        job_id: jobId,
        title: 'Nouvel échange',
        exchange_type: 'autre',
        exchange_date: new Date().toISOString().split('T')[0],
        step_label: step?.label ?? null,
      }),
    })
    if (res.ok) {
      const newEx: JobExchange = await res.json()
      setExchanges(prev => [...prev, newEx])
      setOpenExchanges(prev => new Set([...prev, newEx.id]))
    }
  }

  const updateExchange = async (id: string, field: string, value: string) => {
    setExchanges(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    await fetch(`/api/jobs/exchanges?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ [field]: value }),
    })
  }

  const deleteExchange = async (id: string) => {
    if (!confirm('Supprimer cet échange ?')) return
    await fetch(`/api/jobs/exchanges?id=${id}`, { method: 'DELETE', headers: authHeaders() })
    setExchanges(prev => prev.filter(e => e.id !== id))
  }

  // ── Documents (URL signée) ─────────────────────────────────────────────────

  const viewDocument = async (type: 'cv' | 'lm') => {
    const url = type === 'cv' ? job?.cv_url : job?.cover_letter_url
    if (url) window.open(url, '_blank')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', color: '#999' }}>Chargement…</p>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', color: '#E8151B' }}>Offre introuvable.</p>
    </div>
  )

  const stepData = STEP_ACTIONS[currentStepId] || STEP_ACTIONS['phone_interview']
  const atsScore = job.ats_score ?? null
  const atsKw = job.ats_keywords ?? { present: [], missing: [] }

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 64px' }}>

        {/* ── HEADER ── */}
        <div style={{
          background: '#111111', borderRadius: 16, padding: '24px 28px',
          marginBottom: 20, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 20,
          border: '2px solid #111111', boxShadow: '3px 3px 0 #E8151B',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#F5C400', fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 12, padding: 0 }}>
                ← Mes candidatures
              </button>
              {' / '}
              <span style={{ color: '#888' }}>{job.company}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 12 }}>
              {job.title}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#F5C400', color: '#111', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                {job.job_type || 'CDI'}
              </span>
              {job.location && (
                <span style={{ background: '#222', color: '#ccc', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333' }}>
                  📍 {job.location}
                </span>
              )}
              <span style={{ background: '#222', color: '#ccc', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333' }}>
                {formatDate(job.created_at)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {job.source_url && (
              <button
                onClick={() => window.open(job.source_url, '_blank')}
                style={{ background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxShadow: '2px 2px 0 #fff', whiteSpace: 'nowrap' }}
              >
                Voir l'offre ↗
              </button>
            )}
            <button
              onClick={() => router.push(`/dashboard/editor?job_id=${jobId}`)}
              style={{ background: '#F5C400', color: '#111', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: '2px solid #111', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxShadow: '2px 2px 0 #111', whiteSpace: 'nowrap' }}
            >
              ✏️ Générer un CV
            </button>
          </div>
        </div>

        {/* ── SCORE ATS ── */}
        {(atsScore !== null || (atsKw.present.length > 0 || atsKw.missing.length > 0)) && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 24,
            border: '2px solid #F5C400', boxShadow: '3px 3px 0 #F5C400',
          }}>
            {atsScore !== null && (
              <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F0F0F0" strokeWidth="7"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F5C400" strokeWidth="7"
                    strokeDasharray="201"
                    strokeDashoffset={201 - (201 * atsScore / 100)}
                    strokeLinecap="round"/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1 }}>{atsScore}</span>
                  <small style={{ fontSize: 10, color: '#999', fontWeight: 700 }}>/100</small>
                </div>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 4 }}>Score ATS — Compatibilité avec l'offre</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 10 }}>
                {atsScore !== null && atsScore >= 70
                  ? 'Bonne compatibilité globale. Quelques mots-clés à ajouter pour optimiser.'
                  : 'Des mots-clés importants manquent dans votre CV. Pensez à les intégrer.'}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {atsKw.present.map(k => (
                  <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#E8F5E9', color: '#2E7D32' }}>{k} ✓</span>
                ))}
                {atsKw.missing.map(k => (
                  <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FFEBEE', color: '#C62828' }}>{k} ✗</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PARCOURS DE CANDIDATURE ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 20 }}>
            Parcours de candidature
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex
              const isActive = step.id === currentStepId
              return (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 85, position: 'relative', cursor: 'pointer' }}
                >
                  {/* Ligne de connexion */}
                  {idx < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 20, left: 'calc(50% + 20px)', right: 'calc(-50% + 20px)',
                      height: 3, background: isDone ? '#F5C400' : '#E5E5E5', zIndex: 0,
                    }}/>
                  )}
                  {/* Cercle */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900, position: 'relative', zIndex: 1, flexShrink: 0,
                    background: isActive ? '#111' : isDone ? '#F5C400' : '#fff',
                    border: `3px solid ${isActive ? '#111' : isDone ? '#F5C400' : '#E5E5E5'}`,
                    color: isActive ? '#F5C400' : isDone ? '#111' : '#ccc',
                    boxShadow: isActive ? '0 0 0 4px rgba(245,196,0,0.2)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {step.num}
                  </div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, textAlign: 'center', marginTop: 8, lineHeight: 1.3,
                    color: isActive ? '#111' : isDone ? '#888' : '#ccc',
                  }}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#F5F5F0', border: '2px dashed #ddd', color: '#999',
              fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10,
              cursor: 'pointer', marginTop: 18, fontFamily: 'Montserrat, sans-serif',
            }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#F5C400'; (e.currentTarget as HTMLElement).style.color = '#111' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ddd'; (e.currentTarget as HTMLElement).style.color = '#999' }}
          >
            <span style={{ width: 18, height: 18, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff' }}>+</span>
            Ajouter une étape personnalisée
          </button>
        </div>

        {/* ── BLOC ÉTAPE ACTIVE ── */}
        {stepData && (
          <div style={{
            background: '#FFFDE7', borderRadius: 16, padding: '22px 24px', marginBottom: 20,
            border: '2px solid #F5C400', boxShadow: '3px 3px 0 #F5C400',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ background: '#111', color: '#F5C400', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
                Étape {currentStepIndex + 1} — En cours
              </span>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#111' }}>
                {STEPS.find(s => s.id === currentStepId)?.label}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>{stepData.desc}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
              {stepData.actions.map((action, i) => (
                <div
                  key={i}
                  style={{
                    background: action.type === 'included' ? '#F1F8E9' : '#fff',
                    border: `1.5px solid ${action.type === 'included' ? '#C8E6C9' : action.type === 'new' ? '#FFCDD2' : '#E5E5E5'}`,
                    borderRadius: 12, padding: '14px 16px', cursor: action.type === 'included' ? 'default' : 'pointer',
                    transition: 'border 0.15s',
                  }}
                  onMouseOver={e => { if (action.type !== 'included') (e.currentTarget as HTMLElement).style.borderColor = '#111' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = action.type === 'included' ? '#C8E6C9' : action.type === 'new' ? '#FFCDD2' : '#E5E5E5' }}
                >
                  <span style={{ fontSize: 18, display: 'block', marginBottom: 6 }}>{action.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: action.type === 'included' ? '#2E7D32' : '#111', display: 'block' }}>
                    {action.title}
                    {action.type === 'included' && (
                      <span style={{ background: '#2E7D32', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, marginLeft: 4 }}>✓</span>
                    )}
                    {action.type === 'new' && (
                      <span style={{ background: '#E8151B', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, marginLeft: 4 }}>Nouveau</span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: '#999', marginTop: 2, display: 'block' }}>{action.sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SYNTHÈSE DES ÉCHANGES ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 16 }}>
            Synthèse des échanges
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {exchanges.map((ex, idx) => {
              const isOpen = openExchanges.has(ex.id)
              const isLatest = idx === exchanges.length - 1
              return (
                <div key={ex.id} style={{
                  border: `1.5px solid ${isLatest ? '#F5C400' : '#EBEBEB'}`,
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  {/* Header échange */}
                  <div
                    onClick={() => toggleExchange(ex.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: isLatest ? '#FFFDE7' : '#F8F8F6',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: '#111',
                        color: '#F5C400', fontSize: 12, fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: 0 }}>{ex.title}</p>
                        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
                          {ex.step_label && `${ex.step_label} · `}{formatDate(ex.exchange_date)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#F5C400', color: '#111', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        {EXCHANGE_TYPE_LABELS[ex.exchange_type]}
                      </span>
                      <span style={{ fontSize: 11, color: '#bbb', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </div>
                  </div>

                  {/* Corps échange */}
                  {isOpen && (
                    <div style={{ padding: 16, borderTop: '1px solid #F0F0F0' }}>
                      {/* Champs titre + type + date */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#bbb', display: 'block', marginBottom: 4 }}>Titre</label>
                          <input
                            defaultValue={ex.title}
                            onBlur={e => updateExchange(ex.id, 'title', e.target.value)}
                            style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'Montserrat, sans-serif', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#bbb', display: 'block', marginBottom: 4 }}>Type</label>
                          <select
                            value={ex.exchange_type}
                            onChange={e => updateExchange(ex.id, 'exchange_type', e.target.value)}
                            style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'Montserrat, sans-serif', outline: 'none', background: '#fff' }}
                          >
                            {(Object.entries(EXCHANGE_TYPE_LABELS) as [ExchangeType, string][]).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#bbb', display: 'block', marginBottom: 4 }}>Date</label>
                          <input
                            type="date"
                            defaultValue={ex.exchange_date}
                            onBlur={e => updateExchange(ex.id, 'exchange_date', e.target.value)}
                            style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'Montserrat, sans-serif', outline: 'none' }}
                          />
                        </div>
                      </div>

                      {[
                        { field: 'content', label: 'Déroulement & impressions', placeholder: 'Comment s'est passé l'échange ? Ambiance, durée, interlocuteur...' },
                        { field: 'questions', label: 'Questions posées', placeholder: 'Ce qui a été abordé, les questions difficiles...' },
                        { field: 'answers', label: 'Mes réponses & points à améliorer', placeholder: 'Ce que j'ai bien dit, ce que je reformulerais...' },
                        { field: 'next_step', label: 'Prochaine étape annoncée', placeholder: 'Suite du process, délai, contact...' },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field} style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#bbb', display: 'block', marginBottom: 6 }}>{label}</label>
                          <textarea
                            defaultValue={(ex as any)[field] ?? ''}
                            placeholder={placeholder}
                            onBlur={e => updateExchange(ex.id, field, e.target.value)}
                            style={{
                              width: '100%', border: '1.5px solid #eee', borderRadius: 10,
                              padding: '10px 12px', fontSize: 13, color: '#333',
                              resize: 'vertical', minHeight: field === 'next_step' ? 56 : 80,
                              fontFamily: 'Montserrat, sans-serif', outline: 'none', background: '#fff',
                              boxSizing: 'border-box',
                            }}
                            onFocus={e => { e.target.style.borderColor = '#F5C400' }}
                            onBlurCapture={e => { (e.target as HTMLTextAreaElement).style.borderColor = '#eee' }}
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => deleteExchange(ex.id)}
                        style={{ background: 'none', border: 'none', color: '#E8151B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', padding: 0, marginTop: 4 }}
                      >
                        🗑 Supprimer cet échange
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bouton ajouter échange */}
          <button
            onClick={addExchange}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: '#F5F5F0', border: '2px dashed #ddd', color: '#999',
              fontSize: 13, fontWeight: 700, padding: '14px 20px', borderRadius: 12,
              cursor: 'pointer', marginTop: 12, fontFamily: 'Montserrat, sans-serif', transition: 'all 0.2s',
            }}
            onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#F5C400'; el.style.color = '#111'; el.style.background = '#FFFDE7' }}
            onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#ddd'; el.style.color = '#999'; el.style.background = '#F5F5F0' }}
          >
            <span style={{ width: 20, height: 20, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>+</span>
            Ajouter un échange
          </button>
        </div>

        {/* ── DOCUMENTS + NOTES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Documents */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 14 }}>Documents</p>
            {[
              { sent: job.cv_sent, name: 'CV', type: 'cv' as const, url: job.cv_url },
              { sent: job.cover_letter_sent, name: 'Lettre de motivation', type: 'lm' as const, url: job.cover_letter_url },
            ].map(doc => (
              <div key={doc.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 24, height: 24, background: doc.sent ? '#111' : '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {doc.sent && <svg viewBox="0 0 12 12" fill="none" width="12" height="12"><path d="M2 6l3 3 5-5" stroke="#F5C400" strokeWidth="2" strokeLinecap="round"/></svg>}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#333', margin: 0 }}>{doc.name}</p>
                    <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>{doc.sent ? 'Envoyé — étape Postulé' : 'Non envoyé'}</p>
                  </div>
                </div>
                {doc.url && (
                  <button
                    onClick={() => viewDocument(doc.type)}
                    style={{ background: '#F5F5F0', color: '#111', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Voir
                  </button>
                )}
              </div>
            ))}
            <div style={{ borderBottom: 'none' }} />
          </div>

          {/* Notes */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 14 }}>Mes notes</p>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Impressions générales, contacts, points à surveiller..."
              style={{
                width: '100%', border: '1.5px solid #eee', borderRadius: 10,
                padding: 12, fontSize: 13, color: '#333', resize: 'vertical',
                minHeight: 110, fontFamily: 'Montserrat, sans-serif', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }}
              onBlur={e => { e.target.style.borderColor = '#eee' }}
            />
          </div>
        </div>

        {/* ── DESCRIPTION DU POSTE ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '2px solid #111', boxShadow: '3px 3px 0 #111' }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 16 }}>
            Description du poste
          </p>
          <div style={{
            fontSize: 14, color: '#555', lineHeight: 1.8,
            maxHeight: descExpanded ? 'none' : 200,
            overflow: 'hidden', position: 'relative',
          }}>
            {job.description}
            {!descExpanded && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #fff)' }}/>
            )}
          </div>
          <button
            onClick={() => setDescExpanded(v => !v)}
            style={{
              background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800,
              border: 'none', borderRadius: 10, padding: '10px 20px',
              cursor: 'pointer', marginTop: 12, fontFamily: 'Montserrat, sans-serif',
              boxShadow: '2px 2px 0 #E8151B',
            }}
          >
            {descExpanded ? 'Réduire ↑' : 'Lire la description complète ↓'}
          </button>
        </div>

      </div>
    </div>
  )
}
