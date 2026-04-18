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
import ParcoursBannerModal from './components/ParcoursBannerModal'
import JobArchivedDetails from './components/JobArchivedDetails'
import RgpdConsentModal from '@/components/RgpdConsentModal'
import SecureStorageNotice from '@/components/SecureStorageNotice'

const FONT = "'Montserrat', sans-serif"

const BASE_STEPS = [
  { id: 'to_apply',          label: 'Envie de postuler',      num: 1 },
  { id: 'applied',           label: 'Postulé',                num: 2 },
  { id: 'phone_interview',   label: 'Entretien téléphonique', num: 3 },
  { id: 'hr_interview',      label: 'Entretien RH',           num: 4 },
  { id: 'manager_interview', label: 'Entretien manager',      num: 5 },
  { id: 'offer',             label: 'Offre reçue',            num: 6 },
  { id: 'archived',          label: 'Archivé',                num: 7 },
]

const BASE_STEP_POSITIONS: Record<string, number> = {
  to_apply:          1000,
  applied:           2000,
  phone_interview:   3000,
  hr_interview:      4000,
  manager_interview: 5000,
  offer:             6000,
  archived:          7000,
}

const INTERVIEW_STEP_IDS = ['phone_interview', 'hr_interview', 'manager_interview']

const STATUS_MAP: Record<string, string> = {
  to_apply: 'to_apply', applied: 'applied',
  phone_interview: 'in_progress', hr_interview: 'in_progress',
  manager_interview: 'in_progress', offer: 'offer', archived: 'archived',
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
  interview_contacts: Record<string, string> | null
  interview_location: string | null; interview_link: string | null; interview_phone: string | null
  company_description: string | null; company_website: string | null
  company_size: string | null; department: string | null; source_platform: string | null
  recruitment_process: string | null
  hidden_steps: string[] | null
  step_dates: Record<string, string> | null
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
  const [stagesLabelMap, setStagesLabelMap] = useState<Record<string, string>>({})
  useEffect(() => {
    const supabase = createClient()
    supabase.from('jobs').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setJobs(data)
    })
    supabase.from('pipeline_stages').select('id, label').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((s: any) => { map[s.id] = s.label })
        setStagesLabelMap(map)
      }
    })
  }, [])
  return (
    <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden', background: '#fff', borderRight: '1.5px solid #EBEBEB', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '1.5px solid #EBEBEB', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111', letterSpacing: '-0.2px' }}>Tableau de bord</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', background: '#F5F5F0', padding: '2px 8px', borderRadius: 20 }}>{jobs.length}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {jobs.map(job => {
          const isActive = job.id === currentJobId
          const statusColor = STATUS_COLORS[job.status] ?? STATUS_COLORS['to_apply']
          const stepLabel = job.sub_status
  ? (SUB_STATUS_LABELS[job.sub_status] ?? stagesLabelMap[job.sub_status] ?? STATUS_LABELS[job.status])
  : STATUS_LABELS[job.status]
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
  const [hiddenSteps, setHiddenSteps] = useState<string[]>([])
  const [stepDates, setStepDates] = useState<Record<string, string>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [recruitmentExpanded, setRecruitmentExpanded] = useState(false)
  const [companyExpanded, setCompanyExpanded] = useState(true)
  const [notes, setNotes] = useState('')
  const [contacts, setContacts] = useState<ContactMin[]>([])
  const [showCoverLetter, setShowCoverLetter] = useState(true)
  const notesTimer = useRef<NodeJS.Timeout | null>(null)
  const savedExchangeDatesRef = useRef<string>('')
  const [uploadingDoc, setUploadingDoc] = useState<'cv' | 'cover_letter' | null>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)
  const coverLetterInputRef = useRef<HTMLInputElement>(null)

  // ─── RGPD : fichier en attente + état modale ────────────────────────────────
  const [pendingUpload, setPendingUpload] = useState<{ file: File, docType: 'cv' | 'cover_letter' } | null>(null)
  const [rgpdModalOpen, setRgpdModalOpen] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
 const [editForm, setEditForm] = useState({
    title: '', company: '', location: '', job_type: 'CDI',
    salary_text: '', description: '',
    company_description: '', company_website: '', company_size: '',
    recruitment_process: '',
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

  // ─── Chargement ────────────────────────────────────────────────────────────
  const loadJob = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUserId(session.user.id)
      if (typeof window !== 'undefined') (window as any).__jfmj_token = session.access_token
    }
    const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single()
    if (data) {
      setJob(data)
      setNotes(data.notes ?? '')
      setHiddenSteps(data.hidden_steps ?? [])
      setStepDates(data.step_dates ?? {})
    }
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

  const loadCoverLetterVisibility = useCallback(async (stepId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('job_step_actions')
      .select('id')
      .eq('job_id', jobId)
      .eq('step_id', stepId)
      .ilike('title', '%LM%')
    setShowCoverLetter(data === null || data.length > 0)
  }, [jobId])

  useEffect(() => {
    loadJob().then(() => {
      Promise.all([loadCustomSteps(), loadExchanges(), loadContacts()]).finally(() => setLoading(false))
    })
  }, [loadJob, loadCustomSteps, loadExchanges, loadContacts])

  useEffect(() => { if (userId) loadContacts() }, [userId])

  useEffect(() => {
    if (!exchanges.length) return
    const visibleBase = BASE_STEPS.filter(s => !hiddenSteps.includes(s.id))
    const stepsByLabel: Record<string, string> = {}
    for (const s of visibleBase) stepsByLabel[s.label] = s.id
    for (const s of customSteps) stepsByLabel[s.label] = s.id

    const fromExchanges: Record<string, string> = {}
    for (const exchange of exchanges) {
      if (!exchange.step_label || !exchange.exchange_date) continue
      const stepId = stepsByLabel[exchange.step_label]
      if (!stepId) continue
      if (!fromExchanges[stepId] || exchange.exchange_date > fromExchanges[stepId]) {
        fromExchanges[stepId] = exchange.exchange_date
      }
    }
    const toSave: Record<string, string> = {}
    for (const [stepId, date] of Object.entries(fromExchanges)) {
      if (!stepDates[stepId]) toSave[stepId] = date
    }
    if (!Object.keys(toSave).length) return
    const key = JSON.stringify(toSave)
    if (key === savedExchangeDatesRef.current) return
    savedExchangeDatesRef.current = key
    const merged = { ...stepDates, ...toSave }
    setStepDates(merged)
    fetch(`/api/jobs?id=${jobId}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ step_dates: merged }),
    })
  }, [exchanges.length, customSteps.length, hiddenSteps.length])

  // ─── Construction de allSteps ──────────────────────────────────────────────
  const visibleBase = BASE_STEPS.filter(s => !hiddenSteps.includes(s.id))

  const allStepsMerged = [
    ...visibleBase.map(s => ({ id: s.id, label: s.label, sortPos: BASE_STEP_POSITIONS[s.id] })),
    ...customSteps.map(cs => ({ id: cs.id, label: cs.label, sortPos: cs.position })),
  ].sort((a, b) => a.sortPos - b.sortPos)

  const allSteps = allStepsMerged.map((s, i) => ({ id: s.id, label: s.label, num: i + 1 }))

  const stepDatesFromExchanges: Record<string, string> = {}
  for (const exchange of exchanges) {
    if (!exchange.step_label || !exchange.exchange_date) continue
    const step = allSteps.find(s => s.label === exchange.step_label)
    if (!step) continue
    if (!stepDatesFromExchanges[step.id] || exchange.exchange_date < stepDatesFromExchanges[step.id]) {
      stepDatesFromExchanges[step.id] = exchange.exchange_date
    }
  }
  const mergedStepDates = { ...stepDates, ...stepDatesFromExchanges }

  const currentStepId = job?.sub_status || job?.status || 'to_apply'
  const currentStepIndex = allSteps.findIndex(s => s.id === currentStepId)
  const currentStepLabel = allSteps.find(s => s.id === currentStepId)?.label ?? ''
  const isInterviewStep =
    (INTERVIEW_STEP_IDS.includes(currentStepId) || customSteps.some(cs => cs.id === currentStepId))
    && !hiddenSteps.includes(currentStepId)

  useEffect(() => {
    if (currentStepId) loadCoverLetterVisibility(currentStepId)
  }, [currentStepId, loadCoverLetterVisibility])

  // ─── FIX : handleStepClick avec refresh session + filet de sécurité API ───
  const handleStepClick = async (stepId: string) => {
    if (!job) return
    const globalStatus = STATUS_MAP[stepId] ?? 'in_progress'
    const patch = { sub_status: stepId, status: globalStatus, updated_at: new Date().toISOString() }

    // Mise à jour optimiste de l'UI immédiatement
    setJob(prev => prev ? { ...prev, ...patch } : prev)

    // 1. Rafraîchir la session pour éviter les échecs silencieux à la réouverture
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session && typeof window !== 'undefined') {
      (window as any).__jfmj_token = session.access_token
    }

    // 2. Sauvegarde directe Supabase
    const { error } = await supabase.from('jobs').update(patch).eq('id', jobId)

    // 3. Si la sauvegarde directe échoue → filet de sécurité via API
    if (error) {
      console.error('Erreur sauvegarde étape (direct Supabase):', error)
      await fetch(`/api/jobs?id=${jobId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ sub_status: stepId, status: globalStatus }),
      })
    }
  }

  const handleHideBaseStep = useCallback(async (stepId: string) => {
    const updated = [...hiddenSteps, stepId]
    setHiddenSteps(updated)
    await fetch(`/api/jobs?id=${jobId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ hidden_steps: updated }),
    })
  }, [hiddenSteps, jobId])

  const handleStepDatesChange = useCallback(async (dates: Record<string, string>) => {
    setStepDates(dates)
    await fetch(`/api/jobs?id=${jobId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ step_dates: dates }),
    })
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

  // ─── RGPD : upload après acceptation ────────────────────────────────────────
  // Flow : clic "Charger" → file picker → user choisit un fichier →
  //        handleFileSelected() stocke le fichier et ouvre la modale →
  //        user coche + accepte → handleRgpdAccept() → vrai upload
  const handleFileSelected = (file: File, docType: 'cv' | 'cover_letter') => {
    if (!file) return
    setPendingUpload({ file, docType })
    setRgpdModalOpen(true)
  }

  const handleRgpdAccept = () => {
    if (pendingUpload) {
      handleDocumentUpload(pendingUpload.file, pendingUpload.docType)
    }
    setPendingUpload(null)
    setRgpdModalOpen(false)
  }

  const handleRgpdClose = () => {
    setPendingUpload(null)
    setRgpdModalOpen(false)
  }

  const handleDocumentUpload = async (file: File, docType: 'cv' | 'cover_letter') => {
    if (!file || !userId) return
    setUploadingDoc(docType)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}/${jobId}/${docType}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('job-documents')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: signedData } = await supabase.storage
        .from('job-documents')
        .createSignedUrl(path, 60 * 60 * 24 * 365)
      if (!signedData?.signedUrl) throw new Error('URL non générée')
      const urlField = docType === 'cv' ? 'cv_url' : 'cover_letter_url'
      await fetch(`/api/jobs?id=${jobId}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ [urlField]: signedData.signedUrl }),
      })
      setJob(prev => prev ? { ...prev, [urlField]: signedData.signedUrl } : prev)
    } catch (err) {
      console.error('Erreur upload document:', err)
      alert('Erreur lors du chargement du fichier. Veuillez réessayer.')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleDeleteDocument = async (docType: 'cv' | 'cover_letter') => {
    if (!confirm('Supprimer ce document ?')) return
    const urlField = docType === 'cv' ? 'cv_url' : 'cover_letter_url'
    await fetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ [urlField]: null }) })
    setJob(prev => prev ? { ...prev, [urlField]: null } : prev)
  }

  function openEditModal() {
    if (!job) return
    setEditForm({
      title: job.title || '', company: job.company || '', location: job.location || '',
      job_type: job.job_type || 'CDI', salary_text: job.salary_text || '',
      description: job.description || '', company_description: job.company_description || '',
      company_website: job.company_website || '', company_size: job.company_size || '',
      recruitment_process: job.recruitment_process || '',
    })
    setShowEditModal(true)
  }

  async function saveEdit() {
    const res = await fetch('/api/jobs', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ id: jobId, ...editForm }) })
    const data = await res.json()
    if (data.job) { setJob(data.job); setShowEditModal(false) }
  }

  async function deleteJob() {
    if (deleteConfirmText !== 'SUPPRIMER') return
    setDeleteLoading(true)
    await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE', headers: authHeaders() })
    router.push('/dashboard')
  }

  const addExchange = async () => {
    const step = allSteps.find(s => s.id === currentStepId)
    const res = await fetch('/api/jobs/exchanges', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        job_id: jobId,
        title: 'Nouvel échange',
        exchange_type: 'autre',
        exchange_date: new Date().toISOString().split('T')[0],
        step_label: step?.label ?? null,
        step_number: step?.num ?? null,
      })
    })
    if (res.ok) { const newEx = await res.json(); setExchanges(prev => [...prev, newEx]) }
  }

  const updateExchange = async (id: string, field: string, value: string) => {
    setExchanges(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    await fetch(`/api/jobs/exchanges?id=${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ [field]: value }) })
  }

  const deleteExchange = async (id: string) => {
    await fetch(`/api/jobs/exchanges?id=${id}`, { method: 'DELETE', headers: authHeaders() })
    setExchanges(prev => prev.filter(e => e.id !== id))
  }

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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}><p style={{ color: '#999', fontWeight: 700, fontSize: 15 }}>Chargement…</p></div>
  if (!job) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0', fontFamily: FONT }}><p style={{ color: '#E8151B', fontWeight: 700, fontSize: 15 }}>Offre introuvable.</p></div>

  const atsScore = job.ats_score ?? null
  const atsKw = job.ats_keywords ?? { present: [], missing: [] }
  const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }

  const sectionLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: '#555',
    marginBottom: 14,
    display: 'block',
    fontFamily: FONT,
  }

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500 }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 80, lineHeight: '1.6' }

  const transmittedBy = extractTransmittedBy(job.notes)
  const transmittedByAlreadyContact = transmittedBy
    ? contacts.some(c => c.name.toLowerCase().includes(transmittedBy.toLowerCase().split(' ')[0].toLowerCase()))
    : false

  const docItems = [
    { docType: 'cv' as const, sent: job.cv_sent, name: 'CV', url: job.cv_url, inputRef: cvInputRef },
    { docType: 'cover_letter' as const, sent: job.cover_letter_sent, name: 'Lettre de motivation', url: job.cover_letter_url, inputRef: coverLetterInputRef },
  ]

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
        .doc-upload-btn { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 7px; border: 1.5px solid #EBEBEB; cursor: pointer; font-family: ${FONT}; transition: all 0.15s; }
        .doc-upload-btn:hover { border-color: #111; }
      `}</style>

      <div className="jfmj-sidebar">
        <JobSidebar currentJobId={jobId} onSelect={(id) => router.push(`/dashboard/job/${id}`)} />
      </div>

      <div className="jfmj-main">
        <div className="jfmj-back-mobile" style={{ display: 'none', marginBottom: 14 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#111', cursor: 'pointer', fontFamily: FONT }}>← Tableau de bord</button>
        </div>

        <JobHeader
          job={job} jobId={jobId}
          onBack={() => router.back()}
          onEdit={openEditModal}
          onDelete={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }}
          onGenerateCV={() => router.push(`/dashboard/editor?job_id=${jobId}`)}
        />

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

        <JobStepProgress
          jobId={jobId}
          userId={userId}
          currentStepId={currentStepId}
          customSteps={customSteps}
          allSteps={allSteps}
          allStepsMerged={allStepsMerged}
          currentStepIndex={currentStepIndex}
          onStepClick={handleStepClick}
          onCustomStepsChange={setCustomSteps}
          onHideBaseStep={handleHideBaseStep}
          stepDates={mergedStepDates}
          onStepDatesChange={handleStepDatesChange}
        />
{currentStepId === 'archived' && (
  <JobArchivedDetails
    archivedReason={(job as any).archived_reason ?? null}
    archivedNote={(job as any).archived_note ?? null}
    onPatch={patchJob}
    onJobChange={(field, value) => setJob(prev => prev ? { ...prev, [field]: value } : prev)}
    currentStepNum={currentStepIndex + 1}
  />
)}
       {isInterviewStep && (
          <JobInterviewDetails
            job={job}
            contacts={contacts}
            onPatch={patchJob}
            onJobChange={(field, value) => setJob(prev => prev ? { ...prev, [field]: value } : prev)}
            onCreateContact={() => openCreateContact('')}
            currentStepNum={currentStepIndex + 1}
            currentStepId={currentStepId}
            currentStepLabel={currentStepLabel}
          />
        )}

       {currentStepId !== 'archived' && (
  <JobStepActions
    jobId={jobId}
    userId={userId}
    currentStepId={currentStepId}
    currentStepLabel={currentStepLabel}
    currentStepIndex={currentStepIndex}
    jobTitle={job.title}
  />
)}

        <JobExchanges
          exchanges={exchanges}
          onAdd={addExchange}
          onUpdate={updateExchange}
          onDelete={deleteExchange}
        />

        <div className="jfmj-docs-grid">
          <div style={{ ...card, marginBottom: 0 }}>
            <span style={sectionLabel}>Documents</span>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file, 'cv')
                // Reset l'input pour permettre de re-choisir le même fichier si l'utilisateur annule la modale RGPD
                e.target.value = ''
              }}
            />
            <input
              ref={coverLetterInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file, 'cover_letter')
                e.target.value = ''
              }}
            />
            {docItems.map(doc => (
              <div key={doc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F5F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 22, height: 22, background: doc.url ? '#111' : '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {doc.url && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" /></svg>}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#222', margin: 0, fontFamily: FONT }}>{doc.name}</p>
                    <p style={{ fontSize: 11, color: doc.url ? '#1A7A4A' : '#aaa', margin: 0, fontFamily: FONT, fontWeight: 500 }}>
                      {uploadingDoc === doc.docType ? '⏳ Chargement…' : doc.url ? '✓ Fichier chargé' : 'Aucun fichier'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {doc.url && <button className="doc-upload-btn" onClick={() => window.open(doc.url!, '_blank')} style={{ background: '#F9F9F7', color: '#111' }}>Voir</button>}
                  <button className="doc-upload-btn" onClick={() => doc.inputRef.current?.click()} disabled={uploadingDoc !== null} style={{ background: doc.url ? '#F9F9F7' : '#111', color: doc.url ? '#111' : '#F5C400' }}>
                    {uploadingDoc === doc.docType ? '…' : doc.url ? 'Remplacer' : 'Charger'}
                  </button>
                  {doc.url && <button className="doc-upload-btn" onClick={() => handleDeleteDocument(doc.docType)} style={{ background: 'transparent', color: '#E8151B', borderColor: '#E8151B' }}>✕</button>}
                </div>
              </div>
            ))}
            {/* Notice RGPD permanente sous la liste des documents */}
            <SecureStorageNotice compact />
          </div>
          <div style={{ ...card, marginBottom: 0 }}>
            <span style={sectionLabel}>Mes notes</span>
            <textarea value={notes} onChange={e => handleNotesChange(e.target.value)} placeholder="Impressions générales, contacts, points à surveiller..." style={{ ...ta, minHeight: 100 }} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} />
          </div>
        </div>

        <div style={card}>
          <span style={sectionLabel}>Description du poste</span>
          <div style={{ position: 'relative', maxHeight: descExpanded ? 'none' : 200, overflow: 'hidden' }}>
            <div
              dangerouslySetInnerHTML={{ __html: job.description }}
              style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontFamily: FONT, fontWeight: 500 }}
            />
            {!descExpanded && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #fff)' }} />}
          </div>
          <span onClick={() => setDescExpanded(v => !v)} style={{ fontSize: 13, fontWeight: 700, color: '#111', textDecoration: 'underline', cursor: 'pointer', marginTop: 12, display: 'inline-block', fontFamily: FONT }}>
            {descExpanded ? 'Réduire ↑' : 'Lire la suite →'}
          </span>
        </div>

        {(job.recruitment_process) && (
          <div style={card}>
            <span style={sectionLabel}>Processus de recrutement</span>
            <div style={{ position: 'relative', maxHeight: recruitmentExpanded ? 'none' : 120, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontFamily: FONT, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {job.recruitment_process}
              </div>
              {!recruitmentExpanded && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, #fff)' }} />}
            </div>
            <span onClick={() => setRecruitmentExpanded(v => !v)} style={{ fontSize: 13, fontWeight: 700, color: '#111', textDecoration: 'underline', cursor: 'pointer', marginTop: 10, display: 'inline-block', fontFamily: FONT }}>
              {recruitmentExpanded ? 'Réduire ↑' : 'Lire la suite →'}
            </span>
          </div>
        )}

        <JobCompanySection job={job} expanded={companyExpanded} onToggle={() => setCompanyExpanded(v => !v)} />
      </div>

      {job && (
        <ParcoursBannerModal
          jobId={jobId}
          status={job.status}
          stepDates={mergedStepDates}
        />
      )}

      {showEditModal && (
        <EditJobModal editForm={editForm} onChange={(field, value) => setEditForm(p => ({ ...p, [field]: value }))} onSave={saveEdit} onClose={() => setShowEditModal(false)} />
      )}

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
            <input className="fi" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="SUPPRIMER" style={{ textAlign: 'center', fontWeight: 800, letterSpacing: '0.1em', borderColor: deleteConfirmText === 'SUPPRIMER' ? '#E8151B' : '#E0E0E0' }} autoFocus />
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

      {/* ─── Modale RGPD — s'affiche avant CHAQUE upload CV/LM ─── */}
      <RgpdConsentModal
        isOpen={rgpdModalOpen}
        onClose={handleRgpdClose}
        onAccept={handleRgpdAccept}
        documentType={pendingUpload?.docType === 'cover_letter' ? 'lettre de motivation' : 'CV'}
      />
    </div>
  )
}
