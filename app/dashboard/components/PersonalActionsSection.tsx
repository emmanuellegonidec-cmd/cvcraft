'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const FONT = "'Montserrat', sans-serif";

const ACTION_TYPES = [
  'Candidature externe',
  'Prise de contact réseau',
  'Mise à jour profil',
  'Envoi CV spontané',
  'Autre',
];

const TYPE_COLORS: Record<string, string> = {
  'Candidature externe': '#E8151B',
  'Prise de contact réseau': '#7C3AED',
  'Mise à jour profil': '#1A7A4A',
  'Envoi CV spontané': '#B8900A',
  'Autre': '#555',
};

interface PersonalAction {
  id: string;
  nom: string;
  type: string;
  plateforme: string | null;
  date_action: string;
  heure_action: string | null;
  note: string | null;
  job_id: string | null;
  job_title?: string | null;
  job_company?: string | null;
}

interface JobOption { id: string; title: string; company: string; }

interface Props {
  triggerOpen?: number;
  onCountChange?: (n: number) => void;
}

// Petit utilitaire pour notifier le calendrier qu'il doit se rafraîchir
function notifyCalendarRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jfmj-calendar-refresh'));
  }
}

export default function PersonalActionsSection({ triggerOpen, onCountChange }: Props) {
  const [actions, setActions] = useState<PersonalAction[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAction, setEditAction] = useState<PersonalAction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonalAction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formType, setFormType] = useState('Candidature externe');
  const [formNom, setFormNom] = useState('');
  const [formPlateforme, setFormPlateforme] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formHeure, setFormHeure] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formJobId, setFormJobId] = useState('');
  const [saving, setSaving] = useState(false);

  function getToken() {
    return typeof window !== 'undefined' ? (window as any).__jfmj_token : null;
  }

  function authFetch(url: string, options: RequestInit = {}) {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  async function loadActions() {
    setLoading(true);
    try {
      const res = await authFetch('/api/personal-actions');
      const data = await res.json();
      const list = data.actions || [];
      setActions(list);
      onCountChange?.(list.length);
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    const supabase = createClient();
    const { data } = await supabase.from('jobs').select('id, title, company').order('created_at', { ascending: false });
    setJobs(data || []);
  }

  useEffect(() => { loadActions(); loadJobs(); }, []);

  // Écoute le signal de rafraîchissement (déclenché par le panneau de détail
  // après modification ou suppression depuis le calendrier)
  useEffect(() => {
    const handler = () => loadActions();
    if (typeof window !== 'undefined') {
      window.addEventListener('jfmj-calendar-refresh', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('jfmj-calendar-refresh', handler);
      }
    };
  }, []);

  useEffect(() => {
    if (triggerOpen && triggerOpen > 0) openModal();
  }, [triggerOpen]);

  function openModal(action?: PersonalAction) {
    if (action) {
      setEditAction(action);
      setFormType(action.type);
      setFormNom(action.nom);
      setFormPlateforme(action.plateforme || '');
      setFormDate(action.date_action);
      setFormHeure(action.heure_action || '');
      setFormNote(action.note || '');
      setFormJobId(action.job_id || '');
    } else {
      setEditAction(null);
      setFormType('Candidature externe');
      setFormNom('');
      setFormPlateforme('');
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormHeure('');
      setFormNote('');
      setFormJobId('');
    }
    setShowModal(true);
  }

  async function save() {
    if (!formNom.trim() || !formDate) return;
    setSaving(true);
    try {
      const body = {
        ...(editAction ? { id: editAction.id } : {}),
        nom: formNom.trim(),
        type: formType,
        plateforme: formPlateforme.trim() || null,
        date_action: formDate,
        heure_action: formHeure || null,
        note: formNote.trim() || null,
        job_id: formJobId || null,
      };
      const res = await authFetch('/api/personal-actions', { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (data.action) {
        await loadActions();
        setShowModal(false);
        notifyCalendarRefresh();
      }
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await authFetch('/api/personal-actions?id=' + deleteTarget.id, { method: 'DELETE' });
      await loadActions();
      setDeleteTarget(null);
      notifyCalendarRefresh();
    } finally { setDeleteLoading(false); }
  }

  function formatDate(d: string, h?: string | null) {
    const dateStr = new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    if (h) return `${dateStr} — ${h.replace(':', 'h')}`;
    return dateStr;
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = actions.filter(a => a.date_action >= today).sort((a, b) => a.date_action.localeCompare(b.date_action));
  const past = actions.filter(a => a.date_action < today).sort((a, b) => b.date_action.localeCompare(a.date_action));

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '2px solid #111', borderRadius: 6,
    padding: '11px 14px', fontSize: 14, fontWeight: 600,
    color: '#111', fontFamily: FONT, boxSizing: 'border-box', background: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#111',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT,
  };

  const btnIconStyle: React.CSSProperties = {
    background: '#fff', border: '1.5px solid #DDD', borderRadius: 6,
    width: 32, height: 32, display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', fontSize: 14,
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
      Chargement...
    </div>
  );

  return (
    <div style={{ fontFamily: FONT }}>

      {actions.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa', fontFamily: FONT }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Aucune action pour le moment.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Ajoutez vos candidatures externes, prises de contact, mises à jour de profil...</div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <div style={{ padding: '6px 20px', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#F5F5F5', borderBottom: '1px solid #E8E8E8' }}>
                À venir
              </div>
              {upcoming.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #EBEBEB', gap: 14, background: '#fff' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#111', fontFamily: FONT }}>{a.nom}</span>
                      <span style={{ background: TYPE_COLORS[a.type] || '#555', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 4, whiteSpace: 'nowrap' }}>{a.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      {a.plateforme && <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>📍 {a.plateforme}</span>}
                      <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>📅 {formatDate(a.date_action, a.heure_action)}</span>
                      {a.job_title && <span style={{ fontSize: 11, color: '#111', fontWeight: 700, background: '#F5F5F0', border: '1px solid #DDD', borderRadius: 4, padding: '2px 8px' }}>🔗 {a.job_title}{a.job_company ? ` — ${a.job_company}` : ''}</span>}
                    </div>
                    {a.note && <div style={{ fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' }}>{a.note}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openModal(a)} style={btnIconStyle} title="Modifier">✏️</button>
                    <button onClick={() => setDeleteTarget(a)} style={btnIconStyle} title="Supprimer">🗑️</button>
                  </div>
                </div>
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <div style={{ padding: '6px 20px', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#F5F5F5', borderBottom: '1px solid #E8E8E8' }}>
                Passées
              </div>
              {past.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #EBEBEB', gap: 14, background: '#fff' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#111', fontFamily: FONT }}>{a.nom}</span>
                      <span style={{ background: TYPE_COLORS[a.type] || '#555', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 4, whiteSpace: 'nowrap' }}>{a.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      {a.plateforme && <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>📍 {a.plateforme}</span>}
                      <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>📅 {formatDate(a.date_action, a.heure_action)}</span>
                      {a.job_title && <span style={{ fontSize: 11, color: '#111', fontWeight: 700, background: '#F5F5F0', border: '1px solid #DDD', borderRadius: 4, padding: '2px 8px' }}>🔗 {a.job_title}{a.job_company ? ` — ${a.job_company}` : ''}</span>}
                    </div>
                    {a.note && <div style={{ fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' }}>{a.note}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openModal(a)} style={btnIconStyle} title="Modifier">✏️</button>
                    <button onClick={() => setDeleteTarget(a)} style={btnIconStyle} title="Supprimer">🗑️</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* MODAL AJOUT / ÉDITION */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', border: '2px solid #111', boxShadow: '5px 5px 0 #111', fontFamily: FONT }}>
            <div style={{ padding: '20px 28px 16px', borderBottom: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>
                {editAction ? '✏️ Modifier l\'action' : '⚡ + Ajouter une action'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Type d'action *</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} style={inputStyle}>
                  {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Nom de l'action *</label>
                <input type="text" value={formNom} onChange={e => setFormNom(e.target.value)} placeholder="Ex: Postulé sur Indeed — Manager de transition" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Plateforme / Contact <span style={{ textTransform: 'none', fontWeight: 600, color: '#999' }}>(optionnel)</span></label>
                  <input type="text" value={formPlateforme} onChange={e => setFormPlateforme(e.target.value)} placeholder="Indeed, Valtus, LinkedIn..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Heure <span style={{ textTransform: 'none', fontWeight: 600, color: '#999' }}>(optionnel — laissez vide si pas d'heure précise)</span></label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="time" value={formHeure} onChange={e => setFormHeure(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }} />
                  {formHeure && (
                    <button
                      type="button"
                      onClick={() => setFormHeure('')}
                      style={{ background: '#fff', border: '1.5px solid #DDD', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#888', fontFamily: FONT }}
                      title="Effacer l'heure"
                    >
                      ✕ Effacer
                    </button>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Offre liée <span style={{ textTransform: 'none', fontWeight: 600, color: '#999' }}>(optionnel)</span></label>
                <select value={formJobId} onChange={e => setFormJobId(e.target.value)} style={inputStyle}>
                  <option value="">— Aucune offre liée —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ''}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Note <span style={{ textTransform: 'none', fontWeight: 600, color: '#999' }}>(optionnel)</span></label>
                <textarea value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="Informations complémentaires, suite à donner..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ background: '#fff', border: '2px solid #111', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  Annuler
                </button>
                <button onClick={save} disabled={saving || !formNom.trim() || !formDate} style={{ background: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: '10px 28px', fontSize: 14, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', boxShadow: '3px 3px 0 #111', fontFamily: FONT, opacity: (!formNom.trim() || !formDate) ? 0.6 : 1 }}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 30, width: '100%', maxWidth: 400, border: '2px solid #E8151B', boxShadow: '4px 4px 0 #E8151B', fontFamily: FONT }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#E8151B', margin: '0 0 8px', fontFamily: FONT }}>Supprimer cette action ?</h3>
              <p style={{ fontSize: 13, color: '#555', margin: 0, fontFamily: FONT }}>{deleteTarget.nom}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, background: '#F9F9F7', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={confirmDelete} disabled={deleteLoading} style={{ flex: 1, background: '#E8151B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                {deleteLoading ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
