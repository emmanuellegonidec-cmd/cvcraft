'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { JobExchange, ExchangeType, EXCHANGE_TYPE_LABELS } from '@/lib/types'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'

interface Job {
  id: string; title: string; company: string; location: string; job_type: string
  status: string; sub_status: string; description: string; notes: string; source_url: string
  salary_text: string | null; salary_min: number | null; salary_max: number | null; currency: string | null
  cv_sent: boolean; cover_letter_sent: boolean; cv_url: string | null; cover_letter_url: string | null
  ats_score: number | null; ats_keywords: { present: string[]; missing: string[] } | null
  created_at: string; applied_at: string | null
  interview_at: string | null; interview_time: string | null; interview_time_end: string | null
  interview_type: string | null; interview_contact_id: string | null
  interview_location: string | null; interview_link: string | null; interview_phone: string | null
  company_description: string | null
  company_website: string | null
  company_size: string | null
  department: string | null
  source_platform: string | null
}

interface ContactMin { id: string; name: string; role?: string | null; company?: string | null }

interface StepActionRow {
  id: string; title: string; icon: string; sub: string; position: number
  is_custom: boolean; type: 'included' | 'action' | 'new'
}

const BASE_STEPS = [
  { id: 'to_apply',          label: 'Envie de postuler',      num: 1 },
  { id: 'applied',           label: 'Postulé',                num: 2 },
  { id: 'phone_interview',   label: 'Entretien téléphonique', num: 3 },
  { id: 'hr_interview',      label: 'Entretien RH',           num: 4 },
  { id: 'manager_interview', label: 'Entretien manager',      num: 5 },
  { id: 'offer',             label: 'Offre reçue',            num: 6 },
]

const INTERVIEW_STEP_IDS = ['phone_interview', 'hr_interview', 'manager_interview']

const STATUS_MAP: Record<string, string> = {
  to_apply: 'to_apply', applied: 'applied',
  phone_interview: 'in_progress', hr_interview: 'in_progress',
  manager_interview: 'in_progress', offer: 'offer',
}

const STATUS_LABELS: Record<string, string> = {
  to_apply: 'Envie de postuler', applied: 'Postulé',
  in_progress: 'En cours', offer: 'Offre reçue', archived: 'Archivé',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  to_apply:    { bg: '#F5F5F0', color: '#888' },
  applied:     { bg: '#E8F0FE', color: '#1A6FDB' },
  in_progress: { bg: '#FFF8E1', color: '#B8900A' },
  offer:       { bg: '#E8F5E9', color: '#1A7A4A' },
  archived:    { bg: '#F5F5F5', color: '#aaa' },
}

const SUB_STATUS_LABELS: Record<string, string> = {
  to_apply: 'Envie de postuler', applied: 'Postulé',
  phone_interview: 'Entretien tél.', hr_interview: 'Entretien RH',
  manager_interview: 'Entretien manager', offer: 'Offre reçue',
}

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  telephone: '📞 Téléphone', visio: '💻 Visio', presentiel: '🏢 Présentiel',
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
      { icon: '📋', title: 'Confirmer la réception', sub: 'Email de confirmation reçu ?', type: 'action' },
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

const ICON_CHOICES = ['⭐','📄','✉️','🎯','🔍','📅','🔔','📋','🏢','💬','⚖️','✅','❌','📊','🔧','👤','🧠','💡','🚀','🤝','📞','📝','🗓️','💼','🎤','📌']
const FONT = "'Montserrat', sans-serif"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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

function extractTransmittedBy(notes: string | null): string | null {
  if (!notes) return null
  const match = notes.match(/Transmis par\s*:\s*(.+?)(?:\n|$)/i)
  return match ? match[1].trim() : null
}

function JobSidebar({ currentJobId, onSelect }: { currentJobId: string; onSelect: (id: string) => void }) {
  const [jobs, setJobs] = useState<Job[]>([])
  useEffect(() => {
    const supabase = createClient()
    supabase.from('jobs').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setJobs(data)
    })
  }, [])
  return (
    <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden', background: '#fff', borderRight: '1.5px solid #EBEBEB', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '1.5px solid #EBEBEB', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111', letterSpacing: '-0.2px' }}>Mes candidatures</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', background: '#F5F5F0', padding: '2px 8px', borderRadius: 20 }}>{jobs.length}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {jobs.map(job => {
          const isActive = job.id === currentJobId
          const statusColor = STATUS_COLORS[job.status] ?? STATUS_COLORS['to_apply']
          const stepLabel = job.sub_status ? (SUB_STATUS_LABELS[job.sub_status] ?? STATUS_LABELS[job.status]) : STATUS_LABELS[job.status]
          const dateRef = job.applied_at || job.created_at
          return (
            <div key={job.id} onClick={() => onSelect(job.id)}
              style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F0', cursor: 'pointer', background: isActive ? '#111' : 'transparent', transition: 'background 0.1s' }}
              onMouseOver={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F9F9F7' }}
              onMouseOut={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, color: isActive ? '#fff' : '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
              <div style={{ fontSize: 12, color: isActive ? '#aaa' : '#666', marginBottom: 7, fontWeight: 500 }}>{job.company}{job.location ? ` · ${job.location}` : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isActive ? '#222' : statusColor.bg, color: isActive ? '#F5C400' : statusColor.color }}>{stepLabel}</span>
                <span style={{ fontSize: 10, color: isActive ? '#666' : '#bbb', fontWeight: 600, flexShrink: 0 }}>{formatDateShort(dateRef)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DraggableStep({ step, isActive, isDone, isCustom, onStepClick, onDeleteRequest }: {
  step: { id: string; label: string; num: number }; isActive: boolean; isDone: boolean; isCustom: boolean
  currentStepId: string; onStepClick: (id: string) => void; onDeleteRequest: (id: string, label: string) => void; allStepsLength: number
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: step.id, disabled: !isCustom, data: { stepId: step.id } })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 72, position: 'relative', opacity: isDragging ? 0.4 : 1, transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined, zIndex: isDragging ? 50 : 1 }}>
      <div ref={isCustom ? setNodeRef : undefined} {...(isCustom ? { ...listeners, ...attributes } : {})} onClick={() => onStepClick(step.id)}
        style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, position: 'relative', zIndex: 1, flexShrink: 0, cursor: isCustom ? (isDragging ? 'grabbing' : 'grab') : 'pointer', background: isActive ? '#111' : isDone ? '#F5C400' : '#fff', border: `2.5px solid ${isActive ? '#111' : isDone ? '#F5C400' : '#DEDEDE'}`, color: isActive ? '#F5C400' : isDone ? '#111' : '#ccc', boxShadow: isActive ? '0 0 0 4px rgba(245,196,0,.18)' : 'none', fontFamily: FONT, touchAction: 'none' }}>
        {step.num}
      </div>
      <p onClick={() => onStepClick(step.id)} style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginTop: 6, lineHeight: 1.3, color: isActive ? '#111' : isDone ? '#777' : '#ccc', fontFamily: FONT, cursor: 'pointer', maxWidth: 70 }}>{step.label}</p>
      {isCustom && (
        <button onClick={e => { e.stopPropagation(); onDeleteRequest(step.id, step.label) }}
          style={{ position: 'absolute', top: -5, right: 'calc(50% - 27px)', width: 15, height: 15, borderRadius: '50%', background: '#E8151B', border: 'none', color: '#fff', fontSize: 9, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, lineHeight: 1 }}>×</button>
      )}
    </div>
  )
}

function DropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} style={{ width: isOver ? 28 : 12, height: 34, borderRadius: 6, background: isOver ? '#F5C400' : 'transparent', border: isOver ? '2px dashed #111' : '2px dashed transparent', flexShrink: 0, transition: 'all .15s', alignSelf: 'center', marginBottom: 20 }} />
}

function DraggableActionCard({ action, dragId, onDelete }: { action: StepActionRow; dragId: string; onDelete: (id: string, title: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId })
  const borderColor = action.type === 'included' ? '#C8E6C9' : action.type === 'new' ? '#FFCDD2' : '#EBEBEB'
  const bgColor = action.type === 'included' ? '#F1F8E9' : '#fff'
  return (
    <div ref={setNodeRef} style={{ background: bgColor, border: `1.5px solid ${isDragging ? '#F5C400' : borderColor}`, borderRadius: 10, padding: '12px 14px', cursor: isDragging ? 'grabbing' : 'grab', opacity: isDragging ? 0.5 : 1, transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined, zIndex: isDragging ? 50 : 1, position: 'relative', touchAction: 'none', userSelect: 'none' }} {...listeners} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontSize: 15, display: 'block', marginBottom: 5 }}>{action.icon}</span>
        <div style={{ display: 'flex', gap: 4, marginTop: -2 }}>
          <span style={{ fontSize: 9, color: '#ccc', cursor: 'grab', lineHeight: 1, paddingTop: 2 }}>⠿</span>
          {action.is_custom && (
            <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(action.id, action.title) }}
              style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: action.type === 'included' ? '#2E7D32' : '#111', display: 'block', fontFamily: FONT }}>
        {action.title}
        {action.type === 'included' && <span style={{ background: '#2E7D32', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 20, marginLeft: 4 }}>✓</span>}
        {action.type === 'new' && <span style={{ background: '#E8151B', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 20, marginLeft: 4 }}>Nouveau</span>}
      </span>
      <span style={{ fontSize: 11, color: '#888', marginTop: 3, display: 'block', fontFamily: FONT }}>{action.sub}</span>
    </div>
  )
}

function ActionDropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} style={{ height: isOver ? 44 : 6, borderRadius: 8, background: isOver ? '#FFFDE7' : 'transparent', border: isOver ? '2px dashed #F5C400' : '2px dashed transparent', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: isOver ? '1 / -1' : undefined }} />
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
  const [companyExpanded, setCompanyExpanded] = useState(true)
  const [openExchanges, setOpenExchanges] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newStepName, setNewStepName] = useState('')
  const [newStepPos, setNewStepPos] = useState(5)
  const [stepToDelete, setStepToDelete] = useState<{ id: string; label: string } | null>(null)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [overDropZone, setOverDropZone] = useState<string | null>(null)
  const notesTimer = useRef<NodeJS.Timeout | null>(null)

  const [stepActions, setStepActions] = useState<StepActionRow[]>([])
  const [actionsLoading, setActionsLoading] = useState(false)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [overActionZone, setOverActionZone] = useState<string | null>(null)
  const [showAddAction, setShowAddAction] = useState(false)
  const [newActionTitle, setNewActionTitle] = useState('')
  const [newActionSub, setNewActionSub] = useState('')
  const [newActionIcon, setNewActionIcon] = useState('⭐')
  const [newActionPosition, setNewActionPosition] = useState<number>(-1)
  const [actionToDelete, setActionToDelete] = useState<{ id: string; title: string } | null>(null)

  const [contacts, setContacts] = useState<ContactMin[]>([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '', company: '', location: '', job_type: 'CDI',
    salary_text: '', description: '',
    company_description: '', company_website: '', company_size: '',
  })

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [showCreateContact, setShowCreateContact] = useState(false)
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [contactCompany, setContactCompany] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactLinkedin, setContactLinkedin] = useState('')
  const [contactSaving, setContactSaving] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)

  const loadJob = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) setUserId(session.user.id)
    const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single()
    if (data) { setJob(data); setNotes(data.notes ?? '') }
  }, [jobId])

  const loadCustomSteps = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('pipeline_stages').select('*').eq('job_id', jobId).order('position')
    if (data && data.length > 0) setCustomSteps(data.map((s: any) => ({ id: s.id, label: s.label, position: s.position })))
  }, [jobId])

  const loadExchanges = useCallback(async () => {
    const res = await fetch(`/api/jobs/exchanges?job_id=${jobId}`, { headers: authHeaders() })
    if (res.ok) {
      const data: JobExchange[] = await res.json()
      setExchanges(data)
      if (data.length > 0) { const s = new Set<string>(); s.add(data[data.length - 1].id); setOpenExchanges(s) }
    }
  }, [jobId])

  const loadContacts = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('contacts').select('id, name, role, company').eq('user_id', session.user.id).order('name')
    if (data) setContacts(data)
  }, [])

  useEffect(() => {
    Promise.all([loadJob(), loadCustomSteps(), loadExchanges(), loadContacts()]).finally(() => setLoading(false))
  }, [loadJob, loadCustomSteps, loadExchanges, loadContacts])

  useEffect(() => {
    const interval = setInterval(() => { loadJob() }, 30000)
    return () => clearInterval(interval)
  }, [loadJob])

  useEffect(() => { if (userId) loadContacts() }, [userId])

  const loadStepActions = useCallback(async (stepId: string, uid: string) => {
    if (!stepId || !uid) return
    setActionsLoading(true)
    const supabase = createClient()
    const { data: existing } = await supabase.from('job_step_actions').select('*').eq('job_id', jobId).eq('step_id', stepId).order('position')
    if (existing && existing.length > 0) {
      setStepActions(existing.map((r: any) => ({ id: r.id, title: r.title, icon: r.icon, sub: r.sub, position: r.position, is_custom: r.is_custom, type: r.is_custom ? 'action' : (r.type ?? 'action') })))
    } else {
      const baseData = STEP_ACTIONS[stepId] || STEP_ACTIONS['hr_interview']
      const rows = baseData.actions.map((a, i) => ({ user_id: uid, job_id: jobId, step_id: stepId, title: a.title, icon: a.icon, sub: a.sub, position: (i + 1) * 1000, is_custom: false, type: a.type }))
      const { data: inserted } = await supabase.from('job_step_actions').insert(rows).select()
      if (inserted) setStepActions(inserted.map((r: any) => ({ id: r.id, title: r.title, icon: r.icon, sub: r.sub, position: r.position, is_custom: r.is_custom, type: r.type ?? 'action' })))
    }
    setActionsLoading(false)
  }, [jobId])

  const patchJob = useCallback(async (field: string, value: any) => {
    setJob(prev => prev ? { ...prev, [field]: value } : prev)
    await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ [field]: value }) })
  }, [jobId])

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ notes: val }) })
    }, 800)
  }

  function openEditModal() {
    if (!job) return
    setEditForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      job_type: job.job_type || 'CDI',
      salary_text: job.salary_text || '',
      description: job.description || '',
      company_description: job.company_description || '',
      company_website: job.company_website || '',
      company_size: job.company_size || '',
    })
    setShowEditModal(true)
  }

  async function saveEdit() {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id: jobId, ...editForm }),
    })
    const data = await res.json()
    if (data.job) { setJob(data.job); setShowEditModal(false) }
  }

  async function deleteJob() {
    if (deleteConfirmText !== 'SUPPRIMER') return
    setDeleteLoading(true)
    await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE', headers: authHeaders() })
    router.push('/dashboard')
  }

  function openCreateContact(transmittedBy: string) {
    const parts = transmittedBy.trim().split(/\s+/)
    setContactFirstName(parts[0] || '')
    setContactLastName(parts.slice(1).join(' ') || '')
    setContactRole('')
    setContactCompany(job?.company || '')
    setContactEmail('')
    setContactPhone('')
    setContactLinkedin('')
    setContactSaved(false)
    setShowCreateContact(true)
  }

  async function saveContact() {
    setContactSaving(true)
    const fullName = [contactFirstName.trim(), contactLastName.trim()].filter(Boolean).join(' ')
    const token = getToken()
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        name: fullName, role: contactRole.trim() || null, company: contactCompany.trim() || null,
        email: contactEmail.trim() || null, phone: contactPhone.trim() || null,
        linkedin: contactLinkedin.trim() || null, job_id: jobId,
      }),
    })
    setContactSaving(false)
    if (res.ok) { setContactSaved(true); await loadContacts(); setTimeout(() => setShowCreateContact(false), 1500) }
  }

  const sortedCustom = [...customSteps].sort((a, b) => a.position - b.position)
  const allSteps = [
    ...BASE_STEPS.slice(0, 5),
    ...sortedCustom.map((cs, i) => ({ id: cs.id, label: cs.label, num: 6 + i })),
    { ...BASE_STEPS[5], num: 6 + customSteps.length },
  ]

  const currentStepId = job?.sub_status || job?.status || 'to_apply'
  const currentStepIndex = allSteps.findIndex(s => s.id === currentStepId)
  const isInterviewStep = INTERVIEW_STEP_IDS.includes(currentStepId) || (customSteps.some(cs => cs.id === currentStepId))

  const handleStepClick = async (stepId: string) => {
    if (!job) return
    const globalStatus = STATUS_MAP[stepId] ?? 'in_progress'
    const patch = { sub_status: stepId, status: globalStatus }
    setJob(prev => prev ? { ...prev, ...patch } : prev)
    const res = await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patch) })
    if (res.ok) { const data = await res.json(); if (data.job) setJob(data.job) }
    if (userId) await loadStepActions(stepId, userId)
  }

  useEffect(() => {
    if (job && userId) { const stepId = job.sub_status || job.status || 'to_apply'; loadStepActions(stepId, userId) }
  }, [job?.id, userId])

  const handleAddCustomStep = async () => {
    if (!newStepName.trim() || !userId) return
    const supabase = createClient()
    const position = (newStepPos + 1) * 1000 + (Date.now() % 100)
    const { data } = await supabase.from('pipeline_stages').insert({ user_id: userId, job_id: jobId, label: newStepName.trim(), color: '#F5C400', position }).select().single()
    if (data) setCustomSteps(prev => [...prev, { id: data.id, label: data.label, position: data.position }])
    setNewStepName(''); setNewStepPos(allSteps.length - 2); setShowModal(false)
  }

  const handleDeleteCustomStep = async (stepId: string) => {
    const supabase = createClient()
    await supabase.from('pipeline_stages').delete().eq('id', stepId)
    setCustomSteps(prev => prev.filter(s => s.id !== stepId))
    if (currentStepId === stepId) {
      const patch = { sub_status: 'manager_interview', status: 'in_progress' }
      await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patch) })
      setJob(prev => prev ? { ...prev, ...patch } : prev)
    }
  }

  const handleAddAction = async () => {
    if (!newActionTitle.trim() || !userId) return
    const supabase = createClient()
    const sorted = [...stepActions].sort((a, b) => a.position - b.position)
    let insertPosition: number
    if (newActionPosition === -1 || newActionPosition >= sorted.length) {
      insertPosition = sorted.length > 0 ? Math.max(...sorted.map(a => a.position)) + 1000 : 1000
    } else {
      const afterCard = sorted[newActionPosition]
      const nextCard = sorted[newActionPosition + 1]
      insertPosition = nextCard ? Math.round((afterCard.position + nextCard.position) / 2) : afterCard.position + 1000
    }
    const { data } = await supabase.from('job_step_actions').insert({ user_id: userId, job_id: jobId, step_id: currentStepId, title: newActionTitle.trim(), icon: newActionIcon, sub: newActionSub.trim(), position: insertPosition, is_custom: true, type: 'action' }).select().single()
    if (data) setStepActions(prev => [...prev, { id: data.id, title: data.title, icon: data.icon, sub: data.sub, position: data.position, is_custom: true, type: 'action' }])
    setNewActionTitle(''); setNewActionSub(''); setNewActionIcon('⭐'); setNewActionPosition(-1); setShowAddAction(false)
  }

  const confirmDeleteAction = async () => {
    if (!actionToDelete) return
    const supabase = createClient()
    await supabase.from('job_step_actions').delete().eq('id', actionToDelete.id)
    setStepActions(prev => prev.filter(a => a.id !== actionToDelete.id))
    setActionToDelete(null)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }))
  const actionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }))

  function handleStepDragStart(event: DragStartEvent) { setActiveStepId(event.active.id as string) }
  function handleStepDragOver(event: any) { setOverDropZone(event.over?.id ?? null) }
  async function handleStepDragEnd(event: DragEndEvent) {
    setActiveStepId(null); setOverDropZone(null)
    const { active, over } = event; if (!over) return
    const draggedId = active.id as string; const dropZoneId = over.id as string
    const draggedStep = customSteps.find(s => s.id === draggedId); if (!draggedStep) return
    const match = dropZoneId.match(/^(after|before)-(.+)$/); if (!match) return
    const [, position, targetStepId] = match
    const sorted = [...customSteps].sort((a, b) => a.position - b.position)
    const withoutDragged = sorted.filter(s => s.id !== draggedId)
    const targetIdx = withoutDragged.findIndex(s => s.id === targetStepId)
    const insertIdx = position === 'after' ? targetIdx + 1 : targetIdx
    const reordered = [...withoutDragged.slice(0, insertIdx), draggedStep, ...withoutDragged.slice(insertIdx)]
    const updated = reordered.map((s, i) => ({ ...s, position: (i + 1) * 1000 }))
    setCustomSteps(updated)
    const supabase = createClient()
    await Promise.all(updated.map(s => supabase.from('pipeline_stages').update({ position: s.position }).eq('id', s.id)))
  }

  function handleActionDragStart(event: DragStartEvent) { setActiveActionId(event.active.id as string) }
  function handleActionDragOver(event: any) { setOverActionZone(event.over?.id ?? null) }
  async function handleActionDragEnd(event: DragEndEvent) {
    setActiveActionId(null); setOverActionZone(null)
    const { active, over } = event; if (!over) return
    const draggedId = active.id as string; const dropZoneId = over.id as string
    const match = dropZoneId.match(/^action-(before|after)-(.+)$/); if (!match) return
    const [, pos, targetId] = match; if (draggedId === targetId) return
    const sorted = [...stepActions].sort((a, b) => a.position - b.position)
    const dragged = sorted.find(a => a.id === draggedId); if (!dragged) return
    const withoutDragged = sorted.filter(a => a.id !== draggedId)
    const targetIdx = withoutDragged.findIndex(a => a.id === targetId); if (targetIdx === -1) return
    const insertIdx = pos === 'after' ? targetIdx + 1 : targetIdx
    const reordered = [...withoutDragged.slice(0, insertIdx), dragged, ...withoutDragged.slice(insertIdx)]
    const updated = reordered.map((a, i) => ({ ...a, position: (i + 1) * 1000 }))
    setStepActions(updated)
    const supabase = createClient()
    await Promise.all(updated.map(a => supabase.from('job_step_actions').update({ position: a.position }).eq('id', a.id)))
  }

  const toggleExchange = (id: string) => {
    setOpenExchanges(prev => { const next = new Set(Array.from(prev)); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const addExchange = async () => {
    const step = allSteps.find(s => s.id === currentStepId)
    const res = await fetch('/api/jobs/exchanges', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ job_id: jobId, title: 'Nouvel échange', exchange_type: 'autre', exchange_date: new Date().toISOString().split('T')[0], step_label: step?.label ?? null }) })
    if (res.ok) {
      const newEx: JobExchange = await res.json()
      setExchanges(prev => [...prev, newEx])
      const s = new Set(Array.from(openExchanges)); s.add(newEx.id); setOpenExchanges(s)
    }
  }

  const updateExchange = async (id: string, field: string, value: string) => {
    setExchanges(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    await fetch(`/api/jobs/exchanges?id=${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ [field]: value }) })
  }

  const deleteExchange = async (id: string) => {
    if (!confirm('Supprimer cet échange ?')) return
    await fetch(`/api/jobs/exchanges?id=${id}`, { method: 'DELETE', headers: authHeaders() })
    setExchanges(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}><p style={{ color: '#999', fontWeight: 700, fontSize: 15 }}>Chargement…</p></div>
  if (!job) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}><p style={{ color: '#E8151B', fontWeight: 700, fontSize: 15 }}>Offre introuvable.</p></div>

  const stepData = STEP_ACTIONS[currentStepId] || STEP_ACTIONS['hr_interview']
  const atsScore = job.ats_score ?? null
  const atsKw = job.ats_keywords ?? { present: [], missing: [] }
  const salaryDisplay = job.salary_text ? job.salary_text : job.salary_min && job.salary_max ? `${job.salary_min.toLocaleString('fr-FR')} € — ${job.salary_max.toLocaleString('fr-FR')} €` : job.salary_min ? `À partir de ${job.salary_min.toLocaleString('fr-FR')} €` : job.salary_max ? `Jusqu'à ${job.salary_max.toLocaleString('fr-FR')} €` : null

  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }
  const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 14, display: 'block', fontFamily: FONT }
  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500 }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80, lineHeight: '1.6' }

  const activeStep = activeStepId ? allSteps.find(s => s.id === activeStepId) : null
  const activeAction = activeActionId ? stepActions.find(a => a.id === activeActionId) : null
  const sortedStepActions = [...stepActions].sort((a, b) => a.position - b.position)
  const selectedContact = contacts.find(c => c.id === job.interview_contact_id)

  const transmittedBy = extractTransmittedBy(job.notes)
  const transmittedByAlreadyContact = transmittedBy
    ? contacts.some(c => c.name.toLowerCase().includes(transmittedBy.toLowerCase().split(' ')[0].toLowerCase()))
    : false

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100vh', fontFamily: FONT, display: 'flex' }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .jfmj-sidebar { display: flex; }
        .jfmj-main { flex: 1; padding: 24px 28px 64px; min-width: 0; }
        @media (max-width: 900px) { .jfmj-sidebar { display: none; } .jfmj-main { padding: 16px 16px 48px; } }
        .jfmj-docs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        @media (max-width: 600px) { .jfmj-docs-grid { grid-template-columns: 1fr; } }
        .jfmj-back-mobile { display: none; }
        @media (max-width: 900px) { .jfmj-back-mobile { display: flex !important; } }
        .interview-type-btn { flex: 1; padding: 8px 6px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 2px solid #E0E0E0; background: #fff; color: #888; cursor: pointer; font-family: ${FONT}; transition: all 0.15s; }
        .interview-type-btn.active { border-color: #F5C400; background: #FEF9E0; color: #111; }
        .interview-inp { width: 100%; border: 1.5px solid #eee; border-radius: 8px; padding: 8px 12px; font-size: 13px; font-family: ${FONT}; outline: none; background: #fff; color: #111; box-sizing: border-box; font-weight: 500; }
        .interview-inp:focus { border-color: #F5C400; }
        .btn-edit { background: #F9F9F7; color: #111; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 8px; border: 1.5px solid #ccc; cursor: pointer; font-family: ${FONT}; white-space: nowrap; transition: all 0.15s; }
        .btn-edit:hover { background: #fff; border-color: #111; }
        .btn-delete { background: transparent; color: #E8151B; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 8px; border: 1.5px solid #E8151B; cursor: pointer; font-family: ${FONT}; white-space: nowrap; transition: all 0.15s; }
        .btn-delete:hover { background: #FEF2F2; }
        .fi { width: 100%; border: 1.5px solid #E0E0E0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: ${FONT}; outline: none; background: #fff; color: #111; box-sizing: border-box; font-weight: 500; margin-bottom: 12px; }
        .fi:focus { border-color: #111; }
        .fl { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #888; display: block; margin-bottom: 5px; font-family: ${FONT}; }
      `}</style>

      <div className="jfmj-sidebar"><JobSidebar currentJobId={jobId} onSelect={(id) => router.push(`/dashboard/job/${id}`)} /></div>

      <div className="jfmj-main">
        <div className="jfmj-back-mobile" style={{ display: 'none', marginBottom: 14 }}>
          <button onClick={() => router.back()} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#111', cursor: 'pointer', fontFamily: FONT }}>← Mes candidatures</button>
        </div>

        {/* ─── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{ background: '#111', borderRadius: 12, padding: '22px 26px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, border: '2px solid #111', boxShadow: '3px 3px 0 #E8151B', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontFamily: FONT }}>
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#F5C400', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, fontSize: 12, padding: 0 }}>← Mes candidatures</button>
              {' / '}<span style={{ color: '#555' }}>{job.company}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12, fontFamily: FONT }}>{job.title}</h1>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: salaryDisplay ? 14 : 0 }}>
              <span style={{ background: '#F5C400', color: '#111', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontFamily: FONT }}>{job.job_type || 'CDI'}</span>
              {job.location && <span style={{ background: '#222', color: '#bbb', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>{job.location}</span>}
              <span style={{ background: '#222', color: '#bbb', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>{formatDate(job.created_at)}</span>
            </div>
            {salaryDisplay && (
              <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: 4, fontFamily: FONT }}>Salaire</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#F5C400', fontFamily: FONT }}>{salaryDisplay}</span>
                  <span style={{ background: '#1a1a1a', color: '#888', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>Brut / an</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {job.source_url && <button onClick={() => window.open(job.source_url, '_blank')} style={{ background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 9, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #fff', whiteSpace: 'nowrap' }}>Voir l&apos;offre ↗</button>}
            <button onClick={() => router.push(`/dashboard/editor?job_id=${jobId}`)} style={{ background: '#F5C400', color: '#111', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 9, border: '2px solid #111', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111', whiteSpace: 'nowrap' }}>Générer un CV</button>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-edit" onClick={openEditModal}>✏️ Modifier</button>
              <button className="btn-delete" onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }}>🗑️ Supprimer</button>
            </div>
          </div>
        </div>

        {/* ─── INFOS ENTREPRISE — toujours visible ────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, marginBottom: 14, border: '1.5px solid #EBEBEB', overflow: 'hidden' }}>
          <button
            onClick={() => setCompanyExpanded(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#FAFAFA', border: 'none', cursor: 'pointer', fontFamily: FONT }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🏢</span>
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#555' }}>À propos de {job.company}</span>
            </div>
            <span style={{ fontSize: 12, color: '#aaa', transform: companyExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
          </button>
          {companyExpanded && (
            <div style={{ padding: '16px 20px' }}>
              {job.company_description ? (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>{job.company_description}</p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', marginBottom: 14, fontFamily: FONT }}>
                  Aucune description — cliquez sur ✏️ Modifier pour en ajouter une.
                </p>
              )}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {job.company_size && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#bbb', marginBottom: 3 }}>Taille</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{job.company_size}</div>
                  </div>
                )}
                {job.department && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#bbb', marginBottom: 3 }}>Département</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{job.department}</div>
                  </div>
                )}
                {job.company_website && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#bbb', marginBottom: 3 }}>Site web</div>
                    <a href={job.company_website.startsWith('http') ? job.company_website : `https://${job.company_website}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, fontWeight: 700, color: '#0A66C2', textDecoration: 'none' }}>
                      {job.company_website} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── TRANSMIS PAR ───────────────────────────────────────────────── */}
        {transmittedBy && !transmittedByAlreadyContact && (
          <div style={{ background: '#F5F0FF', border: '1.5px solid #7C3AED', borderRadius: 12, padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#5B21B6' }}>Offre transmise par <strong>{transmittedBy}</strong></div>
                <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 500 }}>Ce contact n&apos;est pas encore dans vos contacts.</div>
              </div>
            </div>
            <button onClick={() => openCreateContact(transmittedBy)}
              style={{ background: '#7C3AED', color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', boxShadow: '2px 2px 0 #111' }}>
              + Créer la fiche contact
            </button>
          </div>
        )}

        {/* ─── SCORE ATS ──────────────────────────────────────────────────── */}
        {(atsScore !== null || atsKw.present.length > 0 || atsKw.missing.length > 0) && (
          <div style={{ ...card, border: '1.5px solid #F5C400', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {atsScore !== null && (
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#F0F0F0" strokeWidth="6" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#F5C400" strokeWidth="6" strokeDasharray="176" strokeDashoffset={176 - (176 * atsScore / 100)} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#111', lineHeight: 1, fontFamily: FONT }}>{atsScore}</span>
                  <small style={{ fontSize: 10, color: '#999', fontWeight: 700, fontFamily: FONT }}>/100</small>
                </div>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 4, fontFamily: FONT }}>Score ATS — Compatibilité avec l&apos;offre</h3>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 8, fontFamily: FONT }}>{atsScore !== null && atsScore >= 70 ? 'Bonne compatibilité. Quelques mots-clés à ajouter.' : 'Des mots-clés importants manquent dans votre CV.'}</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {atsKw.present.map(k => <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: '#E8F5E9', color: '#2E7D32', fontFamily: FONT }}>{k} ✓</span>)}
                {atsKw.missing.map(k => <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: '#FFEBEE', color: '#C62828', fontFamily: FONT }}>{k} ✗</span>)}
              </div>
            </div>
          </div>
        )}

        {/* ─── PARCOURS ───────────────────────────────────────────────────── */}
        <div style={card}>
          <span style={sectionLabel}>Parcours de candidature</span>
          <p style={{ fontSize: 12, color: '#bbb', fontWeight: 600, marginBottom: 14, fontFamily: FONT }}>💡 Cliquez sur une étape pour avancer — glissez les étapes personnalisées pour les réordonner</p>
          <DndContext sensors={sensors} onDragStart={handleStepDragStart} onDragOver={handleStepDragOver} onDragEnd={handleStepDragEnd}>
            <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
              {allSteps.map((step, idx) => {
                const isDone = idx < currentStepIndex
                const isActive = step.id === currentStepId
                const isCustom = !!customSteps.find(cs => cs.id === step.id)
                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 72 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                      {idx < allSteps.length - 1 && <div style={{ position: 'absolute', top: 17, left: 'calc(50% + 17px)', right: 'calc(-50% + 17px)', height: 2.5, background: isDone ? '#F5C400' : '#EBEBEB', zIndex: 0 }} />}
                      <DraggableStep step={step} isActive={isActive} isDone={isDone} isCustom={isCustom} currentStepId={currentStepId} onStepClick={handleStepClick} onDeleteRequest={(id, label) => setStepToDelete({ id, label })} allStepsLength={allSteps.length} />
                    </div>
                    {isCustom && idx < allSteps.length - 1 && <DropZone id={`after-${step.id}`} isOver={overDropZone === `after-${step.id}`} />}
                  </div>
                )
              })}
            </div>
            <DragOverlay>
              {activeStep ? <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F5C400', border: '2.5px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#111', boxShadow: '3px 3px 0 #E8151B', cursor: 'grabbing', fontFamily: FONT }}>{activeStep.num}</div> : null}
            </DragOverlay>
          </DndContext>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F9F9F7', border: '1.5px dashed #ddd', color: '#999', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', marginTop: 14, fontFamily: FONT }}
            onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = '#F5C400'; el.style.color = '#111'; el.style.background = '#FFFDE7' }}
            onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = '#ddd'; el.style.color = '#999'; el.style.background = '#F9F9F7' }}>
            <span style={{ width: 15, height: 15, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>+</span>
            Ajouter une étape personnalisée
          </button>
        </div>

        {/* MODALE AJOUT ÉTAPE */}
        {showModal && (
          <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '32px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 440, border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 5, fontFamily: FONT }}>Ajouter une étape personnalisée</h3>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5, fontFamily: FONT }}>Donnez un nom à cette étape et choisissez où l&apos;insérer.</p>
              <label style={{ ...sectionLabel, marginBottom: 5 }}>Nom de l&apos;étape</label>
              <input style={inp} placeholder="Ex : Test technique, Entretien DRH..." value={newStepName} onChange={e => setNewStepName(e.target.value)} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} />
              <label style={{ ...sectionLabel, marginTop: 14, marginBottom: 8 }}>Où l&apos;insérer ?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {allSteps.slice(0, -1).map((step, idx) => {
                  const nextStep = allSteps[idx + 1]; const pos = idx + 1; const isSelected = newStepPos === pos
                  return (
                    <button key={pos} onClick={() => setNewStepPos(pos)} style={{ background: isSelected ? '#111' : '#F9F9F7', color: isSelected ? '#F5C400' : '#555', border: `1.5px solid ${isSelected ? '#111' : '#E5E5E5'}`, borderRadius: 8, padding: '9px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Après <strong style={{ color: isSelected ? '#F5C400' : '#111' }}>{step.label}</strong></span>
                      <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6 }}>→ avant {nextStep.label}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button onClick={() => setShowModal(false)} style={{ background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                <button onClick={handleAddCustomStep} style={{ background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT }}>Ajouter l&apos;étape</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── BLOC ÉTAPE ACTIVE ───────────────────────────────────────────── */}
        <div style={{ background: '#FFFDE7', borderRadius: 12, padding: '18px 22px', marginBottom: 14, border: '1.5px solid #F5C400' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ background: '#111', color: '#F5C400', fontSize: 10, fontWeight: 800, padding: '3px 11px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT }}>Étape {currentStepIndex + 1} — En cours</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111', fontFamily: FONT }}>{allSteps.find(s => s.id === currentStepId)?.label}</span>
          </div>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 14, lineHeight: 1.6, fontFamily: FONT }}>{stepData.desc}</p>
          {actionsLoading ? (
            <p style={{ fontSize: 12, color: '#bbb', fontWeight: 600, fontFamily: FONT }}>Chargement des actions…</p>
          ) : (
            <DndContext sensors={actionSensors} onDragStart={handleActionDragStart} onDragOver={handleActionDragOver} onDragEnd={handleActionDragEnd}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                {sortedStepActions.map((action) => (
                  <div key={action.id} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                    <ActionDropZone id={`action-before-${action.id}`} isOver={overActionZone === `action-before-${action.id}`} />
                    <div style={{ width: 148 }}><DraggableActionCard action={action} dragId={action.id} onDelete={(id, title) => setActionToDelete({ id, title })} /></div>
                  </div>
                ))}
                <ActionDropZone id={`action-after-${sortedStepActions[sortedStepActions.length - 1]?.id ?? 'end'}`} isOver={overActionZone === `action-after-${sortedStepActions[sortedStepActions.length - 1]?.id ?? 'end'}`} />
              </div>
              <DragOverlay>
                {activeAction ? <div style={{ background: '#fff', border: '1.5px solid #F5C400', borderRadius: 10, padding: '12px 14px', boxShadow: '3px 3px 0 #111', cursor: 'grabbing', width: 148 }}><span style={{ fontSize: 15, display: 'block', marginBottom: 5 }}>{activeAction.icon}</span><span style={{ fontSize: 12, fontWeight: 800, color: '#111', display: 'block', fontFamily: FONT }}>{activeAction.title}</span><span style={{ fontSize: 11, color: '#888', display: 'block', fontFamily: FONT }}>{activeAction.sub}</span></div> : null}
              </DragOverlay>
            </DndContext>
          )}
          {showAddAction ? (
            <div style={{ background: '#fff', border: '1.5px solid #F5C400', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#111', marginBottom: 10, fontFamily: FONT }}>Nouvelle action</p>
              <div style={{ marginBottom: 10 }}>
                <label style={{ ...sectionLabel, marginBottom: 6 }}>Icône</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ICON_CHOICES.map(ic => (
                    <button key={ic} onClick={() => setNewActionIcon(ic)} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${newActionIcon === ic ? '#111' : '#eee'}`, background: newActionIcon === ic ? '#FFFDE7' : '#F9F9F7', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ ...sectionLabel, marginBottom: 5 }}>Titre *</label>
                  <input style={inp} placeholder="Ex : Préparer mes questions" value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} />
                </div>
                <div>
                  <label style={{ ...sectionLabel, marginBottom: 5 }}>Sous-titre</label>
                  <input style={inp} placeholder="Courte description" value={newActionSub} onChange={e => setNewActionSub(e.target.value)} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...sectionLabel, marginBottom: 6 }}>Position</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {sortedStepActions.map((a, idx) => {
                    const isSelected = newActionPosition === idx
                    return <button key={a.id} onClick={() => setNewActionPosition(idx)} style={{ background: isSelected ? '#111' : '#F9F9F7', color: isSelected ? '#F5C400' : '#555', border: `1.5px solid ${isSelected ? '#111' : '#E5E5E5'}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 13 }}>{a.icon}</span>Après <strong style={{ color: isSelected ? '#F5C400' : '#111' }}>{a.title}</strong></button>
                  })}
                  <button onClick={() => setNewActionPosition(-1)} style={{ background: newActionPosition === -1 ? '#111' : '#F9F9F7', color: newActionPosition === -1 ? '#F5C400' : '#555', border: `1.5px solid ${newActionPosition === -1 ? '#111' : '#E5E5E5'}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: 'left' }}>En dernier</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowAddAction(false); setNewActionTitle(''); setNewActionSub(''); setNewActionIcon('⭐'); setNewActionPosition(-1) }} style={{ background: '#F9F9F7', color: '#555', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                <button onClick={handleAddAction} style={{ background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT }}>Ajouter</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddAction(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', border: '1.5px dashed #F5C400', color: '#B8900A', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', marginTop: 4, fontFamily: FONT }}
              onMouseOver={e => { const el = e.currentTarget; el.style.background = '#fff'; el.style.borderColor = '#111'; el.style.color = '#111' }}
              onMouseOut={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.7)'; el.style.borderColor = '#F5C400'; el.style.color = '#B8900A' }}>
              <span style={{ width: 15, height: 15, background: '#F5C400', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#111' }}>+</span>
              Ajouter une action
            </button>
          )}
        </div>

        {/* ─── BLOC ENTRETIEN ──────────────────────────────────────────────── */}
        {isInterviewStep && (
          <div style={{ background: '#FEF9E0', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '2px solid #F5C400', boxShadow: '2px 2px 0 #F5C400' }}>
            <span style={{ ...sectionLabel, color: '#B8900A' }}>📅 Détails de l&apos;entretien</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date</label>
                <input type="date" className="interview-inp" key={job.interview_at || 'no-date'} value={job.interview_at ? job.interview_at.slice(0, 10) : ''} onChange={e => setJob(prev => prev ? { ...prev, interview_at: e.target.value || null } : prev)} onBlur={e => patchJob('interview_at', e.target.value || null)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Début</label>
                <input type="time" className="interview-inp" key={job.interview_time || 'no-time'} value={job.interview_time || ''} onChange={e => setJob(prev => prev ? { ...prev, interview_time: e.target.value || null } : prev)} onBlur={e => patchJob('interview_time', e.target.value || null)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fin</label>
                <input type="time" className="interview-inp" key={job.interview_time_end || 'no-end'} value={job.interview_time_end || ''} onChange={e => setJob(prev => prev ? { ...prev, interview_time_end: e.target.value || null } : prev)} onBlur={e => patchJob('interview_time_end', e.target.value || null)} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Type d&apos;entretien</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['telephone', 'visio', 'presentiel'] as const).map(t => (
                  <button key={t} className={`interview-type-btn${job.interview_type === t ? ' active' : ''}`} onClick={() => patchJob('interview_type', job.interview_type === t ? null : t)}>{INTERVIEW_TYPE_LABELS[t]}</button>
                ))}
              </div>
            </div>
            {job.interview_type === 'telephone' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📞 Numéro de téléphone</label>
                <input type="tel" className="interview-inp" placeholder="Ex : +33 6 12 34 56 78" key={job.interview_phone || 'no-phone'} value={job.interview_phone || ''} onChange={e => setJob(prev => prev ? { ...prev, interview_phone: e.target.value || null } : prev)} onBlur={e => patchJob('interview_phone', e.target.value || null)} />
              </div>
            )}
            {job.interview_type === 'visio' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>💻 Lien de la visio</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="url" className="interview-inp" placeholder="https://meet.google.com/..." key={job.interview_link || 'no-link'} value={job.interview_link || ''} onChange={e => setJob(prev => prev ? { ...prev, interview_link: e.target.value || null } : prev)} onBlur={e => patchJob('interview_link', e.target.value || null)} />
                  {job.interview_link && <button onClick={() => window.open(job.interview_link!, '_blank')} style={{ flexShrink: 0, background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>Rejoindre →</button>}
                </div>
              </div>
            )}
            {job.interview_type === 'presentiel' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🏢 Adresse</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="interview-inp" placeholder="Ex : 12 rue de la Paix, 75001 Paris" key={job.interview_location || 'no-loc'} value={job.interview_location || ''} onChange={e => setJob(prev => prev ? { ...prev, interview_location: e.target.value || null } : prev)} onBlur={e => patchJob('interview_location', e.target.value || null)} />
                  {job.interview_location && <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.interview_location!)}`, '_blank')} style={{ flexShrink: 0, background: '#111', color: '#F5C400', fontSize: 12, fontWeight: 800, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>Maps →</button>}
                </div>
              </div>
            )}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>👤 Contact pour l&apos;entretien</label>
              <select className="interview-inp" value={job.interview_contact_id || ''} onChange={e => patchJob('interview_contact_id', e.target.value || null)}>
                <option value="">— Aucun contact —</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.role ? ` – ${c.role}` : ''}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
              {selectedContact && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#B8900A' }}>
                  👤 {selectedContact.name}{selectedContact.role ? ` – ${selectedContact.role}` : ''}{selectedContact.company ? ` · ${selectedContact.company}` : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SYNTHÈSE ÉCHANGES ───────────────────────────────────────────── */}
        <div style={card}>
          <span style={sectionLabel}>Synthèse des échanges</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exchanges.map((ex, idx) => {
              const isOpen = openExchanges.has(ex.id); const isLatest = idx === exchanges.length - 1
              return (
                <div key={ex.id} style={{ border: `1.5px solid ${isLatest ? '#F5C400' : '#EBEBEB'}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div onClick={() => toggleExchange(ex.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isLatest ? '#FFFDE7' : '#F9F9F7', cursor: 'pointer' }}>
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
                              <select defaultValue={f.val} onChange={e => updateExchange(ex.id, f.field, e.target.value)} style={{ ...inp, background: '#fff' }}>
                                {(Object.entries(EXCHANGE_TYPE_LABELS) as [ExchangeType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            ) : (
                              <input type={f.type} defaultValue={f.val} style={inp} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee'; updateExchange(ex.id, f.field, e.target.value) }} />
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
                        <div key={field} style={{ marginBottom: 10 }}>
                          <label style={{ ...sectionLabel, marginBottom: 5 }}>{label}</label>
                          <textarea defaultValue={(ex as any)[field] ?? ''} placeholder={placeholder} onBlur={e => updateExchange(ex.id, field, e.target.value)} style={{ ...ta, minHeight: field === 'next_step' ? 52 : 76 }} onFocus={e => { e.target.style.borderColor = '#F5C400' }} />
                        </div>
                      ))}
                      <button onClick={() => deleteExchange(ex.id)} style={{ background: 'none', border: 'none', color: '#E8151B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, padding: 0, marginTop: 4 }}>Supprimer cet échange</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <button onClick={addExchange} style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', background: '#F9F9F7', border: '1.5px dashed #ddd', color: '#888', fontSize: 13, fontWeight: 700, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', marginTop: 8, fontFamily: FONT }}
            onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = '#F5C400'; el.style.color = '#111'; el.style.background = '#FFFDE7' }}
            onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = '#ddd'; el.style.color = '#888'; el.style.background = '#F9F9F7' }}>
            <span style={{ width: 19, height: 19, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>+</span>
            Ajouter un échange
          </button>
        </div>

        {/* DOCUMENTS + NOTES */}
        <div className="jfmj-docs-grid">
          <div style={{ ...card, marginBottom: 0 }}>
            <span style={sectionLabel}>Documents</span>
            {[{ sent: job.cv_sent, name: 'CV', url: job.cv_url }, { sent: job.cover_letter_sent, name: 'Lettre de motivation', url: job.cover_letter_url }].map(doc => (
              <div key={doc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F5F5F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 22, height: 22, background: doc.sent ? '#111' : '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {doc.sent && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" /></svg>}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#222', margin: 0, fontFamily: FONT }}>{doc.name}</p>
                    <p style={{ fontSize: 11, color: '#aaa', margin: 0, fontFamily: FONT, fontWeight: 500 }}>{doc.sent ? 'Envoyé — étape Postulé' : 'Non envoyé'}</p>
                  </div>
                </div>
                {doc.url && <button onClick={() => doc.url && window.open(doc.url, '_blank')} style={{ background: '#F9F9F7', color: '#111', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: '1.5px solid #EBEBEB', cursor: 'pointer', fontFamily: FONT }}>Voir</button>}
              </div>
            ))}
          </div>
          <div style={{ ...card, marginBottom: 0 }}>
            <span style={sectionLabel}>Mes notes</span>
            <textarea value={notes} onChange={e => handleNotesChange(e.target.value)} placeholder="Impressions générales, contacts, points à surveiller..." style={{ ...ta, minHeight: 100 }} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div style={card}>
          <span style={sectionLabel}>Description du poste</span>
          <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8, maxHeight: descExpanded ? 'none' : 200, overflow: 'hidden', position: 'relative', fontFamily: FONT, fontWeight: 500 }}>
            {job.description}
            {!descExpanded && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #fff)' }} />}
          </div>
          <button onClick={() => setDescExpanded(v => !v)} style={{ background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800, border: 'none', borderRadius: 9, padding: '9px 18px', cursor: 'pointer', marginTop: 12, fontFamily: FONT, boxShadow: '2px 2px 0 #E8151B' }}>
            {descExpanded ? 'Réduire ↑' : 'Lire la description complète ↓'}
          </button>
        </div>
      </div>

      {/* ════════ MODALES ════════════════════════════════════════════════════ */}

      {/* ── Modale Modifier offre ─────────────────────────────────────────── */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 540, border: '2px solid #111', boxShadow: '4px 4px 0 #111', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>✏️ Modifier l&apos;offre</h3>
              <button onClick={() => setShowEditModal(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ gridColumn: '1 / -1', marginBottom: 14 }}>
                <label className="fl">Intitulé du poste</label>
                <input className="fi" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Entreprise</label>
                <input className="fi" value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Lieu</label>
                <input className="fi" value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} placeholder="Paris · Hybride" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Type de contrat</label>
                <select className="fi" value={editForm.job_type} onChange={e => setEditForm(p => ({ ...p, job_type: e.target.value }))}>
                  {['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Salaire</label>
                <input className="fi" value={editForm.salary_text} onChange={e => setEditForm(p => ({ ...p, salary_text: e.target.value }))} placeholder="45-55k€ / an" />
              </div>
              <div style={{ gridColumn: '1 / -1', marginBottom: 14 }}>
                <label className="fl">Description du poste</label>
                <textarea className="fi" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={5} style={{ resize: 'vertical', minHeight: 120, marginBottom: 0 }} />
              </div>
              <div style={{ gridColumn: '1 / -1', marginBottom: 14 }}>
                <label className="fl">🏢 À propos de l&apos;entreprise</label>
                <textarea className="fi" value={editForm.company_description} onChange={e => setEditForm(p => ({ ...p, company_description: e.target.value }))} rows={3} style={{ resize: 'vertical', marginBottom: 0 }} placeholder="Secteur d'activité, valeurs, taille, histoire..." />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Site web entreprise</label>
                <input className="fi" value={editForm.company_website} onChange={e => setEditForm(p => ({ ...p, company_website: e.target.value }))} placeholder="https://www.entreprise.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Taille entreprise</label>
                <input className="fi" value={editForm.company_size} onChange={e => setEditForm(p => ({ ...p, company_size: e.target.value }))} placeholder="Ex : 500-1000 salariés, ETI..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={saveEdit} style={{ flex: 2, background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #E8151B' }}>Enregistrer →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Supprimer offre ────────────────────────────────────────── */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 30, width: '100%', maxWidth: 420, border: '2px solid #E8151B', boxShadow: '4px 4px 0 #E8151B' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#E8151B', margin: '0 0 8px', fontFamily: FONT }}>Suppression définitive</h3>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0, fontFamily: FONT }}>Cette action est <strong>irréversible</strong>.<br />Toutes les données seront supprimées.</p>
            </div>
            <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 4px', fontFamily: FONT }}>{job.title}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0, fontFamily: FONT }}>{job.company}</p>
            </div>
            <p style={{ fontSize: 12, color: '#555', marginBottom: 8, fontFamily: FONT }}>Pour confirmer, tapez : <strong style={{ color: '#E8151B' }}>SUPPRIMER</strong></p>
            <input className="fi" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="SUPPRIMER"
              style={{ textAlign: 'center', fontWeight: 800, letterSpacing: '0.1em', borderColor: deleteConfirmText === 'SUPPRIMER' ? '#E8151B' : '#E0E0E0' }} autoFocus />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={deleteJob} disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
                style={{ flex: 1, background: deleteConfirmText === 'SUPPRIMER' ? '#E8151B' : '#eee', color: deleteConfirmText === 'SUPPRIMER' ? '#fff' : '#aaa', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: 'none', cursor: deleteConfirmText === 'SUPPRIMER' ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
                {deleteLoading ? '…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Créer contact ──────────────────────────────────────────── */}
      {showCreateContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 480, border: '2px solid #111', boxShadow: '4px 4px 0 #7C3AED', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>👤 Créer une fiche contact</h3>
              <button onClick={() => setShowCreateContact(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <div style={{ background: '#F5F0FF', border: '1.5px solid #7C3AED', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#5B21B6', fontFamily: FONT }}>
              🔗 Ce contact sera lié à : <strong>{job.title}</strong> — {job.company}
            </div>
            {contactSaved ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1A7A4A', fontFamily: FONT }}>Contact créé avec succès !</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div style={{ marginBottom: 14 }}><label className="fl">Prénom *</label><input className="fi" value={contactFirstName} onChange={e => setContactFirstName(e.target.value)} placeholder="Philippe" autoFocus /></div>
                  <div style={{ marginBottom: 14 }}><label className="fl">Nom *</label><input className="fi" value={contactLastName} onChange={e => setContactLastName(e.target.value)} placeholder="Martin" /></div>
                </div>
                <div style={{ marginBottom: 14 }}><label className="fl">Fonction / Poste</label><input className="fi" value={contactRole} onChange={e => setContactRole(e.target.value)} placeholder="Ex : DRH, Directeur Marketing..." /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div style={{ marginBottom: 14 }}><label className="fl">Entreprise</label><input className="fi" value={contactCompany} onChange={e => setContactCompany(e.target.value)} placeholder="Lenôtre..." /></div>
                  <div style={{ marginBottom: 14 }}><label className="fl">Email</label><input className="fi" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="p.martin@..." /></div>
                  <div style={{ marginBottom: 14 }}><label className="fl">Téléphone</label><input className="fi" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+33 6..." /></div>
                  <div style={{ marginBottom: 14 }}><label className="fl">LinkedIn</label><input className="fi" value={contactLinkedin} onChange={e => setContactLinkedin(e.target.value)} placeholder="linkedin.com/in/..." /></div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setShowCreateContact(false)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                  <button onClick={saveContact} disabled={!contactFirstName.trim() || contactSaving}
                    style={{ flex: 2, background: (!contactFirstName.trim() || contactSaving) ? '#eee' : '#7C3AED', color: (!contactFirstName.trim() || contactSaving) ? '#aaa' : '#fff', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: 'none', cursor: contactFirstName.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT, boxShadow: contactFirstName.trim() ? '2px 2px 0 #111' : 'none' }}>
                    {contactSaving ? '…' : 'Créer le contact →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modale Suppression action ─────────────────────────────────────── */}
      {actionToDelete && (
        <div style={{ background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 400, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', margin: '0 20px' }}>
            <div style={{ fontSize: 26, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 8, textAlign: 'center', fontFamily: FONT }}>Supprimer cette action ?</h3>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>&ldquo;{actionToDelete.title}&rdquo;</p>
            <p style={{ fontSize: 12, color: '#E8151B', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setActionToDelete(null)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={confirmDeleteAction} style={{ flex: 1, background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Suppression étape ──────────────────────────────────────── */}
      {stepToDelete && (
        <div style={{ background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 400, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', margin: '0 20px' }}>
            <div style={{ fontSize: 26, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 8, textAlign: 'center', fontFamily: FONT }}>Supprimer cette étape ?</h3>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>&ldquo;{stepToDelete.label}&rdquo;</p>
            <p style={{ fontSize: 12, color: '#E8151B', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStepToDelete(null)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={async () => { await handleDeleteCustomStep(stepToDelete.id); setStepToDelete(null) }} style={{ flex: 1, background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
