'use client';

import { useState, useRef, useEffect } from 'react';
import { Job } from '@/lib/jobs';
import { createClient } from '@/lib/supabase';

// ─── Types & constantes ───────────────────────────────────────────────────────

const CAL_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const CAL_MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

type CalEvent = {
  jobId: string;
  date: Date;
  dateField: 'interview_at' | 'applied_at' | 'created_at' | 'deadline';
  title: string;
  company: string;
  type: 'envie' | 'postule' | 'entretien' | 'offre' | 'archive' | 'deadline';
  hour?: number;
  minutes?: number;
  deadlineLabel?: string; // ex: "Fixer une deadline", "Ajouter un rappel"
};

// ✅ Nouveau type "deadline" en orange
const EV_STYLE: Record<CalEvent['type'], React.CSSProperties> = {
  envie:     { background: '#1C1C1E', color: '#fff' },
  postule:   { background: '#1A4A8A', color: '#fff' },
  entretien: { background: '#E8151B', color: '#fff' },
  offre:     { background: '#1A7A4A', color: '#fff' },
  archive:   { background: '#999', color: '#fff' },
  deadline:  { background: '#D97706', color: '#fff' },
};

const EV_LABEL: Record<CalEvent['type'], string> = {
  envie:     'Envie de postuler',
  postule:   'Postulé',
  entretien: 'Entretien',
  offre:     'Offre reçue',
  archive:   'Archivé',
  deadline:  'Deadline',
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

// ─── Utilitaires ──────────────────────────────────────────────────────────────

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
      to_apply:    'envie',
      applied:     'postule',
      in_progress: 'entretien',
      offer:       'offre',
      archived:    'archive',
    };
    const evType: CalEvent['type'] = typeMap[job.status] ?? 'envie';

    let date: Date;
    let dateField: CalEvent['dateField'] = 'created_at';
    let hour: number | undefined;
    let minutes: number | undefined;

    if ((job.status === 'in_progress' || job.status === 'interview') && (job as any).interview_at) {
      date = new Date((job as any).interview_at);
      dateField = 'interview_at';
      if (date.getHours() > 0 || date.getMinutes() > 0) {
        hour = date.getHours();
        minutes = date.getMinutes();
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

    return { jobId: job.id, date, dateField, title: job.title || 'Sans titre', company: job.company || '', type: evType, hour, minutes };
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

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({
  ev, onJobClick, onDragStart,
}: {
  ev: CalEvent;
  onJobClick: (jobId: string) => void;
  onDragStart: (e: React.DragEvent, ev: CalEvent) => void;
}) {
  const isArchived = ev.type === 'archive';
  const isDeadline = ev.type === 'deadline';
  const timeLabel = ev.hour !== undefined ? formatTime(ev.hour, ev.minutes || 0) : undefined;

  return (
    <div
      draggable={!isArchived && !isDeadline}
      onDragStart={e => !isArchived && !isDeadline && onDragStart(e, ev)}
      onClick={e => { e.stopPropagation(); onJobClick(ev.jobId); }}
      title={`${isDeadline ? '⏰ ' + (ev.deadlineLabel || 'Deadline') + ' — ' : ''}${ev.title} — ${ev.company}`}
      style={{
        ...EV_STYLE[ev.type],
        borderRadius: 5, padding: '5px 8px', marginBottom: 3,
        cursor: 'pointer',
        fontFamily: 'Montserrat,sans-serif', overflow: 'hidden',
        userSelect: 'none', opacity: isArchived ? 0.65 : 1,
        // Deadlines : style légèrement différent (bordure pointillée)
        border: isDeadline ? '1.5px dashed rgba(255,255,255,0.5)' : 'none',
      }}
    >
      {isDeadline && (
        <div style={{ fontSize: 10, opacity: .9, fontWeight: 800, lineHeight: 1.3 }}>
          ⏰ {ev.deadlineLabel || 'Deadline'}
        </div>
      )}
      {timeLabel && !isDeadline && (
        <div style={{ fontSize: 11, opacity: .9, fontWeight: 700, lineHeight: 1.3 }}>{timeLabel}</div>
      )}
      <div style={{
        fontSize: 12, fontWeight: 800, lineHeight: 1.4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: isArchived ? 'line-through' : 'none',
      }}>{ev.title}</div>
      {ev.company && (
        <div style={{
          fontSize: 11, fontWeight: 600, opacity: .85,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
          textDecoration: isArchived ? 'line-through' : 'none',
        }}>{ev.company}</div>
      )}
    </div>
  );
}

// ─── DashboardCalendar (export) ───────────────────────────────────────────────

export default function DashboardCalendar({
  jobs, onJobClick, onDateChange,
}: {
  jobs: Job[];
  onJobClick: (jobId: string) => void;
  onDateChange: (jobId: string, field: string, newDate: Date) => void;
}) {
  const [calView, setCalView]       = useState<'week' | 'month'>('week');
  const [offset, setOffset]         = useState(0);
  const [visible, setVisible]       = useState(true);
  const [dragOver, setDragOver]     = useState<string | null>(null);
  const [deadlineEvents, setDeadlineEvents] = useState<CalEvent[]>([]);
  const dragEvRef = useRef<CalEvent | null>(null);

  const today  = new Date();
  const jobEvents = jobsToEvents(jobs);

  // ✅ Charge les deadlines depuis Supabase au chargement + quand jobs change
  useEffect(() => {
    if (!jobs.length) return;
    loadDeadlines();
  }, [jobs]);

  async function loadDeadlines() {
    const supabase = createClient();
    // Récupère toutes les actions avec une deadline_date pour les jobs de l'utilisateur
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
        // deadline_date est au format YYYY-MM-DD → on parse en heure neutre
        const [y, m, d] = row.deadline_date.split('-').map(Number);
        const date = new Date(y, m - 1, d); // heure locale, pas UTC
        return {
          jobId: row.job_id,
          date,
          dateField: 'deadline' as CalEvent['dateField'],
          title: job.title || 'Sans titre',
          company: job.company || '',
          type: 'deadline' as CalEvent['type'],
          deadlineLabel: row.title, // ex: "Fixer une deadline"
        };
      })
      .filter(Boolean) as CalEvent[];

    setDeadlineEvents(evs);
  }

  // Tous les événements = offres + deadlines
  const allEvents = [...jobEvents, ...deadlineEvents];

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
    if (ev.type === 'deadline') return; // les deadlines ne sont pas draggables

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
        {/* Légendes à gauche */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(Object.keys(EV_LABEL) as CalEvent['type'][]).map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#333', fontWeight: 700 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: (EV_STYLE[t] as any).background, flexShrink: 0 }} />
              {EV_LABEL[t]}
            </div>
          ))}
        </div>
        {/* Navigation + Semaine/Mois à droite */}
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
    const ws = getWeekStart(today, offset);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(d.getDate() + i); return d;
    });
    const periodLabel = `${days[0].getDate()} – ${days[6].getDate()} ${CAL_MONTHS[days[6].getMonth()]} ${days[6].getFullYear()}`;

    return (
      <>
        <NavBar periodLabel={periodLabel} />
        <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(7, minmax(0, 1fr))`, border: '2px solid #111', borderRadius: 10, overflow: 'hidden' }}>
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
                const cellEvs = allEvents.filter(e =>
                  sameDay(e.date, d) && (
                    e.type === 'deadline'
                      ? h === 8  // deadlines affichées à 8h
                      : e.hour !== undefined ? e.hour === h : h === 8
                  )
                );
                return (
                  <div
                    key={`${h}-${di}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => handleDrop(e, d, h)}
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
