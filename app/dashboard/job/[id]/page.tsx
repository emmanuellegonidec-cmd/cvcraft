'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { JobExchange, EXCHANGE_TYPE_LABELS } from '@/lib/types'

import JobHeader from './components/JobHeader'
import JobCompanySection from './components/JobCompanySection'
import JobInterviewDetails from './components/JobInterviewDetails'
import JobExchanges from './components/JobExchanges'
import JobStepProgress from './components/JobStepProgress'
import JobStepActions from './components/JobStepActions'
import EditJobModal from './components/EditJobModal'

const FONT = "'Montserrat', sans-serif"

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
  company_description: string | null; company_website: string | null
  company_size: string | null; department: string | null; source_platform: string | null
}

interface ContactMin { id: string; name: string; role?: string | null; company?: string | null }
interface CustomStep { id: string; label: string; position: number }

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
function getToken(): string | null {
  if (typeof window !== 'undefined') return (window as any).__jfmj_token ?? null
  return null
}
function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}
function extractTransmittedBy(notes: string | null): string | null {
  if (!notes) return null
  const match = notes.match(/Transmis par\s*:\s*(.+?)(?:\n|$)/i)
  return match ? match[1].trim() : null
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
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

// ─── Page principale ──────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [exchanges, setExchanges] = useState<JobExchange[]>([])
  const [customSteps, setCustomSteps] = useState<CustomStep[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [companyExpanded, setCompanyExpanded] = useState(true)
  const [notes, setNotes] = useState('')
  const [contacts, setContacts] = useState<ContactMin[]>([])
  const notesTimer = useRef<NodeJS.Timeout | null>(null)

  // Modales
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '', company: '', location: '', job_type: 'CDI',
    salary_text: '', description: '',
    company_description: '', company_website: '', company_size: '',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Contact
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

  // ─── Chargement ────────────────────────────────────────────────────────────
  const loadJob = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUserId(session.user.id)
      if (typeof window !== 'undefined') (window as any).__jfmj_token = session.access_token
    }
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
    if (res.ok) setExchanges(await res.json())
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
    const interval = setInterval(() => loadJob(), 30000)
    return () => clearInterval(interval)
  }, [loadJob])

  useEffect(() => { if (userId) loadContacts() }, [userId])

  // ─── Steps ─────────────────────────────────────────────────────────────────
  const sortedCustom = [...customSteps].sort((a, b) => a.position - b.position)
  const allSteps = [
    ...BASE_STEPS.slice(0, 5),
    ...sortedCustom.map((cs, i) => ({ id: cs.id, label: cs.label, num: 6 + i })),
    { ...BASE_STEPS[5], num: 6 + customSteps.length },
  ]
  const currentStepId = job?.sub_status || job?.status || 'to_apply'
  const currentStepIndex = allSteps.findIndex(s => s.id === currentStepId)
  const currentStepLabel = allSteps.find(s => s.id === currentStepId)?.label ?? ''
  const isInterviewStep = INTERVIEW_STEP_IDS.includes(currentStepId) || customSteps.some(cs => cs.id === currentStepId)

  const handleStepClick = async (stepId: string) => {
    if (!job) return
    const globalStatus = STATUS_MAP[stepId] ?? 'in_progress'
    const patch = { sub_status: stepId, status: globalStatus }
    setJob(prev => prev ? { ...prev, ...patch } : prev)
    const res = await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(patch) })
    if (res.ok) { const data = await res.json(); if (data.job) setJob(data.job) }
  }

  // ─── Patch rapide ───────────────────────────────────────────────────────────
  const patchJob = useCallback(async (field: string, value: any) => {
    setJob(prev => prev ? { ...prev, [field]: value } : prev)
    await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ [field]: value }) })
  }, [jobId])

  // ─── Notes ─────────────────────────────────────────────────────────────────
  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ notes: val }) })
    }, 800)
  }

  // ─── Modifier ──────────────────────────────────────────────────────────────
  function openEditModal() {
    if (!job) return
    setEditForm({
      title: job.title || '', company: job.company || '', location: job.location || '',
      job_type: job.job_type || 'CDI', salary_text: job.salary_text || '',
      description: job.description || '', company_description: job.company_description || '',
      company_website: job.company_website || '', company_size: job.company_size || '',
    })
    setShowEditModal(true)
  }

  async function saveEdit() {
    const res = await fetch('/api/jobs', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ id: jobId, ...editForm }) })
    const data = await res.json()
    if (data.job) { setJob(data.job); setShowEditModal(false) }
  }

  // ─── Supprimer ─────────────────────────────────────────────────────────────
  async function deleteJob() {
    if (deleteConfirmText !== 'SUPPRIMER') return
    setDeleteLoading(true)
    await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE', headers: authHeaders() })
    router.push('/dashboard')
  }

  // ─── Échanges ──────────────────────────────────────────────────────────────
  const addExchange = async () => {
    const step = allSteps.find(s => s.id === currentStepId)
    const res = await fetch('/api/jobs/exchanges', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ job_id: jobId, title: 'Nouvel échange', exchange_type: 'autre', exchange_date: new Date().toISOString().split('T')[0], step_label: step?.label ?? null }) })
    if (res.ok) { const newEx = await res.json(); setExchanges(prev => [...prev, newEx]) }
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

  // ─── Contact ───────────────────────────────────────────────────────────────
  function openCreateContact(transmittedBy: string) {
    const parts = transmittedBy.trim().split(/\s+/)
    setContactFirstName(parts[0] || ''); setContactLastName(parts.slice(1).join(' ') || '')
    setContactRole(''); setContactCompany(job?.company || '')
    setContactEmail(''); setContactPhone(''); setContactLinkedin('')
    setContactSaved(false); setShowCreateContact(true)
  }

  async function saveContact() {
    setContactSaving(true)
    const fullName = [contactFirstName.trim(), contactLastName.trim()].filter(Boolean).join(' ')
    const token = getToken()
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name: fullName, role: contactRole.trim() || null, company: contactCompany.trim() || null, email: contactEmail.trim() || null, phone: contactPhone.trim() || null, linkedin: contactLinkedin.trim() || null, job_id: jobId }),
    })
    setContactSaving(false)
    if (res.ok) { setContactSaved(true); await loadContacts(); setTimeout(() => setShowCreateContact(false), 1500) }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}><p style={{ color: '#999', fontWeight: 700, fontSize: 15 }}>Chargement…</p></div>
  if (!job) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}><p style={{ color: '#E8151B', fontWeight: 700, fontSize: 15 }}>Offre introuvable.</p></div>

  const atsScore = job.ats_score ?? null
  const atsKw = job.ats_keywords ?? { present: [], missing: [] }
  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }
  const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#666', marginBottom: 14, display: 'block', fontFamily: FONT }
  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500 }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80, lineHeight: '1.6' }

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

      <div className="jfmj-sidebar">
        <JobSidebar currentJobId={jobId} onSelect={(id) => router.push(`/dashboard/job/${id}`)} />
      </div>

      <div className="jfmj-main">
        <div className="jfmj-back-mobile" style={{ display: 'none', marginBottom: 14 }}>
          <button onClick={() => router.back()} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#111', cursor: 'pointer', fontFamily: FONT }}>← Mes candidatures</button>
        </div>

        {/* Header */}
        <JobHeader
          job={job}
          jobId={jobId}
          onBack={() => router.back()}
          onEdit={openEditModal}
          onDelete={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }}
          onGenerateCV={() => router.push(`/dashboard/editor?job_id=${jobId}`)}
        />

        {/* Transmis par */}
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

        {/* Score ATS */}
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

        {/* Parcours */}
        <JobStepProgress
          jobId={jobId}
          userId={userId}
          currentStepId={currentStepId}
          customSteps={customSteps}
          allSteps={allSteps}
          currentStepIndex={currentStepIndex}
          onStepClick={handleStepClick}
          onCustomStepsChange={setCustomSteps}
        />

        {/* Étape active + actions */}
        <JobStepActions
          jobId={jobId}
          userId={userId}
          currentStepId={currentStepId}
          currentStepLabel={currentStepLabel}
          currentStepIndex={currentStepIndex}
        />

        {/* Entretien */}
        {isInterviewStep && (
          <JobInterviewDetails
            job={job}
            contacts={contacts}
            onPatch={patchJob}
            onJobChange={(field, value) => setJob(prev => prev ? { ...prev, [field]: value } : prev)}
          />
        )}

        {/* Échanges */}
        <JobExchanges
          exchanges={exchanges}
          onAdd={addExchange}
          onUpdate={updateExchange}
          onDelete={deleteExchange}
        />

        {/* Documents + Notes */}
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

        {/* Description */}
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

        {/* À propos de l'entreprise */}
        <JobCompanySection
          job={job}
          expanded={companyExpanded}
          onToggle={() => setCompanyExpanded(v => !v)}
        />
      </div>

      {/* ── Modale Modifier ─────────────────────────────────────────────────── */}
      {showEditModal && (
        <EditJobModal
          editForm={editForm}
          onChange={(field, value) => setEditForm(p => ({ ...p, [field]: value }))}
          onSave={saveEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* ── Modale Supprimer ────────────────────────────────────────────────── */}
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

      {/* ── Modale Créer contact ─────────────────────────────────────────────── */}
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
                  <div style={{ marginBottom: 14 }}><label className="fl">Entreprise</label><input className="fi" value={contactCompany} onChange={e => setContactCompany(e.target.value)} /></div>
                  <div style={{ marginBottom: 14 }}><label className="fl">Email</label><input className="fi" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
                  <div style={{ marginBottom: 14 }}><label className="fl">Téléphone</label><input className="fi" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} /></div>
                  <div style={{ marginBottom: 14 }}><label className="fl">LinkedIn</label><input className="fi" value={contactLinkedin} onChange={e => setContactLinkedin(e.target.value)} /></div>
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
    </div>
  )
}
