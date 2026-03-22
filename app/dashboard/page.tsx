'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job, Contact, JobStatus, STATUS_COLORS, JobType } from '@/lib/jobs';

type View = 'kanban' | 'list' | 'contacts' | 'agenda' | 'stats';

// Étapes de base du pipeline
const DEFAULT_STAGES = [
  { id: 'to_apply', label: 'Envie de postuler ?', color: '#888', position: 1, is_default: true },
  { id: 'applied', label: 'Postulé', color: '#1A6FDB', position: 2, is_default: true },
  { id: 'phone_interview', label: 'Entretien téléphonique', color: '#B8900A', position: 3, is_default: true },
  { id: 'hr_interview', label: 'Entretien RH', color: '#B8500A', position: 4, is_default: true },
  { id: 'technical_interview', label: 'Entretien technique', color: '#7A1ADB', position: 5, is_default: true },
  { id: 'offer', label: 'Offre reçue', color: '#1A7A4A', position: 6, is_default: true },
  { id: 'archived', label: 'Archivé', color: '#aaa', position: 99, is_default: true },
];

type Stage = {
  id: string;
  label: string;
  color: string;
  position: number;
  is_default?: boolean;
};

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7) return `Il y a ${diff} jours`;
  return formatDate(dateStr) || '';
}

function cleanJobTitle(title: string | null | undefined): string {
  if (!title) return '';
  return title.replace(/\s*[\|]\s*(LinkedIn|Indeed|APEC|HelloWork|Welcome to the Jungle).*$/i, '').replace(/\s*-\s*(LinkedIn|Indeed|APEC|HelloWork|Welcome to the Jungle).*$/i, '').trim();
}

function cleanLocation(location: string | null | undefined): string {
  if (!location) return '';
  return location.replace(/^(Ville de |Province de |Région de |Department of )/i, '').trim();
}

function detectSource(url: string | null | undefined): string {
  if (!url) return '';
  const u = url.toLowerCase();
  if (u.includes('linkedin.com')) return 'LinkedIn';
  if (u.includes('indeed.')) return 'Indeed';
  if (u.includes('apec.fr')) return 'Apec';
  if (u.includes('hellowork.com')) return 'HelloWork';
  if (u.includes('welcometothejungle.com')) return 'Welcome to the Jungle';
  return 'Autre';
}

function HeartRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2, 3].map(i => (
        <span key={i} onClick={() => onChange(value === i ? 0 : i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
          style={{ fontSize: 22, cursor: 'pointer', color: (hovered >= i || value >= i) ? '#E8151B' : '#E0E0E0', transition: 'color 0.15s', display: 'inline-block', userSelect: 'none' }}>♥</span>
      ))}
      {value > 0 && <span style={{ fontSize: 10, color: '#E8151B', fontWeight: 700 }}>{value === 1 ? 'Intéressant' : value === 2 ? "J'aime bien" : 'Coup de cœur !'}</span>}
    </div>
  );
}

function HeartDisplay({ value }: { value: number }) {
  if (!value) return null;
  return <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>{[1, 2, 3].map(i => <span key={i} style={{ fontSize: 10, color: i <= value ? '#E8151B' : '#E0E0E0' }}>♥</span>)}</div>;
}

const EMPTY_JOB = { status: 'to_apply' as JobStatus, job_type: 'CDI' as JobType, title: '', company: '', location: '', description: '', notes: '', salary: '', source: '', url: '', favorite: 0 };

export default function DashboardPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('kanban');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newJob, setNewJob] = useState({ ...EMPTY_JOB });
  const [newContact, setNewContact] = useState<Partial<Contact>>({});
  const [addJobMode, setAddJobMode] = useState<null | 'url' | 'manual'>(null);
  const [importError, setImportError] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  // Upload document
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingLm, setUploadingLm] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const lmInputRef = useRef<HTMLInputElement>(null);
  // Synthèse entretien
  const [interviewSummary, setInterviewSummary] = useState('');
  // Settings - nouvelle étape
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#E8151B');
  const [newStagePosition, setNewStagePosition] = useState(3);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function authFetch(url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...(options.headers || {}) },
    });
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setAccessToken(session.access_token);
      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
      const meta = session.user.user_metadata;
      setFirstName(capitalize(meta?.first_name || meta?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || ''));

      const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };
      const [jr, cr] = await Promise.all([fetch('/api/jobs', { headers: h }), fetch('/api/contacts', { headers: h })]);
      const jd = await jr.json(); const cd = await cr.json();
      setJobs(jd.jobs || []); setContacts(cd.contacts || []);

      // Charger les étapes personnalisées
      const { data: customStages } = await supabase.from('pipeline_stages').select('*').eq('user_id', session.user.id).order('position');
      if (customStages && customStages.length > 0) {
        const allStages = [...DEFAULT_STAGES, ...customStages.map((s: any) => ({ id: s.id, label: s.label, color: s.color, position: s.position, is_default: false }))];
        allStages.sort((a, b) => a.position - b.position);
        setStages(allStages);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function addCustomStage() {
    if (!newStageName.trim() || !userId || !accessToken) return;
    const supabase = createClient();
    const { data } = await supabase.from('pipeline_stages').insert({
      user_id: userId,
      label: newStageName.trim(),
      color: newStageColor,
      position: newStagePosition,
    }).select().single();
    if (data) {
      const newStage: Stage = { id: data.id, label: data.label, color: data.color, position: data.position, is_default: false };
      const updated = [...stages, newStage].sort((a, b) => a.position - b.position);
      setStages(updated);
      setNewStageName('');
    }
  }

  async function deleteCustomStage(stageId: string) {
    if (!confirm('Supprimer cette étape ?')) return;
    const supabase = createClient();
    await supabase.from('pipeline_stages').delete().eq('id', stageId);
    setStages(prev => prev.filter(s => s.id !== stageId));
  }

  async function handleLogout() { const s = createClient(); await s.auth.signOut(); router.push('/'); }

  function openAddJobModal(defaultStatus?: string) {
    setNewJob({ ...EMPTY_JOB, status: (defaultStatus || 'to_apply') as JobStatus });
    setImportUrl(''); setImportError(false); setAddJobMode(null);
    setEditingJobId(null); setShowAddJob(true);
  }

  function openEditJobModal(job: Job) {
    setNewJob({
      status: job.status, job_type: job.job_type || 'CDI',
      title: job.title || '', company: job.company || '',
      location: job.location || '', description: job.description || '',
      notes: job.notes || '', salary: (job as any).salary_text || '',
      source: (job as any).source_platform || '', url: (job as any).source_url || '',
      favorite: (job as any).favorite || 0,
    });
    setEditingJobId(job.id); setAddJobMode('manual');
    setImportUrl(''); setImportError(false);
    setSelectedJob(null); setShowAddJob(true);
  }

  async function saveJob() {
    if (!newJob.title || !newJob.company) return;
    const payload = {
      title: newJob.title, company: newJob.company,
      location: newJob.location || '', description: newJob.description || '',
      job_type: newJob.job_type || 'CDI', status: newJob.status || 'to_apply',
      notes: newJob.notes || '',
      ...(newJob.salary ? { salary_text: newJob.salary } : {}),
      ...(newJob.source ? { source_platform: newJob.source } : {}),
      ...(newJob.url ? { source_url: newJob.url } : {}),
      ...(newJob.favorite !== undefined ? { favorite: newJob.favorite } : {}),
    };
    if (editingJobId) {
      const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id: editingJobId, ...payload }) });
      const data = await res.json();
      if (data.job) { setJobs(prev => prev.map(j => j.id === editingJobId ? data.job : j)); setShowAddJob(false); setEditingJobId(null); }
      else alert('Erreur : ' + (data.error || 'inconnue'));
    } else {
      const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.job) { setJobs(prev => [data.job, ...prev]); setShowAddJob(false); setNewJob({ ...EMPTY_JOB }); }
      else alert('Erreur : ' + (data.error || 'inconnue'));
    }
  }

  async function updateJobStatus(id: string, status: string) {
    const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id, status }) });
    const data = await res.json();
    if (data.job) { setJobs(prev => prev.map(j => j.id === id ? data.job : j)); if (selectedJob?.id === id) setSelectedJob(data.job); }
  }

  async function updateJobField(id: string, field: string, value: any) {
    const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id, [field]: value }) });
    const data = await res.json();
    if (data.job) { setJobs(prev => prev.map(j => j.id === id ? data.job : j)); if (selectedJob?.id === id) setSelectedJob(data.job); }
  }

  async function deleteJob(id: string) {
    if (!confirm('Supprimer cette offre ?')) return;
    await authFetch('/api/jobs?id=' + id, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id)); setSelectedJob(null);
  }

  async function saveContact() {
    const res = await authFetch('/api/contacts', { method: 'POST', body: JSON.stringify(newContact) });
    const data = await res.json();
    if (data.contact) { setContacts(prev => [data.contact, ...prev]); setShowAddContact(false); setNewContact({}); }
  }

  async function importJobFromUrl(url: string) {
    if (!url) return;
    setImportLoading(true); setImportError(false);
    try {
      const res = await authFetch('/api/jobs/import', { method: 'POST', body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setImportError(true); return; }
      const job = data.job || {};
      const description = (job.description && job.description.length > 150) ? job.description : (job.raw_text || job.description || '');
      setNewJob({ title: cleanJobTitle(job.title), company: job.company_name || '', location: cleanLocation(job.location_text), description, job_type: 'CDI', status: 'to_apply', notes: '', salary: job.salary_text || '', source: detectSource(url), url, favorite: 0 });
      setAddJobMode('manual');
    } catch { setImportError(true); }
    finally { setImportLoading(false); }
  }

 async function uploadDocument(jobId: string, file: File, type: 'cv' | 'lm') {
  if (!userId || !accessToken) return;
  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const path = `${userId}/${jobId}/${type}.${ext}`;
  const { error } = await supabase.storage.from('job-documents').upload(path, file, { upsert: true });
  if (error) { alert('Erreur upload : ' + error.message); return; }

  // URL signée valable 1 an (au lieu de URL publique)
  const { data: signedData } = await supabase.storage
    .from('job-documents')
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  const field = type === 'cv' ? 'cv_url' : 'cover_letter_url';
  const checkField = type === 'cv' ? 'cv_sent' : 'cover_letter_sent';
  await updateJobField(jobId, field, signedData?.signedUrl ?? '');
  await updateJobField(jobId, checkField, true);
}

  const filteredJobs = jobs.filter(j => (!searchQuery || j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase())) && (filterStatus === 'all' || j.status === filterStatus));
  const jobsByStatus = useCallback((s: string) => jobs.filter(j => j.status === s), [jobs]);
  const initials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
  const stats = { total: jobs.length, responseRate: jobs.length ? Math.round((jobs.filter(j => ['hr_interview','technical_interview','phone_interview','offer'].includes(j.status)).length / jobs.length) * 100) : 0, interviews: jobs.filter(j => ['phone_interview','hr_interview','technical_interview'].includes(j.status)).length, offers: jobs.filter(j => j.status === 'offer').length };

  // Stages sans "archivé" pour le kanban principal
  const kanbanStages = stages.filter(s => s.id !== 'archived');

  const isInterviewStage = (status: string) => ['phone_interview', 'hr_interview', 'technical_interview'].includes(status) || stages.find(s => s.id === status && !s.is_default);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat,sans-serif' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 32 }}>⚡</div><div style={{ fontWeight: 700, color: '#888' }}>Chargement...</div></div></div>;

  const LogoSVG = () => (
    <svg viewBox="0 0 60 52" width="28" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="30,1 37,10 46,3 43,13 54,9 49,19 58,20 51,27 57,35 47,32 51,41 41,37 43,47 34,40 30,47 26,40 17,47 19,37 9,41 13,32 3,35 9,27 2,20 11,19 6,9 17,13 14,3 23,10" fill="#111" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
      <polygon points="30,4 36,12 44,6 41,15 51,11 47,20 55,22 49,28 54,35 45,33 49,41 40,37 42,46 33,40 30,46 27,40 18,46 20,37 11,41 15,33 6,35 11,28 5,22 13,20 9,11 19,15 16,6 24,12" fill="#E8151B"/>
      <text x="30" y="25" textAnchor="middle" fontFamily="Impact,sans-serif" fontSize="13" fontWeight="900" fill="#F5C400" stroke="#111" strokeWidth="0.8" paintOrder="stroke">Jean</text>
      <rect x="9" y="28" width="42" height="11" rx="2" fill="#111"/>
      <text x="30" y="37" textAnchor="middle" fontFamily="Impact,sans-serif" fontSize="6" fontWeight="900" fill="#fff">find my job</text>
    </svg>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 3px; }
        .nav-btn { display: flex; align-items: center; gap: 9px; padding: 8px 12px; margin: 1px 6px; border-radius: 8px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); cursor: pointer; border: none; background: transparent; width: calc(100% - 12px); text-align: left; font-family: 'Montserrat', sans-serif; transition: all 0.15s; }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
        .nav-btn.active { background: rgba(232,21,27,0.2); color: #fff; border-left: 3px solid #E8151B; padding-left: 9px; }
        .jcard { background: #fff; border: 2px solid #111; border-radius: 8px; padding: 10px; margin-bottom: 7px; cursor: pointer; box-shadow: 2px 2px 0 #111; transition: all 0.15s; }
        .jcard:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; border-color: #E8151B; }
        .btn-main { display: inline-flex; align-items: center; gap: 6px; background: #111; color: #F5C400; border: 2px solid #111; border-radius: 8px; padding: 9px 18px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 #E8151B; letter-spacing: 0.02em; transition: all 0.15s; }
        .btn-main:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; }
        .btn-main:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-ghost { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #111; border: 2px solid #111; border-radius: 8px; padding: 9px 18px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 #E0E0E0; transition: all 0.15s; }
        .btn-ghost:hover { background: #F4F4F4; }
        .pill { display: inline-flex; align-items: center; border-radius: 5px; padding: 2px 7px; font-size: 10px; font-weight: 700; }
        .fi { width: 100%; border: 2px solid #E0E0E0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: 'Montserrat', sans-serif; outline: none; transition: border-color 0.15s; background: #fff; }
        .fi:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(17,17,17,0.06); }
        .fl { display: block; font-size: 10px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .lrow { display: grid; grid-template-columns: 2fr 1fr 0.8fr 1fr 0.8fr 60px; gap: 12px; padding: 11px 16px; border-bottom: 1.5px solid #E0E0E0; align-items: center; cursor: pointer; transition: background 0.15s; }
        .lrow:hover { background: #FAFAFA; }
        .ccard { background: #fff; border: 2px solid #111; border-radius: 10px; padding: 1rem; box-shadow: 2px 2px 0 #111; transition: all 0.2s; }
        .ccard:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; }
        .cbtn { flex: 1; padding: 5px; border-radius: 6px; border: 1.5px solid #E0E0E0; background: transparent; font-size: 11px; font-weight: 700; color: #888; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.15s; }
        .cbtn:hover { background: #FDEAEA; color: #E8151B; border-color: #E8151B; }
        .modal-bg { position: fixed; inset: 0; background: rgba(15,14,12,0.6); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .modal { background: #fff; border: 2px solid #111; border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 680px; max-height: 94vh; overflow-y: auto; box-shadow: 6px 6px 0 #111; }
        .stat-card { background: #fff; border: 2px solid #111; border-radius: 10px; padding: 0.875rem; box-shadow: 2px 2px 0 #111; }
        .add-card { border: 2px dashed #E0E0E0; border-radius: 8px; padding: 8px; text-align: center; font-size: 11px; color: #888; cursor: pointer; font-weight: 700; transition: all 0.15s; }
        .add-card:hover { border-color: #E8151B; color: #E8151B; background: #FDEAEA; }
        .date-tag { font-size: 9px; color: #aaa; font-weight: 600; margin-top: 5px; display: flex; align-items: center; gap: 3px; }
        .doc-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 6px; border: 1.5px solid #E0E0E0; background: #fff; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.15s; }
        .doc-btn:hover { border-color: #111; background: #F4F4F4; }
        .doc-btn.done { border-color: #1A7A4A; background: #E8F5EE; color: #1A7A4A; }
        .check-box { width: 16px; height: 16px; border: 2px solid #E0E0E0; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
        .check-box.checked { background: #1A7A4A; border-color: #1A7A4A; color: #fff; font-size: 10px; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 210, background: '#111', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoSVG />
          <Link href="/" style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', fontWeight: 900, color: '#fff', textDecoration: 'none' }}>Jean <span style={{ color: '#E8151B' }}>Find My Job</span></Link>
        </div>
        <div style={{ padding: '0.5rem 0.5rem 0.2rem', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recherche</div>
        {(['kanban','list','contacts','agenda','stats'] as View[]).map((v, i) => {
          const labels = ['Tableau de bord','Candidatures','Contacts','Entretiens','Statistiques'];
          const icons = ['📊','📋','👥','📅','📈'];
          const badges = [jobs.length, null, contacts.length, stats.interviews, null];
          return (
            <button key={v} className={'nav-btn' + (view === v ? ' active' : '')} onClick={() => setView(v)}>
              <span style={{ fontSize: 13 }}>{icons[i]}</span>
              <span style={{ flex: 1 }}>{labels[i]}</span>
              {badges[i] !== null && (badges[i] as number) > 0 && <span style={{ background: '#E8151B', color: '#F5C400', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 800 }}>{badges[i]}</span>}
            </button>
          );
        })}
        <div style={{ padding: '0.5rem 0.5rem 0.2rem', marginTop: '0.5rem', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Outils</div>
        <button className="nav-btn" onClick={() => router.push('/dashboard/editor')}><span style={{ fontSize: 13 }}>✦</span> CV Creator</button>
        <div style={{ marginTop: 'auto', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <button className="nav-btn" onClick={() => setShowSettings(true)} style={{ margin: '4px 6px' }}>
            <span style={{ fontSize: 13 }}>⚙️</span> Paramètres
          </button>
          <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={handleLogout}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8151B', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#F5C400' }}>{firstName ? firstName.charAt(0).toUpperCase() : initials(userEmail.split('@')[0])}</div>
              <div><div style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{firstName || userEmail.split('@')[0]}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Déconnexion</div></div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: '#fff', borderBottom: '2px solid #111', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'capitalize' }}>{today}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111' }}>Hello <span style={{ color: '#E8151B' }}>{firstName}</span> ! 👋</div>
          </div>
          <button className="btn-main" onClick={() => view === 'contacts' ? setShowAddContact(true) : openAddJobModal()}>{view === 'contacts' ? '+ Ajouter un contact' : '+ Ajouter une offre'}</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

          {['kanban','list','stats'].includes(view) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: '1.25rem' }}>
              {[{l:'Total',v:stats.total,c:'#111'},{l:'Taux réponse',v:stats.responseRate+'%',c:'#E8151B'},{l:'Entretiens',v:stats.interviews,c:'#1A7A4A'},{l:'Offres',v:stats.offers,c:'#B8900A'},{l:'Contacts',v:contacts.length,c:'#888'}].map(s => (
                <div key={s.l} className="stat-card"><div style={{ fontSize: 9, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.c }}>{s.v}</div></div>
              ))}
            </div>
          )}

          {/* KANBAN */}
          {view === 'kanban' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'start', overflowX: 'auto', paddingBottom: 8 }}>
              {stages.map(col => (
                <div key={col.id} style={{ background: '#F4F4F4', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: 8, minHeight: 180, minWidth: 160, flex: '0 0 auto', width: `${Math.max(160, Math.floor((100 / stages.length)))}px` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3 }}>{col.label}</div>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: col.color + '22', color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{jobsByStatus(col.id).length}</div>
                  </div>
                  {jobsByStatus(col.id).map(job => (
                    <div key={job.id} className="jcard" onClick={() => setSelectedJob(job)}>
                      <div style={{ fontSize: 9, color: '#888', fontWeight: 600, marginBottom: 2 }}>{job.company}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{job.title}</div>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 2 }}>
                        {job.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0', fontSize: 9 }}>{job.location}</span>}
                        {(job as any).salary_text && <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A', fontSize: 9 }}>💰 {(job as any).salary_text}</span>}
                      </div>
                      {(job as any).favorite > 0 && <HeartDisplay value={(job as any).favorite} />}
                      <div className="date-tag">📅 {formatRelative(job.created_at)}</div>
                    </div>
                  ))}
                  <div className="add-card" onClick={() => openAddJobModal(col.id)}>+ Ajouter</div>
                </div>
              ))}
            </div>
          )}

          {/* LIST */}
          {view === 'list' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '2px solid #E0E0E0', borderRadius: 8, padding: '7px 12px', flex: 1, maxWidth: 300 }}>
                  <span>🔍</span>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', fontFamily: 'Montserrat,sans-serif' }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="fi" style={{ width: 'auto' }}>
                  <option value="all">Tous les statuts</option>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
                <div className="lrow" style={{ background: '#F4F4F4', fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', cursor: 'default' }}>
                  <div>Poste / Entreprise</div><div>Localisation</div><div>Type</div><div>Statut</div><div>Créé le</div><div></div>
                </div>
                {filteredJobs.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Aucune candidature</div>}
                {filteredJobs.map(job => {
                  const stage = stages.find(s => s.id === job.status) || { color: '#888', label: job.status };
                  return (
                    <div key={job.id} className="lrow" onClick={() => setSelectedJob(job)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: '#FDEAEA', border: '1.5px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>{job.company.substring(0, 2).toUpperCase()}</div>
                        <div><div style={{ fontWeight: 700, fontSize: 13 }}>{job.title}</div><div style={{ fontSize: 11, color: '#888' }}>{job.company}</div></div>
                      </div>
                      <div style={{ fontSize: 13 }}>{job.location || '—'}</div>
                      <div><span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.job_type}</span></div>
                      <div><span className="pill" style={{ background: stage.color + '22', color: stage.color }}>{stage.label}</span></div>
                      <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{formatDate(job.created_at)}</div>
                      <div><button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: '#E8151B', borderColor: '#FDEAEA' }} onClick={e => { e.stopPropagation(); deleteJob(job.id); }}>✕</button></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {view === 'contacts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {contacts.length === 0 && <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#888' }}>Aucun contact — <button onClick={() => setShowAddContact(true)} style={{ color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Ajouter le premier</button></div>}
              {contacts.map(c => (
                <div key={c.id} className="ccard">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FDEAEA', border: '2px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>{initials(c.name)}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11, color: '#888' }}>{c.role}</div><div style={{ fontSize: 11, color: '#E8151B', fontWeight: 600 }}>{c.company}</div></div>
                  </div>
                  {c.email && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>📧 {c.email}</div>}
                  {c.phone && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>📞 {c.phone}</div>}
                  {c.linkedin && <div style={{ fontSize: 11, color: '#888' }}>🔗 {c.linkedin}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {c.email && <button className="cbtn" onClick={() => window.open('mailto:' + c.email)}>✉️ Email</button>}
                    {c.linkedin && <button className="cbtn" onClick={() => window.open(c.linkedin)}>💼 LinkedIn</button>}
                    <button className="cbtn" style={{ color: '#E8151B' }} onClick={() => authFetch('/api/contacts?id=' + c.id, { method: 'DELETE' }).then(() => setContacts(prev => prev.filter(x => x.id !== c.id)))}>✕</button>
                  </div>
                </div>
              ))}
              <div className="ccard" style={{ border: '2px dashed #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 150, boxShadow: 'none' }} onClick={() => setShowAddContact(true)}>
                <div style={{ textAlign: 'center', color: '#888' }}><div style={{ fontSize: 22, marginBottom: 6 }}>+</div><div style={{ fontSize: 12, fontWeight: 700 }}>Ajouter un contact</div></div>
              </div>
            </div>
          )}

          {/* AGENDA */}
          {view === 'agenda' && (
            <div>
              {jobs.filter(j => isInterviewStage(j.status)).length === 0
                ? <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#888', boxShadow: '3px 3px 0 #111' }}><div style={{ fontSize: 32, marginBottom: 12 }}>📅</div><div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 }}>Aucun entretien planifié</div><button className="btn-main" onClick={() => setView('kanban')}>Voir le tableau de bord</button></div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{jobs.filter(j => isInterviewStage(j.status)).map(job => {
                  const stage = stages.find(s => s.id === job.status);
                  return (
                    <div key={job.id} style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#B8900A', textTransform: 'uppercase' }}>{stage?.label || 'Entretien'}</div>
                        {job.interview_at && <div style={{ fontSize: 12, fontWeight: 800, color: '#B8900A' }}>{new Date(job.interview_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>}
                      </div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{job.title}</div><div style={{ fontSize: 12, color: '#888' }}>{job.company}{job.location && ' · ' + job.location}</div></div>
                      <button className="btn-main" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setSelectedJob(job)}>Voir détails</button>
                    </div>
                  );
                })}</div>
              }
            </div>
          )}

          {/* STATS */}
          {view === 'stats' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Répartition par statut</div>
                {stages.filter(s => s.id !== 'archived').map(col => { const count = jobsByStatus(col.id).length; const pct = jobs.length ? Math.round((count/jobs.length)*100) : 0; return (
                  <div key={col.id} style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{col.label}</span><span style={{ fontWeight: 800 }}>{count}</span></div><div style={{ height: 8, background: '#F4F4F4', borderRadius: 4 }}><div style={{ height: '100%', width: pct+'%', background: col.color, borderRadius: 4 }}/></div></div>
                ); })}
              </div>
              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Taux de conversion</div>
                {[{l:'Candidatures → Entretien',v:stats.responseRate,c:'#E8151B'},{l:'Entretien → Offre',v:stats.interviews?Math.round((stats.offers/stats.interviews)*100):0,c:'#1A7A4A'}].map(item => (
                  <div key={item.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.l}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ height: 6, width: 100, background: '#F4F4F4', borderRadius: 3 }}><div style={{ height: '100%', width: item.v+'%', background: item.c, borderRadius: 3 }}/></div><span style={{ fontSize: 12, fontWeight: 800, color: item.c, minWidth: 36 }}>{item.v}%</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DETAIL PANEL */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.5)', zIndex: 200 }} onClick={() => setSelectedJob(null)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 480, background: '#fff', borderLeft: '2px solid #111', padding: '1.5rem', overflowY: 'auto', boxShadow: '-4px 0 0 #111' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 3, fontWeight: 600 }}>{selectedJob.company}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{selectedJob.title}</div>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {selectedJob.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{selectedJob.location}</span>}
              {(selectedJob as any).salary_text && <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A' }}>💰 {(selectedJob as any).salary_text}</span>}
              {(() => { const stage = stages.find(s => s.id === selectedJob.status); return stage ? <span className="pill" style={{ background: stage.color + '22', color: stage.color }}>{stage.label}</span> : null; })()}
            </div>

            {(selectedJob as any).favorite > 0 && <div style={{ marginBottom: '0.75rem' }}><HeartDisplay value={(selectedJob as any).favorite} /></div>}
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: '1rem' }}>📅 Créé le {formatDate(selectedJob.created_at)}</div>

            {/* CHANGER STATUT */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="fl">Étape</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {stages.map(col => (
                  <button key={col.id} onClick={() => updateJobStatus(selectedJob.id, col.id)}
                    style={{ background: selectedJob.status === col.id ? col.color + '22' : '#fff', color: selectedJob.status === col.id ? col.color : '#888', border: `2px solid ${selectedJob.status === col.id ? col.color : '#E0E0E0'}`, borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DOCUMENTS — section compacte */}
            {(selectedJob.status === 'applied' || selectedJob.status !== 'to_apply') && (
              <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Documents</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* CV */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className={'check-box' + ((selectedJob as any).cv_sent ? ' checked' : '')} onClick={() => updateJobField(selectedJob.id, 'cv_sent', !(selectedJob as any).cv_sent)}>
                      {(selectedJob as any).cv_sent && '✓'}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>CV</span>
                    <button className={'doc-btn' + ((selectedJob as any).cv_url ? ' done' : '')}
                      onClick={() => { if ((selectedJob as any).cv_url) { window.open((selectedJob as any).cv_url); } else { cvInputRef.current?.click(); } }}>
                      {(selectedJob as any).cv_url ? '📎 Voir' : '📎 Joindre'}
                    </button>
                    <input ref={cvInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (f) { setUploadingCv(true); await uploadDocument(selectedJob.id, f, 'cv'); setUploadingCv(false); } }} />
                    {uploadingCv && <span style={{ fontSize: 10, color: '#888' }}>⏳</span>}
                  </div>

                  <div style={{ width: 1, background: '#E0E0E0' }} />

                  {/* LM */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className={'check-box' + ((selectedJob as any).cover_letter_sent ? ' checked' : '')} onClick={() => updateJobField(selectedJob.id, 'cover_letter_sent', !(selectedJob as any).cover_letter_sent)}>
                      {(selectedJob as any).cover_letter_sent && '✓'}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>LM</span>
                    <button className={'doc-btn' + ((selectedJob as any).cover_letter_url ? ' done' : '')}
                      onClick={() => { if ((selectedJob as any).cover_letter_url) { window.open((selectedJob as any).cover_letter_url); } else { lmInputRef.current?.click(); } }}>
                      {(selectedJob as any).cover_letter_url ? '📎 Voir' : '📎 Joindre'}
                    </button>
                    <input ref={lmInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (f) { setUploadingLm(true); await uploadDocument(selectedJob.id, f, 'lm'); setUploadingLm(false); } }} />
                    {uploadingLm && <span style={{ fontSize: 10, color: '#888' }}>⏳</span>}
                  </div>
                </div>
              </div>
            )}

            {/* SYNTHÈSE ENTRETIEN */}
            {isInterviewStage(selectedJob.status) && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="fl">Synthèse de l&apos;entretien</label>
                <textarea
                  defaultValue={(selectedJob as any).interview_summary || ''}
                  placeholder="Notes sur le déroulement, questions posées, impressions..."
                  className="fi"
                  rows={4}
                  style={{ resize: 'vertical' }}
                  onBlur={async e => { await updateJobField(selectedJob.id, 'interview_summary', e.target.value); }}
                />
              </div>
            )}

            {/* DESCRIPTION */}
            {selectedJob.description && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="fl">Description</label>
                <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.6, maxHeight: 180, overflowY: 'auto' }}>{selectedJob.description}</div>
              </div>
            )}

            {/* NOTES */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="fl">Mes notes</label>
              <textarea defaultValue={selectedJob.notes || ''} placeholder="Notes, impressions..." className="fi" style={{ resize: 'vertical', minHeight: 70 }}
                onBlur={async e => { await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id: selectedJob.id, notes: e.target.value }) }); }} />
            </div>

            <button className="btn-main" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => router.push('/dashboard/editor?targetJob=' + encodeURIComponent(selectedJob.title + ' chez ' + selectedJob.company))}>✦ Générer un CV pour ce poste →</button>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => openEditJobModal(selectedJob)}>✏️ Modifier l&apos;offre</button>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: '#E8151B', borderColor: '#FDEAEA' }} onClick={() => deleteJob(selectedJob.id)}>Supprimer</button>
          </div>
        </div>
      )}

      {/* ADD / EDIT JOB MODAL */}
      {showAddJob && (
        <div className="modal-bg" onClick={() => setShowAddJob(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{editingJobId ? "Modifier l'offre" : 'Ajouter une offre'}</h2>
              <button onClick={() => setShowAddJob(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            {!addJobMode && !editingJobId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{mode:'url',icon:'🔗',title:'Importer depuis une URL',sub:'Importer automatiquement depuis un jobboard'},{mode:'manual',icon:'✍️',title:'Remplir manuellement',sub:'Créer une offre à partir de zéro'}].map(opt => (
                  <button key={opt.mode} onClick={() => setAddJobMode(opt.mode as 'url'|'manual')} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1rem 1.25rem', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', textAlign: 'left', boxShadow: '2px 2px 0 #111', width: '100%' }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform='translate(-1px,-1px)'; (e.currentTarget as HTMLElement).style.boxShadow='3px 3px 0 #E8151B'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.boxShadow='2px 2px 0 #111'; }}>
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    <div><div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 2 }}>{opt.title}</div><div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{opt.sub}</div></div>
                  </button>
                ))}
              </div>
            )}

            {addJobMode === 'url' && !editingJobId && (
              <div>
                <button onClick={() => { setAddJobMode(null); setImportError(false); setImportUrl(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 12, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>
                <div style={{ marginBottom: 14 }}><label className="fl">URL de l&apos;offre</label><input className="fi" placeholder="https://www.linkedin.com/jobs/view/..." value={importUrl} onChange={e => setImportUrl(e.target.value)} /></div>
                {importError && (
                  <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>Impossible d&apos;importer cette offre automatiquement.</div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Vous pouvez la remplir manuellement.</div>
                    <button className="btn-main" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => { setAddJobMode('manual'); setImportError(false); }}>→ Remplir manuellement</button>
                  </div>
                )}
                {!importError && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAddJobMode(null)}>Annuler</button>
                    <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={() => importJobFromUrl(importUrl)} disabled={!importUrl || importLoading}>{importLoading ? '⏳ Import en cours...' : "Importer l'offre →"}</button>
                  </div>
                )}
              </div>
            )}

            {addJobMode === 'manual' && (
              <div>
                {!editingJobId && <button onClick={() => setAddJobMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>}
                <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coup de cœur ?</div>
                  <HeartRating value={newJob.favorite} onChange={v => setNewJob(prev => ({ ...prev, favorite: v }))} />
                </div>
                <div style={{ maxHeight: '62vh', overflowY: 'auto', paddingRight: 4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <div style={{ marginBottom: 14 }}><label className="fl">Type de contrat</label><select className="fi" value={newJob.job_type} onChange={e => setNewJob(prev => ({ ...prev, job_type: e.target.value as JobType }))}>{['CDI','CDD','Freelance','Stage','Alternance'].map(t => <option key={t}>{t}</option>)}</select></div>
                    <div style={{ marginBottom: 14 }}><label className="fl">Étape</label>
                      <select className="fi" value={newJob.status} onChange={e => setNewJob(prev => ({ ...prev, status: e.target.value as JobStatus }))}>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}><label className="fl">Intitulé du poste *</label><input className="fi" value={newJob.title} onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))} placeholder="Chief Marketing Officer H/F" /></div>
                    <div style={{ marginBottom: 14 }}><label className="fl">Entreprise *</label><input className="fi" value={newJob.company} onChange={e => setNewJob(prev => ({ ...prev, company: e.target.value }))} placeholder="Decathlon" /></div>
                    <div style={{ marginBottom: 14 }}><label className="fl">Source</label><select className="fi" value={newJob.source} onChange={e => setNewJob(prev => ({ ...prev, source: e.target.value }))}><option value="">Choisir...</option>{['LinkedIn','Indeed','Welcome to the Jungle','Apec','Pôle Emploi','Site entreprise','Réseau','HelloWork','Autre'].map(s => <option key={s}>{s}</option>)}</select></div>
                    <div style={{ marginBottom: 14 }}><label className="fl">Lieu</label><input className="fi" value={newJob.location} onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))} placeholder="Paris · Hybride" /></div>
                    <div style={{ marginBottom: 14 }}><label className="fl">Salaire</label><input className="fi" value={newJob.salary} onChange={e => setNewJob(prev => ({ ...prev, salary: e.target.value }))} placeholder="45-55k€ / an" /></div>
                    <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}><label className="fl">Lien de l&apos;offre</label><input className="fi" value={newJob.url} onChange={e => setNewJob(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..." /></div>
                    <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}><label className="fl">Description du poste</label><textarea className="fi" value={newJob.description} onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))} placeholder="Missions, compétences requises..." rows={5} style={{ resize: 'vertical', minHeight: 120 }} /></div>
                    <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}><label className="fl">Mes notes personnelles</label><textarea className="fi" value={newJob.notes} onChange={e => setNewJob(prev => ({ ...prev, notes: e.target.value }))} placeholder="Mes impressions, points à vérifier..." rows={3} style={{ resize: 'vertical' }} /></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddJob(false)}>Annuler</button>
                  <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={saveJob} disabled={!newJob.title || !newJob.company}>{editingJobId ? 'Enregistrer' : 'Ajouter l\'offre'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddContact && (
        <div className="modal-bg" onClick={() => setShowAddContact(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Ajouter un contact</h2>
              <button onClick={() => setShowAddContact(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            {[{l:'Nom complet *',k:'name',p:'Sophie Martin'},{l:'Rôle',k:'role',p:'Talent Acquisition'},{l:'Entreprise',k:'company',p:'BNP Paribas'},{l:'Email',k:'email',p:'s.martin@bnp.fr'},{l:'Téléphone',k:'phone',p:'+33 6 12 34 56 78'},{l:'LinkedIn',k:'linkedin',p:'linkedin.com/in/...'}].map(f => (
              <div key={f.k} style={{ marginBottom: 12 }}><label className="fl">{f.l}</label><input className="fi" value={(newContact as any)[f.k] || ''} onChange={e => setNewContact(prev => ({ ...prev, [f.k]: e.target.value }))} placeholder={f.p} /></div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddContact(false)}>Annuler</button>
              <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={saveContact} disabled={!newContact.name}>Ajouter le contact</button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="modal-bg" onClick={() => setShowSettings(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>⚙️ Paramètres du pipeline</h2>
              <button onClick={() => setShowSettings(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            {/* Étapes existantes */}
            <label className="fl" style={{ marginBottom: 10 }}>Étapes actuelles</label>
            <div style={{ marginBottom: 20 }}>
              {stages.map(stage => (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{stage.label}</span>
                  <span style={{ fontSize: 10, color: '#aaa' }}>pos. {stage.position}</span>
                  {!stage.is_default && (
                    <button onClick={() => deleteCustomStage(stage.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E8151B', fontSize: 14, padding: '0 4px' }}>✕</button>
                  )}
                  {stage.is_default && <span style={{ fontSize: 9, color: '#aaa', fontWeight: 700 }}>DÉFAUT</span>}
                </div>
              ))}
            </div>

            {/* Ajouter une étape */}
            <label className="fl" style={{ marginBottom: 10 }}>Ajouter une étape personnalisée</label>
            <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="fl">Nom de l&apos;étape</label>
                  <input className="fi" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Ex: Test technique" />
                </div>
                <div>
                  <label className="fl">Couleur</label>
                  <input type="color" value={newStageColor} onChange={e => setNewStageColor(e.target.value)} style={{ width: 44, height: 42, border: '2px solid #E0E0E0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                </div>
                <div>
                  <label className="fl">Position</label>
                  <input type="number" className="fi" value={newStagePosition} onChange={e => setNewStagePosition(Number(e.target.value))} style={{ width: 60 }} min={1} max={98} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
                💡 La position détermine l&apos;ordre dans le pipeline. Ex: 3.5 s&apos;insère entre 3 et 4.
              </div>
              <button className="btn-main" style={{ width: '100%', justifyContent: 'center' }} onClick={addCustomStage} disabled={!newStageName.trim()}>
                + Ajouter cette étape
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
