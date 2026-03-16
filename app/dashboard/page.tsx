'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job, Contact, JobStatus, STATUS_LABELS, STATUS_COLORS, JobType } from '@/lib/jobs';

type View = 'kanban' | 'list' | 'contacts' | 'agenda' | 'stats';

const COLUMNS: { id: JobStatus; label: string; countBg: string; countColor: string }[] = [
  { id: 'to_apply', label: 'À postuler', countBg: '#e8e2d6', countColor: '#7a7670' },
  { id: 'applied', label: 'Postulé', countBg: '#ebf0fd', countColor: '#1a56db' },
  { id: 'interview', label: 'Entretien', countBg: '#fef3c7', countColor: '#d97706' },
  { id: 'offer', label: 'Offre reçue', countBg: '#e6f5ee', countColor: '#0e7c4a' },
  { id: 'archived', label: 'Archivé', countBg: '#f0eeea', countColor: '#aaa' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('kanban');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newJob, setNewJob] = useState<Partial<Job>>({ status: 'to_apply', job_type: 'CDI' });
  const [newContact, setNewContact] = useState<Partial<Contact>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserEmail(user.email || '');
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
    responseRate: jobs.length ? Math.round((jobs.filter(j => ['interview','offer'].includes(j.status)).length / jobs.length) * 100) : 0,
    interviews: jobs.filter(j => j.status === 'interview').length,
    offers: jobs.filter(j => j.status === 'offer').length,
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#faf8f3', fontFamily: 'sans-serif', color: '#7a7670' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#faf8f3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #e8e2d6; border-radius: 3px; }
        .nav-btn { display: flex; align-items: center; gap: 10px; padding: 9px 14px; margin: 1px 8px; border-radius: 8px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.55); cursor: pointer; transition: all 0.15s; border: none; background: transparent; width: calc(100% - 16px); text-align: left; font-family: inherit; }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
        .nav-btn.active { background: rgba(255,255,255,0.12); color: white; }
        .jcard { background: white; border: 1px solid #e8e2d6; border-radius: 10px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
        .jcard:hover { border-color: #1a56db; box-shadow: 0 2px 12px rgba(26,86,219,0.1); transform: translateY(-1px); }
        .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; border: none; }
        .btn:active { transform: scale(0.98); }
        .pill { display: inline-flex; align-items: center; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
        .fi { width: 100%; border: 1px solid #e8e2d6; border-radius: 8px; padding: 9px 12px; font-size: 14px; font-family: inherit; outline: none; }
        .fi:focus { border-color: #1a56db; }
        .lrow { display: grid; grid-template-columns: 2fr 1fr 0.8fr 1fr 0.7fr 60px; gap: 12px; padding: 11px 16px; border-bottom: 1px solid #e8e2d6; align-items: center; cursor: pointer; }
        .lrow:hover { background: #faf8f3; }
        .modal-bg { position: fixed; inset: 0; background: rgba(15,14,12,0.5); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .modal { background: white; border-radius: 16px; padding: 1.5rem; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
        .fl { display: block; font-size: 11px; font-weight: 600; color: #7a7670; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
        .ccard { background: #faf8f3; border: 1px solid #e8e2d6; border-radius: 12px; padding: 1rem; transition: all 0.2s; cursor: default; }
        .ccard:hover { background: white; box-shadow: 0 2px 16px rgba(15,14,12,0.06); }
        .cbtn { flex: 1; padding: 5px; border-radius: 6px; border: 1px solid #e8e2d6; background: transparent; font-size: 11px; font-weight: 600; color: #7a7670; cursor: pointer; font-family: inherit; }
        .cbtn:hover { background: #ebf0fd; color: #1a56db; border-color: #1a56db; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 220, background: '#0f0e0c', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db' }} />Jean
          </Link>
        </div>
        <div style={{ padding: '0.75rem 0.75rem 0.25rem', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recherche</div>
        {([['kanban','📊','Tableau de bord',jobs.length],['list','📋','Candidatures',null],['contacts','👥','Contacts',contacts.length],['agenda','📅','Entretiens',stats.interviews],['stats','📈','Statistiques',null]] as [View,string,string,number|null][]).map(([v,ic,lb,bg]) => (
          <button key={v} className={'nav-btn' + (view===v?' active':'')} onClick={() => setView(v)}>
            <span style={{ fontSize: 14 }}>{ic}</span>
            <span style={{ flex: 1 }}>{lb}</span>
            {bg!==null && bg>0 && <span style={{ background: v==='agenda'?'#dc2626':'#1a56db', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{bg}</span>}
          </button>
        ))}
        <div style={{ padding: '0.75rem 0.75rem 0.25rem', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.5rem' }}>Outils</div>
        <button className="nav-btn" onClick={() => router.push('/dashboard/editor')}><span style={{ fontSize: 14 }}>✦</span> CV Creator</button>
        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }} onClick={handleLogout}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ebf0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1a56db', flexShrink: 0 }}>{initials(userEmail.split('@')[0])}</div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{userEmail.split('@')[0]}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Déconnexion</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.5rem', background: 'white', borderBottom: '1px solid #e8e2d6', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{{ kanban:'Tableau de bord', list:'Mes candidatures', contacts:'Contacts', agenda:'Agenda', stats:'Statistiques' }[view]}</div>
          <button className="btn" style={{ background: '#0f0e0c', color: 'white' }} onClick={() => view==='contacts' ? setShowAddContact(true) : setShowAddJob(true)}>
            {view==='contacts' ? '+ Ajouter un contact' : '+ Ajouter une offre'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* Stats */}
          {['kanban','list','stats'].includes(view) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: '1.5rem' }}>
              {[{l:'Total',v:stats.total,c:'#0f0e0c'},{l:'Taux réponse',v:stats.responseRate+'%',c:'#1a56db'},{l:'Entretiens',v:stats.interviews,c:'#0e7c4a'},{l:'Offres',v:stats.offers,c:'#d97706'},{l:'Contacts',v:contacts.length,c:'#7a7670'}].map(s => (
                <div key={s.l} style={{ background: 'white', border: '1px solid #e8e2d6', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#7a7670', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.l}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}

          {/* KANBAN */}
          {view==='kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, alignItems: 'start' }}>
              {COLUMNS.map(col => (
                <div key={col.id} style={{ background: '#f2ede2', borderRadius: 12, padding: 10, minHeight: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{col.label}</div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: col.countBg, color: col.countColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{jobsByStatus(col.id).length}</div>
                  </div>
                  {jobsByStatus(col.id).map(job => (
                    <div key={job.id} className="jcard" onClick={() => setSelectedJob(job)}>
                      <div style={{ fontSize: 11, color: '#7a7670', marginBottom: 3, fontWeight: 500 }}>{job.company}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{job.title}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {job.location && <span className="pill" style={{ background: '#f2ede2', color: '#7a7670', border: '1px solid #e8e2d6', fontSize: 10 }}>{job.location}</span>}
                        <span className="pill" style={{ background: '#f2ede2', color: '#7a7670', border: '1px solid #e8e2d6', fontSize: 10 }}>{job.job_type}</span>
                      </div>
                    </div>
                  ))}
                  <div onClick={() => { setNewJob({ status: col.id, job_type: 'CDI' }); setShowAddJob(true); }} style={{ border: '1.5px dashed #e8e2d6', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 12, color: '#7a7670', cursor: 'pointer' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor='#1a56db'; (e.currentTarget as HTMLElement).style.color='#1a56db'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor='#e8e2d6'; (e.currentTarget as HTMLElement).style.color='#7a7670'; }}>+ Ajouter</div>
                </div>
              ))}
            </div>
          )}

          {/* LIST */}
          {view==='list' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e8e2d6', borderRadius: 8, padding: '7px 12px', flex: 1, maxWidth: 300 }}>
                  <span>🔍</span>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', fontFamily: 'inherit' }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="fi" style={{ width: 'auto' }}>
                  <option value="all">Tous les statuts</option>
                  {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ background: 'white', border: '1px solid #e8e2d6', borderRadius: 14, overflow: 'hidden' }}>
                <div className="lrow" style={{ background: '#f2ede2', fontSize: 11, fontWeight: 700, color: '#7a7670', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'default' }}>
                  <div>Poste / Entreprise</div><div>Localisation</div><div>Type</div><div>Statut</div><div>Date</div><div></div>
                </div>
                {filteredJobs.length===0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#7a7670', fontSize: 14 }}>Aucune candidature — <button onClick={() => setShowAddJob(true)} style={{ color: '#1a56db', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ajouter</button></div>}
                {filteredJobs.map(job => {
                  const sc = STATUS_COLORS[job.status];
                  return (
                    <div key={job.id} className="lrow" onClick={() => setSelectedJob(job)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ebf0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1a56db', flexShrink: 0 }}>{job.company.substring(0,2).toUpperCase()}</div>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{job.title}</div><div style={{ fontSize: 11, color: '#7a7670' }}>{job.company}</div></div>
                      </div>
                      <div style={{ fontSize: 13 }}>{job.location||'—'}</div>
                      <div><span className="pill" style={{ background: '#f2ede2', color: '#7a7670' }}>{job.job_type}</span></div>
                      <div><span className="pill" style={{ background: sc.bg, color: sc.color }}>{STATUS_LABELS[job.status]}</span></div>
                      <div style={{ fontSize: 12, color: '#7a7670' }}>{job.created_at ? new Date(job.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '—'}</div>
                      <div><button className="btn" style={{ background: 'transparent', border: '1px solid #e8e2d6', padding: '4px 10px', fontSize: 12, color: '#dc2626' }} onClick={e => { e.stopPropagation(); deleteJob(job.id); }}>✕</button></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {view==='contacts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {contacts.length===0 && <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#7a7670', fontSize: 14 }}>Aucun contact — <button onClick={() => setShowAddContact(true)} style={{ color: '#1a56db', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ajouter le premier</button></div>}
              {contacts.map(c => (
                <div key={c.id} className="ccard">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ebf0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1a56db', flexShrink: 0 }}>{initials(c.name)}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 12, color: '#7a7670' }}>{c.role}</div><div style={{ fontSize: 12, color: '#1a56db', fontWeight: 500 }}>{c.company}</div></div>
                  </div>
                  {c.email && <div style={{ fontSize: 12, color: '#7a7670', marginBottom: 4 }}>📧 {c.email}</div>}
                  {c.phone && <div style={{ fontSize: 12, color: '#7a7670', marginBottom: 4 }}>📞 {c.phone}</div>}
                  {c.linkedin && <div style={{ fontSize: 12, color: '#7a7670' }}>🔗 {c.linkedin}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {c.email && <button className="cbtn" onClick={() => window.open('mailto:'+c.email)}>✉️ Email</button>}
                    {c.linkedin && <button className="cbtn" onClick={() => window.open(c.linkedin)}>💼 LinkedIn</button>}
                    <button className="cbtn" style={{ color: '#dc2626' }} onClick={() => fetch('/api/contacts?id='+c.id,{method:'DELETE'}).then(() => setContacts(contacts.filter(x => x.id!==c.id)))}>✕</button>
                  </div>
                </div>
              ))}
              <div className="ccard" style={{ border: '1.5px dashed #e8e2d6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 160 }} onClick={() => setShowAddContact(true)}>
                <div style={{ textAlign: 'center', color: '#7a7670' }}><div style={{ fontSize: 24, marginBottom: 8 }}>+</div><div style={{ fontSize: 13, fontWeight: 500 }}>Ajouter un contact</div></div>
              </div>
            </div>
          )}

          {/* AGENDA */}
          {view==='agenda' && (
            <div>
              {jobs.filter(j => j.status==='interview').length===0 ? (
                <div style={{ background: 'white', border: '1px solid #e8e2d6', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#7a7670' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Aucun entretien planifié</div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>Mettez des candidatures au statut "Entretien" pour les voir ici</div>
                  <button className="btn" style={{ background: '#0f0e0c', color: 'white' }} onClick={() => setView('kanban')}>Voir le tableau de bord</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {jobs.filter(j => j.status==='interview').map(job => (
                    <div key={job.id} style={{ background: 'white', border: '1px solid #e8e2d6', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 60 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>ENTRETIEN</div>
                        {job.interview_at && <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{new Date(job.interview_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{job.title}</div>
                        <div style={{ fontSize: 13, color: '#7a7670' }}>{job.company}{job.location && ' · '+job.location}</div>
                        {job.contact_name && <div style={{ fontSize: 12, color: '#1a56db', marginTop: 4 }}>Contact : {job.contact_name}</div>}
                      </div>
                      <button className="btn" style={{ background: '#ebf0fd', color: '#1a56db', border: 'none' }} onClick={() => setSelectedJob(job)}>Voir détails</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STATS */}
          {view==='stats' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'white', border: '1px solid #e8e2d6', borderRadius: 14, padding: '1.5rem' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: '1rem' }}>Répartition par statut</div>
                {COLUMNS.filter(c => c.id!=='archived').map(col => {
                  const count = jobsByStatus(col.id).length;
                  const pct = jobs.length ? Math.round((count/jobs.length)*100) : 0;
                  return (
                    <div key={col.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>{col.label}</span><span style={{ fontWeight: 700 }}>{count}</span></div>
                      <div style={{ height: 8, background: '#f2ede2', borderRadius: 4 }}><div style={{ height: '100%', width: pct+'%', background: col.countColor, borderRadius: 4 }} /></div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: 'white', border: '1px solid #e8e2d6', borderRadius: 14, padding: '1.5rem' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: '1rem' }}>Taux de conversion</div>
                {[{l:'Candidatures → Entretien',v:stats.responseRate,c:'#1a56db'},{l:'Entretien → Offre',v:stats.interviews?Math.round((stats.offers/stats.interviews)*100):0,c:'#0e7c4a'}].map(item => (
                  <div key={item.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 13 }}>{item.l}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 6, width: 100, background: '#f2ede2', borderRadius: 3 }}><div style={{ height: '100%', width: item.v+'%', background: item.c, borderRadius: 3 }} /></div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.c, minWidth: 36 }}>{item.v}%</span>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.4)', zIndex: 200 }} onClick={() => setSelectedJob(null)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 460, background: 'white', padding: '1.5rem', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div><div style={{ fontSize: 11, color: '#7a7670', marginBottom: 4 }}>{selectedJob.company}</div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedJob.title}</div></div>
              <button onClick={() => setSelectedJob(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e8e2d6', background: 'transparent', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {selectedJob.location && <span className="pill" style={{ background: '#f2ede2', color: '#7a7670' }}>{selectedJob.location}</span>}
              <span className="pill" style={{ background: '#f2ede2', color: '#7a7670' }}>{selectedJob.job_type}</span>
              <span className="pill" style={{ background: STATUS_COLORS[selectedJob.status].bg, color: STATUS_COLORS[selectedJob.status].color }}>{STATUS_LABELS[selectedJob.status]}</span>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="fl">Changer le statut</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLUMNS.map(col => (
                  <button key={col.id} onClick={() => { updateJobStatus(selectedJob.id, col.id); setSelectedJob({...selectedJob, status: col.id}); }} className="btn" style={{ background: selectedJob.status===col.id?col.countBg:'transparent', color: selectedJob.status===col.id?col.countColor:'#7a7670', border: '1px solid '+(selectedJob.status===col.id?col.countColor:'#e8e2d6'), padding: '5px 12px', fontSize: 12 }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
            {selectedJob.description && <div style={{ marginBottom: '1.25rem' }}><label className="fl">Description</label><div style={{ background: '#faf8f3', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.6 }}>{selectedJob.description}</div></div>}
            {selectedJob.contact_name && <div style={{ marginBottom: '1.25rem' }}><label className="fl">Contact</label><div style={{ background: '#faf8f3', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>{selectedJob.contact_name}{selectedJob.contact_email && ' — '+selectedJob.contact_email}</div></div>}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="fl">Mes notes</label>
              <textarea defaultValue={selectedJob.notes||''} placeholder="Notes, impressions, questions à poser..." className="fi" style={{ resize: 'vertical', minHeight: 80 }} onBlur={async e => { await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selectedJob.id,notes:e.target.value})}); }} />
            </div>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', background: '#0f0e0c', color: 'white', marginBottom: 8 }} onClick={() => router.push('/dashboard/editor?targetJob='+encodeURIComponent(selectedJob.title+' chez '+selectedJob.company))}>
              ✦ Générer un CV pour ce poste →
            </button>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626' }} onClick={() => deleteJob(selectedJob.id)}>Supprimer cette offre</button>
          </div>
        </div>
      )}

      {/* ADD JOB */}
      {showAddJob && (
        <div className="modal-bg" onClick={() => setShowAddJob(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ajouter une offre</h2>
              <button onClick={() => setShowAddJob(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e8e2d6', background: 'transparent', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              {[{lbl:'Titre du poste *',key:'title',full:true,ph:'Chef de projet digital'},{lbl:'Entreprise *',key:'company',ph:'Decathlon'},{lbl:'Ville',key:'location',ph:'Paris · Hybrid'},{lbl:'Email contact',key:'contact_email',ph:'recruteur@co.fr'},{lbl:'Nom contact',key:'contact_name',ph:'Sophie Martin'}].map(f => (
                <div key={f.key} style={{ marginBottom: 14, gridColumn: f.full?'1/-1':undefined }}>
                  <label className="fl">{f.lbl}</label>
                  <input className="fi" value={(newJob as any)[f.key]||''} onChange={e => setNewJob({...newJob,[f.key]:e.target.value})} placeholder={f.ph} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Type</label>
                <select className="fi" value={newJob.job_type} onChange={e => setNewJob({...newJob,job_type:e.target.value as JobType})}>
                  {['CDI','CDD','Freelance','Stage','Alternance'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Statut</label>
                <select className="fi" value={newJob.status} onChange={e => setNewJob({...newJob,status:e.target.value as JobStatus})}>
                  {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                <label className="fl">Date d'entretien</label>
                <input className="fi" type="datetime-local" value={newJob.interview_at||''} onChange={e => setNewJob({...newJob,interview_at:e.target.value})} />
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                <label className="fl">Description</label>
                <textarea className="fi" value={newJob.description||''} onChange={e => setNewJob({...newJob,description:e.target.value})} placeholder="Résumé du poste, missions..." rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', border: '1px solid #e8e2d6', background: 'transparent' }} onClick={() => setShowAddJob(false)}>Annuler</button>
              <button className="btn" style={{ flex: 2, justifyContent: 'center', background: '#0f0e0c', color: 'white' }} onClick={saveJob} disabled={!newJob.title||!newJob.company}>Ajouter l'offre</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT */}
      {showAddContact && (
        <div className="modal-bg" onClick={() => setShowAddContact(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ajouter un contact</h2>
              <button onClick={() => setShowAddContact(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e8e2d6', background: 'transparent', cursor: 'pointer' }}>✕</button>
            </div>
            {[{l:'Nom complet *',k:'name',p:'Sophie Martin'},{l:'Rôle',k:'role',p:'Talent Acquisition'},{l:'Entreprise',k:'company',p:'BNP Paribas'},{l:'Email',k:'email',p:'s.martin@bnp.fr'},{l:'Téléphone',k:'phone',p:'+33 6 12 34 56 78'},{l:'LinkedIn',k:'linkedin',p:'linkedin.com/in/...'}].map(f => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <label className="fl">{f.l}</label>
                <input className="fi" value={(newContact as any)[f.k]||''} onChange={e => setNewContact({...newContact,[f.k]:e.target.value})} placeholder={f.p} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', border: '1px solid #e8e2d6', background: 'transparent' }} onClick={() => setShowAddContact(false)}>Annuler</button>
              <button className="btn" style={{ flex: 2, justifyContent: 'center', background: '#0f0e0c', color: 'white' }} onClick={saveContact} disabled={!newContact.name}>Ajouter le contact</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
