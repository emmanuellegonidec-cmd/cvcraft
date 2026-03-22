'use client';
import { Job } from '@/lib/jobs';
import { Stage, isInterviewStage } from './types';

// ── AGENDA VIEW ───────────────────────────────────────────────────

type AgendaProps = {
  jobs: Job[];
  stages: Stage[];
  onJobClick: (job: Job) => void;
  onBackToKanban: () => void;
};

export function AgendaView({ jobs, stages, onJobClick, onBackToKanban }: AgendaProps) {
  const interviewJobs = jobs.filter(j => isInterviewStage(j.status, stages));

  if (interviewJobs.length === 0) {
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
      {interviewJobs.map(job => {
        const stage = stages.find(s => s.id === job.status);
        return (
          <div key={job.id} style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '2px 2px 0 #111' }}>
            <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#B8900A', textTransform: 'uppercase' }}>{stage?.label || 'Entretien'}</div>
              {job.interview_at && (
                <div style={{ fontSize: 12, fontWeight: 800, color: '#B8900A' }}>
                  {new Date(job.interview_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{job.title}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{job.company}{job.location && ' · ' + job.location}</div>
            </div>
            <button className="btn-main" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => onJobClick(job)}>Voir détails</button>
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
