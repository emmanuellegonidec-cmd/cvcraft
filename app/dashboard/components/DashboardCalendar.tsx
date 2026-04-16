'use client';

import { useState, useRef, useEffect } from 'react';
import { Job } from '@/lib/jobs';
import { createClient } from '@/lib/supabase';

const CAL_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const CAL_MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const DETAIL_STEP_LABELS: Record<string, string> = {
  to_apply:          'Envie de postuler',
  applied:           'Postulé',
  phone_interview:   'Entretien téléphonique',
  hr_interview:      'Entretien RH',
  manager_interview: 'Entretien manager',
  offer:             'Offre reçue',
};

type CalEvent = {
  jobId: string;
  date: Date;
  dateField: 'interview_at' | 'applied_at' | 'created_at' | 'deadline' | 'action';
  title: string;
  company: string;
  type: 'envie' | 'postule' | 'entretien' | 'en_cours' | 'offre' | 'archive' | 'deadline' | 'action';
  hour?: number;
  minutes?: number;
  endHour?: number;
  endMinutes?: number;
  deadlineLabel?: string;
};

const EV_STYLE: Record<CalEvent['type'], React.CSSProperties> = {
  envie:     { background: '#1C1C1E', color: '#fff' },
  postule:   { background: '#1A4A8A', color: '#fff' },
  entretien: { background: '#E8151B', color: '#fff' },
  en_cours:  { background: '#B8900A', color: '#fff' },
  offre:     { background: '#1A7A4A', color: '#fff' },
  archive:   { background: '#999', color: '#fff' },
  deadline:  { background: '#D97706', color: '#fff' },
  action:    { background: '#F5C400', color: '#111' },
};

const EV_LABEL: Record<CalEvent['type'], string> = {
  envie:     'Envie de postuler',
  postule:   'Postulé',
  entretien: 'Entretien',
  en_cours:  'En cours',
  offre:     'Offre reçue',
  archive:   'Archivé',
  deadline:  'Deadline',
  action:    'Action',
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

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function jobsToEvents(jobs: Job[], stagesLabelMap: Record<string, string> = {}): CalEvent[] {
  return jobs.map(job => {
    const typeMap: Record<string, CalEvent['type']> = {
      to_apply:    'envie',
      applied:     'postule',
      in_progress: 'entretien',
      offer:       'offre',
      archived:    'archive',
    };
    let evType: CalEvent['type'] = typeMap[job.status] ?? 'envie';

    let date: Date;
    let dateField: CalEvent['dateField'] = 'created_at';
    let hour: number | undefined;
    let minutes: number | undefined;
    let subStatusLabel: string | null = null;

    const subStatus = (job as any).sub_status as string | null;
    const stepDates = (job as any).step_dates as Record<string, string> | null;

    function extractHour(): { h: number; m: number } | null {
      const t = (job as any).interview_time as string | null;
      if (!t) return null;
      const parts = t.split(':').map(Number);
      if (parts[0] > 0 || parts[1] > 0) return { h: parts[0], m: parts[1] };
      return null;
    }

    if ((job as any).status === 'in_progress') {
      if (subStatus) {
        subStatusLabel = DETAIL_STEP_LABELS[subStatus]
          || stagesLabelMap[subStatus]
          || null;
      }

      const stepDateStr = subStatus && stepDates && stepDates[subStatus] ? stepDates[subStatus] : null;
      const stepDateObj = stepDateStr ? parseLocalDate(stepDateStr) : null;
      const interviewAtStr = (job as any).interview_at as string | null;
      const interviewAtObj = interviewAtStr
        ? (interviewAtStr.length === 10 ? parseLocalDate(interviewAtStr) : new Date(interviewAtStr))
        : null;

      const hasAnyDate = stepDateObj || interviewAtObj;
      const hasInterview = hasAnyDate;

      if (hasAnyDate) {
        // Logique : step_dates future = prochaine étape planifiée (priorité)
        // step_dates passée = date du clic, pas de l'entretien → utiliser interview_at
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        if (stepDateObj && stepDateObj >= todayMidnight) {
          date = stepDateObj; // date future = prochaine étape planifiée
        } else if (interviewAtObj) {
          date = interviewAtObj; // step_date passée → interview_at prime
        } else if (stepDateObj) {
          date = stepDateObj; // pas d'interview_at → step_date même passée
        } else {
          date = new Date(job.created_at);
          dateField = 'created_at';
        }
        dateField = 'interview_at';
        const hm = extractHour();
        if (hm) { hour = hm.h; minutes = hm.m; }
      } else {
        date = new Date(job.created_at);
        dateField = 'created_at';
      }

      if (!hasInterview) {
        evType = 'en_cours';
      }

    } else if (job.status === 'applied' && (job as any).applied_at) {
      date = new Date((job as any).applied_at);
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

    return {
      jobId: job.id,
      date,
      dateField,
      title: job.title || 'Sans titre',
      company: subStatusLabel
        ? `${subStatusLabel} · ${job.company || ''}`
        : (job.company || ''),
      type: evType,
      hour,
      minutes,
    };
  }).filter(e => !isNaN(e.date.getTime()));
}

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

function EventCard({
  ev, onJobClick, onDragStart,
}: {
  ev: CalEvent;
  onJobClick: (jobId: string) => void;
  onDragStart: (e: React.DragEvent, ev: CalEvent) => void;
}) {
  const isArchived = ev.type === 'archive';
  const isDeadline = ev.type === 'deadline';
  const isAction   = ev.type === 'action';
  const timeLabel = ev.hour !== undefined ? formatTime(ev.hour, ev.minutes || 0) : undefined;

  return (
    <div
      draggable={!isArchived && !isDeadline && !isAction}
      onDragStart={e => !isArchived && !isDeadline && !isAction && onDragStart(e, ev)}
      onClick={e => { e.stopPropagation(); if (!isAction) onJobClick(ev.jobId); }}
      title={`${isDeadline ? '⏰ ' + (ev.deadlineLabel || 'Deadline') + ' — ' : ''}${isAction ? '⚡ Action — ' : ''}${ev.title} — ${ev.company}`}
      style={{
        ...EV_STYLE[ev.type],
        borderRadius: 5, padding: '5px 8px', marginBottom: 3,
        cursor: isAction ? 'default' : 'pointer',
        fontFamily: 'Montserrat,sans-serif', overflow: 'hidden',
        userSelect: 'none', opacity: isArchived ? 0.65 : 1,
        border: isDeadline ? '1.5px dashed rgba(255,255,255,0.5)' : isAction ? '1.5px solid rgba(255,255,255,0.3)' : 'none',
      }}
    >
      {isDeadline && (
        <div style={{ fontSize: 10, opacity: .9, fontWeight: 800, lineHeight: 1.3 }}>
          ⏰ {ev.deadlineLabel || 'Deadline'}
        </div>
      )}
      {isAction && (
        <div style={{ fontSize: 10, opacity: .9, fontWeight: 800, lineHeight: 1.3 }}>
          ⚡ {ev.company || 'Action'}
        </div>
      )}
      {timeLabel && !isDeadline && !isAction && (
        <div style={{ fontSize: 11, opacity: .9, fontWeight: 700, lineHeight: 1.3 }}>{timeLabel}</div>
      )}
      {timeLabel && isAction && (
        <div style={{ fontSize: 10, opacity: .8, fontWeight: 600, lineHeight: 1.3 }}>
          {timeLabel}{ev.endHour !== undefined ? ` → ${formatTime(ev.endHour, ev.endMinutes || 0)}` : ''}
        </div>
      )}
      <div style={{
        fontSize: 12, fontWeight: 800, lineHeight: 1.4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: isArchived ? 'line-through' : 'none',
      }}>{ev.title}</div>
      {ev.company && !isAction && (
        <div style={{
          fontSize: 11, fontWeight: 600, opacity: .85,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
          textDecoration: isArchived ? 'line-through' : 'none',
        }}>{ev.company}</div>
      )}
    </div>
  );
}

export default function DashboardCalendar({
  jobs, onJobClick, onDateChange, stagesLabelMap = {},
}: {
  jobs: Job[];
  stagesLabelMap?: Record<string, string>;
  onJobClick: (jobId: string) => void;
  onDateChange: (jobId: string, field: string, newDate: Date) => void;
}) {
  const [calView, setCalView]   = useState<'week' | 'month'>('week');
  const [offset, setOffset]     = useState(0);
  const [visible, setVisible]   = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [deadlineEvents, setDeadlineEvents] = useState<CalEvent[]>([]);
  const [actionEvents, setActionEvents]     = useState<CalEvent[]>([]);
  const dragEvRef = useRef<CalEvent | null>(null);

  const today = new Date();
  const jobEvents = jobsToEvents(jobs, stagesLabelMap);

  useEffect(() => {
    if (jobs.length) loadDeadlines();
  }, [jobs]);

  useEffect(() => {
    loadActions();
  }, []);

  async function loadDeadlines() {
    const supabase = createClient();
    const jobIds = jobs.map(j => j.id);
    if (!jobIds.length) return;

    const { data } = await supabase
      .from('job_step_actions')
      .select('job_id, title, deadline_date')
      .in('job_id', jobIds)
      .not('deadline_date', 'is', null);

    if (!data) return;

    const evs: CalEvent[] = data
      .filter((row: any) => row.deadline_date)
      .map((row: any) => {
        const job = jobs.find(j => j.id === row.job_id);
        if (!job) return null;
        const date = parseLocalDate(row.deadline_date);
        return {
          jobId: row.job_id,
          date,
          dateField: 'deadline' as CalEvent['dateField'],
          title: job.title || 'Sans titre',
          company: job.company || '',
          type: 'deadline' as CalEvent['type'],
          deadlineLabel: row.title,
        };
      })
      .filter(Boolean) as CalEvent[];

    setDeadlineEvents(evs);
  }

  async function loadActions() {
    try {
      const token = (window as any).__jfmj_token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [resEv, resPA] = await Promise.all([
        fetch('/api/actions', { headers }),
        fetch('/api/personal-actions', { headers }),
      ]);

      const evs: CalEvent[] = [];

      if (resEv.ok) {
        const data = await resEv.json();
        (data || []).forEach((action: any) => {
          const date = new Date(action.date_debut);
          const hour = date.getHours();
          const minutes = date.getMinutes();
          const endDate = action.date_fin ? new Date(action.date_fin) : null;
          const endHour = endDate ? endDate.getHours() : undefined;
          const endMinutes = endDate ? endDate.getMinutes() : undefined;
          evs.push({
            jobId: action.id,
            date,
            dateField: 'action' as CalEvent['dateField'],
            title: action.nom,
            company: action.organisateur || action.categorie || '',
            type: 'action' as CalEvent['type'],
            hour: hour > 0 || minutes > 0 ? hour : undefined,
            minutes: hour > 0 || minutes > 0 ? minutes : undefined,
            endHour,
            endMinutes,
          });
        });
      }

      if (resPA.ok) {
        const dataPA = await resPA.json();
        (dataPA.actions || []).forEach((action: any) => {
          const date = parseLocalDate(action.date_action);
          evs.push({
            jobId: action.id,
            date,
            dateField: 'action' as CalEvent['dateField'],
            title: action.nom,
            company: action.plateforme || action.type || '',
            type: 'action' as CalEvent['type'],
          });
        });
      }

      setActionEvents(evs);
    } catch (err) {
      console.error('Erreur chargement actions calendrier:', err);
    }
  }

  const allEvents = [...jobEvents, ...deadlineEvents, ...actionEvents];

  function handleDragStart(e: React.DragEvent, ev: CalEvent) {
    dragEvRef.current = ev;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e: React.DragEvent, targetDate: Date, targetHour?: number) {
    e.preventDefault();
    setDragOver(null);
    if (!dragEvRef.current) return;
    const ev = dragEvRef.current;
    dragEvRef.current = null;
    if (ev.type === 'deadline' || ev.type === 'action') return;

    const newDate = new Date(targetDate);
    if (targetHour !== undefined) {
      newDate.setHours(targetHour, 0, 0, 0);
    } else {
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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(Object.keys(EV_LABEL) as CalEvent['type'][]).map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#333', fontWeight: 700 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: (EV_STYLE[t] as any).background, flexShrink: 0 }} />
              {EV_LABEL[t]}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setOffset(o => o - 1)} style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#555', minWidth: 160, textAlign: 'center' }}>{periodLabel}</span>
          <button onClick={() => setOffset(o => o + 1)} style={navBtnStyle}>›</button>
          <button onClick={() => setOffset(0)} style={{ ...navBtnStyle, fontSize: 11, padding: '3px 8px', width: 'auto' }}>Auj.</button>
          <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
            {(['week', 'month'] as const).map(v => (
              <button key={v} onClick={() => { setCalView(v); setOffset(0); }} style={{
                padding: '4px 12px', fontSize: 12, fontWeight: 700,
                fontFamily: 'Montserrat,sans-serif',
                border: '2px solid #111', borderRadius: 6, cursor: 'pointer',
                background: calView === v ? '#111' : '#fff',
                color: calView === v ? '#F5C400' : '#111',
              }}>{v === 'week' ? 'Semaine' : 'Mois'}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function WeekView() {
    const HOUR_H = 60; // px par heure
    const START_H = 8;
    const totalH = HOURS.length * HOUR_H;

    const ws = getWeekStart(today, offset);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(d.getDate() + i); return d;
    });
    const periodLabel = `${days[0].getDate()} – ${days[6].getDate()} ${CAL_MONTHS[days[6].getMonth()]} ${days[6].getFullYear()}`;

    function evTop(ev: CalEvent): number {
      const h = ev.hour ?? START_H;
      const m = ev.minutes ?? 0;
      return (h - START_H) * HOUR_H + (m / 60) * HOUR_H;
    }

    function evHeight(ev: CalEvent): number {
      if (ev.endHour !== undefined) {
        const startMin = (ev.hour ?? START_H) * 60 + (ev.minutes ?? 0);
        const endMin = ev.endHour * 60 + (ev.endMinutes ?? 0);
        const dur = Math.max(endMin - startMin, 30);
        return (dur / 60) * HOUR_H - 2;
      }
      return 44; // hauteur par défaut sans heure de fin
    }

    return (
      <>
        <NavBar periodLabel={periodLabel} />
        <div style={{ border: '2px solid #111', borderRadius: 10, overflow: 'hidden' }}>
          {/* En-tête jours */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, minmax(0, 1fr))', borderBottom: '2px solid #111', background: '#FAFAFA' }}>
            <div />
            {days.map((d, i) => {
              const isTod = sameDay(d, today);
              return (
                <div key={i} style={{ borderLeft: '1px solid #E5E5E5', textAlign: 'center', padding: '8px 4px' }}>
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
          </div>

          {/* Corps — lignes d'heures + colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, minmax(0, 1fr))' }}>
            {/* Colonne heures */}
            <div style={{ background: '#FAFAFA', borderRight: '1px solid #E5E5E5', position: 'relative', height: totalH }}>
              {HOURS.map(h => (
                <div key={h} style={{
                  position: 'absolute', top: (h - START_H) * HOUR_H,
                  right: 6, fontSize: 10, color: '#AAA', fontWeight: 600, lineHeight: 1,
                }}>{h}h</div>
              ))}
            </div>

            {/* Colonnes jours */}
            {days.map((d, di) => {
              const isTod = sameDay(d, today);
              const dayEvs = allEvents.filter(e => sameDay(e.date, d));
              const key = cellKey(d);
              return (
                <div
                  key={di}
                  onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, d)}
                  style={{
                    position: 'relative',
                    height: totalH,
                    borderLeft: '1px solid #E5E5E5',
                    background: isTod ? 'rgba(245,196,0,0.04)' : 'transparent',
                    ...dropStyle(key),
                  }}
                >
                  {/* Lignes d'heures */}
                  {HOURS.map(h => (
                    <div key={h} style={{
                      position: 'absolute', top: (h - START_H) * HOUR_H,
                      left: 0, right: 0, borderTop: '1px solid #F0F0F0',
                    }} />
                  ))}

                  {/* Événements positionnés */}
                  {dayEvs.map((ev, ei) => {
                    const top = evTop(ev);
                    const height = evHeight(ev);
                    const isArchived = ev.type === 'archive';
                    const isAction = ev.type === 'action';
                    const isDeadline = ev.type === 'deadline';
                    const timeLabel = ev.hour !== undefined ? formatTime(ev.hour, ev.minutes || 0) : undefined;
                    const endLabel = ev.endHour !== undefined ? formatTime(ev.endHour, ev.endMinutes || 0) : undefined;

                    return (
                      <div
                        key={ei}
                        draggable={!isArchived && !isDeadline && !isAction}
                        onDragStart={e => !isArchived && !isDeadline && !isAction && handleDragStart(e, ev)}
                        onClick={e => { e.stopPropagation(); if (!isAction) onJobClick(ev.jobId); }}
                        style={{
                          position: 'absolute',
                          top: top + 1,
                          left: 2,
                          right: 2,
                          height: height,
                          ...EV_STYLE[ev.type],
                          borderRadius: 5,
                          padding: '4px 7px',
                          cursor: isAction ? 'default' : 'pointer',
                          fontFamily: 'Montserrat,sans-serif',
                          overflow: 'hidden',
                          userSelect: 'none',
                          opacity: isArchived ? 0.65 : 1,
                          border: isDeadline ? '1.5px dashed rgba(255,255,255,0.5)' : isAction ? '1.5px solid rgba(255,255,255,0.3)' : 'none',
                          zIndex: 1,
                          boxSizing: 'border-box',
                        }}
                      >
                        {timeLabel && (
                          <div style={{ fontSize: 10, opacity: .9, fontWeight: 700, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                            {timeLabel}{endLabel ? ` → ${endLabel}` : ''}
                          </div>
                        )}
                        {isAction && (
                          <div style={{ fontSize: 10, opacity: .85, fontWeight: 800, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                            ⚡ {ev.company || 'Action'}
                          </div>
                        )}
                        {isDeadline && (
                          <div style={{ fontSize: 10, opacity: .85, fontWeight: 800, lineHeight: 1.3 }}>⏰ {ev.deadlineLabel}</div>
                        )}
                        <div style={{
                          fontSize: 11, fontWeight: 800, lineHeight: 1.3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          textDecoration: isArchived ? 'line-through' : 'none',
                        }}>{ev.title}</div>
                        {ev.company && !isAction && height > 40 && (
                          <div style={{
                            fontSize: 10, opacity: .85, lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            textDecoration: isArchived ? 'line-through' : 'none',
                          }}>{ev.company}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
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
              const dayEvs  = sortEvents(allEvents.filter(e => sameDay(e.date, d)));
              const key     = cellKey(d);
              return (
                <div
                  key={idx}
                  onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, d)}
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
          <span style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            📅 Calendrier
          </span>
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
