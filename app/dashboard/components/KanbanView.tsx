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
  onOpenSettings: () => void;
};

export default function KanbanView({ jobs, stages, onJobClick, onAddJob, onOpenSettings }: Props) {
  const jobsByStatus = (s: string) => jobs.filter(j => j.status === s);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    stages.forEach(s => { init[s.id] = true; });
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
              flex: isCollapsed ? '0 0 auto' : '1 1 0',
              minWidth: isCollapsed ? 'unset' : 200,
              width: isCollapsed ? 'auto' : undefined,
              transition: 'flex 0.2s ease, min-width 0.2s ease',
              overflow: 'hidden',
            }}
          >
            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 4 }}>
              <div style={{
                fontSize: 9, fontWeight: 800, color: '#111',
                textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3,
                whiteSpace: isCollapsed ? 'nowrap' : 'normal',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {col.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: col.color + '22', color: col.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800,
                }}>
                  {count}
                </div>
                {isEmpty && (
                  <button
                    onClick={() => toggle(col.id)}
                    title={isCollapsed ? 'Déplier' : 'Replier'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0 2px', fontSize: 13, color: '#bbb',
                      lineHeight: 1, fontWeight: 700,
                    }}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                )}
              </div>
            </div>

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

      {/* Colonne fantôme : + Nouvelle étape */}
      <div
        onClick={onOpenSettings}
        title="Ajouter une étape"
        style={{
          flex: '0 0 auto',
          width: 120,
          minHeight: 80,
          background: 'transparent',
          border: '1.5px dashed #ccc',
          borderRadius: 10,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          gap: 4,
          opacity: 0.6,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
      >
        <div style={{ fontSize: 18, color: '#aaa', lineHeight: 1 }}>+</div>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Nouvelle étape</div>
      </div>
    </div>
  );
}
