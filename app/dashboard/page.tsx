'use client';

import { useEffect, useState, useCallback } from 'react';
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

// ─── Calendrier ───────────────────────────────────────────────────────────────

const CAL_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const CAL_MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

type CalEvent = {
  date: Date;
  title: string;
  type: 'envie' | 'postule' | 'entretien' | 'offre';
  time?: string;
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function jobsToEvents(jobs: Job[]): CalEvent[] {
  const events: CalEvent[] = [];
  for (const job of jobs) {
    if (!job.created_at) continue;
    const created = new Date(job.created_at);

    // Date de création → type selon statut
    const typeMap: Record<string, CalEvent['type']> = {
      to_apply:    'envie',
      applied:     'postule',
      in_progress: 'entretien',
      offer:       'offre',
      archived:    'envie',
    };
    const evType: CalEvent['type'] = typeMap[job.status] ?? 'envie';
    const label = [job.title, job.company].filter(Boolean).join(' – ');

    events.push({ date: created, title: label, type: evType });

    // Si des dates d'entretien existent dans les champs (interview_date, next_step_date)
    const iDate = (job as any).interview_date || (job as any).next_step_date;
    if (iDate) {
      const d = new Date(iDate);
      const timeStr = d.getHours() > 0
        ? `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
        : undefined;
      events.push({ date: d, title: label, type: 'entretien', time: timeStr });
    }
  }
  return events;
}

function getWeekStart(base: Date, off: number): Date {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + off * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

const EV_STYLE: Record<CalEvent['type'], React.CSSProperties> = {
  envie:     { background: '#111', color: '#F5C400' },
  postule:   { background: '#DBEAFE', color: '#1E40AF' },
  entretien: { background: '#FEE2E2', color: '#991B1B', borderLeft: '3px solid #E8151B' },
  offre:     { background: '#FEF9C3', color: '#92400E', borderLeft: '3px solid #F5C400' },
};

const EV_LABEL: Record<CalEvent['type'], string> = {
  envie:     'Envie de postuler',
  postule:   'Postulé',
  entretien: 'Entretien',
  offre:     'Offre reçue',
};

function DashboardCalendar({ jobs }: { jobs: Job[] }) {
  const [calView, setCalView] = useState<'week' | 'month'>('week');
  const [offset, setOffset] = useState(0);
  const [visible, setVisible] = useState(true);

  const today = new Date();
  const events = jobsToEvents(jobs);

  // ── Vue semaine ──────────────────────────────────────────────────────────────
  function WeekView() {
    const ws = getWeekStart(today, offset);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(d.getDate() + i); return d;
    });
    const we = days[6];
    const periodLabel = `${days[0].getDate()} – ${we.getDate()} ${CAL_MONTHS[we.getMonth()]} ${we.getFullYear()}`;

    const colWidth = 'minmax(0,1fr)';
    const timeColW = 44;

    return (
      <div>
        {/* Header nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setCalView(v)} style={{
                padding: '4px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat,sans-serif',
                border: '2px solid #111', borderRadius: 6, cursor: 'pointer',
                background: calView === v ? '#111' : '#fff', color: calView === v ? '#F5C400' : '#111',
              }}>{v === 'week' ? 'Semaine' : 'Mois'}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setOffset(o => o - 1)} style={navBtnStyle}>‹</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#555', minWidth: 160, textAlign: 'center' }}>{periodLabel}</span>
            <button onClick={() => setOffset(o => o + 1)} style={navBtnStyle}>›</button>
            <button onClick={() => setOffset(0)} style={{ ...navBtnStyle, fontSize: 11, padding: '3px 8px', width: 'auto' }}>Auj.</button>
          </div>
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: `${timeColW}px repeat(7, ${colWidth})`, border: '2px solid #111', borderRadius: 10, overflow: 'hidden' }}>
          {/* En-têtes */}
          <div style={weekHeaderCell} />
          {days.map((d, i) => {
            const isTod = sameDay(d, today);
            return (
              <div key={i} style={{ ...weekHeaderCell, borderRight: i === 6 ? 'none' : '1px solid #E5E5E5', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{CAL_DAYS[i]}</div>
                <div style={{
                  fontSize: 16, fontWeight: 900, color: isTod ? '#fff' : '#111',
                  background: isTod ? '#111' : 'transparent',
                  borderRadius: '50%', width: 28, height: 28,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  margin: '2px auto 0',
                }}>{d.getDate()}</div>
              </div>
            );
          })}

          {/* Lignes horaires */}
          {HOURS.map(h => (
            <>
              <div key={`t${h}`} style={{ background: '#FAFAFA', borderRight: '1px solid #E5E5E5', borderBottom: '1px solid #F0F0F0', height: 52, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '4px 6px 0', fontSize: 10, color: '#AAA', fontWeight: 600 }}>{h}h</div>
              {days.map((d, di) => {
                const isTod = sameDay(d, today);
                const cellEvs = events.filter(e => sameDay(e.date, d) && (!e.time || parseInt(e.time) === h));
                return (
                  <div key={`${h}-${di}`} style={{
                    height: 52, borderRight: di === 6 ? 'none' : '1px solid #F0F0F0',
                    borderBottom: '1px solid #F0F0F0',
                    background: isTod ? 'rgba(245,196,0,0.04)' : 'transparent',
                    position: 'relative', padding: '2px',
                  }}>
                    {/* Événements sans heure affichés sur la première ligne (8h) */}
                    {h === 8 && events.filter(e => sameDay(e.date, d) && !e.time).map((ev, ei) => (
                      <div key={ei} title={ev.title} style={{
                        ...EV_STYLE[ev.type],
                        borderRadius: 4, padding: '2px 4px', fontSize: 9, fontWeight: 700,
                        marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: 'Montserrat,sans-serif',
                      }}>{ev.title}</div>
                    ))}
                    {/* Événements avec heure */}
                    {cellEvs.filter(e => !!e.time).map((ev, ei) => (
                      <div key={ei} title={ev.title} style={{
                        ...EV_STYLE[ev.type],
                        borderRadius: 4, padding: '2px 4px', fontSize: 9, fontWeight: 700,
                        marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: 'Montserrat,sans-serif',
                      }}><span style={{ opacity: .7 }}>{ev.time} </span>{ev.title}</div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    );
  }

  // ── Vue mois ─────────────────────────────────────────────────────────────────
  function MonthView() {
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const periodLabel = `${CAL_MONTHS[base.getMonth()]} ${base.getFullYear()}`;
    const firstDay = (base.getDay() + 6) % 7;
    const gridStart = new Date(base); gridStart.setDate(1 - firstDay);
    const cells = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart); d.setDate(d.getDate() + i); return d;
    });

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setCalView(v)} style={{
                padding: '4px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat,sans-serif',
                border: '2px solid #111', borderRadius: 6, cursor: 'pointer',
                background: calView === v ? '#111' : '#fff', color: calView === v ? '#F5C400' : '#111',
              }}>{v === 'week' ? 'Semaine' : 'Mois'}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setOffset(o => o - 1)} style={navBtnStyle}>‹</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#555', minWidth: 140, textAlign: 'center' }}>{periodLabel}</span>
            <button onClick={() => setOffset(o => o + 1)} style={navBtnStyle}>›</button>
            <button onClick={() => setOffset(0)} style={{ ...navBtnStyle, fontSize: 11, padding: '3px 8px', width: 'auto' }}>Auj.</button>
          </div>
        </div>

        <div style={{ border: '2px solid #111', borderRadius: 10, overflow: 'hidden' }}>
          {/* Jours de la semaine */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#111' }}>
            {CAL_DAYS.map((d, i) => (
              <div key={i} style={{ padding: '7px 4px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#F5C400', textTransform: 'uppercase', letterSpacing: '.06em', borderRight: i < 6 ? '1px solid #333' : 'none' }}>{d}</div>
            ))}
          </div>
          {/* Cellules */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {cells.map((d, idx) => {
              const isOther = d.getMonth() !== base.getMonth();
              const isTod = sameDay(d, today);
              const dayEvs = events.filter(e => sameDay(e.date, d));
              return (
                <div key={idx} style={{
                  minHeight: 80, borderRight: (idx % 7) < 6 ? '1px solid #E5E5E5' : 'none',
                  borderBottom: idx < 35 ? '1px solid #E5E5E5' : 'none',
                  padding: '5px 4px 3px', background: isTod ? 'rgba(245,196,0,0.07)' : 'transparent',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: isOther ? '#CCC' : '#111', marginBottom: 3 }}>
                    {isTod
                      ? <span style={{ background: '#111', color: '#F5C400', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{d.getDate()}</span>
                      : d.getDate()}
                  </div>
                  {dayEvs.slice(0, 3).map((ev, ei) => (
                    <div key={ei} title={ev.title} style={{
                      ...EV_STYLE[ev.type],
                      borderRadius: 3, padding: '1px 4px', fontSize: 9, fontWeight: 700,
                      marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontFamily: 'Montserrat,sans-serif',
                    }}>{ev.title}</div>
                  ))}
                  {dayEvs.length > 3 && (
                    <div style={{ fontSize: 9, color: '#AAA', fontWeight: 700, padding: '1px 3px' }}>+{dayEvs.length - 3} autres</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.25rem', background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
      {/* Barre titre */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: visible ? '2px solid #111' : 'none', background: '#FAFAFA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#111', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '.04em' }}>📅 Calendrier</span>
          {/* Légende */}
          {visible && (
            <div style={{ display: 'flex', gap: 10, marginLeft: 8 }}>
              {(Object.keys(EV_LABEL) as CalEvent['type'][]).map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#666', fontWeight: 600 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, ...EV_STYLE[t] }} />
                  {EV_LABEL[t]}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setVisible(v => !v)} style={{
          fontSize: 11, fontWeight: 800, fontFamily: 'Montserrat,sans-serif',
          background: 'transparent', border: '1.5px solid #CCC', borderRadius: 6,
          padding: '3px 10px', cursor: 'pointer', color: '#555',
        }}>{visible ? 'Masquer' : 'Afficher'}</button>
      </div>

      {/* Contenu calendrier */}
      {visible && (
        <div style={{ padding: '14px 16px' }}>
          {calView === 'week' ? <WeekView /> : <MonthView />}
        </div>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #CCC', borderRadius: 6,
  width: 28, height: 28, cursor: 'pointer', color: '#555',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Montserrat,sans-serif',
};

const weekHeaderCell: React.CSSProperties = {
  background: '#FAFAFA', padding: '8px 4px',
  borderBottom: '2px solid #111',
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
  const [showSettings, setShowSettings] = useState(false);
  const [triggerAddContact, setTriggerAddContact] = useState(0);
  const [newJob, setNewJob] = useState<NewJobState>({ ...EMPTY_JOB });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [addJobMode, setAddJobMode] = useState<null | 'url' | 'manual' | 'spontaneous'>(null);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#E8151B');
  const [newStagePosition, setNewStagePosition] = useState(3);

  useEffect(() => {
    if (accessToken) (window as any).__jfmj_token = accessToken;
  }, [accessToken]);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
        .from('pipeline_stages')
        .select('*')
        .eq('user_id', session.user.id)
        .is('job_id', null)
        .order('position');

      if (customStages && customStages.length > 0) {
        const all = [
          ...DEFAULT_STAGES,
          ...customStages.map((s: any) => ({
            id: s.id, label: s.label, color: s.color,
            position: s.position, is_default: false,
          })),
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
      if (data.job) {
        setJobs(prev => prev.map(j => j.id === editingJobId ? data.job : j));
        setShowAddJob(false); setEditingJobId(null);
      } else alert('Erreur : ' + (data.error || 'inconnue'));
    } else {
      const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.job) {
        setJobs(prev => [data.job, ...prev]);
        setShowAddJob(false); setNewJob({ ...EMPTY_JOB });
      } else alert('Erreur : ' + (data.error || 'inconnue'));
    }
  }

  async function updateJobStatus(id: string, newStatus: string) {
    const subStatus = STATUS_TO_SUB[newStatus] ?? newStatus;
    setJobs(prev => prev.map(j =>
      j.id === id ? { ...j, status: newStatus as JobStatus, sub_status: subStatus } as any : j
    ));
    if (selectedJob?.id === id) {
      setSelectedJob(prev => prev ? { ...prev, status: newStatus as JobStatus } : prev);
    }
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
      user_id: userId, label: newStageName.trim(),
      color: newStageColor, position: newStagePosition,
    }).select().single();
    if (data) {
      const updated = [
        ...stages,
        { id: data.id, label: data.label, color: data.color, position: data.position, is_default: false },
      ].sort((a, b) => a.position - b.position);
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
        {/* Barre du haut */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 2rem', background: '#fff', borderBottom: '2px solid #111', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'capitalize' }}>{today}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111' }}>
              Hello <span style={{ color: '#E8151B' }}>{firstName}</span> ! 👋
            </div>
          </div>
          <button className="btn-main" onClick={() => view === 'contacts' ? setTriggerAddContact(n => n + 1) : openAddJobModal()}>
            {view === 'contacts' ? '+ Ajouter un contact' : '+ Ajouter une offre'}
          </button>
        </div>

        {/* Contenu principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

          {/* Stats */}
          {['kanban', 'list', 'stats'].includes(view) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: '1.25rem' }}>
              {[
                { l: 'Total', v: stats.total, c: '#111' },
                { l: 'Taux réponse', v: stats.responseRate + '%', c: '#E8151B' },
                { l: 'Entretiens', v: stats.interviews, c: '#1A7A4A' },
                { l: 'Offres', v: stats.offers, c: '#B8900A' },
                { l: 'Contacts', v: contacts.length, c: '#888' },
              ].map(s => (
                <div key={s.l} className="stat-card">
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Calendrier (kanban + list uniquement) ── */}
          {['kanban', 'list'].includes(view) && (
            <DashboardCalendar jobs={jobs} />
          )}

          {view === 'kanban' && (
            <KanbanView
              jobs={jobs}
              stages={stages}
              onJobClick={setSelectedJob}
              onAddJob={openAddJobModal}
              onOpenSettings={() => setShowSettings(true)}
              onRefresh={handleRefresh}
              onStatusChange={updateJobStatus}
            />
          )}
          {view === 'list' && (
            <ListView jobs={jobs} stages={stages} onJobClick={setSelectedJob} onDeleteJob={deleteJob} onAddJob={openAddJobModal} />
          )}
          {view === 'contacts' && (
            <ContactsView
              contacts={contacts}
              onAddContact={triggerAddContact}
              onDeleteContact={deleteContact}
              onRefresh={fetchContacts}
            />
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
          importUrl={importUrl} setImportUrl={setImportUrl} addJobMode={addJobMode}
          setAddJobMode={setAddJobMode} importError={importError} setImportError={setImportError}
          importLoading={importLoading} onImport={importJobFromUrl} onSave={saveJob}
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
