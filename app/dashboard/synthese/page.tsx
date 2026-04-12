'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  to_apply: 'À postuler',
  applied: 'Postulé',
  in_progress: 'En cours',
  offer_received: 'Offre reçue',
  archived: 'Archivé',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  to_apply:       { bg: '#F1EFE8', color: '#5F5E5A' },
  applied:        { bg: '#FAEEDA', color: '#854F0B' },
  in_progress:    { bg: '#E6F1FB', color: '#185FA5' },
  offer_received: { bg: '#EAF3DE', color: '#3B6D11' },
  archived:       { bg: '#FCEBEB', color: '#A32D2D' },
};

interface Action { label: string; is_done: boolean; due_date: string | null; }
interface Job {
  id: string; title: string; company: string; status: string;
  sub_status: string; created_at: string; location?: string;
  salary?: string; actions: Action[]; note?: string;
}

export default function SynthesePage() {
  const router = useRouter();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const defaultFrom = sixMonthsAgo.toISOString().split('T')[0];
  const defaultTo = new Date().toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteLibre, setNoteLibre] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = (window as Window & { __jfmj_token?: string }).__jfmj_token || '';
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, status: statusFilter });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/synthese?${params}`, { headers });
      const data = await res.json();
      setJobs((data.jobs || []).map((j: Job) => ({ ...j, note: '' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = {
    total: jobs.length,
    interviews: jobs.filter(j => j.status === 'in_progress').length,
    offers: jobs.filter(j => j.status === 'offer_received').length,
    tauxReponse: jobs.length > 0
      ? Math.round((jobs.filter(j => ['in_progress','offer_received','archived'].includes(j.status)).length / jobs.length) * 100)
      : 0,
  };

  const updateJob = (id: string, field: keyof Job, value: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, [field]: value } : j));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap');
        * { box-sizing: border-box; }
        .synthese-page { font-family: 'Montserrat', sans-serif; display: flex; min-height: 100vh; background: #f5f5f0; }
        .synthese-sidebar { width: 200px; min-width: 200px; background: #0f0f0f; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; border-right: 1px solid #1e1e1e; }
        .synthese-content { flex: 1; padding: 36px 44px; max-width: 1100px; }
        .section-label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .stat-card { background: #fff; border: 2px solid #111; border-radius: 8px; padding: 16px 18px; box-shadow: 4px 4px 0 #111; }
        table { width: 100%; border-collapse: collapse; background: #fff; border: 2px solid #111; border-radius: 8px; overflow: hidden; table-layout: fixed; }
        th { background: #111; color: #fff; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; font-family: 'Montserrat', sans-serif; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 12px; font-family: 'Montserrat', sans-serif; color: #111; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) td { background: #fafafa; }
        [contenteditable]:focus { outline: 2px solid #F5C400; background: #fffde7 !important; border-radius: 2px; }
        .btn-yellow { background: #F5C400; border: 2px solid #111; border-radius: 4px; padding: 9px 20px; font-size: 13px; font-weight: 700; color: #111; cursor: pointer; box-shadow: 3px 3px 0 #111; font-family: 'Montserrat', sans-serif; }
        .btn-red { background: #E8151B; border: 2px solid #111; border-radius: 4px; padding: 9px 20px; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; box-shadow: 4px 4px 0 #111; font-family: 'Montserrat', sans-serif; }
        input[type=date], select { border: 2px solid #111; border-radius: 4px; padding: 7px 10px; font-size: 13px; font-family: 'Montserrat', sans-serif; background: #fff; color: #111; }
        textarea { width: 100%; min-height: 60px; border: 2px solid #111; border-radius: 6px; padding: 10px 12px; font-size: 13px; font-family: 'Montserrat', sans-serif; resize: vertical; color: #111; background: #fff; }
        @media print {
          .no-print { display: none !important; }
          .synthese-sidebar { display: none !important; }
          .synthese-content { padding: 20px !important; }
          .synthese-page { background: white !important; }
          th { background: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .stat-card { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      <div className="synthese-page">
        {/* Sidebar */}
        <aside className="synthese-sidebar no-print">
          <div onClick={() => router.push('/')} style={{ padding: '18px 16px 16px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#F5C400' }}>find my Job</span>
          </div>
          <div style={{ flex: 1, padding: '14px 10px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 10px' }}>Recherche</div>
            {[
              { label: 'Tableau de bord', path: '/dashboard' },
              { label: 'Candidatures', path: '/dashboard' },
              { label: 'Contacts', path: '/dashboard' },
              { label: 'Entretiens', path: '/dashboard' },
              { label: 'Actions', path: '/dashboard' },
              { label: 'Statistiques', path: '/dashboard' },
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.path)}
                style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', border: 'none', borderLeft: '3px solid transparent', borderRadius: 0, background: 'transparent', color: '#888', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#161616'; e.currentTarget.style.color = '#ccc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
              >{item.label}</button>
            ))}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 10px' }}>Outils</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none', borderLeft: '3px solid #E8151B', borderRadius: 0, background: '#1c1c1c', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <span style={{ fontSize: 16 }}>📊</span> Synthèse
            </button>
            <button onClick={() => router.push('/dashboard/help')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: '#888', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#161616'; e.currentTarget.style.color = '#ccc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
            >❓ Help</button>
          </div>
          <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px' }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', color: '#888', fontFamily: 'Montserrat, sans-serif', fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F5C400'; e.currentTarget.style.borderColor = '#F5C400'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#242424'; }}
            >← Retour au dashboard</button>
          </div>
        </aside>

        {/* Contenu */}
        <div className="synthese-content">
          <div className="no-print" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: 0 }}>
              Synthèse <span style={{ color: '#E8151B' }}>de mes candidatures</span>
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Exportez un bilan complet de votre recherche d'emploi</p>
          </div>

          {/* Filtres */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fff', border: '2px solid #111', borderRadius: 8, padding: '14px 18px', marginBottom: 24, boxShadow: '4px 4px 0 #111' }}>
            <span className="section-label" style={{ margin: 0 }}>Du</span>
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
                <div style={{ fontSize: 28, fontWeight: 900, color: '#111' }}>{s.value}</div>
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
                  <col style={{ width: '20%' }} /><col style={{ width: '16%' }} />
                  <col style={{ width: '12%' }} /><col style={{ width: '14%' }} />
                  <col style={{ width: '10%' }} /><col style={{ width: '28%' }} />
                </colgroup>
                <thead>
                  <tr>{['Poste', 'Entreprise', 'Statut', 'Étape pipeline', 'Date', 'Actions & notes'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {jobs.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 28, fontSize: 14 }}>
                      {loading ? 'Chargement...' : 'Aucune candidature sur cette période.'}
                    </td></tr>
                  )}
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div contentEditable suppressContentEditableWarning style={{ fontWeight: 700, outline: 'none' }}
                          onBlur={e => updateJob(job.id, 'title', e.currentTarget.textContent || '')}>{job.title}</div>
                      </td>
                      <td>
                        <div contentEditable suppressContentEditableWarning style={{ outline: 'none' }}
                          onBlur={e => updateJob(job.id, 'company', e.currentTarget.textContent || '')}>{job.company}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, border: '1px solid #111', background: STATUS_COLORS[job.status]?.bg || '#F1EFE8', color: STATUS_COLORS[job.status]?.color || '#5F5E5A' }}>
                          {STATUS_LABELS[job.status] || job.status}
                        </span>
                      </td>
                      <td style={{ color: '#555', fontSize: 12 }}>{job.sub_status || '—'}</td>
                      <td style={{ color: '#888', fontSize: 12 }}>{formatDate(job.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {job.actions.slice(0, 4).map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: a.is_done ? '#639922' : '#EF9F27' }} />
                              <span style={{ color: a.is_done ? '#3B6D11' : '#854F0B' }}>{a.label}</span>
                            </div>
                          ))}
                          {job.actions.length === 0 && <span style={{ fontSize: 11, color: '#ccc' }}>Aucune action</span>}
                        </div>
                        <div contentEditable suppressContentEditableWarning
                          style={{ marginTop: 6, fontSize: 11, color: '#888', outline: 'none', borderTop: '1px dashed #e5e5e5', paddingTop: 4, minHeight: 16 }}
                          onBlur={e => updateJob(job.id, 'note', e.currentTarget.textContent || '')}>
                          {job.note || <span style={{ color: '#ccc' }}>Ajouter une note...</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn-red" onClick={handlePrint}>Exporter en PDF</button>
          </div>
        </div>
      </div>
    </>
  );
}