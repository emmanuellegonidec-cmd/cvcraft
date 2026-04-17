'use client';

import { useState, useEffect } from 'react';

const FONT = "'Montserrat', sans-serif";

const EVENT_CATEGORIES = [
  'Atelier', 'Formation', 'Coaching', 'Networking',
  'Rendez-vous conseil', 'Bilan de compétences', 'Autre',
];

const CATEGORIE_COLORS: Record<string, string> = {
  'Atelier': '#F5C400',
  'Formation': '#1B4F72',
  'Coaching': '#E8151B',
  'Networking': '#2ecc71',
  'Rendez-vous conseil': '#9b59b6',
  'Bilan de compétences': '#e67e22',
  'Autre': '#888',
};

const PERSONAL_ACTION_TYPES = [
  'Candidature externe', 'Prise de contact réseau', 'Mise à jour profil',
  'Envoi CV spontané', 'Autre',
];

const PERSONAL_TYPE_COLORS: Record<string, string> = {
  'Candidature externe': '#E8151B',
  'Prise de contact réseau': '#7C3AED',
  'Mise à jour profil': '#1A7A4A',
  'Envoi CV spontané': '#B8900A',
  'Autre': '#555',
};

const STATUTS = [
  { value: 'a_faire', label: 'À faire', color: '#1B4F72' },
  { value: 'fait',    label: 'Fait',    color: '#1A7A4A' },
  { value: 'annule',  label: 'Annulé',  color: '#888' },
];

interface JobOption { id: string; title: string; company: string; }

interface Props {
  kind: 'personal_action' | 'event';
  data: any;
  jobs?: JobOption[];
  onClose: () => void;
}

function notifyRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jfmj-calendar-refresh'));
  }
}

function formatDateLabel(d: string, h?: string | null) {
  if (!d) return '';
  const date = new Date(d.length === 10 ? d + 'T12:00:00' : d);
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  if (h) return `${dateStr} — ${h.replace(':', 'h')}`;
  return dateStr;
}

function formatDateTimeLabel(s: string) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Calcule le statut effectif (en_retard si date passée et statut a_faire)
function getEffectiveStatus(kind: 'personal_action' | 'event', data: any): 'fait' | 'annule' | 'a_faire' | 'en_retard' {
  const statut = data.statut || 'a_faire';
  if (statut === 'fait') return 'fait';
  if (statut === 'annule') return 'annule';
  const now = new Date();
  let target: Date;
  if (kind === 'personal_action') {
    const dateStr = data.date_action + (data.heure_action ? 'T' + data.heure_action : 'T23:59:59');
    target = new Date(dateStr);
  } else {
    target = new Date(data.date_fin || data.date_debut);
  }
  if (target < now) return 'en_retard';
  return 'a_faire';
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '2px solid #111', borderRadius: 6,
  padding: '10px 12px', fontSize: 13, fontWeight: 600,
  color: '#111', fontFamily: FONT, boxSizing: 'border-box', background: '#fff',
};

export default function ActionDetailPanel({ kind, data, jobs = [], onClose }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Champs personal_action
  const [paNom, setPaNom] = useState(data.nom || '');
  const [paType, setPaType] = useState(data.type || PERSONAL_ACTION_TYPES[0]);
  const [paPlateforme, setPaPlateforme] = useState(data.plateforme || '');
  const [paDate, setPaDate] = useState(data.date_action || '');
  const [paHeure, setPaHeure] = useState(data.heure_action || '');
  const [paNote, setPaNote] = useState(data.note || '');
  const [paJobId, setPaJobId] = useState(data.job_id || '');

  // Champs event
  const [evNom, setEvNom] = useState(data.nom || '');
  const [evOrganisateur, setEvOrganisateur] = useState(data.organisateur || '');
  const [evCategorie, setEvCategorie] = useState(data.categorie || '');
  const [evDateDebut, setEvDateDebut] = useState('');
  const [evDateFin, setEvDateFin] = useState('');
  const [evNote, setEvNote] = useState(data.note || '');

  // Statut (partagé aux deux)
  const [statut, setStatut] = useState(data.statut || 'a_faire');

  useEffect(() => {
    if (kind === 'event' && data.date_debut) {
      const toLocalInput = (s: string) => {
        const d = new Date(s);
        const off = d.getTimezoneOffset();
        return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
      };
      setEvDateDebut(toLocalInput(data.date_debut));
      if (data.date_fin) setEvDateFin(toLocalInput(data.date_fin));
    }
  }, [kind, data]);

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

  async function savePersonalAction() {
    if (!paNom.trim() || !paDate) {
      setError('Le nom et la date sont requis.');
      return;
    }
    setSaving(true); setError('');
    try {
      const body = {
        id: data.id,
        nom: paNom.trim(),
        type: paType,
        plateforme: paPlateforme.trim() || null,
        date_action: paDate,
        heure_action: paHeure || null,
        note: paNote.trim() || null,
        job_id: paJobId || null,
        statut,
      };
      const res = await authFetch('/api/personal-actions', { method: 'POST', body: JSON.stringify(body) });
      const result = await res.json();
      if (result.action) {
        Object.assign(data, body);
        notifyRefresh();
        setMode('view');
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function saveEvent() {
    if (!evNom.trim() || !evDateDebut) {
      setError('Le nom et la date de début sont requis.');
      return;
    }
    setSaving(true); setError('');
    try {
      const toISO = (val: string) => val ? new Date(val).toISOString() : null;
      const body = {
        id: data.id,
        nom: evNom,
        organisateur: evOrganisateur,
        categorie: evCategorie,
        date_debut: toISO(evDateDebut),
        date_fin: evDateFin ? toISO(evDateFin) : null,
        note: evNote,
        statut,
      };
      const res = await authFetch('/api/actions', { method: 'PUT', body: JSON.stringify(body) });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
      Object.assign(data, {
        nom: evNom, organisateur: evOrganisateur, categorie: evCategorie,
        date_debut: body.date_debut, date_fin: body.date_fin, note: evNote,
        statut,
      });
      notifyRefresh();
      setMode('view');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  // Changement rapide de statut (depuis le mode VIEW)
  async function quickChangeStatus(newStatut: string) {
    setSaving(true); setError('');
    try {
      if (kind === 'personal_action') {
        const res = await authFetch('/api/personal-actions', {
          method: 'POST',
          body: JSON.stringify({ id: data.id, statut: newStatut }),
        });
        const result = await res.json();
        if (result.action) {
          data.statut = newStatut;
          setStatut(newStatut);
          notifyRefresh();
        } else {
          setError(result.error || 'Erreur');
        }
      } else {
        const res = await authFetch('/api/actions', {
          method: 'PUT',
          body: JSON.stringify({ id: data.id, statut: newStatut }),
        });
        if (res.ok) {
          data.statut = newStatut;
          setStatut(newStatut);
          notifyRefresh();
        } else {
          const result = await res.json();
          setError(result.error || 'Erreur');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const url = kind === 'personal_action'
        ? '/api/personal-actions?id=' + data.id
        : '/api/actions?id=' + data.id;
      await authFetch(url, { method: 'DELETE' });
      notifyRefresh();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const headerLabel = kind === 'personal_action' ? 'Action' : 'Événement';
  const effectiveStatus = getEffectiveStatus(kind, data);

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998,
      }} />

      {/* Panneau latéral */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw',
        background: '#fff', borderLeft: '2px solid #111', zIndex: 999,
        display: 'flex', flexDirection: 'column', fontFamily: FONT,
        boxShadow: '-4px 0 0 #111',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '2px solid #111', background: '#FAFAFA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {headerLabel}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888', lineHeight: 1, padding: 0,
          }} title="Fermer">×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {error && (
            <div style={{ background: '#ffeaea', border: '1px solid #E8151B', color: '#E8151B', padding: '8px 12px', marginBottom: 16, fontSize: 12, borderRadius: 6 }}>
              {error}
            </div>
          )}

          {mode === 'view' ? (
            <>
              {/* Titre + badges */}
              <div style={{ marginBottom: 22 }}>
                <h2 style={{
                  fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 10px',
                  fontFamily: FONT, lineHeight: 1.3,
                  textDecoration: (effectiveStatus === 'fait' || effectiveStatus === 'annule') ? 'line-through' : 'none',
                  opacity: effectiveStatus === 'annule' ? 0.6 : 1,
                }}>
                  {data.nom}
                </h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {kind === 'personal_action' && data.type && (
                    <span style={{ background: PERSONAL_TYPE_COLORS[data.type] || '#555', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4 }}>
                      {data.type}
                    </span>
                  )}
                  {kind === 'event' && data.categorie && (
                    <span style={{ background: CATEGORIE_COLORS[data.categorie] || '#888', color: '#111', fontSize: 11, fontWeight: 800, padding: '3px 10px', border: '1px solid #111' }}>
                      {data.categorie}
                    </span>
                  )}
                  {effectiveStatus === 'en_retard' && (
                    <span style={{ background: '#E8151B', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🔴 En retard
                    </span>
                  )}
                  {effectiveStatus === 'fait' && (
                    <span style={{ background: '#1A7A4A', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ✓ Fait
                    </span>
                  )}
                  {effectiveStatus === 'annule' && (
                    <span style={{ background: '#888', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Annulé
                    </span>
                  )}
                </div>
              </div>

              {/* Sélecteur de statut rapide */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: FONT }}>
                  Changer le statut
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {STATUTS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => quickChangeStatus(s.value)}
                      disabled={saving || statut === s.value}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        border: '2px solid #111',
                        borderRadius: 6,
                        background: statut === s.value ? s.color : '#fff',
                        color: statut === s.value ? '#fff' : '#111',
                        cursor: statut === s.value ? 'default' : 'pointer',
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: 11,
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Détails */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {kind === 'personal_action' && (
                  <>
                    <DetailRow label="Date" value={formatDateLabel(data.date_action, data.heure_action)} icon="📅" />
                    {data.plateforme && <DetailRow label="Plateforme / Contact" value={data.plateforme} icon="📍" />}
                    {data.job_title && <DetailRow label="Offre liée" value={data.job_title + (data.job_company ? ' — ' + data.job_company : '')} icon="🔗" />}
                    {data.note && <DetailRow label="Note" value={data.note} icon="📝" multiline />}
                  </>
                )}
                {kind === 'event' && (
                  <>
                    <DetailRow label="Date de début" value={formatDateTimeLabel(data.date_debut)} icon="📅" />
                    {data.date_fin && <DetailRow label="Date de fin" value={formatDateTimeLabel(data.date_fin)} icon="🏁" />}
                    {data.organisateur && <DetailRow label="Organisateur" value={data.organisateur} icon="📍" />}
                    {data.note && <DetailRow label="Note" value={data.note} icon="📝" multiline />}
                  </>
                )}
              </div>
            </>
          ) : (
            // Mode EDIT
            <>
              {kind === 'personal_action' ? (
                <>
                  <Field label="Nom de l'action *">
                    <input type="text" value={paNom} onChange={e => setPaNom(e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Type *">
                    <select value={paType} onChange={e => setPaType(e.target.value)} style={inputStyle}>
                      {PERSONAL_ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Plateforme / Contact (optionnel)">
                    <input type="text" value={paPlateforme} onChange={e => setPaPlateforme(e.target.value)} style={inputStyle} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <Field label="Date *" noMargin>
                      <input type="date" value={paDate} onChange={e => setPaDate(e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Heure (optionnel)" noMargin>
                      <input type="time" value={paHeure} onChange={e => setPaHeure(e.target.value)} style={inputStyle} />
                    </Field>
                  </div>
                  <Field label="Offre liée (optionnel)">
                    <select value={paJobId} onChange={e => setPaJobId(e.target.value)} style={inputStyle}>
                      <option value="">— Aucune offre liée —</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ''}</option>)}
                    </select>
                  </Field>
                  <Field label="Statut">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {STATUTS.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setStatut(s.value)}
                          style={{
                            flex: 1, padding: '10px', border: '2px solid #111', borderRadius: 6,
                            background: statut === s.value ? s.color : '#fff',
                            color: statut === s.value ? '#fff' : '#111',
                            cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 12,
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Note (optionnel)">
                    <textarea value={paNote} onChange={e => setPaNote(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Nom de l'événement *">
                    <input type="text" value={evNom} onChange={e => setEvNom(e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Organisateur">
                    <input type="text" value={evOrganisateur} onChange={e => setEvOrganisateur(e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Catégorie">
                    <select value={evCategorie} onChange={e => setEvCategorie(e.target.value)} style={inputStyle}>
                      <option value="">-- Choisir une catégorie --</option>
                      {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <Field label="Date début *" noMargin>
                      <input type="datetime-local" value={evDateDebut} onChange={e => setEvDateDebut(e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Date fin" noMargin>
                      <input type="datetime-local" value={evDateFin} onChange={e => setEvDateFin(e.target.value)} style={inputStyle} />
                    </Field>
                  </div>
                  <Field label="Statut">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {STATUTS.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setStatut(s.value)}
                          style={{
                            flex: 1, padding: '10px', border: '2px solid #111', borderRadius: 6,
                            background: statut === s.value ? s.color : '#fff',
                            color: statut === s.value ? '#fff' : '#111',
                            cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 12,
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Note">
                    <textarea value={evNote} onChange={e => setEvNote(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  </Field>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 16, borderTop: '2px solid #111', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'view' ? (
            <>
              <button onClick={() => { setMode('edit'); setError(''); }} style={{
                background: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: '12px',
                fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0 #111', fontFamily: FONT,
              }}>
                ✏️ Modifier
              </button>
              <button onClick={() => setShowDelete(true)} style={{
                background: '#fff', color: '#E8151B', border: '2px solid #E8151B', borderRadius: 8, padding: '10px',
                fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
              }}>
                🗑️ Supprimer
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setMode('view'); setError(''); }} disabled={saving} style={{
                flex: 1, background: '#fff', border: '2px solid #111', borderRadius: 8, padding: '10px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>
                Annuler
              </button>
              <button onClick={kind === 'personal_action' ? savePersonalAction : saveEvent} disabled={saving} style={{
                flex: 1, background: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: '10px',
                fontSize: 13, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', boxShadow: '3px 3px 0 #111', fontFamily: FONT,
              }}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation suppression */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400, width: '100%', border: '2px solid #E8151B', boxShadow: '4px 4px 0 #E8151B', fontFamily: FONT }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#E8151B', margin: '0 0 8px', fontFamily: FONT }}>
                Supprimer {kind === 'personal_action' ? 'cette action' : 'cet événement'} ?
              </h3>
              <p style={{ fontSize: 13, color: '#555', margin: 0, fontFamily: FONT }}>
                <strong>{data.nom}</strong>
              </p>
              <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0', fontFamily: FONT }}>
                Cette action est <strong>irréversible</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDelete(false)} style={{
                flex: 1, background: '#F9F9F7', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
              }}>
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, background: '#E8151B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px',
                fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
              }}>
                {deleting ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children, noMargin = false }: { label: string; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 14 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: FONT }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailRow({ label, value, icon, multiline = false }: { label: string; value: string; icon?: string; multiline?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: FONT }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: 14, color: '#111', fontWeight: 600, fontFamily: FONT, lineHeight: multiline ? 1.5 : 1.3, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>
        {value}
      </div>
    </div>
  );
}
