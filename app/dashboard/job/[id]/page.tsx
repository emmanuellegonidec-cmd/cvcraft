'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { JobExchange, ExchangeType, EXCHANGE_TYPE_LABELS } from '@/lib/types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

interface Job {
  id: string; title: string; company: string; location: string; job_type: string
  status: string; sub_status: string; description: string; notes: string; source_url: string
  salary_text: string | null; salary_min: number | null; salary_max: number | null; currency: string | null
  cv_sent: boolean; cover_letter_sent: boolean; cv_url: string | null; cover_letter_url: string | null
  ats_score: number | null; ats_keywords: { present: string[]; missing: string[] } | null; created_at: string
}

const BASE_STEPS = [
  { id: 'to_apply',          label: 'Envie de postuler',      num: 1 },
  { id: 'applied',           label: 'Postulé',                num: 2 },
  { id: 'phone_interview',   label: 'Entretien téléphonique', num: 3 },
  { id: 'hr_interview',      label: 'Entretien RH',           num: 4 },
  { id: 'manager_interview', label: 'Entretien manager',      num: 5 },
  { id: 'offer',             label: 'Offre reçue',            num: 6 },
]

const STATUS_MAP: Record<string, string> = {
  to_apply: 'to_apply', applied: 'applied',
  phone_interview: 'in_progress', hr_interview: 'in_progress',
  manager_interview: 'in_progress', offer: 'offer',
}

interface StepAction { icon: string; title: string; sub: string; type: 'included' | 'action' | 'new' }

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
    desc: "Votre dossier est envoyé. Gardez une trace et programmez une relance.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Envoyé à cette étape', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Envoyée à cette étape', type: 'included' },
      { icon: '🔔', title: 'Programmer une relance', sub: 'Dans 7 à 10 jours', type: 'action' },
      { icon: '📏', title: 'Confirmer la réception', sub: 'Email de confirmation reçu ?', type: 'action' },
    ],
  },
  phone_interview: {
    desc: "Préparez un pitch de 2 minutes et vos questions. CV et LM sont déjà transmis.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '🎯', title: 'Préparer mon pitch', sub: '2 min chrono', type: 'action' },
      { icon: '⏰', title: 'Mes questions', sub: 'À poser au recruteur', type: 'action' },
      { icon: '📅', title: 'Ajouter un rappel', sub: "Date & heure de l'appel", type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  hr_interview: {
    desc: "L'entretien RH explore votre personnalité et vos motivations. Préparez des exemples avec la méthode STAR.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '⭐', title: 'Méthode STAR', sub: 'Préparer mes exemples', type: 'new' },
      { icon: '🧠', title: 'Questions RH types', sub: 'Points forts, faiblesse...', type: 'new' },
      { icon: '🏢', title: "Connaître l'entreprise", sub: 'Valeurs, actualités, équipe', type: 'action' },
      { icon: '⏰', title: 'Mes questions RH', sub: 'Culture, équipe, mobilité', type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  manager_interview: {
    desc: "L'entretien manager est plus technique. Montrez votre expertise métier et votre compréhension des enjeux.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '📊', title: 'Portfolio / cas pratique', sub: 'Exemples chiffrés', type: 'new' },
      { icon: '🔧', title: 'Analyse du poste', sub: 'Enjeux, priorités, KPIs', type: 'new' },
      { icon: '👤', title: 'Références professionnelles', sub: 'Prévenir ses contacts', type: 'new' },
      { icon: '⏰', title: 'Mes questions manager', sub: 'Équipe, objectifs, style', type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  offer: {
    desc: "Félicitations ! Prenez le temps d'analyser l'offre avant de répondre. Négociez si nécessaire.",
    actions: [
      { icon: '📋', title: 'Analyser le contrat', sub: 'Salaire, avantages, conditions', type: 'new' },
      { icon: '⚖️', title: 'Comparer les offres', sub: 'Si vous avez plusieurs pistes', type: 'new' },
      { icon: '💬', title: 'Négocier le salaire', sub: 'Conseils & arguments', type: 'new' },
      { icon: '📅', title: 'Date de prise de poste', sub: 'Préavis, disponibilité', type: 'action' },
      { icon: '✅', title: "Accepter l'offre", sub: 'Confirmer par écrit', type: 'action' },
      { icon: '❌', title: 'Refuser poliment', sub: 'Garder le contact', type: 'action' },
    ],
  },
}

const FONT = "'Montserrat', sans-serif"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function getToken(): string | null {
  if (typeof window !== 'undefined') return (window as any).__jfmj_token ?? null
  return null
}
function authHeaders(): HeadersInit {
  const token = getToken()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

// ─── Bulle d'étape draggable (étapes custom uniquement) ───────────────────────
function DraggableStep({
  step, isActive, isDone, isCustom, currentStepId,
  onStepClick, onDeleteRequest, allStepsLength,
}: {
  step: { id: string; label: string; num: number }
  isActive: boolean; isDone: boolean; isCustom: boolean
  currentStepId: string
  onStepClick: (id: string) => void
  onDeleteRequest: (id: string, label: string) => void
  allStepsLength: number
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: step.id,
    disabled: !isCustom,
    data: { stepId: step.id },
  })

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        flex: 1, minWidth: 80, position: 'relative',
        opacity: isDragging ? 0.4 : 1,
        transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
        zIndex: isDragging ? 50 : 1,
      }}
    >
      <div
        ref={isCustom ? setNodeRef : undefined}
        {...(isCustom ? { ...listeners, ...attributes } : {})}
        onClick={() => onStepClick(step.id)}
        title={isCustom ? 'Glisser pour réordonner' : undefined}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, position: 'relative', zIndex: 1,
          flexShrink: 0,
          cursor: isCustom ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          background: isActive ? '#111' : isDone ? '#F5C400' : '#fff',
          border: `3px solid ${isActive ? '#111' : isDone ? '#F5C400' : '#E5E5E5'}`,
          color: isActive ? '#F5C400' : isDone ? '#111' : '#ccc',
          boxShadow: isActive ? '0 0 0 4px rgba(245,196,0,.2)' : 'none',
          fontFamily: FONT,
          touchAction: 'none',
        }}
      >
        {step.num}
      </div>
      <p
        onClick={() => onStepClick(step.id)}
        style={{
          fontSize: 10, fontWeight: 700, textAlign: 'center', marginTop: 7,
          lineHeight: 1.3, color: isActive ? '#111' : isDone ? '#888' : '#ccc',
          fontFamily: FONT, cursor: 'pointer',
        }}
      >
        {step.label}
      </p>
      {isCustom && (
        <button
          onClick={e => { e.stopPropagation(); onDeleteRequest(step.id, step.label) }}
          title="Supprimer cette étape"
          style={{
            position: 'absolute', top: -6, right: 'calc(50% - 28px)',
            width: 16, height: 16, borderRadius: '50%',
            background: '#E8151B', border: 'none', color: '#fff',
            fontSize: 10, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2, lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

// ─── Zone de dépôt entre étapes ───────────────────────────────────────────────
function DropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        width: isOver ? 32 : 14,
        height: 36,
        borderRadius: 8,
        background: isOver ? '#F5C400' : 'transparent',
        border: isOver ? '2px dashed #111' : '2px dashed transparent',
        flexShrink: 0,
        transition: 'all .15s',
        alignSelf: 'center',
        marginBottom: 20,
      }}
    />
  )
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [exchanges, setExchanges] = useState<JobExchange[]>([])
  const [customSteps, setCustomSteps] = useState<{ id: string; label: string; position: number }[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [openExchanges, setOpenExchanges] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newStepName, setNewStepName] = useState('')
  const [newStepPos, setNewStepPos] = useState(5)
  const [stepToDelete, setStepToDelete] = useState<{ id: string; label: string } | null>(null)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [overDropZone, setOverDropZone] = useState<string | null>(null)
  const notesTimer = useRef<NodeJS.Timeout | null>(null)

  const loadJob = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) setUserId(session.user.id)
    const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single()
    if (data) { setJob(data); setNotes(data.notes ?? '') }
  }, [jobId])

  const loadCustomSteps = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('pipeline_stages').select('*').eq('job_id', jobId).order('position')
    if (data && data.length > 0) {
      setCustomSteps(data.map((s: any) => ({ id: s.id, label: s.label, position: s.position })))
    }
  }, [jobId])

  const loadExchanges = useCallback(async () => {
    const res = await fetch(`/api/jobs/exchanges?job_id=${jobId}`, { headers: authHeaders() })
    if (res.ok) {
      const data: JobExchange[] = await res.json()
      setExchanges(data)
      if (data.length > 0) {
        const s = new Set<string>(); s.add(data[data.length - 1].id); setOpenExchanges(s)
      }
    }
  }, [jobId])

  useEffect(() => {
    Promise.all([loadJob(), loadCustomSteps(), loadExchanges()]).finally(() => setLoading(false))
  }, [loadJob, loadCustomSteps, loadExchanges])

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      await fetch(`/api/jobs?id=${jobId}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ notes: val }),
      })
    }, 800)
  }

  const sortedCustom = [...customSteps].sort((a, b) => a.position - b.position)
  const allSteps = [
    ...BASE_STEPS.slice(0, 5),
    ...sortedCustom.map((cs, i) => ({ id: cs.id, label: cs.label, num: 6 + i })),
    { ...BASE_STEPS[5], num: 6 + customSteps.length },
  ]

  const currentStepId = job?.sub_status || job?.status || 'to_apply'
  const currentStepIndex = allSteps.findIndex(s => s.id === currentStepId)

  const handleStepClick = async (stepId: string) => {
    if (!job) return
    const globalStatus = STATUS_MAP[stepId] ?? 'in_progress'
    const patch = { sub_status: stepId, status: globalStatus }
    setJob(prev => prev ? { ...prev, ...patch } : prev)
    const res = await fetch(`/api/jobs?id=${jobId}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patch),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.job) setJob(data.job)
    }
  }

  const handleAddCustomStep = async () => {
    if (!newStepName.trim() || !userId) return
    const supabase = createClient()
    const position = (newStepPos + 1) * 1000 + (Date.now() % 100)
    const { data } = await supabase
      .from('pipeline_stages')
      .insert({ user_id: userId, job_id: jobId, label: newStepName.trim(), color: '#F5C400', position })
      .select().single()
    if (data) setCustomSteps(prev => [...prev, { id: data.id, label: data.label, position: data.position }])
    setNewStepName('')
    setNewStepPos(allSteps.length - 2)
    setShowModal(false)
  }

  const handleDeleteCustomStep = async (stepId: string) => {
    const supabase = createClient()
    await supabase.from('pipeline_stages').delete().eq('id', stepId)
    setCustomSteps(prev => prev.filter(s => s.id !== stepId))
    if (currentStepId === stepId) {
      const patch = { sub_status: 'manager_interview', status: 'in_progress' }
      await fetch(`/api/jobs?id=${jobId}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patch),
      })
      setJob(prev => prev ? { ...prev, ...patch } : prev)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleStepDragStart(event: DragStartEvent) {
    setActiveStepId(event.active.id as string)
  }

  function handleStepDragOver(event: any) {
    setOverDropZone(event.over?.id ?? null)
  }

  async function handleStepDragEnd(event: DragEndEvent) {
    setActiveStepId(null)
    setOverDropZone(null)
    const { active, over } = event
    if (!over) return

    const draggedId = active.id as string
    const dropZoneId = over.id as string

    const draggedStep = customSteps.find(s => s.id === draggedId)
    if (!draggedStep) return

    const match = dropZoneId.match(/^(after|before)-(.+)$/)
    if (!match) return
    const [, position, targetStepId] = match

    const sorted = [...customSteps].sort((a, b) => a.position - b.position)
    const targetStep = customSteps.find(s => s.id === targetStepId)
    if (!targetStep || draggedId === targetStepId) return

    const withoutDragged = sorted.filter(s => s.id !== draggedId)
    const targetIdx = withoutDragged.findIndex(s => s.id === targetStepId)
    const insertIdx = position === 'after' ? targetIdx + 1 : targetIdx
    const reordered = [
      ...withoutDragged.slice(0, insertIdx),
      draggedStep,
      ...withoutDragged.slice(insertIdx),
    ]

    const updated = reordered.map((s, i) => ({ ...s, position: (i + 1) * 1000 }))
    setCustomSteps(updated)

    const supabase = createClient()
    await Promise.all(
      updated.map(s =>
        supabase.from('pipeline_stages').update({ position: s.position }).eq('id', s.id)
      )
    )
  }

  const toggleExchange = (id: string) => {
    setOpenExchanges(prev => {
      const next = new Set(Array.from(prev))
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addExchange = async () => {
    const step = allSteps.find(s => s.id === currentStepId)
    const res = await fetch('/api/jobs/exchanges', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({
        job_id: jobId, title: 'Nouvel échange', exchange_type: 'autre',
        exchange_date: new Date().toISOString().split('T')[0],
        step_label: step?.label ?? null,
      }),
    })
    if (res.ok) {
      const newEx: JobExchange = await res.json()
      setExchanges(prev => [...prev, newEx])
      const s = new Set(Array.from(openExchanges)); s.add(newEx.id); setOpenExchanges(s)
    }
  }

  const updateExchange = async (id: string, field: string, value: string) => {
    setExchanges(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    await fetch(`/api/jobs/exchanges?id=${id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ [field]: value }),
    })
  }

  const deleteExchange = async (id: string) => {
    if (!confirm('Supprimer cet échange ?')) return
    await fetch(`/api/jobs/exchanges?id=${id}`, { method: 'DELETE', headers: authHeaders() })
    setExchanges(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}>
      <p style={{ color: '#999', fontWeight: 700 }}>Chargement…</p>
    </div>
  )
  if (!job) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}>
      <p style={{ color: '#E8151B', fontWeight: 700 }}>Offre introuvable.</p>
    </div>
  )

  const stepData = STEP_ACTIONS[currentStepId] || STEP_ACTIONS['hr_interview']
  const atsScore = job.ats_score ?? null
  const atsKw = job.ats_keywords ?? { present: [], missing: [] }
  const salaryDisplay = job.salary_text
    ? job.salary_text
    : job.salary_min && job.salary_max
      ? `${job.salary_min.toLocaleString('fr-FR')} € — ${job.salary_max.toLocaleString('fr-FR')} €`
      : job.salary_min ? `À partir de ${job.salary_min.toLocaleString('fr-FR')} €`
      : job.salary_max ? `Jusqu'à ${job.salary_max.toLocaleString('fr-FR')} €`
      : null

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '22px 26px', marginBottom: 18, border: '2px solid #111', boxShadow: '3px 3px 0 #111' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 16, display: 'block', fontFamily: FONT }
  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontFamily: FONT, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box' }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80, lineHeight: '1.6' }

  const activeStep = activeStepId ? allSteps.find(s => s.id === activeStepId) : null

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100vh', fontFamily: FONT, width: '100%' }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── Responsive styles ── */}
      <style>{`
        .jfmj-container {
          width: 100%;
          padding: 24px 32px 64px;
          box-sizing: border-box;
        }
        .jfmj-docs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }
        @media (max-width: 768px) {
          .jfmj-container {
            padding: 16px 16px 48px;
          }
          .jfmj-docs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="jfmj-container">

        {/* HEADER */}
        <div style={{ background: '#111', borderRadius: 14, padding: '22px 28px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, border: '2px solid #111', boxShadow: '3px 3px 0 #E8151B', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontFamily: FONT }}>
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#F5C400', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, fontSize: 11, padding: 0 }}>← Mes candidatures</button>
              {' / '}<span style={{ color: '#888' }}>{job.company}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 12, fontFamily: FONT }}>{job.title}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: salaryDisplay ? 16 : 0 }}>
              <span style={{ background: '#F5C400', color: '#111', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontFamily: FONT }}>{job.job_type || 'CDI'}</span>
              {job.location && <span style={{ background: '#222', color: '#ccc', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>{job.location}</span>}
              <span style={{ background: '#222', color: '#ccc', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>{formatDate(job.created_at)}</span>
            </div>
            {salaryDisplay && (
              <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#666', marginBottom: 4, fontFamily: FONT }}>Salaire</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#F5C400', fontFamily: FONT }}>{salaryDisplay}</span>
                  <span style={{ background: '#1a1a1a', color: '#aaa', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>Brut / an</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {job.source_url && (
              <button onClick={() => window.open(job.source_url, '_blank')} style={{ background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #fff', whiteSpace: 'nowrap' }}>
                Voir l'offre ↗
              </button>
            )}
            <button onClick={() => router.push(`/dashboard/editor?job_id=${jobId}`)} style={{ background: '#F5C400', color: '#111', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: '2px solid #111', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111', whiteSpace: 'nowrap' }}>
              Générer un CV
            </button>
          </div>
        </div>

        {/* SCORE ATS */}
        {(atsScore !== null || atsKw.present.length > 0 || atsKw.missing.length > 0) && (
          <div style={{ ...card, boxShadow: '3px 3px 0 #F5C400', border: '2px solid #F5C400', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {atsScore !== null && (
              <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F0F0F0" strokeWidth="7" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F5C400" strokeWidth="7" strokeDasharray="201" strokeDashoffset={201 - (201 * atsScore / 100)} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1, fontFamily: FONT }}>{atsScore}</span>
                  <small style={{ fontSize: 10, color: '#999', fontWeight: 700, fontFamily: FONT }}>/100</small>
                </div>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#111', marginBottom: 4, fontFamily: FONT }}>Score ATS — Compatibilité avec l'offre</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 10, fontFamily: FONT }}>
                {atsScore !== null && atsScore >= 70 ? 'Bonne compatibilité globale. Quelques mots-clés à ajouter.' : 'Des mots-clés importants manquent dans votre CV.'}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {atsKw.present.map(k => <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#E8F5E9', color: '#2E7D32', fontFamily: FONT }}>{k} ✓</span>)}
                {atsKw.missing.map(k => <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FFEBEE', color: '#C62828', fontFamily: FONT }}>{k} ✗</span>)}
              </div>
            </div>
          </div>
        )}

        {/* PARCOURS avec drag & drop */}
        <div style={card}>
          <span style={lbl}>Parcours de candidature</span>
          <p style={{ fontSize: 11, color: '#bbb', fontWeight: 600, marginBottom: 12, fontFamily: FONT }}>
            💡 Cliquez sur une étape pour avancer — glissez les étapes personnalisées pour les réordonner
          </p>

          <DndContext
            sensors={sensors}
            onDragStart={handleStepDragStart}
            onDragOver={handleStepDragOver}
            onDragEnd={handleStepDragEnd}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
              {allSteps.map((step, idx) => {
                const isDone = idx < currentStepIndex
                const isActive = step.id === currentStepId
                const isCustom = !!customSteps.find(cs => cs.id === step.id)

                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 80 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                      {idx < allSteps.length - 1 && (
                        <div style={{ position: 'absolute', top: 18, left: 'calc(50% + 18px)', right: 'calc(-50% + 18px)', height: 3, background: isDone ? '#F5C400' : '#E5E5E5', zIndex: 0 }} />
                      )}
                      <DraggableStep
                        step={step} isActive={isActive} isDone={isDone}
                        isCustom={isCustom} currentStepId={currentStepId}
                        onStepClick={handleStepClick}
                        onDeleteRequest={(id, label) => setStepToDelete({ id, label })}
                        allStepsLength={allSteps.length}
                      />
                    </div>
                    {isCustom && idx < allSteps.length - 1 && (
                      <DropZone id={`after-${step.id}`} isOver={overDropZone === `after-${step.id}`} />
                    )}
                  </div>
                )
              })}
            </div>

            <DragOverlay>
              {activeStep ? (
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#F5C400', border: '3px solid #111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: '#111',
                  boxShadow: '3px 3px 0 #E8151B', cursor: 'grabbing',
                  fontFamily: FONT,
                }}>
                  {activeStep.num}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <button onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F5F5F0', border: '2px dashed #ddd', color: '#999', fontSize: 11, fontWeight: 700, padding: '7px 14px', borderRadius: 9, cursor: 'pointer', marginTop: 16, fontFamily: FONT }}
            onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = '#F5C400'; el.style.color = '#111'; el.style.background = '#FFFDE7' }}
            onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = '#ddd'; el.style.color = '#999'; el.style.background = '#F5F5F0' }}>
            <span style={{ width: 16, height: 16, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>+</span>
            Ajouter une étape personnalisée
          </button>
        </div>

        {/* MODALE AJOUT ÉTAPE */}
        {showModal && (
          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#111', marginBottom: 6, fontFamily: FONT }}>Ajouter une étape personnalisée</h3>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 18, lineHeight: 1.5, fontFamily: FONT }}>Donnez un nom à cette étape et choisissez où l'insérer.</p>
              <label style={{ ...lbl, marginBottom: 6 }}>Nom de l'étape</label>
              <input style={inp} placeholder="Ex : Test technique, Entretien DRH..." value={newStepName}
                onChange={e => setNewStepName(e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#F5C400' }}
                onBlur={e => { e.target.style.borderColor = '#eee' }} />
              <label style={{ ...lbl, marginTop: 14, marginBottom: 8 }}>Où l'insérer ?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allSteps.slice(0, -1).map((step, idx) => {
                  const nextStep = allSteps[idx + 1]
                  const pos = idx + 1
                  const isSelected = newStepPos === pos
                  return (
                    <button key={pos} onClick={() => setNewStepPos(pos)}
                      style={{ background: isSelected ? '#111' : '#F5F5F0', color: isSelected ? '#F5C400' : '#666', border: `1.5px solid ${isSelected ? '#111' : '#E5E5E5'}`, borderRadius: 9, padding: '10px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Après <strong style={{ color: isSelected ? '#F5C400' : '#111' }}>{step.label}</strong></span>
                      <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6 }}>→ avant {nextStep.label}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ background: '#F5F5F0', color: '#666', fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                <button onClick={handleAddCustomStep} style={{ background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT }}>Ajouter l'étape</button>
              </div>
            </div>
          </div>
        )}

        {/* BLOC ÉTAPE ACTIVE */}
        {stepData && (
          <div style={{ background: '#FFFDE7', borderRadius: 14, padding: '20px 26px', marginBottom: 18, border: '2px solid #F5C400', boxShadow: '3px 3px 0 #F5C400' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#111', color: '#F5C400', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT }}>Étape {currentStepIndex + 1} — En cours</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: FONT }}>{allSteps.find(s => s.id === currentStepId)?.label}</span>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5, fontFamily: FONT }}>{stepData.desc}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
              {stepData.actions.map((action, i) => (
                <div key={i} style={{ background: action.type === 'included' ? '#F1F8E9' : '#fff', border: `1.5px solid ${action.type === 'included' ? '#C8E6C9' : action.type === 'new' ? '#FFCDD2' : '#E5E5E5'}`, borderRadius: 12, padding: '13px 15px', cursor: action.type === 'included' ? 'default' : 'pointer' }}
                  onMouseOver={e => { if (action.type !== 'included') (e.currentTarget as HTMLElement).style.borderColor = '#111' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = action.type === 'included' ? '#C8E6C9' : action.type === 'new' ? '#FFCDD2' : '#E5E5E5' }}>
                  <span style={{ fontSize: 16, display: 'block', marginBottom: 5 }}>{action.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: action.type === 'included' ? '#2E7D32' : '#111', display: 'block', fontFamily: FONT }}>
                    {action.title}
                    {action.type === 'included' && <span style={{ background: '#2E7D32', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, marginLeft: 4 }}>✓</span>}
                    {action.type === 'new' && <span style={{ background: '#E8151B', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, marginLeft: 4 }}>Nouveau</span>}
                  </span>
                  <span style={{ fontSize: 10, color: '#999', marginTop: 2, display: 'block', fontFamily: FONT }}>{action.sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SYNTHÈSE ÉCHANGES */}
        <div style={card}>
          <span style={lbl}>Synthèse des échanges</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {exchanges.map((ex, idx) => {
              const isOpen = openExchanges.has(ex.id)
              const isLatest = idx === exchanges.length - 1
              return (
                <div key={ex.id} style={{ border: `1.5px solid ${isLatest ? '#F5C400' : '#EBEBEB'}`, borderRadius: 11, overflow: 'hidden' }}>
                  <div onClick={() => toggleExchange(ex.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 15px', background: isLatest ? '#FFFDE7' : '#F8F8F6', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#111', color: '#F5C400', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: FONT }}>{idx + 1}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: 0, fontFamily: FONT }}>{ex.title}</p>
                        <p style={{ fontSize: 11, color: '#999', margin: 0, fontFamily: FONT }}>{ex.step_label && `${ex.step_label} · `}{formatDate(ex.exchange_date)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#F5C400', color: '#111', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, fontFamily: FONT }}>{EXCHANGE_TYPE_LABELS[ex.exchange_type]}</span>
                      <span style={{ fontSize: 10, color: '#bbb', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: 16, borderTop: '1px solid #F0F0F0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
                        {[
                          { field: 'title', label: 'Titre', type: 'text', val: ex.title },
                          { field: 'exchange_type', label: 'Type', type: 'select', val: ex.exchange_type },
                          { field: 'exchange_date', label: 'Date', type: 'date', val: ex.exchange_date },
                        ].map(f => (
                          <div key={f.field}>
                            <label style={{ ...lbl, marginBottom: 5 }}>{f.label}</label>
                            {f.type === 'select' ? (
                              <select defaultValue={f.val} onChange={e => updateExchange(ex.id, f.field, e.target.value)} style={{ ...inp, background: '#fff' }}>
                                {(Object.entries(EXCHANGE_TYPE_LABELS) as [ExchangeType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            ) : (
                              <input type={f.type} defaultValue={f.val} style={inp}
                                onFocus={e => { e.target.style.borderColor = '#F5C400' }}
                                onBlur={e => { e.target.style.borderColor = '#eee'; updateExchange(ex.id, f.field, e.target.value) }} />
                            )}
                          </div>
                        ))}
                      </div>
                      {[
                        { field: 'content', label: 'Déroulement & impressions', placeholder: "Comment s'est passé l'échange ?" },
                        { field: 'questions', label: 'Questions posées', placeholder: "Ce qui a été abordé..." },
                        { field: 'answers', label: 'Mes réponses & points à améliorer', placeholder: "Ce que j'ai bien dit, ce que je reformulerais..." },
                        { field: 'next_step', label: 'Prochaine étape annoncée', placeholder: "Suite du process, délai, contact..." },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field} style={{ marginBottom: 12 }}>
                          <label style={{ ...lbl, marginBottom: 6 }}>{label}</label>
                          <textarea defaultValue={(ex as any)[field] ?? ''} placeholder={placeholder}
                            onBlur={e => updateExchange(ex.id, field, e.target.value)}
                            style={{ ...ta, minHeight: field === 'next_step' ? 56 : 80 }}
                            onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
                        </div>
                      ))}
                      <button onClick={() => deleteExchange(ex.id)} style={{ background: 'none', border: 'none', color: '#E8151B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, padding: 0, marginTop: 4 }}>
                        Supprimer cet échange
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <button onClick={addExchange}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: '#F5F5F0', border: '2px dashed #ddd', color: '#999', fontSize: 13, fontWeight: 700, padding: '13px 18px', borderRadius: 11, cursor: 'pointer', marginTop: 10, fontFamily: FONT }}
            onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = '#F5C400'; el.style.color = '#111'; el.style.background = '#FFFDE7' }}
            onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = '#ddd'; el.style.color = '#999'; el.style.background = '#F5F5F0' }}>
            <span style={{ width: 20, height: 20, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>+</span>
            Ajouter un échange
          </button>
        </div>

        {/* DOCUMENTS + NOTES */}
        <div className="jfmj-docs-grid">
          <div style={{ ...card, marginBottom: 0 }}>
            <span style={lbl}>Documents</span>
            {[
              { sent: job.cv_sent, name: 'CV', url: job.cv_url },
              { sent: job.cover_letter_sent, name: 'Lettre de motivation', url: job.cover_letter_url },
            ].map(doc => (
              <div key={doc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 22, height: 22, background: doc.sent ? '#111' : '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {doc.sent && <svg viewBox="0 0 12 12" fill="none" width="12" height="12"><path d="M2 6l3 3 5-5" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" /></svg>}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#333', margin: 0, fontFamily: FONT }}>{doc.name}</p>
                    <p style={{ fontSize: 10, color: '#bbb', margin: 0, fontFamily: FONT }}>{doc.sent ? 'Envoyé — étape Postulé' : 'Non envoyé'}</p>
                  </div>
                </div>
                {doc.url && <button onClick={() => doc.url && window.open(doc.url, '_blank')} style={{ background: '#F5F5F0', color: '#111', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: '1px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Voir</button>}
              </div>
            ))}
          </div>
          <div style={{ ...card, marginBottom: 0 }}>
            <span style={lbl}>Mes notes</span>
            <textarea value={notes} onChange={e => handleNotesChange(e.target.value)}
              placeholder="Impressions générales, contacts, points à surveiller..."
              style={{ ...ta, minHeight: 110 }}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }}
              onBlur={e => { e.target.style.borderColor = '#eee' }} />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div style={card}>
          <span style={lbl}>Description du poste</span>
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8, maxHeight: descExpanded ? 'none' : 200, overflow: 'hidden', position: 'relative', fontFamily: FONT }}>
            {job.description}
            {!descExpanded && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #fff)' }} />}
          </div>
          <button onClick={() => setDescExpanded(v => !v)} style={{ background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800, border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', marginTop: 12, fontFamily: FONT, boxShadow: '2px 2px 0 #E8151B' }}>
            {descExpanded ? 'Réduire ↑' : 'Lire la description complète ↓'}
          </button>
        </div>

      </div>

      {/* MODALE SUPPRESSION ÉTAPE */}
      {stepToDelete && (
        <div style={{ background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', margin: '0 20px' }}>
            <div style={{ fontSize: 28, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#111', marginBottom: 8, textAlign: 'center', fontFamily: FONT }}>Supprimer cette étape ?</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 6, textAlign: 'center', lineHeight: 1.5, fontFamily: FONT }}>Vous êtes sur le point de supprimer l'étape</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 20, textAlign: 'center', fontFamily: FONT }}>"{stepToDelete.label}"</p>
            <p style={{ fontSize: 12, color: '#E8151B', marginBottom: 20, textAlign: 'center', fontFamily: FONT }}>Cette action est définitive et ne peut pas être annulée.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStepToDelete(null)}
                style={{ flex: 1, background: '#F5F5F0', color: '#666', fontSize: 13, fontWeight: 700, padding: '11px 0', borderRadius: 10, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>
                Annuler
              </button>
              <button onClick={async () => { await handleDeleteCustomStep(stepToDelete.id); setStepToDelete(null) }}
                style={{ flex: 1, background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '11px 0', borderRadius: 10, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
