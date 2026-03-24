'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job } from '@/lib/jobs';
import { DETAIL_STAGES, Stage, getGlobalStatus, formatDate, isInterviewStage, GLOBAL_STYLES } from '../../components/types';
import { HeartDisplay } from '../../components/HeartComponents';

interface ContactLie {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  job_id: string | null;
  job_manual: string | null;
}

export default function JobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [customStages, setCustomStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsLies, setContactsLies] = useState<ContactLie[]>([]);

  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#7A1ADB');

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

      // Charger les contacts liés à ce job
      const cr = await fetch('/api/contacts', { headers: h });
      const cd = await cr.json();
      if (cd.contacts) {
        setContactsLies(cd.contacts.filter((c: ContactLie) => c.job_id === jobId));
      }

      // ✅ CORRIGÉ : filtrer les étapes custom par job_id (et non globalement par user_id)
      const { data: cs } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('job_id', jobId)           // ← AJOUT du filtre par job
        .order('position');
      if (cs) setCustomStages(cs.map((s: any) => ({
        id: s.id,
        label: s.label,
        color: s.color,
        position: s.position,
        is_default: false,
        global_status: 'in_progress',
      })));

      setLoading(false);
    }
    load();
  }, [jobId, router]);

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
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  async function handleStageChange(subStatusId: string) {
    if (!job) return;
    const globalStatus = getGlobalStatus(subStatusId, customStages);
    const res = await authFetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ id: job.id, sub_status: subStatusId, status: globalStatus }),
    });
    const data = await res.json();
    if (data.job) setJob(data.job);
  }

  async function handleFieldUpdate(field: string, value: any) {
    if (!job) return;
    const res = await authFetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ id: job.id, [field]: value }),
    });
    const data = await res.json();
    if (data.job) setJob(data.job);
  }

  async function addCustomStage() {
    if (!newStageName.trim() || !userId) return;
    const supabase = createClient();
    const maxPos = customStages.length > 0 ? Math.max(...customStages.map(s => s.position)) : 5;
    // ✅ CORRIGÉ : on insère avec job_id pour lier l'étape à cette offre uniquement
    const { data } = await supabase.from('pipeline_stages').insert({
      user_id: userId,
      job_id: jobId,               // ← AJOUT du job_id
      label: newStageName.trim(),
      color: newStageColor,
      position: maxPos + 1,
    }).select().single();
    if (data) {
      setCustomStages(prev => [...prev, {
        id: data.id,
        label: data.label,
        color: data.color,
        position: data.position,
        is_default: false,
        global_status: 'in_progress',
      }]);
      setNewStageName('');
      setShowAddStage(false);
    }
  }

  async function deleteCustomStage(stageId: string) {
    if (!confirm('Supprimer cette étape ?')) return;
    const supabase = createClient();
    // ✅ CORRIGÉ : on filtre aussi par job_id pour plus de sécurité
    await supabase.from('pipeline_stages').delete().eq('id', stageId).eq('job_id', jobId);
    setCustomStages(prev => prev.filter(s => s.id !== stageId));
  }

  const initials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ fontWeight: 700, color: '#888' }}>Chargement...</div>
      </div>
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
          ✏️ Générer un CV
        </button>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* Pipeline détaillé */}
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pipeline</div>
            <button onClick={() => setShowAddStage(true)} style={{ background: 'none', border: '1.5px dashed #ccc', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#aaa', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>
              + Étape
            </button>
          </div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
            {detailStages.map((s, i) => {
              const isActive = currentSubStatus === s.id;
              const isPast = currentStageIndex > i;
              const isCustom = !s.is_default && customStages.find(c => c.id === s.id);
              return (
                <div key={s.id} style={{ position: 'relative', flex: '1 1 0', minWidth: 80, zIndex: isActive ? 2 : 1 }}>
                  <button
                    onClick={() => handleStageChange(s.id)}
                    style={{
                      width: '100%',
                      background: isActive ? s.color : isPast ? s.color + '33' : '#F4F4F4',
                      color: isActive ? '#fff' : isPast ? s.color : '#888',
                      border: `2px solid ${isActive ? s.color : isPast ? s.color + '66' : '#E0E0E0'}`,
                      borderRadius: i === 0 ? '8px 0 0 8px' : i === detailStages.length - 1 ? '0 8px 8px 0' : '0',
                      marginLeft: i === 0 ? 0 : -2,
                      padding: '8px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'Montserrat,sans-serif',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                      textAlign: 'center',
                    }}
                  >
                    {s.label}
                    {isCustom && (
                      <span
                        onClick={e => { e.stopPropagation(); deleteCustomStage(s.id); }}
                        style={{ marginLeft: 4, opacity: 0.5, cursor: 'pointer', fontSize: 9 }}
                      >✕</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {showAddStage && (
            <div style={{ marginTop: 12, background: '#F4F4F4', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                placeholder="Nom de l'étape..."
                className="fi"
                style={{ flex: 1, minWidth: 150 }}
                onKeyDown={e => e.key === 'Enter' && addCustomStage()}
                autoFocus
              />
              <input
                type="color"
                value={newStageColor}
                onChange={e => setNewStageColor(e.target.value)}
                style={{ width: 36, height: 36, border: '2px solid #E0E0E0', borderRadius: 6, cursor: 'pointer', padding: 2 }}
              />
              <button className="btn-main" style={{ padding: '7px 14px', fontSize: 12 }} onClick={addCustomStage}>Ajouter</button>
              <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => { setShowAddStage(false); setNewStageName(''); }}>Annuler</button>
            </div>
          )}
        </div>

        {/* Infos + Documents */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Informations</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {job.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.location}</span>}
              {(job as any).salary_text && <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A' }}>💶 {(job as any).salary_text}</span>}
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

          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Documents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={'check-box' + ((job as any).cv_sent ? ' checked' : '')} onClick={() => handleFieldUpdate('cv_sent', !(job as any).cv_sent)}>{(job as any).cv_sent && '✓'}</div>
                <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>CV envoyé</span>
                <button className={'doc-btn' + ((job as any).cv_url ? ' done' : '')} onClick={() => (job as any).cv_url && window.open((job as any).cv_url)}>{(job as any).cv_url ? '📄 Voir' : '📄 Non joint'}</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={'check-box' + ((job as any).cover_letter_sent ? ' checked' : '')} onClick={() => handleFieldUpdate('cover_letter_sent', !(job as any).cover_letter_sent)}>{(job as any).cover_letter_sent && '✓'}</div>
                <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>LM envoyée</span>
                <button className={'doc-btn' + ((job as any).cover_letter_url ? ' done' : '')} onClick={() => (job as any).cover_letter_url && window.open((job as any).cover_letter_url)}>{(job as any).cover_letter_url ? '📄 Voir' : '📄 Non jointe'}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts liés */}
        {contactsLies.length > 0 && (
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Contacts liés
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contactsLies.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FDEAEA', border: '2px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>
                    {initials(c.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                    {c.role && <div style={{ fontSize: 11, color: '#888' }}>{c.role}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {c.email    && <button className="cbtn" onClick={() => window.open('mailto:' + c.email)}>✉️ Email</button>}
                    {c.phone    && <button className="cbtn" onClick={() => window.open('tel:' + c.phone)}>📞 Appel</button>}
                    {c.linkedin && <button className="cbtn" onClick={() => window.open(c.linkedin!)}>💼 LinkedIn</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes + Synthèse entretien */}
        <div style={{ display: 'grid', gridTemplateColumns: isInterviewStage(job.status, customStages) ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Mes notes</div>
            <textarea
              defaultValue={job.notes || ''}
              placeholder="Notes, impressions, points clés..."
              className="fi"
              style={{ resize: 'vertical', minHeight: 100 }}
              onBlur={e => handleFieldUpdate('notes', e.target.value)}
            />
          </div>
          {isInterviewStage(job.status, customStages) && (
            <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.25rem', boxShadow: '3px 3px 0 #111' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Synthèse entretien</div>
              <textarea
                defaultValue={(job as any).interview_summary || ''}
                placeholder="Déroulement, questions posées, impressions..."
                className="fi"
                style={{ resize: 'vertical', minHeight: 100 }}
                onBlur={e => handleFieldUpdate('interview_summary', e.target.value)}
              />
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
