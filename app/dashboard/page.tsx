'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job, Contact, JobStatus, STATUS_LABELS, STATUS_COLORS, JobType } from '@/lib/jobs';

type View = 'kanban' | 'list' | 'contacts' | 'agenda' | 'stats';

const COLUMNS: { id: JobStatus; label: string; countBg: string; countColor: string }[] = [
  { id: 'to_apply', label: 'À postuler', countBg: '#E0E0E0', countColor: '#888' },
  { id: 'applied', label: 'Postulé', countBg: '#EBF2FD', countColor: '#1A6FDB' },
  { id: 'interview', label: 'Entretien', countBg: '#FEF9E0', countColor: '#B8900A' },
  { id: 'offer', label: 'Offre reçue', countBg: '#E8F5EE', countColor: '#1A7A4A' },
  { id: 'archived', label: 'Archivé', countBg: '#F0EEEA', countColor: '#aaa' },
];

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7) return `Il y a ${diff} jours`;
  return formatDate(dateStr) || '';
}

export default function DashboardPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('kanban');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newJob, setNewJob] = useState<Partial<Job>>({ status: 'to_apply', job_type: 'CDI' });
  const [newContact, setNewContact] = useState<Partial<Contact>>({});

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserEmail(user.email || '');
      const meta = user.user_metadata;
      const fn = meta?.first_name || meta?.full_name?.split(' ')[0] || user.email?.split('@')[0] || '';
      setFirstName(capitalize(fn));
      const [jr, cr] = await Promise.all([fetch('/api/jobs'), fetch('/api/contacts')]);
      const jd = await jr.json();
      const cd = await cr.json();
      setJobs(jd.jobs || []);
      setContacts(cd.contacts || []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  async function saveJob() {
    const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newJob) });
    const data = await res.json();
    if (data.job) { setJobs([data.job, ...jobs]); setShowAddJob(false); setNewJob({ status: 'to_apply', job_type: 'CDI' }); }
  }

  async function updateJobStatus(id: string, status: JobStatus) {
    const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    const data = await res.json();
    if (data.job) setJobs(jobs.map(j => j.id === id ? data.job : j));
  }

  async function deleteJob(id: string) {
    if (!confirm('Supprimer cette offre ?')) return;
    await fetch('/api/jobs?id=' + id, { method: 'DELETE' });
    setJobs(jobs.filter(j => j.id !== id));
    setSelectedJob(null);
  }

  async function saveContact() {
    const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newContact) });
    const data = await res.json();
    if (data.contact) { setContacts([data.contact, ...contacts]); setShowAddContact(false); setNewContact({}); }
  }

  const filteredJobs = jobs.filter(j => {
    const ms = !searchQuery || j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase());
    const mf = filterStatus === 'all' || j.status === filterStatus;
    return ms && mf;
  });

  const jobsByStatus = useCallback((s: JobStatus) => jobs.filter(j => j.status === s), [jobs]);
  const initials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

  const stats = {
    total: jobs.length,
    responseRate: jobs.length ? Math.round((jobs.filter(j => ['interview', 'offer'].includes(j.status)).length / jobs.length) * 100) : 0,
    interviews: jobs.filter(j => j.status === 'interview').length,
    offers: jobs.filter(j => j.status === 'offer').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAFAFA', fontFamily: 'Montserrat,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div style={{ fontWeight: 700, color: '#888' }}>Chargement...</div>
      </div>
    </div>
  );

  const LogoSVG = () => (
    <svg viewBox="0 0 60 52" width="28" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="30,1 37,10 46,3 43,13 54,9 49,19 58,20 51,27 57,35 47,32 51,41 41,37 43,47 34,40 30,47 26,40 17,47 19,37 9,41 13,32 3,35 9,27 2,20 11,19 6,9 17,13 14,3 23,10" fill="#111" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
      <polygon points="30,4 36,12 44,6 41,15 51,11 47,20 55,22 49,28 54,35 45,33 49,41 40,37 42,46 33,40 30,46 27,40 18,46 20,37 11,41 15,33 6,35 11,28 5,22 13,20 9,11 19,15 16,6 24,12" fill="#E8151B"/>
      <text x="30" y="25" textAnchor="middle" fontFamily="Impact,sans-serif" fontSize="13" fontWeight="900" fill="#F5C400" stroke="#111" strokeWidth="0.8" paintOrder="stroke">Jean</text>
      <rect x="9" y="28" width="42" height="11" rx="2" fill="#111"/>
      <text x="30" y="37" textAnchor="middle" fontFamily="Impact,sans-serif" fontSize="6" fontWeight="900" fill="#fff">find my job</text>
    </svg>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 3px; }
        .nav-btn { display: flex; align-items: center; gap: 9px; padding: 8px 12px; margin: 1px 6px; border-radius: 8px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); cursor: pointer; border: none; background: transparent; width: calc(100% - 12px); text-align: left; font-family: 'Montserrat', sans-serif; transition: all 0.15s; letter-spacing: 0.01em; }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
        .nav-btn.active { background: rgba(232,21,27,0.2); color: #fff; border-left: 3px solid #E8151B; padding-left: 9px; }
        .jcard { background: #fff; border: 2px solid #111; border-radius: 8px; padding: 10px; margin-bottom: 7px; cursor: pointer; box-shadow: 2px 2px 0 #111; transition: all 0.15s; }
        .jcard:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; border-color: #E8151B; }
        .btn-main { display: inline-flex; align-items: center; gap: 6px; background: #111; color: #F5C400; border: 2px solid #111; border-radius: 8px; padding: 9px 18px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 #E8151B; letter-spacing: 0.02em; transition: all 0.15s; }
        .btn-main:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; }
        .btn-ghost { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #111; border: 2px solid #111; border-radius: 8px; padding: 9px 18px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 #E0E0E0; transition: all 0.15s; }
        .btn-ghost:hover { background: #F4F4F4; }
        .pill { display: inline-flex; align-items: center; border-radius: 5px; padding: 2px 7px; font-size: 10px; font-weight: 700; }
        .fi { width: 100%; border: 2px solid #E0E0E0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: 'Montserrat', sans-serif; outline: none; transition: border-color 0.15s; }
        .fi:focus { border-color: #E8151B; box-shadow: 0 0 0 3px rgba(232,21,27,0.08); }
        .fl { display: block; font-size: 10px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .lrow { display: grid; grid-template-columns: 2fr 1fr 0.8fr 1fr 0.8fr 60px; gap: 12px; padding: 11px 16px; border-bottom: 1.5px solid #E0E0E0; align-items: center; cursor: pointer; transition: background 0.15s; }
        .lrow:hover { background: #FAFAFA; }
        .ccard { background: #fff; border: 2px solid #111; border-radius: 10px; padding: 1rem; box-shadow: 2px 2px 0 #111; transition: all 0.2s; }
        .ccard:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; }
        .cbtn { flex: 1; padding: 5px; border-radius: 6px; border: 1.5px solid #E0E0E0; background: transparent; font-size: 11px; font-weight: 700; color: #888; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.15s; }
        .cbtn:hover { background: #FDEAEA; color: #E8151B; border-color: #E8151B; }
        .modal-bg { position: fixed; inset: 0; background: rgba(15,14,12,0.6); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .modal { background: #fff; border: 2px solid #111; border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 6px 6px 0 #111; }
        .stat-card { background: #fff; border: 2px solid #111; border-radius: 10px; padding: 0.875rem; box-shadow: 2px 2px 0 #111; }
        .add-card { border: 2px dashed #E0E0E0; border-radius: 8px; padding: 8px; text-align: center; font-size: 11px; color: #888; cursor: pointer; font-weight: 700; transition: all 0.15s; }
        .add-card:hover { border-color: #E8151B; color: #E8151B; background: #FDEAEA; }
        .date-tag { font-size: 9px; color: #aaa; font-weight: 600; margin-top: 5px; display: flex; align-items: center; gap: 3px; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 210, background: '#111', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '2px solid #111' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoSVG />
          <div>
            <Link href="/" style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', fontWeight: 900, color: '#fff', textDecoration: 'none', letterSpacing: '-0.01em' }}>
              Jean <span style={{ color: '#E8151B' }}>Find My Job</span>
            </Link>
          </div>
        </div>

        <div style={{ padding: '0.5rem 0.5rem 0.2rem', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recherche</div>

        {([
          ['kanban', '📊', 'Tableau de bord', jobs.length],
          ['list', '📋', 'Candidatures', null],
          ['contacts', '👥', 'Contacts', contacts.length],
          ['agenda', '📅', 'Entretiens', stats.interviews],
          ['stats', '📈', 'Statistiques', null],
        ] as [View, string, string, number | null][]).map(([v, ic, lb, bg]) => (
          <button key={v} className={'nav-btn' + (view === v ? ' active' : '')} onClick={() => setView(v)}>
            <span style={{ fontSize: 13 }}>{ic}</span>
            <span style={{ flex: 1 }}>{lb}</span>
            {bg !== null && bg > 0 && (
              <span style={{ background: v === 'agenda' && bg > 0 ? '#E8151B' : '#E8151B', color: '#F5C400', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 800 }}>{bg}</span>
            )}
          </button>
        ))}

        <div style={{ padding: '0.5rem 0.5rem 0.2rem', marginTop: '0.5rem', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Outils</div>
        <button className="nav-btn" onClick={() => router.push('/dashboard/editor')}>
          <span style={{ fontSize: 13 }}>✦</span> CV Creator
        </button>

        <div style={{ marginTop: 'auto', padding: '0.875rem', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={handleLogout}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8151B', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#F5C400', flexShrink: 0 }}>
              {firstName ? firstName.charAt(0).toUpperCase() : initials(userEmail.split('@')[0])}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{firstName || userEmail.split('@')[0]}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Déconnexion</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: '#fff', borderBottom: '2px solid #111', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'capitalize', letterSpacing: '0.02em' }}>{today}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>
              Hello <span style={{ color: '#E8151B' }}>{firstName}</span> ! 👋
            </div>
          </div>
          <button className="btn-main" onClick={() => view === 'contacts' ? setShowAddContact(true) : setShowAddJob(true)}>
            {view === 'contacts' ? '+ Ajouter un contact' : '+ Ajouter une offre'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

          {/* Stats */}
          {['kanban', 'list', 'stats'].includes(view) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: '1.25rem' }}>
              {[
                { l: 'Total', v: stats.total, c: '#111' },
                { l: 'Taux réponse', v: stats.responseRate + '%', c: '#E8151B' },
                { l: 'Entretiens', v: stats.interviews, c: '#1A7A4A' },
                { l: 'Offres', v: stats.offers, c: '#B8900A' },
                { l: 'Contacts', v: contacts.length, c: '#888' },
              ].map(s => (
                <div key={s.l} className="stat-card">
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}

          {/* KANBAN */}
          {view === 'kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, alignItems: 'start' }}>
              {COLUMNS.map(col => (
                <div key={col.id} style={{ background: '#F4F4F4', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: 8, minHeight: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col.label}</div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: col.countBg, color: col.countColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>
                      {jobsByStatus(col.id).length}
                    </div>
                  </div>
                  {jobsByStatus(col.id).map(job => (
                    <div key={job.id} className="jcard" onClick={() => setSelectedJob(job)}>
                      <div style={{ fontSize: 9, color: '#888', fontWeight: 600, marginBottom: 2 }}>{job.company}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{job.title}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {job.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0', fontSize: 9 }}>{job.location}</span>}
                        <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0', fontSize: 9 }}>{job.job_type}</span>
                      </div>
                      <div className="date-tag">
                        📅 {formatRelative(job.created_at)}
                      </div>
                    </div>
                  ))}
                  <div className="add-card" onClick={() => { setNewJob({ status: col.id, job_type: 'CDI' }); setShowAddJob(true); }}>
                    + Ajouter
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST */}
          {view === 'list' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '2px solid #E0E0E0', borderRadius: 8, padding: '7px 12px', flex: 1, maxWidth: 300 }}>
                  <span>🔍</span>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', fontFamily: 'Montserrat,sans-serif' }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="fi" style={{ width: 'auto' }}>
                  <option value="all">Tous les statuts</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111' }}>
                <div className="lrow" style={{ background: '#F4F4F4', fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'default' }}>
                  <div>Poste / Entreprise</div><div>Localisation</div><div>Type</div><div>Statut</div><div>Créé le</div><div></div>
                </div>
                {filteredJobs.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#888', fontSize: 14 }}>
                    Aucune candidature — <button onClick={() => setShowAddJob(true)} style={{ color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Ajouter</button>
                  </div>
                )}
                {filteredJobs.map(job => {
                  const sc = STATUS_COLORS[job.status];
                  return (
                    <div key={job.id} className="lrow" onClick={() => setSelectedJob(job)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: '#FDEAEA', border: '1.5px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>{job.company.substring(0, 2).toUpperCase()}</div>
                        <div><div style={{ fontWeight: 700, fontSize: 13 }}>{job.title}</div><div style={{ fontSize: 11, color: '#888' }}>{job.company}</div></div>
                      </div>
                      <div style={{ fontSize: 13 }}>{job.location || '—'}</div>
                      <div><span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.job_type}</span></div>
                      <div><span className="pill" style={{ background: sc.bg, color: sc.color }}>{STATUS_LABELS[job.status]}</span></div>
                      <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{formatDate(job.created_at)}</div>
                      <div><button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: '#E8151B', borderColor: '#FDEAEA' }} onClick={e => { e.stopPropagation(); deleteJob(job.id); }}>✕</button></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {view === 'contacts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {contacts.length === 0 && (
                <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#888', fontSize: 14 }}>
                  Aucun contact — <button onClick={() => setShowAddContact(true)} style={{ color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Ajouter le premier</button>
                </div>
              )}
              {contacts.map(c => (
                <div key={c.id} className="ccard">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FDEAEA', border: '2px solid #E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#E8151B', flexShrink: 0 }}>{initials(c.name)}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11, color: '#888' }}>{c.role}</div><div style={{ fontSize: 11, color: '#E8151B', fontWeight: 600 }}>{c.company}</div></div>
                  </div>
                  {c.email && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>📧 {c.email}</div>}
                  {c.phone && <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>📞 {c.phone}</div>}
                  {c.linkedin && <div style={{ fontSize: 11, color: '#888' }}>🔗 {c.linkedin}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {c.email && <button className="cbtn" onClick={() => window.open('mailto:' + c.email)}>✉️ Email</button>}
                    {c.linkedin && <button className="cbtn" onClick={() => window.open(c.linkedin)}>💼 LinkedIn</button>}
                    <button className="cbtn" style={{ color: '#E8151B' }} onClick={() => fetch('/api/contacts?id=' + c.id, { method: 'DELETE' }).then(() => setContacts(contacts.filter(x => x.id !== c.id)))}>✕</button>
                  </div>
                </div>
              ))}
              <div className="ccard" style={{ border: '2px dashed #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 150, boxShadow: 'none' }} onClick={() => setShowAddContact(true)}>
                <div style={{ textAlign: 'center', color: '#888' }}><div style={{ fontSize: 22, marginBottom: 6 }}>+</div><div style={{ fontSize: 12, fontWeight: 700 }}>Ajouter un contact</div></div>
              </div>
            </div>
          )}

          {/* AGENDA */}
          {view === 'agenda' && (
            <div>
              {jobs.filter(j => j.status === 'interview').length === 0 ? (
                <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#888', boxShadow: '3px 3px 0 #111' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 }}>Aucun entretien planifié</div>
                  <button className="btn-main" onClick={() => setView('kanban')}>Voir le tableau de bord</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {jobs.filter(j => j.status === 'interview').map(job => (
                    <div key={job.id} style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 60 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#B8900A', textTransform: 'uppercase' }}>Entretien</div>
                        {job.interview_at && <div style={{ fontSize: 12, fontWeight: 800, color: '#B8900A' }}>{new Date(job.interview_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{job.company}{job.location && ' · ' + job.location}</div>
                        {job.contact_name && <div style={{ fontSize: 11, color: '#E8151B', marginTop: 3, fontWeight: 600 }}>Contact : {job.contact_name}</div>}
                      </div>
                      <button className="btn-main" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setSelectedJob(job)}>Voir détails</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STATS */}
          {view === 'stats' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Répartition par statut</div>
                {COLUMNS.filter(c => c.id !== 'archived').map(col => {
                  const count = jobsByStatus(col.id).length;
                  const pct = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
                  return (
                    <div key={col.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{col.label}</span><span style={{ fontWeight: 800 }}>{count}</span></div>
                      <div style={{ height: 8, background: '#F4F4F4', borderRadius: 4, border: '1px solid #E0E0E0' }}>
                        <div style={{ height: '100%', width: pct + '%', background: col.countColor, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Taux de conversion</div>
                {[
                  { l: 'Candidatures → Entretien', v: stats.responseRate, c: '#E8151B' },
                  { l: 'Entretien → Offre', v: stats.interviews ? Math.round((stats.offers / stats.interviews) * 100) : 0, c: '#1A7A4A' },
                ].map(item => (
                  <div key={item.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.l}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 6, width: 100, background: '#F4F4F4', borderRadius: 3, border: '1px solid #E0E0E0' }}>
                        <div style={{ height: '100%', width: item.v + '%', background: item.c, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: item.c, minWidth: 36 }}>{item.v}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DETAIL PANEL */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.5)', zIndex: 200 }} onClick={() => setSelectedJob(null)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 460, background: '#fff', borderLeft: '2px solid #111', padding: '1.5rem', overflowY: 'auto', boxShadow: '-4px 0 0 #111' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 3, fontWeight: 600 }}>{selectedJob.company}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{selectedJob.title}</div>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800, boxShadow: '1px 1px 0 #111' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
              {selectedJob.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{selectedJob.location}</span>}
              <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{selectedJob.job_type}</span>
              <span className="pill" style={{ background: STATUS_COLORS[selectedJob.status].bg, color: STATUS_COLORS[selectedJob.status].color }}>{STATUS_LABELS[selectedJob.status]}</span>
            </div>

            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: '1rem' }}>
              📅 Créé le {formatDate(selectedJob.created_at)}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="fl">Changer le statut</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {COLUMNS.map(col => (
                  <button key={col.id} onClick={() => { updateJobStatus(selectedJob.id, col.id); setSelectedJob({ ...selectedJob, status: col.id }); }} style={{ background: selectedJob.status === col.id ? col.countBg : '#fff', color: selectedJob.status === col.id ? col.countColor : '#888', border: `2px solid ${selectedJob.status === col.id ? col.countColor : '#E0E0E0'}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedJob.description && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="fl">Description</label>
                <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.6 }}>{selectedJob.description}</div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="fl">Mes notes</label>
              <textarea defaultValue={selectedJob.notes || ''} placeholder="Notes, impressions, questions à poser..." className="fi" style={{ resize: 'vertical', minHeight: 80 }}
                onBlur={async e => { await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedJob.id, notes: e.target.value }) }); }} />
            </div>

            <button className="btn-main" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => router.push('/dashboard/editor?targetJob=' + encodeURIComponent(selectedJob.title + ' chez ' + selectedJob.company))}>
              ✦ Générer un CV pour ce poste →
            </button>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: '#E8151B', borderColor: '#FDEAEA' }} onClick={() => deleteJob(selectedJob.id)}>Supprimer</button>
          </div>
        </div>
      )}

      {/* ADD JOB MODAL */}
      {showAddJob && (
        <div className="modal-bg" onClick={() => setShowAddJob(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Ajouter une offre</h2>
              <button onClick={() => setShowAddJob(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              {[{ lbl: 'Titre du poste *', key: 'title', full: true, ph: 'Chef de projet digital' }, { lbl: 'Entreprise *', key: 'company', ph: 'Decathlon' }, { lbl: 'Ville', key: 'location', ph: 'Paris · Hybrid' }, { lbl: 'Contact', key: 'contact_name', ph: 'Sophie Martin' }, { lbl: 'Email contact', key: 'contact_email', ph: 'recruteur@co.fr' }].map(f => (
                <div key={f.key} style={{ marginBottom: 12, gridColumn: f.full ? '1/-1' : undefined }}>
                  <label className="fl">{f.lbl}</label>
                  <input className="fi" value={(newJob as any)[f.key] || ''} onChange={e => setNewJob({ ...newJob, [f.key]: e.target.value })} placeholder={f.ph} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}><label className="fl">Type</label><select className="fi" value={newJob.job_type} onChange={e => setNewJob({ ...newJob, job_type: e.target.value as JobType })}>{['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div style={{ marginBottom: 12 }}><label className="fl">Statut</label><select className="fi" value={newJob.status} onChange={e => setNewJob({ ...newJob, status: e.target.value as JobStatus })}>{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div style={{ marginBottom: 12, gridColumn: '1/-1' }}><label className="fl">Date d'entretien</label><input className="fi" type="datetime-local" value={newJob.interview_at || ''} onChange={e => setNewJob({ ...newJob, interview_at: e.target.value })} /></div>
              <div style={{ marginBottom: 12, gridColumn: '1/-1' }}><label className="fl">Description</label><textarea className="fi" value={newJob.description || ''} onChange={e => setNewJob({ ...newJob, description: e.target.value })} placeholder="Résumé du poste..." rows={3} style={{ resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddJob(false)}>Annuler</button>
              <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={saveJob} disabled={!newJob.title || !newJob.company}>Ajouter l'offre</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddContact && (
        <div className="modal-bg" onClick={() => setShowAddContact(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Ajouter un contact</h2>
              <button onClick={() => setShowAddContact(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            {[{ l: 'Nom complet *', k: 'name', p: 'Sophie Martin' }, { l: 'Rôle', k: 'role', p: 'Talent Acquisition' }, { l: 'Entreprise', k: 'company', p: 'BNP Paribas' }, { l: 'Email', k: 'email', p: 's.martin@bnp.fr' }, { l: 'Téléphone', k: 'phone', p: '+33 6 12 34 56 78' }, { l: 'LinkedIn', k: 'linkedin', p: 'linkedin.com/in/...' }].map(f => (
              <div key={f.k} style={{ marginBottom: 12 }}>
                <label className="fl">{f.l}</label>
                <input className="fi" value={(newContact as any)[f.k] || ''} onChange={e => setNewContact({ ...newContact, [f.k]: e.target.value })} placeholder={f.p} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddContact(false)}>Annuler</button>
              <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={saveContact} disabled={!newContact.name}>Ajouter le contact</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
