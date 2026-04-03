'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { SettingsModal } from './components/Modals';
import DashboardCalendar from './components/DashboardCalendar';

import {
  View, Stage, NewJobState,
  DEFAULT_STAGES, EMPTY_JOB, GLOBAL_STYLES,
  capitalize, cleanJobTitle, cleanLocation, detectSource, isInterviewStage,
} from './components/types';

const STATUS_TO_SUB: Record<string, string> = {
  to_apply:    'to_apply',
  applied:     'applied',
  in_progress: 'phone_interview',
  offer:       'offer',
  archived:    'archived',
};

export default function DashboardPage() {
  const router = useRouter();

  const [accessToken, setAccessToken]     = useState<string | null>(null);
  const [userId, setUserId]               = useState<string | null>(null);
  const [userEmail, setUserEmail]         = useState('');
  const [firstName, setFirstName]         = useState('');
  const [jobs, setJobs]                   = useState<Job[]>([]);
  const [contacts, setContacts]           = useState<Contact[]>([]);
  const [stages, setStages]               = useState<Stage[]>(DEFAULT_STAGES);
  const [loading, setLoading]             = useState(true);
  const [view, setView]                   = useState<View>('kanban');
  const [selectedJob, setSelectedJob]     = useState<Job | null>(null);
  const [showAddJob, setShowAddJob]       = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [triggerAddContact, setTriggerAddContact] = useState(0);
  const [newJob, setNewJob]               = useState<NewJobState>({ ...EMPTY_JOB });
  const [editingJobId, setEditingJobId]   = useState<string | null>(null);
  const [addJobMode, setAddJobMode]       = useState<null | 'url' | 'manual' | 'file' | 'spontaneous'>(null);
  const [importUrl, setImportUrl]         = useState('');
  const [importError, setImportError]     = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const extraJobFields = useRef<Record<string, string>>({});
  const [newStageName, setNewStageName]   = useState('');
  const [newStageColor, setNewStageColor] = useState('#E8151B');
  const [newStagePosition, setNewStagePosition] = useState(3);

  // Ref pour capturer newJob de façon synchrone au moment du save
  const newJobRef = useRef<NewJobState>({ ...EMPTY_JOB });

  useEffect(() => {
    newJobRef.current = newJob;
  }, [newJob]);

  useEffect(() => {
    if (accessToken) (window as any).__jfmj_token = accessToken;
  }, [accessToken]);

  // ✅ Date du jour affichée en fuseau France
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Europe/Paris',
  });

  function authFetch(url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  const fetchJobs = useCallback(async (token: string) => {
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const jr = await fetch('/api/jobs', { headers: h });
    const jd = await jr.json();
    setJobs(jd.jobs || []);
  }, []);

  const handleRefresh = useCallback(() => {
    if (accessToken) fetchJobs(accessToken);
  }, [accessToken, fetchJobs]);

  const fetchContacts = useCallback(async () => {
    if (!accessToken) return;
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
    const cr = await fetch('/api/contacts', { headers: h });
    const cd = await cr.json();
    setContacts(cd.contacts || []);
  }, [accessToken]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setAccessToken(session.access_token);
      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
      const meta = session.user.user_metadata;
      setFirstName(capitalize(
        meta?.first_name || meta?.full_name?.split(' ')[0] ||
        session.user.email?.split('@')[0] || ''
      ));
      const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };
      const [jr, cr] = await Promise.all([
        fetch('/api/jobs', { headers: h }),
        fetch('/api/contacts', { headers: h }),
      ]);
      const jd = await jr.json();
      const cd = await cr.json();
      setJobs(jd.jobs || []);
      setContacts(cd.contacts || []);

      const { data: customStages } = await supabase
        .from('pipeline_stages').select('*')
        .eq('user_id', session.user.id).is('job_id', null).order('position');

      if (customStages && customStages.length > 0) {
        const all = [
          ...DEFAULT_STAGES,
          ...customStages.map((s: any) => ({ id: s.id, label: s.label, color: s.color, position: s.position, is_default: false })),
        ].sort((a, b) => a.position - b.position);
        setStages(all);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const stats = {
    total: jobs.length,
    responseRate: jobs.length
      ? Math.round((jobs.filter(j => isInterviewStage(j.status, stages) || j.status === 'offer').length / jobs.length) * 100)
      : 0,
    interviews: jobs.filter(j => isInterviewStage(j.status, stages)).length,
    offers: jobs.filter(j => j.status === 'offer').length,
  };

  function openAddJobModal(defaultStatus?: string) {
    setNewJob({ ...EMPTY_JOB, status: (defaultStatus || 'to_apply') as JobStatus });
    extraJobFields.current = {};
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
    // Lire newJob depuis le ref (valeur synchrone la plus récente)
    const job = newJobRef.current;
    if (!job.title || !job.company) return;

    // Lire les champs entreprise depuis extraJobFields (remontés par FileImportMode)
    const extras = extraJobFields.current || {};

    const payload = {
      title: job.title, company: job.company,
      location: job.location || '', description: job.description || '',
      job_type: job.job_type || 'CDI', status: job.status || 'to_apply',
      notes: job.notes || '',
      ...(job.salary   ? { salary_text: job.salary }             : {}),
      ...(job.source   ? { source_platform: job.source }         : {}),
      ...(job.url      ? { source_url: job.url }                 : {}),
      ...(job.favorite !== undefined ? { favorite: job.favorite } : {}),
      // Champs entreprise : d'abord extraJobFields (import fichier), puis newJob si déjà fusionné
      company_description: extras.company_description || (job as any).company_description || '',
      company_website:     extras.company_website     || (job as any).company_website     || '',
      company_size:        extras.company_size        || (job as any).company_size        || '',
    };

    // Nettoyer les champs vides pour ne pas écraser des valeurs existantes
    if (!payload.company_description) delete (payload as any).company_description;
    if (!payload.company_website)     delete (payload as any).company_website;
    if (!payload.company_size)        delete (payload as any).company_size;

    if (editingJobId) {
      const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id: editingJobId, ...payload }) });
      const data = await res.json();
      if (data.job) { setJobs(prev => prev.map(j => j.id === editingJobId ? data.job : j)); setShowAddJob(false); setEditingJobId(null); }
      else alert('Erreur : ' + (data.error || 'inconnue'));
    } else {
      const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.job) { setJobs(prev => [data.job, ...prev]); setShowAddJob(false); setNewJob({ ...EMPTY_JOB }); extraJobFields.current = {}; }
      else alert('Erreur : ' + (data.error || 'inconnue'));
    }
  }

  async function updateJobStatus(id: string, newStatus: string) {
    const subStatus = STATUS_TO_SUB[newStatus] ?? newStatus;
    const now = new Date().toISOString();

    // Mise à jour optimiste côté UI
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus as JobStatus, sub_status: subStatus } as any : j));
    if (selectedJob?.id === id) setSelectedJob(prev => prev ? { ...prev, status: newStatus as JobStatus } : prev);

    // PATCH vers l'API — route.ts gère stage_changed_at et interview_at automatiquement
    const res = await authFetch(`/api/jobs?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, sub_status: subStatus }),
    });
    const data = await res.json();
    if (data.job) {
      setJobs(prev => prev.map(j => j.id === id ? data.job : j));
      if (selectedJob?.id === id) setSelectedJob(data.job);
    }
  }

  async function updateJobField(id: string, field: string, value: any) {
    const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id, [field]: value }) });
    const data = await res.json();
    if (data.job) {
      setJobs(prev => prev.map(j => j.id === id ? data.job : j));
      if (selectedJob?.id === id) setSelectedJob(data.job);
    }
  }

  async function handleCalendarDateChange(jobId: string, field: string, newDate: Date) {
    const iso = newDate.toISOString();
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, [field]: iso } as any : j));
    if (selectedJob?.id === jobId) setSelectedJob(prev => prev ? { ...prev, [field]: iso } as any : prev);
    const res = await authFetch(`/api/jobs?id=${jobId}`, { method: 'PATCH', body: JSON.stringify({ [field]: iso }) });
    const data = await res.json();
    if (data.job) {
      setJobs(prev => prev.map(j => j.id === jobId ? data.job : j));
      if (selectedJob?.id === jobId) setSelectedJob(data.job);
    }
  }

  function handleCalendarJobClick(jobId: string) {
    const job = jobs.find(j => j.id === jobId);
    if (job) setSelectedJob(job);
  }

  async function deleteJob(id: string) {
    if (!confirm('Supprimer cette offre ?')) return;
    await authFetch('/api/jobs?id=' + id, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
    setSelectedJob(null);
  }

  async function importJobFromUrl(url: string) {
    if (!url) return;
    setImportLoading(true); setImportError(false);
    try {
      const res = await authFetch('/api/jobs/import', { method: 'POST', body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setImportError(true); return; }
      const job = data.job || {};
      const description = (job.description && job.description.length > 150)
        ? job.description : (job.raw_text || job.description || '');
      setNewJob({
        title: cleanJobTitle(job.title), company: job.company_name || '',
        location: cleanLocation(job.location_text), description,
        job_type: 'CDI', status: 'to_apply', notes: '',
        salary: job.salary_text || '', source: detectSource(url), url, favorite: 0,
      });
      setAddJobMode('manual');
    } catch { setImportError(true); }
    finally { setImportLoading(false); }
  }

  async function deleteContact(id: string) {
    await authFetch('/api/contacts?id=' + id, { method: 'DELETE' });
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  async function addCustomStage() {
    if (!newStageName.trim() || !userId) return;
    const supabase = createClient();
    const { data } = await supabase.from('pipeline_stages').insert({
      user_id: userId, label: newStageName.trim(), color: newStageColor, position: newStagePosition,
    }).select().single();
    if (data) {
      const updated = [...stages, { id: data.id, label: data.label, color: data.color, position: data.position, is_default: false }]
        .sort((a, b) => a.position - b.position);
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
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>⚡</div>
        <div style={{ fontWeight: 700, color: '#888' }}>Chargement...</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: "'Montserrat', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      <Sidebar
        view={view} setView={setView} firstName={firstName} userEmail={userEmail}
        jobCount={jobs.length} contactCount={contacts.length}
        interviewCount={stats.interviews} onSettings={() => setShowSettings(true)}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Topbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 2rem', background: '#fff', borderBottom: '2px solid #111', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'capitalize' }}>{today}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111' }}>
              Hello <span style={{ color: '#E8151B' }}>{firstName}</span> ! 👋
            </div>
          </div>
          <button className="btn-main" onClick={() => view === 'contacts' ? setTriggerAddContact(n => n + 1) : openAddJobModal()}>
            {view === 'contacts' ? '+ Ajouter un contact' : '+ Ajouter une offre'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

          {/* ── Stats ── */}
          {['kanban', 'list', 'stats'].includes(view) && (
            <div style={{ marginBottom: '1.25rem', background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
              <div style={{ padding: '10px 16px', borderBottom: '2px solid #111', background: '#FAFAFA' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Montserrat,sans-serif' }}>
                  📊 Statistiques
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
                {[
                  { l: "Nombre d'offres", v: stats.total,              c: '#111' },
                  { l: 'Taux de réponse', v: stats.responseRate + '%', c: '#E8151B' },
                  { l: 'Entretiens',      v: stats.interviews,          c: '#1A7A4A' },
                  { l: 'Proposition',     v: stats.offers,              c: '#B8900A' },
                  { l: 'Contacts',        v: contacts.length,           c: '#888' },
                ].map((s, i, arr) => (
                  <div key={s.l} style={{ padding: '14px 16px', borderRight: i < arr.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Calendrier ── */}
          {['kanban', 'list'].includes(view) && (
            <DashboardCalendar
              jobs={jobs}
              onJobClick={handleCalendarJobClick}
              onDateChange={handleCalendarDateChange}
            />
          )}

          {/* ── Titre section Candidatures dans un bloc ── */}
          {view === 'kanban' && (
            <div style={{
              marginBottom: '0.75rem', marginTop: '0.25rem',
              background: '#fff', border: '2px solid #111', borderRadius: 12,
              boxShadow: '3px 3px 0 #111', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', background: '#FAFAFA',
              }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Montserrat,sans-serif' }}>
                  📋 Candidatures
                </span>
                <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
                  {jobs.length} offre{jobs.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {view === 'kanban' && (
            <KanbanView
              jobs={jobs} stages={stages}
              onJobClick={setSelectedJob} onAddJob={openAddJobModal}
              onOpenSettings={() => setShowSettings(true)}
              onRefresh={handleRefresh} onStatusChange={updateJobStatus}
            />
          )}
          {view === 'list' && (
            <ListView jobs={jobs} stages={stages} onJobClick={setSelectedJob} onDeleteJob={deleteJob} onAddJob={openAddJobModal} />
          )}
          {view === 'contacts' && (
            <ContactsView contacts={contacts} onAddContact={triggerAddContact} onDeleteContact={deleteContact} onRefresh={fetchContacts} />
          )}
          {view === 'agenda' && (
            <AgendaView jobs={jobs} stages={stages} onJobClick={setSelectedJob} onBackToKanban={() => setView('kanban')} />
          )}
          {view === 'stats' && (
            <StatsView jobs={jobs} stages={stages} contactCount={contacts.length} />
          )}
        </div>
      </main>

      {selectedJob && (
        <JobDetailPanel
          job={selectedJob} stages={stages} userId={userId} accessToken={accessToken}
          onClose={() => setSelectedJob(null)} onStatusChange={updateJobStatus}
          onFieldUpdate={updateJobField} onEdit={openEditJobModal} onDelete={deleteJob}
        />
      )}

      {showAddJob && (
        <JobModal
          editingJobId={editingJobId} newJob={newJob} setNewJob={setNewJob} stages={stages}
          importUrl={importUrl} setImportUrl={setImportUrl}
          addJobMode={addJobMode} setAddJobMode={setAddJobMode}
          importError={importError} setImportError={setImportError}
          importLoading={importLoading} onImport={importJobFromUrl} onSave={saveJob}
          onSetExtra={(d: Record<string, string>) => { extraJobFields.current = d; }}
          onClose={() => setShowAddJob(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          stages={stages} newStageName={newStageName} setNewStageName={setNewStageName}
          newStageColor={newStageColor} setNewStageColor={setNewStageColor}
          newStagePosition={newStagePosition} setNewStagePosition={setNewStagePosition}
          onAddStage={addCustomStage} onDeleteStage={deleteCustomStage}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
