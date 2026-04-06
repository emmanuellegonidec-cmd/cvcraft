'use client';
import OnboardingModal from './components/OnboardingModal';

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
import ActionsSection from './components/ActionsSection';

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

const FONT = "'Montserrat', sans-serif";

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
  const [triggerAddAction, setTriggerAddAction] = useState(0);
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
  const [stagesLabelMap, setStagesLabelMap] = useState<Record<string, string>>({});
  const newJobRef = useRef<NewJobState>({ ...EMPTY_JOB });

  // Actions collapsible ferme par defaut + compteur
  const [actionsVisible, setActionsVisible] = useState(false);
  const [actionsCount, setActionsCount] = useState(0);

  // Modale suppression offre custom
  const [deleteJobTarget, setDeleteJobTarget] = useState<Job | null>(null);
  const [deleteJobLoading, setDeleteJobLoading] = useState(false);

  useEffect(() => { newJobRef.current = newJob; }, [newJob]);
  useEffect(() => { if (accessToken) (window as any).__jfmj_token = accessToken; }, [accessToken]);

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

      const { data: allPipelineStages } = await supabase
        .from('pipeline_stages').select('id, label')
        .eq('user_id', session.user.id);
      if (allPipelineStages) {
        const map: Record<string, string> = {};
        allPipelineStages.forEach((s: any) => { map[s.id] = s.label; });
        setStagesLabelMap(map);
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
    const job = newJobRef.current;
    if (!job.title || !job.company) return;
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
      company_description: extras.company_description || (job as any).company_description || '',
      company_website:     extras.company_website     || (job as any).company_website     || '',
      company_size:        extras.company_size        || (job as any).company_size        || '',
      ...((job as any).transmitted_by_contact_id ? { transmitted_by_contact_id: (job as any).transmitted_by_contact_id } : {}),
    };
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
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus as JobStatus, sub_status: subStatus } as any : j));
    if (selectedJob?.id === id) setSelectedJob(prev => prev ? { ...prev, status: newStatus as JobStatus } : prev);
    const res = await authFetch(`/api/jobs?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, sub_status: subStatus }) });
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

  // Ouvre la modale custom au lieu du confirm() natif
  function deleteJob(id: string) {
    const job = jobs.find(j => j.id === id);
    if (job) setDeleteJobTarget(job);
  }

  async function confirmDeleteJob() {
    if (!deleteJobTarget) return;
    setDeleteJobLoading(true);
    await authFetch('/api/jobs?id=' + deleteJobTarget.id, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== deleteJobTarget.id));
    if (selectedJob?.id === deleteJobTarget.id) setSelectedJob(null);
    setDeleteJobTarget(null);
    setDeleteJobLoading(false);
  }

  async function importJobFromUrl(url: string) {
    if (!url) return;
    setImportLoading(true); setImportError(false);
    try {
      const res = await authFetch('/api/jobs/import', { method: 'POST', body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setImportError(true); return; }
      if (data.savedJobId) {
        if (accessToken) await fetchJobs(accessToken);
        setShowAddJob(false); setNewJob({ ...EMPTY_JOB });
        router.push(`/dashboard/job/${data.savedJobId}`); return;
      }
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

  function getMainButtonLabel() {
    if (view === 'contacts') return '+ Ajouter un contact';
    if (view === 'actions') return '+ Ajouter une action';
    return '+ Ajouter une offre';
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>⚡</div>
        <div style={{ fontWeight: 700, color: '#888' }}>Chargement...</div>
      </div>
    </div>
  );

  const mainButtonLabel = getMainButtonLabel();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: FONT }}>
      <style>{GLOBAL_STYLES}</style>

      <Sidebar
        view={view} setView={setView} firstName={firstName} userEmail={userEmail}
        jobCount={jobs.length} contactCount={contacts.length}
        interviewCount={stats.interviews} onSettings={() => setShowSettings(true)}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header sans borderBottom, Hello agrandi */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 2rem', background: '#fff', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'capitalize' }}>{today}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#111' }}>
              Hello <span style={{ color: '#E8151B' }}>{firstName}</span> ! 👋
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {view === 'kanban' && (
              <button className="btn-main" style={{ background: '#7C3AED', boxShadow: '2px 2px 0 #111' }} onClick={() => setTriggerAddAction(n => n + 1)}>
                + Ajouter une action
              </button>
            )}
            {mainButtonLabel && (
              <button className="btn-main" onClick={() => {
                if (view === 'contacts') setTriggerAddContact(n => n + 1);
                else if (view === 'actions') setTriggerAddAction(n => n + 1);
                else openAddJobModal();
              }}>
                {mainButtonLabel}
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

          {/* Statistiques */}
          {['kanban', 'list', 'stats'].includes(view) && (
            <div style={{ marginBottom: '1.25rem', background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
              <div style={{ padding: '10px 16px', borderBottom: '2px solid #111', background: '#FAFAFA' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>
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

          {/* Calendrier */}
          {['kanban', 'list'].includes(view) && (
            <DashboardCalendar
              jobs={jobs}
              stagesLabelMap={stagesLabelMap}
              onJobClick={handleCalendarJobClick}
              onDateChange={handleCalendarDateChange}
            />
          )}

          {/* Candidatures + Kanban dans un seul bloc */}
          {view === 'kanban' && (
            <div style={{ marginBottom: '0.75rem', marginTop: '0.25rem', background: '#fff', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#FAFAFA', borderBottom: '2px solid #111' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>
                  📋 Candidatures
                </span>
                <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
                  {jobs.length} offre{jobs.length > 1 ? 's' : ''}
                </span>
              </div>
              <KanbanView
                jobs={jobs} stages={stages}
                stagesLabelMap={stagesLabelMap}
                onJobClick={setSelectedJob} onAddJob={openAddJobModal}
                onOpenSettings={() => setShowSettings(true)}
                onRefresh={handleRefresh} onStatusChange={updateJobStatus}
              />
            </div>
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

          {/* Actions collapsible — header unique avec badge nombre */}
          {view === 'kanban' && (
            <div style={{ marginBottom: '1.25rem', background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: actionsVisible ? '2px solid #111' : 'none',
                background: '#FAFAFA',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>
                    ⚡ Actions
                  </span>
                  {actionsCount > 0 && (
                    <span style={{ background: '#111', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>
                      {actionsCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActionsVisible(v => !v)}
                  style={{ fontSize: 11, fontWeight: 800, fontFamily: FONT, background: 'transparent', border: '1.5px solid #CCC', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}
                >
                  {actionsVisible ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              {actionsVisible && (
                <ActionsSection triggerOpen={triggerAddAction} onCountChange={setActionsCount} />
              )}
            </div>
          )}

          {view === 'actions' && (
            <ActionsSection triggerOpen={triggerAddAction} onCountChange={setActionsCount} />
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

      {/* Modale suppression offre — style coherent avec le reste de l'app */}
      {deleteJobTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0 20px' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 30, width: '100%', maxWidth: 420, border: '2px solid #E8151B', boxShadow: '4px 4px 0 #E8151B', fontFamily: FONT }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#E8151B', margin: '0 0 8px', fontFamily: FONT }}>Supprimer cette offre ?</h3>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0, fontFamily: FONT }}>
                Cette action est <strong>irréversible</strong>.<br />Toutes les données seront supprimées.
              </p>
            </div>
            <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px', fontFamily: FONT }}>{deleteJobTarget.title}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0, fontFamily: FONT }}>{deleteJobTarget.company}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteJobTarget(null)}
                style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteJob}
                disabled={deleteJobLoading}
                style={{ flex: 1, background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, opacity: deleteJobLoading ? 0.7 : 1 }}
              >
                {deleteJobLoading ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* Onboarding première connexion */}
      <OnboardingModal onAddJob={() => setAddJobMode('url')} />

    </div>
  );
}
