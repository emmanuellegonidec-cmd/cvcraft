'use client';
import { useState } from 'react';
import { Job, JobStatus } from '@/lib/jobs';
import { Stage, formatDate } from './types';

type Props = {
  jobs: Job[];
  stages: Stage[];
  onJobClick: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  onAddJob: () => void;
};

export default function ListView({ jobs, stages, onJobClick, onDeleteJob, onAddJob }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = jobs.filter(j =>
    (!searchQuery || j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterStatus === 'all' || j.status === filterStatus)
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '2px solid #E0E0E0', borderRadius: 8, padding: '7px 12px', flex: 1, maxWidth: 300 }}>
          <span>🔍</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..."
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', fontFamily: 'Montserrat,sans-serif' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="fi" style={{ width: 'auto' }}>
          <option value="all">Tous les statuts</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
        <div className="lrow" style={{ background: '#F4F4F4', fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', cursor: 'default' }}>
          <div>Poste / Entreprise</div><div>Localisation</div><div>Type</div><div>Statut</div><div>Créé le</div><div></div>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            Aucune candidature — <button onClick={onAddJob} style={{ color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Ajouter</button>
          </div>
        )}

        {filtered.map(job => {
          const stage = stages.find(s => s.id === job.status) || { color: '#888', label: job.status };
          return (
            <div key={job.id} className="lrow" onClick={() => onJobClick(job)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: '#FDEAEA', border: '1.5px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>
                  {job.company.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{job.title}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{job.company}</div>
                </div>
              </div>
              <div style={{ fontSize: 13 }}>{job.location || '—'}</div>
              <div><span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.job_type}</span></div>
              <div><span className="pill" style={{ background: stage.color + '22', color: stage.color }}>{stage.label}</span></div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{formatDate(job.created_at)}</div>
              <div>
                <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: '#E8151B', borderColor: '#FDEAEA' }}
                  onClick={e => { e.stopPropagation(); onDeleteJob(job.id); }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
