'use client';
import { useRef, useState } from 'react';
import { JobType, JobStatus } from '@/lib/jobs';
import { NewJobState } from './types';
import { ContactOption, ContactPicker } from './JobModal';

type Props = {
  contacts: ContactOption[];
  setNewJob: (fn: (prev: NewJobState) => NewJobState) => void;
  setAddJobMode: (v: null | 'url' | 'manual' | 'file' | 'spontaneous') => void;
  onBack: () => void;
  // Remonte les infos entreprise vers JobModal pour saveJob
  onSetCompanyExtras: (data: { company_description?: string; company_website?: string; company_size?: string }) => void;
  // Remonte "transmis par" vers JobModal (utilisé en mode manuel ensuite)
  onSetTransmittedByFree: (v: string) => void;
};

export default function FileImportMode({
  contacts, setNewJob, setAddJobMode, onBack,
  onSetCompanyExtras, onSetTransmittedByFree,
}: Props) {
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const [fileAnalyzing, setFileAnalyzing] = useState(false);
  const [fileError, setFileError]         = useState<string | null>(null);
  const [fileName, setFileName]           = useState<string | null>(null);
  const [dragOver, setDragOver]           = useState(false);
  const [transmittedById, setTransmittedById]     = useState('');
  const [transmittedByFree, setTransmittedByFree] = useState('');

  function resolveContact(contactId: string, freeText: string): string {
    if (contactId && contactId !== '__new__') {
      const c = contacts.find(c => c.id === contactId);
      if (c) return [c.name, c.role, c.company].filter(Boolean).join(' — ');
    }
    return freeText.trim();
  }

  async function processFile(file: File) {
    setFileError(null); setFileAnalyzing(true); setFileName(file.name);
    const token = (window as unknown as { __jfmj_token?: string }).__jfmj_token;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/jobs/import-file', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setFileError(data.error || "Impossible d'analyser ce fichier."); return; }
      const d = data.data;

      // Remonter les infos entreprise vers JobModal
      const extras: { company_description?: string; company_website?: string; company_size?: string } = {};
      if (d.company_description) extras.company_description = d.company_description;
      if (d.company_website)     extras.company_website     = d.company_website;
      if (d.company_size)        extras.company_size        = d.company_size;
      if (Object.keys(extras).length) onSetCompanyExtras(extras);

      // Remonter "transmis par" extrait par l'IA
      if (d.transmitted_by) {
        setTransmittedByFree(d.transmitted_by);
        onSetTransmittedByFree(d.transmitted_by);
      }
      // Propager le contact sélectionné manuellement
      const contactLabel = resolveContact(transmittedById, transmittedByFree);
      if (contactLabel) onSetTransmittedByFree(contactLabel);

      const descParts = [d.description, d.requirements].filter(Boolean);
      const description = descParts.length > 1
        ? `${descParts[0]}\n\n--- Profil requis ---\n\n${descParts[1]}`
        : descParts[0] || '';

      setNewJob(() => ({
        title: d.title || '', company: d.company || '', location: d.location || '',
        job_type: (d.job_type as JobType) || 'CDI', status: 'to_apply' as JobStatus,
        description, notes: '', salary: d.salary_text || '',
        source: '',
        url: d.company_website || '', favorite: 0,
      }));
      setAddJobMode('manual');
    } catch { setFileError("Erreur réseau. Vérifiez votre connexion."); }
    finally { setFileAnalyzing(false); }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div>
      <button
        onClick={() => { onBack(); setFileError(null); setFileName(null); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>
        ← Retour
      </button>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !fileAnalyzing && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#E8151B' : '#CCC'}`,
          borderRadius: 12, padding: '36px 20px', textAlign: 'center',
          cursor: fileAnalyzing ? 'not-allowed' : 'pointer',
          background: dragOver ? '#FFF5F5' : '#FAFAFA',
          transition: 'all 0.15s', marginBottom: 16,
        }}
      >
        {fileAnalyzing ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 4 }}>Analyse en cours…</div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{fileName && `"${fileName}"`} — Claude lit votre offre</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 6 }}>Déposez votre fichier ici</div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 14 }}>ou cliquez pour sélectionner</div>
            <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {['PDF', 'Word .docx', 'Image JPG/PNG'].map(fmt => (
                <span key={fmt} style={{ background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: 6, padding: '3px 10px', color: '#555' }}>{fmt}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt" style={{ display: 'none' }} onChange={handleFileChange} />

      {!fileAnalyzing && !fileError && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">👤 Transmis par (optionnel)</label>
            <ContactPicker
              contacts={contacts}
              contactId={transmittedById} setContactId={setTransmittedById}
              freeText={transmittedByFree} setFreeText={setTransmittedByFree}
              placeholder="Prénom Nom — personne qui vous a envoyé ce document"
            />
          </div>
          <div style={{ fontSize: 12, color: '#888', textAlign: 'center', fontWeight: 500 }}>
            L&apos;IA analysera votre document et pré-remplira la fiche offre.<br />
            Vous pourrez vérifier et compléter avant de sauvegarder.
          </div>
        </>
      )}

      {fileError && (
        <div style={{ background: '#FEF2F2', border: '2px solid #E8151B', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#E8151B', marginBottom: 4 }}>Erreur d&apos;analyse</div>
          <div style={{ fontSize: 12, color: '#555' }}>{fileError}</div>
          <button className="btn-ghost" style={{ marginTop: 10, fontSize: 12 }} onClick={() => { setFileError(null); setFileName(null); }}>← Réessayer</button>
        </div>
      )}
    </div>
  );
}
