'use client';

import { useEffect, useState, useRef } from 'react';

const STATUS_LABELS: Record<string, string> = {
  to_apply: 'À postuler',
  applied: 'Postulé',
  in_progress: 'En cours',
  offer_received: 'Offre reçue',
  archived: 'Archivé',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  to_apply:      { bg: '#F1EFE8', color: '#5F5E5A' },
  applied:       { bg: '#FAEEDA', color: '#854F0B' },
  in_progress:   { bg: '#E6F1FB', color: '#185FA5' },
  offer_received:{ bg: '#EAF3DE', color: '#3B6D11' },
  archived:      { bg: '#FCEBEB', color: '#A32D2D' },
};

interface Action {
  label: string;
  is_done: boolean;
  due_date: string | null;
}

interface Job {
  id: string;
  title: string;
  company: string;
  status: string;
  sub_status: string;
  created_at: string;
  location?: string;
  salary?: string;
  actions: Action[];
  note?: string;
}

export default function SynthesePage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteLibre, setNoteLibre] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = (window as Window & { __jfmj_token?: string }).__jfmj_token || '';
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, status: statusFilter });
      const res = await fetch(`/api/synthese?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      ? Math.round((jobs.filter(j => j.status !== 'to_apply').length / jobs.length) * 100)
      : 0,
  };

  const handlePrint = () => window.print();

  const updateJob = (id: string, field: keyof Job, value: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, [field]: value } : j));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; }
          body { background: white !important; }
          table { font-size: 11px !important; }
          th { background: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div style={{ fontFamily: 'Montserrat, sans-serif', padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }} className="print-area">

        {/* En-tête */}
        <div className="no-print" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 4 }}>
            Synthèse <span style={{ color: '#F5C400' }}>de mes candidatures</span>
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>Exportez un bilan de votre recherche d'emploi</p>
        </div>

        {/* Filtres */}
        <div className="no-print" style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          background: '#fff', border: '2px solid #111', borderRadius: 8,
          padding: '14px 18px', marginBottom: 24, boxShadow: '4px 4px 0 #111',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Période</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ border: '1.5px solid #111', borderRadius: 4, padding: '6px 10px', fontSize: 13, fontFamily: 'Montserrat, sans-serif' }} />
          <span style={{ fontSize: 13, color: '#888' }}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ border: '1.5px solid #111', borderRadius: 4, padding: '6px 10px', fontSize: 13, fontFamily: 'Montserrat, sans-serif' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ border: '1.5px solid #111', borderRadius: 4, padding: '6px 10px', fontSize: 13, fontFamily: 'Montserrat, sans-serif', marginLeft: 8 }}>
            <option value="all">Tous les statuts</option>
            <option value="to_apply">À postuler</option>
            <option value="applied">Postulé</option>
            <option value="in_progress">En cours</option>
            <option value="offer_received">Offre reçue</option>
            <option value="archived">Archivé</option>
          </select>
          <button onClick={fetchData}
            style={{ background: '#F5C400', border: '2px solid #111', borderRadius: 4, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '3px 3px 0 #111', fontFamily: 'Montserrat, sans-serif', marginLeft: 'auto' }}>
            Appliquer
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Candidatures', value: stats.total },
            { label: 'En cours / Entretiens', value: stats.interviews },
            { label: 'Offres reçues', value: stats.offers },
            { label: 'Taux de réponse', value: `${stats.tauxReponse}%` },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '2px solid #111', borderRadius: 8, padding: '14px 16px', boxShadow: '3px 3px 0 #111' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Note libre */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Note libre (apparaît dans l'export)
          </div>
          <textarea
            value={noteLibre}
            onChange={e => setNoteLibre(e.target.value)}
            placeholder="Ex : Bilan de recherche janvier–avril 2026. Secteur ciblé : marketing digital, Paris IDF."
            style={{
              width: '100%', minHeight: 56, border: '1.5px solid #111', borderRadius: 6,
              padding: '10px 12px', fontSize: 13, fontFamily: 'Montserrat, sans-serif',
              resize: 'vertical', color: '#111',
            }}
          />
        </div>

        {/* Tableau */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Détail des candidatures {loading && '— chargement...'}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #111', borderRadius: 8, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '28%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['Poste', 'Entreprise', 'Statut', 'Étape pipeline', 'Date', 'Actions & notes'].map(h => (
                    <th key={h} style={{
                      background: '#111', color: '#fff', textAlign: 'left',
                      padding: '10px 12px', fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: 0.8,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 14 }}>
                    {loading ? 'Chargement...' : 'Aucune candidature sur cette période.'}
                  </td></tr>
                )}
                {jobs.map((job, i) => (
                  <tr key={job.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5', fontSize: 13, fontWeight: 600 }}>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => updateJob(job.id, 'title', e.currentTarget.textContent || '')}
                        style={{ outline: 'none', cursor: 'text' }}
                      >{job.title}</div>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5', fontSize: 13 }}>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => updateJob(job.id, 'company', e.currentTarget.textContent || '')}
                        style={{ outline: 'none', cursor: 'text' }}
                      >{job.company}</div>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5' }}>
                      <span style={{
                        display: 'inline-block', fontSize: 10, fontWeight: 700,
                        padding: '3px 8px', borderRadius: 99, border: '1px solid #111',
                        background: STATUS_COLORS[job.status]?.bg || '#F1EFE8',
                        color: STATUS_COLORS[job.status]?.color || '#5F5E5A',
                      }}>
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5', fontSize: 12, color: '#555' }}>
                      {job.sub_status || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5', fontSize: 12, color: '#888' }}>
                      {formatDate(job.created_at)}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e5e5' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {job.actions.slice(0, 4).map((a, ai) => (
                          <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                              background: a.is_done ? '#639922' : '#EF9F27',
                            }} />
                            <span style={{ color: a.is_done ? '#3B6D11' : '#854F0B' }}>{a.label}</span>
                          </div>
                        ))}
                        {job.actions.length === 0 && <span style={{ fontSize: 11, color: '#ccc' }}>Aucune action</span>}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => updateJob(job.id, 'note', e.currentTarget.textContent || '')}
                        style={{
                          marginTop: job.actions.length > 0 ? 6 : 0,
                          fontSize: 11, color: '#888', outline: 'none', cursor: 'text',
                          borderTop: job.actions.length > 0 ? '1px dashed #e5e5e5' : 'none',
                          paddingTop: job.actions.length > 0 ? 4 : 0,
                          minHeight: 16,
                        }}
                        data-placeholder="Ajouter une note..."
                      >{job.note}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Boutons export */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={handlePrint}
            style={{ background: '#E8151B', border: '2px solid #111', borderRadius: 4, padding: '10px 24px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '4px 4px 0 #111', fontFamily: 'Montserrat, sans-serif' }}>
            Exporter en PDF
          </button>
        </div>
      </div>
    </>
  );
}