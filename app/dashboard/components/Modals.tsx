'use client';
import { useState, useEffect } from 'react';
import { Contact } from '@/lib/jobs';
import { Stage } from './types';

// ── Types internes ────────────────────────────────────────────────────────────

type NoteType = 'appel' | 'email' | 'rdv' | 'visio' | 'message' | 'linkedin' | 'autre';

interface ContactNote {
  id: string;
  contact_id: string;
  user_id: string;
  date: string;
  type: NoteType;
  contenu: string;
  created_at: string;
  isNew?: boolean;
  toDelete?: boolean;
}

interface Job {
  id: string;
  title: string;
  company: string | null;
}

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: 'appel',    label: 'Appel' },
  { value: 'visio',    label: 'Visio' },
  { value: 'email',    label: 'Email' },
  { value: 'rdv',      label: 'RDV' },
  { value: 'message',  label: 'Message' },
  { value: 'linkedin', label: 'Message LinkedIn' },
  { value: 'autre',    label: 'Autre' },
];

const NOTE_BADGE: Record<NoteType, { bg: string; color: string }> = {
  appel:    { bg: '#EBF0FD', color: '#1a56db' },
  visio:    { bg: '#E0F2FE', color: '#0369a1' },
  email:    { bg: '#FEF3C7', color: '#d97706' },
  rdv:      { bg: '#E6F5EE', color: '#0e7c4a' },
  message:  { bg: '#F3E8FF', color: '#7c3aed' },
  linkedin: { bg: '#E0F0FF', color: '#0a66c2' },
  autre:    { bg: '#F0EEEA', color: '#888' },
};

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── CONTACT MODAL ─────────────────────────────────────────────────────────────

type ContactModalProps = {
  isOpen: boolean;
  contact?: Partial<Contact> | null;
  userId: string | null;
  accessToken: string | null;
  onSave: () => void;
  onClose: () => void;
};

export function ContactModal({ isOpen, contact, userId, accessToken, onSave, onClose }: ContactModalProps) {

  const [name, setName]           = useState('');
  const [role, setRole]           = useState('');
  const [company, setCompany]     = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [linkedin, setLinkedin]   = useState('');
  const [jobId, setJobId]         = useState('');
  const [jobManual, setJobManual] = useState('');

  const [notes, setNotes]             = useState<ContactNote[]>([]);
  const [noteDate, setNoteDate]       = useState(today());
  const [noteType, setNoteType]       = useState<NoteType>('appel');
  const [noteContenu, setNoteContenu] = useState('');

  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchJobs();
    if (contact?.id) {
      setName(contact.name || '');
      setRole(contact.role || '');
      setCompany(contact.company || '');
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setLinkedin(contact.linkedin || '');
      setJobId((contact as any).job_id || '');
      setJobManual((contact as any).job_manual || '');
      fetchNotes(contact.id);
    } else {
      setName(''); setRole(''); setCompany(''); setEmail('');
      setPhone(''); setLinkedin(''); setJobId(''); setJobManual('');
      setNotes([]);
    }
  }, [isOpen, contact]);

  async function fetchJobs() {
    const res = await fetch('/api/jobs', { headers });
    const data = await res.json();
    if (data.jobs) setJobs(data.jobs);
  }

  async function fetchNotes(contactId: string) {
    const res = await fetch(`/api/contacts/notes?contact_id=${contactId}`, { headers });
    if (!res.ok) return;
    const data = await res.json();
    if (data.notes) setNotes(data.notes);
  }

  function ajouterNote() {
    if (!noteContenu.trim()) return;
    setNotes(prev => [{
      id: 'new-' + Date.now(),
      contact_id: contact?.id || '',
      user_id: userId || '',
      date: noteDate,
      type: noteType,
      contenu: noteContenu.trim(),
      created_at: new Date().toISOString(),
      isNew: true,
    }, ...prev]);
    setNoteContenu('');
    setNoteDate(today());
    setNoteType('appel');
  }

  function supprimerNote(noteId: string) {
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, toDelete: true } : n
    ));
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return; }
    if (!accessToken) { setError('Session expirée, recharge la page.'); return; }
    setLoading(true);
    setError(null);

    try {
      const contactData = {
        name:       name.trim(),
        role:       role.trim() || null,
        company:    company.trim() || null,
        email:      email.trim() || null,
        phone:      phone.trim() || null,
        linkedin:   linkedin.trim() || null,
        job_id:     jobId || null,
        job_manual: jobManual.trim() || null,
      };

      // 1. Sauvegarder le contact via API
      let contactId: string;
      if (contact?.id) {
        const res = await fetch('/api/contacts', {
          method: 'POST', headers,
          body: JSON.stringify({ id: contact.id, ...contactData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur mise à jour');
        contactId = data.contact.id;
      } else {
        const res = await fetch('/api/contacts', {
          method: 'POST', headers,
          body: JSON.stringify(contactData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur création');
        contactId = data.contact.id;
      }

      // 2. Sauvegarder les nouvelles notes via API
      const nouvelles = notes.filter(n => n.isNew && !n.toDelete);
      for (const n of nouvelles) {
        await fetch('/api/contacts/notes', {
          method: 'POST', headers,
          body: JSON.stringify({
            contact_id: contactId,
            date: n.date,
            type: n.type,
            contenu: n.contenu,
          }),
        });
      }

      // 3. Supprimer les notes marquées
      const aSupprimer = notes.filter(n => n.toDelete && !n.isNew);
      for (const n of aSupprimer) {
        await fetch(`/api/contacts/notes?id=${n.id}`, { method: 'DELETE', headers });
      }

      handleClose();
      onSave();
    } catch (err: any) {
      console.error(err);
      setError('Erreur : ' + (err.message || 'Réessaie.'));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName(''); setRole(''); setCompany(''); setEmail('');
    setPhone(''); setLinkedin(''); setJobId(''); setJobManual('');
    setNotes([]); setNoteDate(today()); setNoteType('appel'); setNoteContenu('');
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  const notesVisibles = notes.filter(n => !n.toDelete);

  return (
    <div className="modal-bg" onClick={handleClose}>
      <div className="modal" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>
            {contact?.id ? 'Modifier le contact' : 'Ajouter un contact'}
          </h2>
          <button onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div><label className="fl">Nom complet *</label><input className="fi" value={name} onChange={e => setName(e.target.value)} placeholder="Sophie Martin" /></div>
          <div><label className="fl">Rôle</label><input className="fi" value={role} onChange={e => setRole(e.target.value)} placeholder="Talent Acquisition" /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div><label className="fl">Entreprise</label><input className="fi" value={company} onChange={e => setCompany(e.target.value)} placeholder="BNP Paribas" /></div>
          <div><label className="fl">Email</label><input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="s.martin@bnp.fr" /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div><label className="fl">Téléphone</label><input className="fi" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" /></div>
          <div><label className="fl">LinkedIn</label><input className="fi" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/..." /></div>
        </div>

        <hr style={{ border: 'none', borderTop: '1.5px solid #F0EEEA', marginBottom: 16 }} />

        <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <label className="fl" style={{ marginBottom: 8 }}>Poste associé</label>
          <select className="fi" value={jobId} onChange={e => setJobId(e.target.value)} style={{ marginBottom: 8, background: '#fff' }}>
            <option value="">Sélectionner un poste existant…</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ''}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
            <span style={{ fontSize: 11, color: '#aaa' }}>ou saisir manuellement</span>
            <span style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
          </div>
          <input className="fi" value={jobManual} onChange={e => setJobManual(e.target.value)} placeholder="Ex : Responsable marketing — Canal+" style={{ background: '#fff' }} />
        </div>

        <hr style={{ border: 'none', borderTop: '1.5px solid #F0EEEA', marginBottom: 16 }} />

        <label className="fl" style={{ marginBottom: 10 }}>Notes</label>

        {notesVisibles.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {notesVisibles.map(note => (
              <div key={note.id} style={{ border: '1.5px solid #F0EEEA', borderRadius: 10, padding: '10px 12px', marginBottom: 8, position: 'relative' }}>
                <button onClick={() => supprimerNote(note.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 12, padding: '0 4px' }}>✕</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: NOTE_BADGE[note.type]?.bg, color: NOTE_BADGE[note.type]?.color }}>
                    {NOTE_TYPES.find(t => t.value === note.type)?.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{formatDate(note.date)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5, margin: 0, paddingRight: 20 }}>{note.contenu}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 8 }}>
            <input type="date" className="fi" value={noteDate} onChange={e => setNoteDate(e.target.value)} style={{ background: '#fff' }} />
            <select className="fi" value={noteType} onChange={e => setNoteType(e.target.value as NoteType)} style={{ background: '#fff' }}>
              {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <textarea className="fi" value={noteContenu} onChange={e => setNoteContenu(e.target.value)} placeholder="Contenu de la note…" rows={3} style={{ resize: 'none', background: '#fff', marginBottom: 8 }} />
          <button onClick={ajouterNote} disabled={!noteContenu.trim()} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1.5px dashed #E8B84B', background: 'transparent', color: '#C4931A', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: noteContenu.trim() ? 1 : 0.4 }}>
            + Ajouter cette note
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEE', border: '1.5px solid #fca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#E8151B', marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleClose}>Annuler</button>
          <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Enregistrement…' : contact?.id ? 'Mettre à jour' : 'Ajouter le contact'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────────────────

type SettingsModalProps = {
  stages: Stage[];
  newStageName: string;
  setNewStageName: (v: string) => void;
  newStageColor: string;
  setNewStageColor: (v: string) => void;
  newStagePosition: number;
  setNewStagePosition: (v: number) => void;
  onAddStage: () => void;
  onDeleteStage: (id: string) => void;
  onClose: () => void;
};

export function SettingsModal({ stages, newStageName, setNewStageName, newStageColor, setNewStageColor, newStagePosition, setNewStagePosition, onAddStage, onDeleteStage, onClose }: SettingsModalProps) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>⚙️ Paramètres du pipeline</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
        <label className="fl" style={{ marginBottom: 10 }}>Étapes actuelles</label>
        <div style={{ marginBottom: 20 }}>
          {stages.map(stage => (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{stage.label}</span>
              <span style={{ fontSize: 10, color: '#aaa' }}>pos. {stage.position}</span>
              {!stage.is_default ? (
                <button onClick={() => onDeleteStage(stage.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E8151B', fontSize: 14, padding: '0 4px' }}>✕</button>
              ) : (
                <span style={{ fontSize: 9, color: '#aaa', fontWeight: 700 }}>DÉFAUT</span>
              )}
            </div>
          ))}
        </div>
        <label className="fl" style={{ marginBottom: 10 }}>Ajouter une étape personnalisée</label>
        <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 10 }}>
            <div><label className="fl">Nom de l&apos;étape</label><input className="fi" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Ex: Test technique" /></div>
            <div><label className="fl">Couleur</label><input type="color" value={newStageColor} onChange={e => setNewStageColor(e.target.value)} style={{ width: 44, height: 42, border: '2px solid #E0E0E0', borderRadius: 8, cursor: 'pointer', padding: 2 }} /></div>
            <div><label className="fl">Position</label><input type="number" className="fi" value={newStagePosition} onChange={e => setNewStagePosition(Number(e.target.value))} style={{ width: 60 }} min={1} max={98} /></div>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>💡 La position détermine l&apos;ordre. Ex: 3.5 s&apos;insère entre la position 3 et 4.</div>
          <button className="btn-main" style={{ width: '100%', justifyContent: 'center' }} onClick={onAddStage} disabled={!newStageName.trim()}>+ Ajouter cette étape</button>
        </div>
      </div>
    </div>
  );
}
