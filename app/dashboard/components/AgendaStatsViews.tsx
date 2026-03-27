'use client';
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

const TYPE_LABELS: Record<string, string> = {
  telephone: '📞 Téléphone',
  visio: '💻 Visio',
  presentiel: '🏢 Présentiel',
};

function formatInterviewDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatInterviewTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5); // HH:MM
}

export function AgendaView({ jobs, stages, onJobClick, onBackToKanban }: AgendaProps) {
  const router = useRouter();
  const interviewJobs = jobs.filter(j => isInterviewStage(j.status, stages));

  // Trier par date d'entretien (les plus proches en premier, sans date à la fin)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map(job => {
        const stage = stages.find(s => s.id === job.status);
        const interviewDate = (job as any).interview_at;
        const interviewTime = (job as any).interview_time;
        const interviewType = (job as any).interview_type;
        const contactName = (job as any).interview_contact_name; // jointure optionnelle
        const hasDateInfo = interviewDate || interviewTime;

        return (
          <div
            key={job.id}
            style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '2px 2px 0 #111', cursor: 'pointer' }}
            onClick={() => onJobClick(job)}
          >
            {/* Bloc date/type */}
            <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 90, flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#B8900A', textTransform: 'uppercase', marginBottom: 2 }}>
                {stage?.label || 'Entretien'}
              </div>
              {interviewDate ? (
                <div style={{ fontSize: 12, fontWeight: 800, color: '#111', lineHeight: 1.3 }}>
                  {formatInterviewDate(interviewDate)}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: '#B8900A', fontWeight: 600 }}>Date à fixer</div>
              )}
              {interviewTime && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B8900A', marginTop: 2 }}>
                  🕐 {formatInterviewTime(interviewTime)}
                </div>
              )}
            </div>

            {/* Infos job */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{job.title}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                {job.company}{job.location && ' · ' + job.location}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {interviewType && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#F0F0F0', border: '1px solid #E0E0E0', borderRadius: 5, padding: '2px 7px', color: '#555' }}>
                    {TYPE_LABELS[interviewType] || interviewType}
                  </span>
                )}
                {contactName && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#FDEAEA', border: '1px solid #FFBABA', borderRadius: 5, padding: '2px 7px', color: '#E8151B' }}>
                    👤 {contactName}
                  </span>
                )}
                {!hasDateInfo && !interviewType && (
                  <span style={{ fontSize: 10, color: '#BBB', fontWeight: 600 }}>Détails à compléter</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <button
                className="btn-main"
                style={{ fontSize: 11, padding: '6px 12px' }}
                onClick={() => onJobClick(job)}
              >
                Détails
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: 11, padding: '5px 12px' }}
                onClick={() => router.push(`/dashboard/job/${job.id}`)}
              >
                Page →
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
  const interviews = jobs.filter(j => isInterviewStage(j.status, stages)).length;
  const offers = jobs.filter(j => j.status === 'offer').length;
  const responseRate = jobs.length ? Math.round((jobs.filter(j => isInterviewStage(j.status, stages) || j.status === 'offer').length / jobs.length) * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Répartition par statut</div>
        {stages.filter(s => s.id !== 'archived').map(col => {
          const count = jobsByStatus(col.id).length;
          const pct = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
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
