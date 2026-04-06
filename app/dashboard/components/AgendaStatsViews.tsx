'use client';
import { useEffect, useState } from 'react';
import { Job } from '@/lib/jobs';
import { Stage, isInterviewStage } from './types';
import { useRouter } from 'next/navigation';

type AgendaProps = {
  jobs: Job[];
  stages: Stage[];
  onJobClick: (job: Job) => void;
  onBackToKanban: () => void;
};

type ContactMin = { id: string; name: string; role?: string | null };

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  telephone:  { label: '📞 Téléphone',  color: '#1A6FA8', bg: '#E8F4FD' },
  visio:      { label: '💻 Visio',      color: '#6B35B5', bg: '#F0EBFB' },
  presentiel: { label: '🏢 Présentiel', color: '#1A7A4A', bg: '#E8F5EE' },
};

const FONT = "'Montserrat', sans-serif";

function getAuthHeaders(): Record<string, string> {
  const token = (typeof window !== 'undefined') ? (window as any).__jfmj_token : null;
  if (!token) return { 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Europe/Paris',
  });
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function parseLocalDate(dateStr: string): Date {
  if (dateStr.length === 10) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

// Calcule la date effective d'un entretien (même logique que DashboardCalendar)
function getEffectiveDate(job: Job): Date | null {
  const subStatus = (job as any).sub_status as string | null;
  const stepDates = (job as any).step_dates as Record<string, string> | null;
  const interviewAt = (job as any).interview_at as string | null;

  if (job.status === 'in_progress' && subStatus && stepDates?.[subStatus]) {
    const stepDate = parseLocalDate(stepDates[subStatus]);
    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    if (stepDate >= todayMidnight) return stepDate; // future → prochaine étape
    if (interviewAt) return new Date(interviewAt);  // passée → interview_at prime
    return stepDate;
  }
  if (interviewAt) return new Date(interviewAt);
  return null;
}

function isPast(job: Job): boolean {
  const d = getEffectiveDate(job);
  if (!d) return false;
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  return d < todayMidnight;
}

// Label de section
function SectionLabel({ label, past }: { label: string; past: boolean }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700,
      color: past ? '#aaa' : '#888',
      textTransform: 'uppercase', letterSpacing: '0.5px',
      fontFamily: FONT, marginBottom: 6, marginTop: past ? 12 : 0,
    }}>
      {label}
    </p>
  );
}

export function AgendaView({ jobs, stages, onJobClick, onBackToKanban }: AgendaProps) {
  const router = useRouter();
  const [contactsMap, setContactsMap] = useState<Record<string, ContactMin>>({});

  useEffect(() => {
    fetch('/api/contacts', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        if (!data.contacts) return;
        const map: Record<string, ContactMin> = {};
        data.contacts.forEach((c: ContactMin) => { map[c.id] = c; });
        setContactsMap(map);
      })
      .catch(() => {});
  }, []);

  const interviewJobs = jobs.filter(j => isInterviewStage(j.status, stages));

  // Tri par date effective croissante
  const sorted = [...interviewJobs].sort((a, b) => {
    const da = getEffectiveDate(a);
    const db = getEffectiveDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.getTime() - db.getTime();
  });

  const upcoming = sorted.filter(j => !isPast(j));
  const past     = sorted.filter(j => isPast(j));

  if (sorted.length === 0) {
    return (
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#888', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8, fontFamily: FONT }}>Aucun entretien planifié</div>
        <button className="btn-main" onClick={onBackToKanban}>Voir le tableau de bord</button>
      </div>
    );
  }

  function renderCard(job: Job, muted: boolean) {
    const subStatusId = (job as any).sub_status || job.status;
    const detailStage = stages.find(s => s.id === subStatusId);
    const effectiveDate = getEffectiveDate(job);
    const timeStart   = (job as any).interview_time as string | null;
    const timeEnd     = (job as any).interview_time_end as string | null;
    const iType       = (job as any).interview_type as string | null;
    const contactId   = (job as any).interview_contact_id as string | null;
    const contact     = contactId ? contactsMap[contactId] : null;
    const typeInfo    = iType ? TYPE_LABELS[iType] : null;

    const timeLabel = timeStart
      ? (timeEnd ? `${fmtTime(timeStart)} – ${fmtTime(timeEnd)}` : fmtTime(timeStart))
      : null;

    const contactLabel = contact
      ? contact.name + (contact.role ? ` – ${contact.role}` : '')
      : null;

    return (
      <div
        key={job.id}
        style={{
          background: '#fff',
          border: '2px solid #111',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '2px 2px 0 #111',
          flexWrap: 'wrap',
          opacity: muted ? 0.65 : 1,
          marginBottom: 8,
        }}
      >
        {/* DATE */}
        <div style={{
          background: muted ? '#F5F5F0' : '#FEF9E0',
          border: `2px solid ${muted ? '#DDD' : '#F5C400'}`,
          borderRadius: 8,
          padding: '5px 10px', textAlign: 'center', minWidth: 90, flexShrink: 0,
        }}>
          {effectiveDate
            ? <div style={{ fontSize: 11, fontWeight: 800, color: muted ? '#888' : '#111', fontFamily: FONT }}>{fmtDate(effectiveDate.toISOString())}</div>
            : <div style={{ fontSize: 10, fontWeight: 700, color: '#B8900A', fontFamily: FONT }}>Date à fixer</div>
          }
        </div>

        {/* HORAIRE */}
        {timeLabel && (
          <div style={{
            background: muted ? '#F5F5F0' : '#FFF8EC',
            border: `1.5px solid ${muted ? '#DDD' : '#FFD97A'}`,
            borderRadius: 8, padding: '5px 10px', flexShrink: 0,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: muted ? '#888' : '#B8900A', fontFamily: FONT }}>🕐 {timeLabel}</div>
          </div>
        )}

        {/* ÉTAPE */}
        {detailStage && (
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
            background: detailStage.color + '22', color: detailStage.color,
            border: `1.5px solid ${detailStage.color}55`,
            fontFamily: FONT,
          }}>
            {detailStage.label}
          </span>
        )}

        {/* TITRE · Entreprise · Contact */}
        <div style={{ flex: '1 1 140px', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', fontFamily: FONT, textDecoration: muted ? 'line-through' : 'none' }}>{job.title}</span>
          {job.company && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap', fontFamily: FONT }}>· {job.company}</span>
          )}
          {contactLabel && (
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px', flexShrink: 0,
              background: '#FDEAEA', color: '#E8151B', border: '1.5px solid #FFBABA', whiteSpace: 'nowrap',
              fontFamily: FONT,
            }}>
              👤 {contactLabel}
            </span>
          )}
        </div>

        {/* TYPE */}
        {typeInfo && (
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
            background: typeInfo.bg, color: typeInfo.color, border: `1.5px solid ${typeInfo.color}44`,
            fontFamily: FONT,
          }}>
            {typeInfo.label}
          </span>
        )}

        {/* BOUTONS */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
          <button className="btn-main" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => onJobClick(job)}>
            RDV
          </button>
          <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => router.push(`/dashboard/job/${job.id}`)}>
            Offre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {upcoming.length > 0 && (
        <>
          <SectionLabel label="À venir" past={false} />
          {upcoming.map(job => renderCard(job, false))}
        </>
      )}
      {past.length > 0 && (
        <>
          <SectionLabel label="Passées" past={true} />
          {past.map(job => renderCard(job, true))}
        </>
      )}
    </div>
  );
}

// ── STATS VIEW ────────────────────────────────────────────────────

type StatsProps = {
  jobs: Job[];
  stages: Stage[];
  contactCount: number;
};

export function StatsView({ jobs, stages, contactCount }: StatsProps) {
  const jobsByStatus = (s: string) => jobs.filter(j => j.status === s);
  const interviews   = jobs.filter(j => isInterviewStage(j.status, stages)).length;
  const offers       = jobs.filter(j => j.status === 'offer').length;
  const responseRate = jobs.length
    ? Math.round((jobs.filter(j => isInterviewStage(j.status, stages) || j.status === 'offer').length / jobs.length) * 100)
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', fontFamily: FONT }}>Répartition par statut</div>
        {stages.filter(s => s.id !== 'archived').map(col => {
          const count = jobsByStatus(col.id).length;
          const pct   = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
          return (
            <div key={col.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontFamily: FONT }}>
                <span style={{ fontWeight: 600 }}>{col.label}</span>
                <span style={{ fontWeight: 800 }}>{count}</span>
              </div>
              <div style={{ height: 8, background: '#F4F4F4', borderRadius: 4 }}>
                <div style={{ height: '100%', width: pct + '%', background: col.color, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', fontFamily: FONT }}>Taux de conversion</div>
        {[
          { l: 'Candidatures → Entretien', v: responseRate, c: '#E8151B' },
          { l: 'Entretien → Offre', v: interviews ? Math.round((offers / interviews) * 100) : 0, c: '#1A7A4A' },
        ].map(item => (
          <div key={item.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT }}>{item.l}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ height: 6, width: 100, background: '#F4F4F4', borderRadius: 3 }}>
                <div style={{ height: '100%', width: item.v + '%', background: item.c, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: item.c, minWidth: 36, fontFamily: FONT }}>{item.v}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
