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
  jobId: string;
  date: Date;
  dateField: 'interview_at' | 'applied_at' | 'created_at';
  title: string;
  company: string;
  type: 'envie' | 'postule' | 'entretien' | 'offre' | 'archive';
  hour?: number;   // heure extraite (0-23), undefined = pas d'heure
  minutes?: number;
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

function jobsToEvents(jobs: Job[]): CalEvent[] {
  return jobs.map(job => {
    const typeMap: Record<string, CalEvent['type']> = {
      to_apply:  'envie',
      applied:   'postule',
      interview: 'entretien',
      offer:     'offre',
      archived:  'archive',
    };
    const evType: CalEvent['type'] = typeMap[job.status] ?? 'envie';

    let date: Date;
    let dateField: CalEvent['dateField'] = 'created_at';
    let hour: number | undefined;
    let minutes: number | undefined;

    if (job.status === 'interview' && job.interview_at) {
      date = new Date(job.interview_at);
      dateField = 'interview_at';
      if (date.getHours() > 0 || date.getMinutes() > 0) {
        hour = date.getHours();
        minutes = date.getMinutes();
      }
    } else if (job.status === 'applied' && job.applied_at) {
      date = new Date(job.applied_at);
      dateField = 'applied_at';
      if (date.getHours() > 0 || date.getMinutes() > 0) {
        hour = date.getHours();
        minutes = date.getMinutes();
      }
    } else {
      date = new Date(job.created_at);
      dateField = 'created_at';
      if (date.getHours() > 0 || date.getMinutes() > 0) {
        hour = date.getHours();
        minutes = date.getMinutes();
      }
    }

    return { jobId: job.id, date, dateField, title: job.title || 'Sans titre', company: job.company || '', type: evType, hour, minutes };
  }).filter(e => !isNaN(e.date.getTime()));
}

// Trie les événements d'un jour : par heure croissante, sans heure à la fin
function sortEvents(evs: CalEvent[]): CalEvent[] {
  return [...evs].sort((a, b) => {
    const ah = a.hour !== undefined ? a.hour * 60 + (a.minutes || 0) : 99999;
    const bh = b.hour !== undefined ? b.hour * 60 + (b.minutes || 0) : 99999;
    return ah - bh;
  });
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
  archive:   { background: '#F0F0F0', color: '#999', borderLeft: '3px solid #CCC' },
};

const EV_LABEL: Record<CalEvent['type'], string> = {
  envie:     'Envie de postuler',
  postule:   'Postulé',
  entretien: 'Entretien',
  offre:     'Offre reçue',
  archive:   'Archivé',
};

const navBtnStyle: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #CCC', borderRadius: 6,
  width: 28, height: 28, cursor: 'pointer', color: '#555',
  fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Montserrat,sans-serif', padding: 0,
};

const weekTh: React.CSSProperties = {
  background: '#FAFAFA', padding: '8px 4px', borderBottom: '2px solid #111',
};

function EventCard({
  ev, onJobClick, onDragStart,
}: {
  ev: CalEvent;
  onJobClick: (jobId: string) => void;
  onDragStart: (e: React.DragEvent, ev: CalEvent) => void;
}) {
  const isArchived = ev.type === 'archive';
  const timeLabel = ev.hour !== undefined ? formatTime(ev.hour, ev.minutes || 0) : undefined;

  return (
    <div
      draggable={!isArchived}
      onDragStart={e => !isArchived && onDragStart(e, ev)}
      onClick={e => { e.stopPropagation(); onJobClick(ev.jobId); }}
      title={`${ev.title} — ${ev.company}${timeLabel ? ' · ' + timeLabel : ''}`}
      style={{
        ...EV_STYLE[ev.type],
        borderRadius: 4, padding: '3px 5px', marginBottom: 2,
        cursor: isArchived ? 'pointer' : 'grab',
        fontFamily: 'Montserrat,sans-serif', overflow: 'hidden',
        userSelect: 'none', opacity: isArchived ? 0.65 : 1,
      }}
    >
      {timeLabel && (
        <div style={{ fontSize: 9, opacity: .8, fontWeight: 700, lineHeight: 1.2 }}>{timeLabel}</div>
      )}
      <div style={{
        fontSize: 10, fontWeight: 800, lineHeight: 1.3,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: isArchived ? 'line-through' : 'none',
      }}>{ev.title}</div>
      {ev.company && (
        <div style={{
          fontSize: 9, fontWeight: 600, opacity: .75,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
          textDecoration: isArchived ? 'line-through' : 'none',
        }}>{ev.company}</div>
      )}
    </div>
  );
}

function DashboardCalendar({
  jobs, onJobClick, onDateChange,
}: {
  jobs: Job[];
  onJobClick: (jobId: string) => void;
  onDateChange: (jobId: string, field: string, newDate: Date) => void;
}) {
  const [calView, setCalView]   = useState<'week' | 'month'>('week');
  const [offset, setOffset]     = useState(0);
  const [visible, setVisible]   = useState(true);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const dragEvRef = useRef<CalEvent | null>(null);

  const today  = new Date();
  const events = jobsToEvents(jobs);

  function handleDragStart(e: React.DragEvent, ev: CalEvent) {
    dragEvRef.current = ev;
    e.dataTransfer.effectAllowed = 'move';
  }

  // En vue semaine : targetDate = jour, targetHour = heure de la cellule (enregistre l'heure)
  // En vue mois : targetDate = jour, targetHour = undefined (conserve l'heure existante)
  function handleDrop(e: React.DragEvent, targetDate: Date, targetHour?: number) {
    e.preventDefault();
    setDragOver(null);
    if (!dragEvRef.current) return;
    const ev = dragEvRef.current;
    dragEvRef.current = null;

    const newDate = new Date(targetDate);

    if (targetHour !== undefined) {
      // Vue semaine : on place à l'heure exacte de la cellule
      newDate.setHours(targetHour, 0, 0, 0);
    } else {
      // Vue mois : on conserve l'heure existante
      if (ev.hour !== undefined) {
        newDate.setHours(ev.hour, ev.minutes || 0, 0, 0);
      } else {
        newDate.setHours(0, 0, 0, 0);
      }
    }

    onDateChange(ev.jobId, ev.dateField, newDate);
  }

  function cellKey(date: Date, hour?: number) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}${hour !== undefined ? `-${hour}` : ''}`;
  }

  function dropStyle(key: string): React.CSSProperties {
    return dragOver === key
      ? { background: 'rgba(245,196,0,0.15)', outline: '2px dashed #F5C400', outlineOffset: -2 }
      : {};
  }

  function NavBar({ periodLabel }: { periodLabel: string }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['week', 'month'] as const).map(v => (
            <button key={v} onClick={() => { setCalView(v); setOffset(0); }} style={{
              padding: '4px 14px', fontSize: 12, fontWeight: 700,
              fontFamily: 'Montserrat,sans-serif',
              border: '2px solid #111', borderRadius: 6, cursor: 'pointer',
              background: calView === v ? '#111' : '#fff',
              color: calView === v ? '#F5C400' : '#111',
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
    );
  }

  function WeekView() {
    const ws = getWeekStart(today, offset);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(d.getDate() + i); return d;
    });
    const periodLabel = `${days[0].getDate()} – ${days[6].getDate()} ${CAL_MONTHS[days[6].getMonth()]} ${days[6].getFullYear()}`;

    return (
      <>
        <NavBar periodLabel={periodLabel} />
        <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(7, minmax(0, 1fr))`, border: '2px solid #111', borderRadius: 10, overflow: 'hidden' }}>
          {/* En-têtes jours */}
          <div style={weekTh} />
          {days.map((d, i) => {
            const isTod = sameDay(d, today);
            return (
              <div key={i} style={{ ...weekTh, borderRight: i === 6 ? 'none' : '1px solid #E5E5E5', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{CAL_DAYS[i]}</div>
                <div style={{
                  fontSize: 15, fontWeight: 900, color: isTod ? '#fff' : '#111',
                  background: isTod ? '#111' : 'transparent',
                  borderRadius: '50%', width: 26, height: 26,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  margin: '2px auto 0',
                }}>{d.getDate()}</div>
              </div>
            );
          })}

          {/* Lignes horaires — drop inclut l'heure */}
          {HOURS.map(h => (
            <>
              <div key={`t${h}`} style={{
                background: '#FAFAFA', borderRight: '1px solid #E5E5E5',
                borderBottom: '1px solid #F0F0F0', height: 54,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                padding: '4px 6px 0', fontSize: 10, color: '#AAA', fontWeight: 600,
              }}>{h}h</div>
              {days.map((d, di) => {
                const isTod = sameDay(d, today);
                const key = cellKey(d, h);
                // Affiche les événements dont l'heure correspond à cette cellule,
                // ou les événements sans heure dans la cellule 8h
                const cellEvs = events.filter(e =>
                  sameDay(e.date, d) && (
                    e.hour !== undefined ? e.hour === h : h === 8
                  )
                );
                return (
                  <div
                    key={`${h}-${di}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => handleDrop(e, d, h)}  // ← passe l'heure
                    style={{
                      height: 54,
                      borderRight: di === 6 ? 'none' : '1px solid #F0F0F0',
                      borderBottom: '1px solid #F0F0F0',
                      background: isTod ? 'rgba(245,196,0,0.04)' : 'transparent',
                      padding: '2px',
                      ...dropStyle(key),
                    }}
                  >
                    {cellEvs.map((ev, ei) => (
                      <EventCard key={ei} ev={ev} onJobClick={onJobClick} onDragStart={handleDragStart} />
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </>
    );
  }

  function MonthView() {
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const periodLabel = `${CAL_MONTHS[base.getMonth()]} ${base.getFullYear()}`;
    const firstDay = (base.getDay() + 6) % 7;
    const gridStart = new Date(base); gridStart.setDate(1 - firstDay);
    const cells = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart); d.setDate(d.getDate() + i); return d;
    });

    return (
      <>
        <NavBar periodLabel={periodLabel} />
        <div style={{ border: '2px solid #111', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', background: '#111' }}>
            {CAL_DAYS.map((d, i) => (
              <div key={i} style={{
                padding: '7px 4px', textAlign: 'center',
                fontSize: 10, fontWeight: 800, color: '#F5C400',
                textTransform: 'uppercase', letterSpacing: '.06em',
                borderRight: i < 6 ? '1px solid #333' : 'none',
              }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {cells.map((d, idx) => {
              const isOther = d.getMonth() !== base.getMonth();
              const isTod   = sameDay(d, today);
              // Triés par heure croissante, sans heure à la fin
              const dayEvs  = sortEvents(events.filter(e => sameDay(e.date, d)));
              const key     = cellKey(d);
              return (
                <div
                  key={idx}
                  onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, d)}  // pas d'heure en vue mois
                  style={{
                    minHeight: 80,
                    borderRight: (idx % 7) < 6 ? '1px solid #E5E5E5' : 'none',
                    borderBottom: idx < 35 ? '1px solid #E5E5E5' : 'none',
                    padding: '5px 4px 3px',
                    background: isTod ? 'rgba(245,196,0,0.07)' : 'transparent',
                    ...dropStyle(key),
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 900, color: isOther ? '#CCC' : '#111', marginBottom: 3 }}>
                    {isTod
                      ? <span style={{ background: '#111', color: '#F5C400', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{d.getDate()}</span>
                      : d.getDate()}
                  </div>
                  {dayEvs.slice(0, 3).map((ev, ei) => (
                    <EventCard key={ei} ev={ev} onJobClick={onJobClick} onDragStart={handleDragStart} />
                  ))}
                  {dayEvs.length > 3 && (
                    <div style={{ fontSize: 9, color: '#AAA', fontWeight: 700, padding: '1px 3px' }}>+{dayEvs.length - 3} autres</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={{ marginBottom: '1.25rem', background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: visible ? '2px solid #111' : 'none',
        background: '#FAFAFA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#111', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            📅 Calendrier
          </span>
          {visible && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(Object.keys(EV_LABEL) as CalEvent['type'][]).map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#666', fontWeight: 600 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: (EV_STYLE[t] as any).background }} />
                  {EV_LABEL[t]}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setVisible(v => !v)} style={{
          fontSize: 11, fontWeight: 800, fontFamily: 'Montserrat,sans-serif',
          background: 'transparent', border: '1.5px solid #CCC', borderRadius: 6,
          padding: '3px 10px', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap',
        }}>{visible ? 'Masquer' : 'Afficher'}</button>
      </div>

      {visible && (
        <div style={{ padding: '14px 16px' }}>
          {calView === 'week' ? <WeekView /> : <MonthView />}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
  const [addJobMode, setAddJobMode]       = useState<null | 'url' | 'manual' | 'spontaneous'>(null);
  const [importUrl, setImportUrl]         = useState('');
  const [importError, setImportError]     = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [newStageName, setNewStageName]   = useState('');
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
      ...(newJob.salary   ? { salary_text: newJob.salary }             : {}),
      ...(newJob.source   ? { source_platform: newJob.source }         : {}),
      ...(newJob.url      ? { source_url: newJob.url }                 : {}),
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
    // Mise à jour optimiste immédiate
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

          {['kanban', 'list', 'stats'].includes(view) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: '1.25rem' }}>
              {[
                { l: 'Total',        v: stats.total,              c: '#111' },
                { l: 'Taux réponse', v: stats.responseRate + '%', c: '#E8151B' },
                { l: 'Entretiens',   v: stats.interviews,          c: '#1A7A4A' },
                { l: 'Offres',       v: stats.offers,              c: '#B8900A' },
                { l: 'Contacts',     v: contacts.length,           c: '#888' },
              ].map(s => (
                <div key={s.l} className="stat-card">
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}

          {['kanban', 'list'].includes(view) && (
            <DashboardCalendar
              jobs={jobs}
              onJobClick={handleCalendarJobClick}
              onDateChange={handleCalendarDateChange}
            />
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
