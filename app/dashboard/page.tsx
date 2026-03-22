'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job, Contact, JobStatus } from '@/lib/jobs';

import Sidebar from './components/Sidebar';
import KanbanView from './components/KanbanView';
import ListView from './components/ListView';
import ContactsView from './components/ContactsView';
import { AgendaView, StatsView } from './components/AgendaStatsViews';
import JobDetailPanel from './components/JobDetailPanel';
import JobModal from './components/JobModal';
import { ContactModal, SettingsModal } from './components/Modals';

import {
  View, Stage, NewJobState,
  DEFAULT_STAGES, EMPTY_JOB, GLOBAL_STYLES,
  capitalize, cleanJobTitle, cleanLocation, detectSource, isInterviewStage,
} from './components/types';

export default function DashboardPage() {
  const router = useRouter();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('kanban');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newJob, setNewJob] = useState<NewJobState>({ ...EMPTY_JOB });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [addJobMode, setAddJobMode] = useState<null | 'url' | 'manual'>(null);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({});
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
      const { data: customStages } = await supabase.from('pipeline_stages').select('*').eq('user_id', session.user.id).order('position');
      if (customStages && customStages.length > 0) {
        const all = [...DEFAULT_STAGES, ...customStages.map((s: any) => ({ id: s.id, label: s.label, color: s.color, position: s.position, is_default: false }))].sort((a, b) => a.position - b.position);
        setStages(all);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const stats = {
    total: jobs.length,
    responseRate: jobs.length ? Math.round((jobs.filter(j => isInterviewStage(j.status, stages) || j.status === 'offer').length / jobs.length) * 100) : 0,
    interviews: jobs.filter(j => isInterviewStage(j.status, stages)).length,
    offers: jobs.filter(j => j.status === 'offer').length,
  };

  function openAddJobModal(defaultStatus?: string) {
    setNewJob({ ...EMPTY_JOB, status: (defaultStatus || 'to_apply') as JobStatus });
    setImportUrl(''); setImportError(false); setAddJobMode(null); setEditingJobId(null); setShowAddJob(true);
  }

  function openEditJobModal(job: Job) {
    setNewJob({ status: job.status, job_type: job.job_type || 'CDI', title: job.title || '', company: job.company || '', location: job.location || '', description: job.description || '', notes: job.notes || '', salary: (job as any).salary_text || '', source: (job as any).source_platform || '', url: (job as any).source_url || '', favorite: (job as any).favorite || 0 });
    setEditingJobId(job.id); setAddJobMode('manual'); setImportUrl(''); setImportError(false); setSelectedJob(null); setShowAddJob(true);
  }

  async function saveJob() {
    if (!newJob.title || !newJob.company) return;
    const payload = { title: newJob.title, company: newJob.company, location: newJob.location || '', description: newJob.description || '', job_type: newJob.job_type || 'CDI', status: newJob.status || 'to_apply', notes: newJob.notes || '', ...(newJob.salary ? { salary_text: newJob.salary } : {}), ...(newJob.source ? { source_platform: newJob.source } : {}), ...(newJob.url ? { source_url: newJob.url } : {}), ...(newJob.favorite !== undefined ? { favorite: newJob.favorite } : {}) };
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

  async function saveContact() {
    const res = await authFetch('/api/contacts', { method: 'POST', body: JSON.stringify(newContact) });
    const data = await res.json();
    if (data.contact) { setContacts(prev => [data.contact, ...prev]); setShowAddContact(false); setNewContact({}); }
  }

  async function deleteContact(id: string) {
    await authFetch('/api/contacts?id=' + id, { method: 'DELETE' });
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  async function addCustomStage() {
    if (!newStageName.trim() || !userId) return;
    const supabase = createClient();
    const { data } = await supabase.from('pipeline_stages').insert({ user_id: userId, label: newStageName.trim(), color: newStageColor, position: newStagePosition }).select().single();
    if (data) {
      const updated = [...stages, { id: data.id, label: data.label, color: data.color, position: data.position, is_default: false }].sort((a, b) => a.position - b.position);
      setStages(updated); setNewStageName('');
    }
  }

  async function deleteCustomStage(stageId: string) {
    if (!confirm('Supprimer cette étape ?')) return;
    const supabase = createClient();
    await supabase.from('pipeline_stages').delete().eq('id', stageId);
    setStages(prev => prev.filter(s => s.id !== stageId));
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat,sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32 }}>⚡</div><div style={{ fontWeight: 700, color: '#888' }}>Chargement...</div></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: "'Montserrat', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      <Sidebar view={view} setView={setView} firstName={firstName} userEmail={userEmail} jobCount={jobs.length} contactCount={contacts.length} interviewCount={stats.interviews} onSettings={() => setShowSettings(true)} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: '#fff', borderBottom: '2px solid #111', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'capitalize' }}>{today}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111' }}>Hello <span style={{ color: '#E8151B' }}>{firstName}</span> ! 👋</div>
          </div>
          <button className="btn-main" onClick={() => view === 'contacts' ? setShowAddContact(true) : openAddJobModal()}>
            {view === 'contacts' ? '+ Ajouter un contact' : '+ Ajouter une offre'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {['kanban', 'list', 'stats'].includes(view) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: '1.25rem' }}>
              {[{ l: 'Total', v: stats.total, c: '#111' }, { l: 'Taux réponse', v: stats.responseRate + '%', c: '#E8151B' }, { l: 'Entretiens', v: stats.interviews, c: '#1A7A4A' }, { l: 'Offres', v: stats.offers, c: '#B8900A' }, { l: 'Contacts', v: contacts.length, c: '#888' }].map(s => (
                <div key={s.l} className="stat-card">
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'kanban' && <KanbanView jobs={jobs} stages={stages} onJobClick={setSelectedJob} onAddJob={openAddJobModal} />}
          {view === 'list' && <ListView jobs={jobs} stages={stages} onJobClick={setSelectedJob} onDeleteJob={deleteJob} onAddJob={openAddJobModal} />}
          {view === 'contacts' && <ContactsView contacts={contacts} onAddContact={() => setShowAddContact(true)} onDeleteContact={deleteContact} />}
          {view === 'agenda' && <AgendaView jobs={jobs} stages={stages} onJobClick={setSelectedJob} onBackToKanban={() => setView('kanban')} />}
          {view === 'stats' && <StatsView jobs={jobs} stages={stages} contactCount={contacts.length} />}
        </div>
      </main>

      {selectedJob && (
        <JobDetailPanel job={selectedJob} stages={stages} userId={userId} accessToken={accessToken} onClose={() => setSelectedJob(null)} onStatusChange={updateJobStatus} onFieldUpdate={updateJobField} onEdit={openEditJobModal} onDelete={deleteJob} />
      )}

      {showAddJob && (
        <JobModal editingJobId={editingJobId} newJob={newJob} setNewJob={setNewJob} stages={stages} importUrl={importUrl} setImportUrl={setImportUrl} addJobMode={addJobMode} setAddJobMode={setAddJobMode} importError={importError} setImportError={setImportError} importLoading={importLoading} onImport={importJobFromUrl} onSave={saveJob} onClose={() => setShowAddJob(false)} />
      )}

      {showAddContact && (
        <ContactModal newContact={newContact} setNewContact={setNewContact} onSave={saveContact} onClose={() => setShowAddContact(false)} />
      )}

      {showSettings && (
        <SettingsModal stages={stages} newStageName={newStageName} setNewStageName={setNewStageName} newStageColor={newStageColor} setNewStageColor={setNewStageColor} newStagePosition={newStagePosition} setNewStagePosition={setNewStagePosition} onAddStage={addCustomStage} onDeleteStage={deleteCustomStage} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
