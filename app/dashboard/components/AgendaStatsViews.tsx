'use client';
import { useEffect, useState } from 'react';
import { Job } from '@/lib/jobs';
import { Stage, isInterviewStage } from './types';
import { useRouter } from 'next/navigation';

// ── AGENDA VIEW ───────────────────────────────────────────────────

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

function getAuthHeaders(): Record<string, string> {
  const token = (typeof window !== 'undefined') ? (window as any).__jfmj_token : null;
  if (!token) return { 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return '';
  return t.slice(0, 5);
}

export function AgendaView({ jobs, stages, onJobClick, onBackToKanban }: AgendaProps) {
  const router = useRouter();
  const [contactsMap, setContactsMap] = useState<Record<string, ContactMin>>({});

  // Charger tous les contacts pour résoudre interview_contact_id → nom + fonction
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

  const sorted = [...interviewJobs].sort((a, b) => {
    const da = (a as any).interview_at;
    const db = (b as any).interview_at;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return new Date(da).getTime() - new Date(db).getTime();
  });

  if (sorted.length === 0) {
    return (
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#888', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 }}>Aucun entretien planifié</div>
        <button className="btn-main" onClick={onBackToKanban}>Voir le tableau de bord</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map(job => {
        const subStatusId  = (job as any).sub_status || job.status;
        const detailStage  = stages.find(s => s.id === subStatusId);
        const date         = (job as any).interview_at as string | null;
        const timeStart    = (job as any).interview_time as string | null;
        const timeEnd      = (job as any).interview_time_end as string | null;
        const iType        = (job as any).interview_type as string | null;
        const contactId    = (job as any).interview_contact_id as string | null;
        const contact      = contactId ? contactsMap[contactId] : null;
        const typeInfo     = iType ? TYPE_LABELS[iType] : null;

        const timeLabel = timeStart
          ? (timeEnd ? `${fmtTime(timeStart)} – ${fmtTime(timeEnd)}` : fmtTime(timeStart))
          : null;

        // Affichage contact : "Prénom Nom - Fonction"
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
            }}
          >
            {/* 1 — Bloc DATE */}
            <div style={{
              background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8,
              padding: '5px 10px', textAlign: 'center', minWidth: 90, flexShrink: 0,
            }}>
              {date
                ? <div style={{ fontSize: 11, fontWeight: 800, color: '#111' }}>{fmtDate(date)}</div>
                : <div style={{ fontSize: 10, fontWeight: 700, color: '#B8900A' }}>Date à fixer</div>
              }
            </div>

            {/* 2 — Bloc HORAIRE (séparé) */}
            {timeLabel && (
              <div style={{
                background: '#FFF8EC', border: '1.5px solid #FFD97A', borderRadius: 8,
                padding: '5px 10px', textAlign: 'center', flexShrink: 0,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#B8900A' }}>🕐 {timeLabel}</div>
              </div>
            )}

            {/* 3 — Titre + entreprise */}
            <div style={{ flex: '1 1 140px', minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
              <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {job.company}{job.location ? ' · ' + job.location : ''}
              </div>
            </div>

            {/* 4 — Étape détaillée (sub_status) */}
            {detailStage && (
              <span style={{
                fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                background: detailStage.color + '22', color: detailStage.color,
                border: `1.5px solid ${detailStage.color}55`,
              }}>
                {detailStage.label}
              </span>
            )}

            {/* 5 — Type */}
            {typeInfo && (
              <span style={{
                fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                background: typeInfo.bg, color: typeInfo.color, border: `1.5px solid ${typeInfo.color}44`,
              }}>
                {typeInfo.label}
              </span>
            )}

            {/* 6 — Contact : Prénom Nom – Fonction */}
            {contactLabel && (
              <span style={{
                fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
                background: '#FDEAEA', color: '#E8151B', border: '1.5px solid #FFBABA',
              }}>
                👤 {contactLabel}
              </span>
            )}

            {/* 7 — Boutons */}
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
      })}
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
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Répartition par statut</div>
        {stages.filter(s => s.id !== 'archived').map(col => {
          const count = jobsByStatus(col.id).length;
          const pct   = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
          return (
            <div key={col.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
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
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Taux de conversion</div>
        {[
          { l: 'Candidatures → Entretien', v: responseRate, c: '#E8151B' },
          { l: 'Entretien → Offre', v: interviews ? Math.round((offers / interviews) * 100) : 0, c: '#1A7A4A' },
        ].map(item => (
          <div key={item.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{item.l}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ height: 6, width: 100, background: '#F4F4F4', borderRadius: 3 }}>
                <div style={{ height: '100%', width: item.v + '%', background: item.c, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: item.c, minWidth: 36 }}>{item.v}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
