'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const STATUS_LABELS: Record<string, string> = {
  to_apply: 'À postuler', applied: 'Postulé', in_progress: 'En cours',
  offer_received: 'Offre reçue', offer: 'Offre reçue', archived: 'Archivé',
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

function getStepInfo(sub_status: string, pipelineStages: Record<string, string>) {
  const idx = PIPELINE_STEPS.findIndex(s => s.key === sub_status);
  if (idx >= 0) return { label: PIPELINE_STEPS[idx].label, step: idx + 1, total: 8 };
  if (pipelineStages[sub_status]) return { label: pipelineStages[sub_status], step: null, total: null };
  return { label: sub_status || '—', step: null, total: null };
}

function formatDateFr(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Job {
  id: string; title: string; company: string; status: string;
  sub_status: string; created_at: string; note: string;
}

interface Exchange {
  id: string; job_id: string; date: string | null;
  step_label: string; content: string | null;
  job_title?: string; job_company?: string;
}

interface ActionItem {
  id: string; nom: string; organisateur: string | null;
  categorie: string | null; date_debut: string | null;
  date_fin: string | null; note: string | null;
}

export default function SynthesePage() {
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: stagesData } = await supabase
        .from('pipeline_stages')
        .select('id, label')
        .eq('user_id', user.id);
      const stagesMap: Record<string, string> = {};
      (stagesData || []).forEach((s: { id: string; label: string }) => { stagesMap[s.id] = s.label; });
      setPipelineStages(stagesMap);

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

      if (jobIds.length > 0) {
        const { data: exData } = await supabase
          .from('job_exchanges')
          .select('id, job_id, date, step_label, content')
          .in('job_id', jobIds)
          .order('date', { ascending: false });

        const jobMap: Record<string, { title: string; company: string }> = {};
        jobList.forEach((j: { id: string; title: string; company: string }) => {
          jobMap[j.id] = { title: j.title, company: j.company };
        });

        setExchanges((exData || []).map((e: Exchange) => ({
          ...e,
          job_title: jobMap[e.job_id]?.title || '—',
          job_company: jobMap[e.job_id]?.company || '—',
        })));
      } else {
        setExchanges([]);
      }

      const { data: actionsData } = await supabase
        .from('actions')
        .select('id, nom, organisateur, categorie, date_debut, date_fin, note')
        .eq('user_id', user.id)
        .gte('date_debut', dateFrom)
        .lte('date_debut', dateTo + 'T23:59:59')
        .order('date_debut', { ascending: false });
      setActions(actionsData || []);

      setJobs(jobList.map((j: { id: string; title: string; company: string; status: string; sub_status: string; created_at: string }) => ({
        ...j, note: '',
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

  const removeJob = (id: string) => setJobs(prev => prev.filter(j => j.id !== id));

  const updateActionNote = (id: string, value: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, note: value } : a));
  };

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
        .btn-delete { background: transparent; border: 1px solid #ddd; border-radius: 4px; padding: 3px 8px; font-size: 11px; color: #bbb; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.12s; }
        .btn-delete:hover { background: #FCEBEB; border-color: #E8151B; color: #E8151B; }
        input[type=date], select { border: 2px solid #111; border-radius: 4px; padding: 7px 10px; font-size: 13px; font-family: 'Montserrat', sans-serif; background: #fff; color: #111; }
        .nav-btn { display: flex; align-items: center; padding: 9px 12px; border: none; border-left: 3px solid transparent; background: transparent; color: #888; font-family: Montserrat,sans-serif; font-weight: 500; font-size: 14px; cursor: pointer; text-align: left; width: 100%; transition: all 0.12s; }
        .nav-btn:hover { background: #161616; color: #ccc; }
        .nav-btn.active { border-left: 3px solid #E8151B; background: #1c1c1c; color: #fff; font-weight: 700; }
        .note-editable:empty:before { content: 'Écrire ici...'; color: #ccc; font-style: italic; }
        .print-title { display: none; }
        @media print {
          @page { margin: 1.5cm; }
          .no-print { display: none !important; }
          .synthese-sidebar { display: none !important; }
          .synthese-content { padding: 0 !important; max-width: 100% !important; }
          .synthese-page { background: white !important; }
          th { background: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .stat-card { box-shadow: none !important; border: 1px solid #ccc !important; }
          .btn-delete { display: none !important; }
          .note-editable:empty:before { content: '' !important; }
          .note-editable:empty { display: none !important; }
          .print-title { display: block !important; margin-bottom: 20px; }
          .screen-title { display: none !important; }
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

          {/* Titre écran */}
          <div className="screen-title no-print" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: 0, fontFamily: 'Montserrat,sans-serif' }}>
              Synthèse <span style={{ color: '#E8151B' }}>de mes candidatures</span>
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Exportez un bilan complet de votre recherche d'emploi</p>
          </div>

          {/* Titre PDF uniquement */}
          <div className="print-title">
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 4px 0', fontFamily: 'Montserrat,sans-serif' }}>
              Bilan d'activité
            </h1>
            <p style={{ fontSize: 13, color: '#555', margin: 0, fontFamily: 'Montserrat,sans-serif' }}>
              Période : {formatDateFr(dateFrom)} → {formatDateFr(dateTo)}
            </p>
            <div style={{ borderBottom: '3px solid #F5C400', marginTop: 12, marginBottom: 20 }} />
          </div>

          {/* Filtres */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fff', border: '2px solid #111', borderRadius: 8, padding: '14px 18px', marginBottom: 24, boxShadow: '4px 4px 0 #111' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>Du</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ flex: 1, minWidth: 130 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>Au</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ flex: 1, minWidth: 130 }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
              <option value="all">Tous les statuts</option>
              <option value="to_apply">À postuler</option>
              <option value="applied">Postulé</option>
              <option value="in_progress">En cours</option>
              <option value="offer_received">Offre reçue</option>
              <option value="archived">Archivé</option>
            </select>
            <button className="btn-yellow" onClick={fetchData}>Appliquer</button>
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

          {/* Tableau candidatures */}
          <div style={{ marginBottom: 36 }}>
            <div className="section-label">Détail des candidatures {loading && '— chargement...'}</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <colgroup>
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '27%' }} />
                  <col style={{ width: '7%' }} />
                </colgroup>
                <thead>
                  <tr>{['Date','Poste','Entreprise','Statut','Étape pipeline','Notes',''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {jobs.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 28, fontSize: 14 }}>
                      {loading ? 'Chargement...' : 'Aucune candidature sur cette période.'}
                    </td></tr>
                  )}
                  {jobs.map(job => {
                    const stepInfo = getStepInfo(job.sub_status, pipelineStages);
                    return (
                      <tr key={job.id}>
                        <td style={{ color: '#888', fontSize: 11 }}>{formatDateShort(job.created_at)}</td>
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
                          <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, border: '1px solid #111', background: STATUS_COLORS[job.status]?.bg || '#F1EFE8', color: STATUS_COLORS[job.status]?.color || '#5F5E5A' }}>
                            {STATUS_LABELS[job.status] || job.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: '#111', fontWeight: 600 }}>{stepInfo.label}</div>
                          {stepInfo.step && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Étape {stepInfo.step}/{stepInfo.total}</div>}
                        </td>
                        <td>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            className="note-editable"
                            style={{ fontSize: 12, color: '#333', outline: 'none', minHeight: 36, cursor: 'text', lineHeight: 1.6 }}
                            onBlur={e => updateJob(job.id, 'note', e.currentTarget.textContent || '')}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn-delete no-print" onClick={() => removeJob(job.id)}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tableau échanges */}
          {exchanges.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div className="section-label">Échanges & entretiens</div>
              <table>
                <colgroup>
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '40%' }} />
                </colgroup>
                <thead>
                  <tr>{['Date','Poste','Entreprise','Étape','Notes / contenu'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {exchanges.map(ex => (
                    <tr key={ex.id}>
                      <td style={{ color: '#888', fontSize: 11 }}>{formatDateShort(ex.date)}</td>
                      <td style={{ fontWeight: 600 }}>{ex.job_title}</td>
                      <td>{ex.job_company}</td>
                      <td>
                        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, border: '1px solid #ddd', background: '#f5f5f0', color: '#555' }}>
                          {ex.step_label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#555' }}>{ex.content || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tableau actions */}
          {actions.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div className="section-label">Actions & formations</div>
              <table>
                <colgroup>
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '29%' }} />
                  <col style={{ width: '7%' }} />
                </colgroup>
                <thead>
                  <tr>{['Date','Nom','Organisateur','Catégorie','Notes',''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {actions.map(a => (
                    <tr key={a.id}>
                      <td style={{ color: '#888', fontSize: 11 }}>{formatDateShort(a.date_debut)}</td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{a.nom}</td>
                      <td style={{ fontSize: 12 }}>{a.organisateur || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, border: '1px solid #ddd', background: '#f5f5f0', color: '#555' }}>
                          {a.categorie || '—'}
                        </span>
                      </td>
                      <td>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          className="note-editable"
                          style={{ fontSize: 12, color: '#333', outline: 'none', minHeight: 28, cursor: 'text', lineHeight: 1.6 }}
                          onBlur={e => updateActionNote(a.id, e.currentTarget.textContent || '')}
                        >
                          {a.note && a.note !== 'EMPTY' ? a.note : ''}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-delete no-print" onClick={() => setActions(prev => prev.filter(x => x.id !== a.id))}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-red" onClick={() => window.print()}>Exporter en PDF</button>
          </div>

        </div>
      </div>
    </>
  );
}