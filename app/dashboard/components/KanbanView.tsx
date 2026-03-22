'use client';
import { useState } from 'react';
import { Job } from '@/lib/jobs';
import { Stage, formatRelative } from './types';
import { HeartDisplay } from './HeartComponents';

type Props = {
  jobs: Job[];
  stages: Stage[];
  onJobClick: (job: Job) => void;
  onAddJob: (stageId: string) => void;
};

export default function KanbanView({ jobs, stages, onJobClick, onAddJob }: Props) {
  const jobsByStatus = (s: string) => jobs.filter(j => j.status === s);

  // Colonnes vides repliées par défaut
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    stages.forEach(s => { init[s.id] = true; }); // sera affiné au premier render
    return init;
  });

  const toggle = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'start', overflowX: 'auto', paddingBottom: 8, width: '100%' }}>
      {stages.map(col => {
        const count = jobsByStatus(col.id).length;
        const isEmpty = count === 0;
        const isCollapsed = isEmpty && collapsed[col.id] !== false;

        return (
          <div
            key={col.id}
            style={{
              background: '#F4F4F4',
              border: '1.5px solid #E0E0E0',
              borderRadius: 10,
              padding: 8,
              // Colonnes vides repliées : largeur fixe réduite ; sinon flex grow
              flex: isCollapsed ? '0 0 auto' : '1 1 0',
              minWidth: isCollapsed ? 'unset' : 200,
              width: isCollapsed ? 'auto' : undefined,
              transition: 'flex 0.2s ease, min-width 0.2s ease',
              overflow: 'hidden',
            }}
          >
            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCollapsed ? 4 : 8, gap: 4 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#111',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                  whiteSpace: isCollapsed ? 'nowrap' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {col.label}
              </div>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: col.color + '22', color: col.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, flexShrink: 0,
              }}>
                {count}
              </div>
            </div>

            {/* Bouton + sous le titre, uniquement si vide et replié */}
            {isEmpty && isCollapsed && (
              <button
                onClick={() => toggle(col.id)}
                title="Déplier"
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: '1px dashed #ccc',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontSize: 14,
                  color: '#bbb',
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                +
              </button>
            )}

            {/* Bouton − pour replier une colonne vide dépliée */}
            {isEmpty && !isCollapsed && (
              <button
                onClick={() => toggle(col.id)}
                title="Replier"
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: '1px dashed #ccc',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '2px 0',
                  fontSize: 14,
                  color: '#bbb',
                  textAlign: 'center',
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                −
              </button>
            )}

            {/* Contenu masqué si replié */}
            {!isCollapsed && (
              <>
                {jobsByStatus(col.id).map(job => (
                  <div key={job.id} className="jcard" onClick={() => onJobClick(job)}>
                    <div style={{ fontSize: 9, color: '#888', fontWeight: 600, marginBottom: 2 }}>{job.company}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{job.title}</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 2 }}>
                      {job.location && (
                        <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0', fontSize: 9 }}>{job.location}</span>
                      )}
                      {(job as any).salary_text && (
                        <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A', fontSize: 9 }}>💰 {(job as any).salary_text}</span>
                      )}
                    </div>
                    {(job as any).favorite > 0 && <HeartDisplay value={(job as any).favorite} />}
                    <div className="date-tag">📅 {formatRelative(job.created_at)}</div>
                  </div>
                ))}

                <div className="add-card" onClick={() => onAddJob(col.id)}>+ Ajouter</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
