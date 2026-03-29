'use client';

import { useState, useRef } from 'react';
import { Job } from '@/lib/jobs';

// ─── Types & constantes ───────────────────────────────────────────────────────

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
  hour?: number;
  minutes?: number;
};

const EV_STYLE: Record<CalEvent['type'], React.CSSProperties> = {
  envie:     { background: '#1C1C1E', color: '#fff' },
  postule:   { background: '#1A4A8A', color: '#fff' },
  entretien: { background: '#E8151B', color: '#fff' },
  offre:     { background: '#1A7A4A', color: '#fff' },
  archive:   { background: '#999', color: '#fff' },
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

// ─── DashboardCalendar (export) ───────────────────────────────────────────────

export default function DashboardCalendar({
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

  function handleDrop(e: React.DragEvent, targetDate: Date, targetHour?: number) {
    e.preventDefault();
    setDragOver(null);
    if (!dragEvRef.current) return;
    const ev = dragEvRef.current;
    dragEvRef.current = null;

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
              const dayEvs  = sortEvents(events.filter(e => sameDay(e.date, d)));
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
          {visible && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(Object.keys(EV_LABEL) as CalEvent['type'][]).map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#333', fontWeight: 700 }}>
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
