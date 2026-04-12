'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const STATUS_LABELS: Record<string, string> = {
  to_apply: 'À postuler',
  applied: 'Postulé',
  in_progress: 'En cours',
  offer_received: 'Offre reçue',
  offer: 'Offre reçue',
  archived: 'Archivé',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  to_apply:       { bg: '#F1EFE8', color: '#5F5E5A' },
  applied:        { bg: '#FAEEDA', color: '#854F0B' },
  in_progress:    { bg: '#E6F1FB', color: '#185FA5' },
  offer_received: { bg: '#EAF3DE', color: '#3B6D11' },
  offer:          { bg: '#EAF3DE', color: '#3B6D11' },
  archived:       { bg: '#FCEBEB', color: '#A32D2D' },
};

const PIPELINE_STEPS: { key: string; label: string }[] = [
  { key: 'to_apply',           label: 'Envoi de postuler' },
  { key: 'applied',            label: 'Postulé' },
  { key: 'phone_interview',    label: 'Entretien téléphonique' },
  { key: 'hr_interview',       label: 'Entretien RH' },
  { key: 'manager_interview',  label: 'Entretien manager' },
  { key: 'director_interview', label: 'Entretien direction' },
  { key: 'drh_interview',      label: 'Entretien DRH' },
  { key: 'offer_received',     label: 'Offre reçue' },
  { key: 'offer',              label: 'Offre reçue' },
];

function getStepInfo(sub_status: string, customSteps: Record<string, { label: string; position: number }>) {
  const idx = PIPELINE_STEPS.findIndex(s => s.key === sub_status);
  if (idx >= 0) return { label: PIPELINE_STEPS[idx].label, step: idx + 1, total: PIPELINE_STEPS.length };
  if (customSteps[sub_status]) return { label: customSteps[sub_status].label, step: customSteps[sub_status].position, total: '?' };
  return { label: sub_status || '—', step: null, total: null };
}

interface Action { label: string; is_done: boolean; due_date: string | null; }
interface Job {
  id: string; title: string; company: string; status: string;
  sub_status: string; created_at: string;
  actions: Action[]; note: string;
}

export default function SynthesePage() {
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteLibre, setNoteLibre] = useState('');
  const [customSteps, setCustomSteps] = useState<Record<string, { label: string; position: number }>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      let query = supabase
        .from('jobs')
        .select('id, title, company, status, sub_status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data: jobsData, error: jobsError } = await query;
      if (jobsError) { console.error('jobs error', jobsError); return; }

      const jobList = jobsData || [];
      const jobIds = jobList.map((j: { id: string }) => j.id);

      const actionsMap: Record<string, Action[]> = {};
      const customMap: Record<string, { label: string; position: number }> = {};

      if (jobIds.length > 0) {
        const { data: actionsData, error: actionsError } = await supabase
          .from('job_step_actions')
          .select('job_id, label, is_done, due_date')
          .in('job_id', jobIds);

        if (actionsError) console.error('actions error', actionsError);
        (actionsData || []).forEach((a: { job_id: string; label: string; is_done: boolean; due_date: string | null }) => {
          if (!actionsMap[a.job_id]) actionsMap[a.job_id] = [];
          actionsMap[a.job_id].push({ label: a.label, is_done: a.is_done, due_date: a.due_date });
        });

        const { data: customData } = await supabase
          .from('job_custom_steps')
          .select('id, label, position')
          .in('job_id', jobIds);

        (customData || []).forEach((c: { id: string; label: string; position: number }) => {
          customMap[c.id] = { label: c.label, position: c.position };
        });
        setCustomSteps(customMap);
      }

      setJobs(jobList.map((j: { id: string; title: string; company: string; status: string; sub_status: string; created_at: string }) => ({
        ...j,
        actions: actionsMap[j.id] || [],
        note: '',
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = {
    total: jobs.length,
    interviews: jobs.filter(j => j.status === 'in_progress').length,
    offers: jobs.filter(j => ['offer_received', 'offer'].includes(j.status)).length,
    tauxReponse: jobs.length > 0
      ? Math.round((jobs.filter(j => ['in_progress', 'offer_received', 'offer', 'archived'].includes(j.status)).length / jobs.length) * 100)
      : 0,
  };

  const updateJob = (id: string, field: 'title' | 'company' | 'note', value: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, [field]: value } : j));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap');
        * { box-sizing: border-box; }
        .synthese-page { font-family: 'Montserrat', sans-serif; display: flex; min-height: 100vh; background: #f5f5f0; }
        .synthese-sidebar { width: 200px; min-width: 200px; background: #0f0f0f; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; border-right: 1px solid #1e1e1e; }
        .synthese-content { flex: 1; padding: 36px 44px; max-width: 1200px; }
        .section-label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .stat-card { background: #fff; border: 2px solid #111; border-radius: 8px; padding: 16px 18px; box-shadow: 4px 4px 0 #111; }
        table { width: 100%; border-collapse: collapse; background: #fff; border: 2px solid #111; table-layout: fixed; }
        th { background: #111; color: #fff; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; font-family: 'Montserrat', sans-serif; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 12px; font-family: 'Montserrat', sans-serif; color: #111; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) td { background: #fafafa; }
        [contenteditable]:focus { outline: 2px solid #F5C400; background: #fffde7 !important; border-radius: 2px; }
        .btn-yellow { background: #F5C400; border: 2px solid #111; border-radius: 4px; padding: 9px 20px; font-size: 13px; font-weight: 700; color: #111; cursor: pointer; box-shadow: 3px 3px 0 #111; font-family: 'Montserrat', sans-serif; }
        .btn-red { background: #E8151B; border: 2px solid #111; border-radius: 4px; padding: 9px 20px; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; box-shadow: 4px 4px 0 #111; font-family: 'Montserrat', sans-serif; }
        input[type=date], select { border: 2px solid #111; border-radius: 4px; padding: 7px 10px; font-size: 13px; font-family: 'Montserrat', sans-serif; background: #fff; color: #111; }
        textarea { width: 100%; min-height: 60px; border: 2px solid #111; border-radius: 6px; padding: 10px 12px; font-size: 13px; font-family: 'Montserrat', sans-serif; resize: vertical; color: #111; background: #fff; }
        .nav-btn { display: flex; align-items: center; padding: 9px 12px; border: none; border-left: 3px solid transparent; background: transparent; color: #888; font-family: Montserrat,sans-serif; font-weight: 500; font-size: 14px; cursor: pointer; text-align: left; width: 100%; transition: all 0.12s; }
        .nav-btn:hover { background: #161616; color: #ccc; }
        .nav-btn.active { border-left: 3px solid #E8151B; background: #1c1c1c; color: #fff; font-weight: 700; }
        .note-editable:empty:before { content: 'Ajouter une note...'; color: #ccc; font-style: italic; }
        @media print {
          .no-print { display: none !important; }
          .synthese-sidebar { display: none !important; }
          .synthese-content { padding: 20px !important; max-width: 100% !important; }
          .synthese-page { background: white !important; }
          th { background: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .stat-card { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      <div className="synthese-page">

        {/* Sidebar */}
        <aside className="synthese-sidebar no-print">
          <div onClick={() => router.push('/')} style={{ padding: '18px 16px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#F5C400' }}>find my Job</span>
          </div>
          <div style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 8px' }}>Recherche</div>
            {['Tableau de bord','Candidatures','Contacts','Entretiens','Actions','Statistiques'].map(label => (
              <button key={label} className="nav-btn" onClick={() => router.push('/dashboard')}>{label}</button>
            ))}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 8px' }}>Outils</div>
            <button className="nav-btn active">Synthèse</button>
            <button className="nav-btn" onClick={() => router.push('/dashboard/help')}>Help</button>
          </div>
          <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px' }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', color: '#888', fontFamily: 'Montserrat,sans-serif', fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F5C400'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#888'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; }}
            >← Retour au dashboard</button>
          </div>
        </aside>

        {/* Contenu */}
        <div className="synthese-content">

          <div className="no-print" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: 0, fontFamily: 'Montserrat,sans-serif' }}>
              Synthèse <span style={{ color: '#E8151B' }}>de mes candidatures</span>
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Exportez un bilan complet de votre recherche d'emploi</p>
          </div>

          {/* Filtres */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fff', border: '2px solid #111', borderRadius: 8, padding: '14px 18px', marginBottom: 24, boxShadow: '4px 4px 0 #111' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Du</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ color: '#888' }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="to_apply">À postuler</option>
              <option value="applied">Postulé</option>
              <option value="in_progress">En cours</option>
              <option value="offer_received">Offre reçue</option>
              <option value="archived">Archivé</option>
            </select>
            <button className="btn-yellow" onClick={fetchData} style={{ marginLeft: 'auto' }}>Appliquer</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Candidatures', value: stats.total },
              { label: 'En cours / entretiens', value: stats.interviews },
              { label: 'Offres reçues', value: stats.offers },
              { label: 'Taux de réponse', value: `${stats.tauxReponse}%` },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 28, fontWeight: 900, color: '#111', fontFamily: 'Montserrat,sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Note libre */}
          <div style={{ marginBottom: 24 }}>
            <div className="section-label">Note libre (apparaît dans l'export)</div>
            <textarea value={noteLibre} onChange={e => setNoteLibre(e.target.value)}
              placeholder="Ex : Bilan de recherche janvier–avril 2026. Secteur ciblé : marketing digital, Paris IDF." />
          </div>

          {/* Tableau */}
          <div style={{ marginBottom: 28 }}>
            <div className="section-label">Détail des candidatures {loading && '— chargement...'}</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '30%' }} />
                </colgroup>
                <thead>
                  <tr>
                    {['Poste','Entreprise','Statut','Étape pipeline','Date','Actions & notes'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 28, fontSize: 14 }}>
                      {loading ? 'Chargement...' : 'Aucune candidature sur cette période.'}
                    </td></tr>
                  )}
                  {jobs.map(job => {
                    const stepInfo = getStepInfo(job.sub_status, customSteps);
                    return (
                      <tr key={job.id}>
                        <td>
                          <div contentEditable suppressContentEditableWarning
                            style={{ fontWeight: 700, outline: 'none', cursor: 'text' }}
                            onBlur={e => updateJob(job.id, 'title', e.currentTarget.textContent || '')}>
                            {job.title}
                          </div>
                        </td>
                        <td>
                          <div contentEditable suppressContentEditableWarning
                            style={{ outline: 'none', cursor: 'text' }}
                            onBlur={e => updateJob(job.id, 'company', e.currentTarget.textContent || '')}>
                            {job.company}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block', fontSize: 10, fontWeight: 700,
                            padding: '3px 8px', borderRadius: 99, border: '1px solid #111',
                            background: STATUS_COLORS[job.status]?.bg || '#F1EFE8',
                            color: STATUS_COLORS[job.status]?.color || '#5F5E5A',
                          }}>
                            {STATUS_LABELS[job.status] || job.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: '#111', fontWeight: 500 }}>{stepInfo.label}</div>
                          {stepInfo.step && (
                            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                              Étape {stepInfo.step}/{stepInfo.total}
                            </div>
                          )}
                        </td>
                        <td style={{ color: '#888', fontSize: 12 }}>{formatDate(job.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: job.actions.length > 0 ? 6 : 0 }}>
                            {job.actions.length === 0 && (
                              <span style={{ fontSize: 11, color: '#ccc' }}>Aucune action</span>
                            )}
                            {job.actions.map((a, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: a.is_done ? '#639922' : '#EF9F27' }} />
                                <span style={{ color: a.is_done ? '#3B6D11' : '#854F0B', textDecoration: a.is_done ? 'line-through' : 'none' }}>
                                  {a.label}
                                </span>
                                {a.due_date && (
                                  <span style={{ color: '#aaa', fontSize: 10 }}>
                                    — {new Date(a.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            className="note-editable"
                            style={{ fontSize: 11, color: '#888', outline: 'none', borderTop: job.actions.length > 0 ? '1px dashed #e5e5e5' : 'none', paddingTop: job.actions.length > 0 ? 4 : 0, minHeight: 18, cursor: 'text' }}
                            onBlur={e => updateJob(job.id, 'note', e.currentTarget.textContent || '')}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-red" onClick={() => window.print()}>Exporter en PDF</button>
          </div>

        </div>
      </div>
    </>
  );
}