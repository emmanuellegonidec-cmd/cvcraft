'use client';
import { Job, JobStatus, JobType } from '@/lib/jobs';
import { Stage, NewJobState, EMPTY_JOB } from './types';
import { HeartRating } from './HeartComponents';

type Props = {
  editingJobId: string | null;
  newJob: NewJobState;
  setNewJob: (fn: (prev: NewJobState) => NewJobState) => void;
  stages: Stage[];
  importUrl: string;
  setImportUrl: (v: string) => void;
  addJobMode: null | 'url' | 'manual';
  setAddJobMode: (v: null | 'url' | 'manual') => void;
  importError: boolean;
  setImportError: (v: boolean) => void;
  importLoading: boolean;
  onImport: (url: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function JobModal({
  editingJobId, newJob, setNewJob, stages,
  importUrl, setImportUrl, addJobMode, setAddJobMode,
  importError, setImportError, importLoading,
  onImport, onSave, onClose,
}: Props) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
            {editingJobId ? "Modifier l'offre" : 'Ajouter une offre'}
          </h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        {/* Choix mode — seulement pour nouveau */}
        {!addJobMode && !editingJobId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { mode: 'url', icon: '🔗', title: 'Importer depuis une URL', sub: 'Importer automatiquement depuis un jobboard' },
              { mode: 'manual', icon: '✍️', title: 'Remplir manuellement', sub: 'Créer une offre à partir de zéro' },
            ].map(opt => (
              <button key={opt.mode} onClick={() => setAddJobMode(opt.mode as 'url' | 'manual')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1rem 1.25rem', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', textAlign: 'left', boxShadow: '2px 2px 0 #111', width: '100%' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-1px,-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0 #E8151B'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 0 #111'; }}>
                <span style={{ fontSize: 24 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 2 }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mode URL */}
        {addJobMode === 'url' && !editingJobId && (
          <div>
            <button onClick={() => { setAddJobMode(null); setImportError(false); setImportUrl(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 12, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>
            <div style={{ marginBottom: 14 }}>
              <label className="fl">URL de l&apos;offre</label>
              <input className="fi" placeholder="https://www.linkedin.com/jobs/view/..." value={importUrl} onChange={e => setImportUrl(e.target.value)} />
            </div>
            {importError && (
              <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>Impossible d&apos;importer cette offre automatiquement.</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Vous pouvez la remplir manuellement.</div>
                <button className="btn-main" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => { setAddJobMode('manual'); setImportError(false); }}>→ Remplir manuellement</button>
              </div>
            )}
            {!importError && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAddJobMode(null)}>Annuler</button>
                <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={() => onImport(importUrl)} disabled={!importUrl || importLoading}>
                  {importLoading ? '⏳ Import en cours...' : "Importer l'offre →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode manuel */}
        {addJobMode === 'manual' && (
          <div>
            {!editingJobId && (
              <button onClick={() => setAddJobMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>
            )}

            <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coup de cœur ?</div>
              <HeartRating value={newJob.favorite} onChange={v => setNewJob(prev => ({ ...prev, favorite: v }))} />
            </div>

            <div style={{ maxHeight: '62vh', overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Type de contrat</label>
                  <select className="fi" value={newJob.job_type} onChange={e => setNewJob(prev => ({ ...prev, job_type: e.target.value as JobType }))}>
                    {['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Étape</label>
                  <select className="fi" value={newJob.status} onChange={e => setNewJob(prev => ({ ...prev, status: e.target.value as JobStatus }))}>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Intitulé du poste *</label>
                  <input className="fi" value={newJob.title} onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))} placeholder="Chief Marketing Officer H/F" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Entreprise *</label>
                  <input className="fi" value={newJob.company} onChange={e => setNewJob(prev => ({ ...prev, company: e.target.value }))} placeholder="Decathlon" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Source</label>
                  <select className="fi" value={newJob.source} onChange={e => setNewJob(prev => ({ ...prev, source: e.target.value }))}>
                    <option value="">Choisir...</option>
                    {['LinkedIn', 'Indeed', 'Welcome to the Jungle', 'Apec', 'Pôle Emploi', 'Site entreprise', 'Réseau', 'HelloWork', 'Autre'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Lieu</label>
                  <input className="fi" value={newJob.location} onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))} placeholder="Paris · Hybride" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Salaire</label>
                  <input className="fi" value={newJob.salary} onChange={e => setNewJob(prev => ({ ...prev, salary: e.target.value }))} placeholder="45-55k€ / an" />
                </div>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Lien de l&apos;offre</label>
                  <input className="fi" value={newJob.url} onChange={e => setNewJob(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..." />
                </div>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Description du poste</label>
                  <textarea className="fi" value={newJob.description} onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))} placeholder="Missions, compétences requises..." rows={5} style={{ resize: 'vertical', minHeight: 120 }} />
                </div>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Mes notes personnelles</label>
                  <textarea className="fi" value={newJob.notes} onChange={e => setNewJob(prev => ({ ...prev, notes: e.target.value }))} placeholder="Mes impressions, points à vérifier..." rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
              <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={onSave} disabled={!newJob.title || !newJob.company}>
                {editingJobId ? 'Enregistrer' : "Ajouter l'offre"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
