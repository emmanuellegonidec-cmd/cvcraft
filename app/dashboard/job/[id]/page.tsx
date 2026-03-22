'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job } from '@/lib/jobs';
import { DETAIL_STAGES, Stage, getGlobalStatus, formatDate, isInterviewStage, GLOBAL_STYLES } from '../../components/types';
import { HeartDisplay } from '../../components/HeartComponents';

export default function JobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [customStages, setCustomStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setAccessToken(session.access_token);
      setUserId(session.user.id);

      const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };
      const res = await fetch('/api/jobs', { headers: h });
      const data = await res.json();
      const found = (data.jobs || []).find((j: Job) => j.id === jobId);
      if (!found) { router.push('/dashboard'); return; }
      setJob(found);

      const { data: cs } = await supabase.from('pipeline_stages').select('*').eq('user_id', session.user.id).order('position');
      if (cs) setCustomStages(cs.map((s: any) => ({ id: s.id, label: s.label, color: s.color, position: s.position, is_default: false, global_status: 'in_progress' })));

      setLoading(false);
    }
    load();
  }, [jobId, router]);

  // Pipeline détaillé = étapes fixes + étapes perso insérées avant "offer"
  const detailStages: Stage[] = [
    ...DETAIL_STAGES.filter(s => !['offer', 'archived'].includes(s.id)),
    ...customStages,
    DETAIL_STAGES.find(s => s.id === 'offer')!,
    DETAIL_STAGES.find(s => s.id === 'archived')!,
  ];

  const currentSubStatus = (job as any)?.sub_status || job?.status;
  const currentStageIndex = detailStages.findIndex(s => s.id === currentSubStatus);

  async function authFetch(url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...(options.headers || {}) },
    });
  }

  async function handleStageChange(subStatusId: string) {
    if (!job) return;
    const globalStatus = getGlobalStatus(subStatusId, customStages);
    const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id: job.id, sub_status: subStatusId, status: globalStatus }) });
    const data = await res.json();
    if (data.job) setJob(data.job);
  }

  async function handleFieldUpdate(field: string, value: any) {
    if (!job) return;
    const res = await authFetch('/api/jobs', { method: 'POST', body: JSON.stringify({ id: job.id, [field]: value }) });
    const data = await res.json();
    if (data.job) setJob(data.job);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat,sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32 }}>⚡</div><div style={{ fontWeight: 700, color: '#888' }}>Chargement...</div></div>
    </div>
  );

  if (!job) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'Montserrat', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Header */}
      <div style={{ background: '#111', borderBottom: '2px solid #111', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{job.company}</div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{job.title}</div>
        </div>
        <button className="btn-main" onClick={() => router.push('/dashboard/editor?targetJob=' + encodeURIComponent(job.title + ' chez ' + job.company))}>
          ✦ Générer un CV
        </button>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* Pipeline détaillé */}
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pipeline</div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
            {detailStages.map((s, i) => {
              const isActive = currentSubStatus === s.id;
              const isPast = currentStageIndex > i;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStageChange(s.id)}
                  style={{
                    flex: '1 1 0',
                    minWidth: 80,
                    background: isActive ? s.color : isPast ? s.color + '33' : '#F4F4F4',
                    color: isActive ? '#fff' : isPast ? s.color : '#888',
                    border: `2px solid ${isActive ? s.color : isPast ? s.color + '66' : '#E0E0E0'}`,
                    borderRadius: i === 0 ? '8px 0 0 8px' : i === detailStages.length - 1 ? '0 8px 8px 0' : '0',
                    marginLeft: i === 0 ? 0 : -2,
                    padding: '8px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Montserrat,sans-serif',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    zIndex: isActive ? 2 : 1,
                    position: 'relative',
                    textAlign: 'center',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Infos + Documents */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Infos offre */}
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Informations</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {job.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.location}</span>}
              {(job as any).salary_text && <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A' }}>💰 {(job as any).salary_text}</span>}
              {job.job_type && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.job_type}</span>}
            </div>
            {(job as any).favorite > 0 && <div style={{ marginBottom: 8 }}><HeartDisplay value={(job as any).favorite} /></div>}
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>📅 Créé le {formatDate(job.created_at)}</div>
            {(job as any).source_url && (
              <a href={(job as any).source_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: '#1A6FDB', fontWeight: 600, textDecoration: 'none' }}>
                🔗 Voir l'offre originale
              </a>
            )}
          </div>

          {/* Documents */}
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Documents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* CV */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={'check-box' + ((job as any).cv_sent ? ' checked' : '')} onClick={() => handleFieldUpdate('cv_sent', !(job as any).cv_sent)}>
                  {(job as any).cv_sent && '✓'}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>CV envoyé</span>
                <button className={'doc-btn' + ((job as any).cv_url ? ' done' : '')}
                  onClick={() => (job as any).cv_url && window.open((job as any).cv_url)}>
                  {(job as any).cv_url ? '📎 Voir' : '📎 Non joint'}
                </button>
              </div>
              {/* LM */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={'check-box' + ((job as any).cover_letter_sent ? ' checked' : '')} onClick={() => handleFieldUpdate('cover_letter_sent', !(job as any).cover_letter_sent)}>
                  {(job as any).cover_letter_sent && '✓'}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>LM envoyée</span>
                <button className={'doc-btn' + ((job as any).cover_letter_url ? ' done' : '')}
                  onClick={() => (job as any).cover_letter_url && window.open((job as any).cover_letter_url)}>
                  {(job as any).cover_letter_url ? '📎 Voir' : '📎 Non jointe'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes + Synthèse entretien */}
        <div style={{ display: 'grid', gridTemplateColumns: isInterviewStage(job.status, customStages) ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Mes notes</div>
            <textarea defaultValue={job.notes || ''} placeholder="Notes, impressions, points clés..." className="fi" style={{ resize: 'vertical', minHeight: 100 }}
              onBlur={e => handleFieldUpdate('notes', e.target.value)} />
          </div>

          {isInterviewStage(job.status, customStages) && (
            <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Synthèse entretien</div>
              <textarea defaultValue={(job as any).interview_summary || ''} placeholder="Déroulement, questions posées, impressions..." className="fi" style={{ resize: 'vertical', minHeight: 100 }}
                onBlur={e => handleFieldUpdate('interview_summary', e.target.value)} />
            </div>
          )}
        </div>

        {/* Description */}
        {job.description && (
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Description du poste</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>{job.description}</div>
          </div>
        )}

      </div>
    </div>
  );
}
