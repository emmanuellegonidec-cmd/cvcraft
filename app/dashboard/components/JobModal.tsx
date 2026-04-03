'use client';
import { useState, useEffect } from 'react';
import { Job, JobStatus } from '@/lib/jobs';
import { Stage, NewJobState, EMPTY_JOB } from './types';
import SpontaneousMode from './SpontaneousMode';
import FileImportMode from './FileImportMode';
import ManualFormMode from './ManualFormMode';

// ─── Types partagés exportés ───
export type ContactOption = { id: string; name: string; role?: string; company?: string };

export function ContactPicker({ contacts, contactId, setContactId, freeText, setFreeText, placeholder }: {
  contacts: ContactOption[];
  contactId: string; setContactId: (v: string) => void;
  freeText: string; setFreeText: (v: string) => void;
  placeholder: string;
}) {
  const selected = contacts.find(c => c.id === contactId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <select className="fi" value={contactId} onChange={e => setContactId(e.target.value)} style={{ marginBottom: 0 }}>
        <option value="">— Choisir dans mes contacts —</option>
        {contacts.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}{c.role ? ` · ${c.role}` : ''}{c.company ? ` (${c.company})` : ''}
          </option>
        ))}
        <option value="__new__">✏️ Saisir un nouveau nom...</option>
      </select>
      {(contactId === '__new__' || (!contactId && freeText)) && (
        <input className="fi" value={freeText} onChange={e => setFreeText(e.target.value)}
          placeholder={placeholder} style={{ marginBottom: 0 }} />
      )}
      {selected && (
        <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, padding: '2px 4px' }}>
          👤 {selected.name}{selected.role ? ` · ${selected.role}` : ''}
          {selected.company ? ` (${selected.company})` : ''}
        </div>
      )}
    </div>
  );
}

// ─── Props ───
type Props = {
  editingJobId: string | null;
  newJob: NewJobState;
  setNewJob: (fn: (prev: NewJobState) => NewJobState) => void;
  stages: Stage[];
  importUrl: string;
  setImportUrl: (v: string) => void;
  addJobMode: null | 'url' | 'manual' | 'file' | 'spontaneous';
  setAddJobMode: (v: null | 'url' | 'manual' | 'file' | 'spontaneous') => void;
  importError: boolean;
  setImportError: (v: boolean) => void;
  importLoading: boolean;
  onImport: (url: string) => void;
  onSave: () => void;
  onClose: () => void;
  onSetExtra?: (data: Record<string, string>) => void;
};

export default function JobModal({
  editingJobId, newJob, setNewJob, stages,
  importUrl, setImportUrl, addJobMode, setAddJobMode,
  importError, setImportError, importLoading,
  onImport, onSave, onClose, onSetExtra,
}: Props) {

  const [contacts, setContacts]                   = useState<ContactOption[]>([]);
  const [transmittedById, setTransmittedById]     = useState('');
  const [transmittedByFree, setTransmittedByFree] = useState('');
  const [customSource, setCustomSource]           = useState('');
  const [companyExtras, setCompanyExtras]         = useState<{
    company_description?: string; company_website?: string; company_size?: string;
  }>({});

  useEffect(() => {
    const token = (window as unknown as { __jfmj_token?: string }).__jfmj_token;
    fetch('/api/contacts', {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(r => r.json())
      .then(d => { if (d.contacts) setContacts(d.contacts); })
      .catch(() => {});
  }, []);

  function resolveSource(): string {
    if (['Autre', 'Chasseur de tête', 'Cabinet recrutement'].includes(newJob.source || '')) {
      return customSource.trim() || newJob.source || '';
    }
    return newJob.source || '';
  }

  // ─── Crée un contact si nouveau nom saisi, retourne l'id ───
  async function resolveOrCreateContact(): Promise<string | null> {
    // Cas 1 : contact existant sélectionné dans le dropdown
    if (transmittedById && transmittedById !== '__new__') {
      return transmittedById;
    }

    // Cas 2 : nouveau nom saisi manuellement
    const freeText = transmittedByFree.trim();
    if (!freeText) return null;

    try {
      const token = (window as unknown as { __jfmj_token?: string }).__jfmj_token;

      // Parser "Prénom Nom — Rôle" si le format contient " — "
      const parts = freeText.split(' — ');
      const name = parts[0].trim();
      const role = parts[1]?.trim() || '';

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, role }),
      });
      const data = await res.json();
      if (data.contact?.id) {
        // Ajouter le nouveau contact à la liste locale
        setContacts(prev => [data.contact, ...prev]);
        return data.contact.id;
      }
    } catch {}
    return null;
  }

  async function handleSave() {
    const resolvedSource = resolveSource();

    if (onSetExtra && Object.keys(companyExtras).length) {
      onSetExtra(companyExtras as Record<string, string>);
    }

    // Créer ou récupérer le contact "Transmis par"
    const contactId = await resolveOrCreateContact();

    // Construire le label texte pour les notes (rétrocompatibilité)
    let transmittedLabel = '';
    if (contactId && contactId !== transmittedById) {
      // Contact fraîchement créé : utiliser le texte libre
      transmittedLabel = transmittedByFree.trim();
    } else if (transmittedById && transmittedById !== '__new__') {
      // Contact existant : construire le label depuis la liste
      const c = contacts.find(c => c.id === transmittedById);
      if (c) transmittedLabel = [c.name, c.role, c.company].filter(Boolean).join(' — ');
    } else {
      transmittedLabel = transmittedByFree.trim();
    }

    setNewJob(prev => ({
      ...prev,
      source: resolvedSource,
      // Stocker l'id du contact pour que saveJob() puisse l'enregistrer
      ...(contactId ? { transmitted_by_contact_id: contactId } as any : {}),
      notes: transmittedLabel
        ? [prev.notes, `Transmis par : ${transmittedLabel}`].filter(Boolean).join('\n')
        : prev.notes,
    }));

    setTimeout(() => { onSave(); }, 50);
  }

  const isFileImport = (!(newJob as any).source || (newJob as any).source === '') &&
    (Object.keys(companyExtras).length > 0 || (transmittedByFree !== '') || ((newJob.description || '').length > 200));

  const modalTitle = editingJobId ? "Modifier l'offre"
    : addJobMode === 'spontaneous' ? '📨 Candidature spontanée'
    : addJobMode === 'file' ? '📄 Importer un fichier'
    : 'Ajouter une offre';

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{modalTitle}</h2>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕
          </button>
        </div>

        {/* ── Écran de choix ── */}
        {!addJobMode && !editingJobId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { mode: 'url',         icon: '🔗', title: 'Importer depuis une URL',   sub: 'Importer automatiquement depuis un jobboard' },
              { mode: 'manual',      icon: '✏️', title: 'Remplir manuellement',      sub: 'Créer une offre à partir de zéro' },
              { mode: 'file',        icon: '📄', title: 'Importer un fichier',       sub: 'PDF, Word, image — analysé automatiquement par IA' },
              { mode: 'spontaneous', icon: '📨', title: 'Candidature spontanée',     sub: 'Contacter une entreprise sans offre publiée' },
            ].map(opt => (
              <button key={opt.mode}
                onClick={() => setAddJobMode(opt.mode as 'url' | 'manual' | 'file' | 'spontaneous')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1rem 1.25rem', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', textAlign: 'left', boxShadow: '2px 2px 0 #111', width: '100%' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-1px,-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0 #E8151B'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 0 #111'; }}>
                <span style={{ fontSize: 24 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 2 }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Mode URL ── */}
        {addJobMode === 'url' && !editingJobId && (
          <div>
            <button onClick={() => { setAddJobMode(null); setImportError(false); setImportUrl(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 12, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>
            <div style={{ marginBottom: 14 }}>
              <label className="fl">URL de l&apos;offre</label>
              <input className="fi" placeholder="https://www.linkedin.com/jobs/view/..." value={importUrl} onChange={e => setImportUrl(e.target.value)} />
            </div>
            {importError && (
              <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>Impossible d&apos;importer cette offre automatiquement.</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Vous pouvez la remplir manuellement.</div>
                <button className="btn-main" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => { setAddJobMode('manual'); setImportError(false); }}>→ Remplir manuellement</button>
              </div>
            )}
            {!importError && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAddJobMode(null)}>Annuler</button>
                <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={() => onImport(importUrl)} disabled={!importUrl || importLoading}>
                  {importLoading ? '⏳ Import en cours...' : "Importer l'offre →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Mode fichier ── */}
        {addJobMode === 'file' && (
          <FileImportMode
            contacts={contacts}
            setNewJob={setNewJob}
            setAddJobMode={setAddJobMode}
            onBack={() => setAddJobMode(null)}
            onSetCompanyExtras={extras => setCompanyExtras(extras)}
            onSetTransmittedByFree={v => setTransmittedByFree(v)}
          />
        )}

        {/* ── Mode manuel ── */}
        {addJobMode === 'manual' && (
          <ManualFormMode
            editingJobId={editingJobId}
            newJob={newJob}
            setNewJob={setNewJob}
            stages={stages}
            contacts={contacts}
            isFileImport={isFileImport}
            companyExtras={companyExtras}
            setCompanyExtras={fn => setCompanyExtras(fn)}
            transmittedById={transmittedById}
            setTransmittedById={setTransmittedById}
            transmittedByFree={transmittedByFree}
            setTransmittedByFree={setTransmittedByFree}
            customSource={customSource}
            setCustomSource={setCustomSource}
            onSave={handleSave}
            onClose={onClose}
            onBack={() => setAddJobMode(null)}
          />
        )}

        {/* ── Mode édition ── */}
        {editingJobId && !addJobMode && (
          <ManualFormMode
            editingJobId={editingJobId}
            newJob={newJob}
            setNewJob={setNewJob}
            stages={stages}
            contacts={contacts}
            isFileImport={false}
            companyExtras={companyExtras}
            setCompanyExtras={fn => setCompanyExtras(fn)}
            transmittedById={transmittedById}
            setTransmittedById={setTransmittedById}
            transmittedByFree={transmittedByFree}
            setTransmittedByFree={setTransmittedByFree}
            customSource={customSource}
            setCustomSource={setCustomSource}
            onSave={handleSave}
            onClose={onClose}
            onBack={() => {}}
          />
        )}

        {/* ── Mode spontané ── */}
        {addJobMode === 'spontaneous' && (
          <SpontaneousMode
            contacts={contacts}
            setNewJob={setNewJob}
            onSave={onSave}
            onClose={onClose}
            onBack={() => setAddJobMode(null)}
          />
        )}

      </div>
    </div>
  );
}
