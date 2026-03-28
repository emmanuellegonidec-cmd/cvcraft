'use client';
import { useState, useRef, useEffect } from 'react';
import { Job, JobStatus, JobType } from '@/lib/jobs';
import { Stage, NewJobState, EMPTY_JOB } from './types';
import { HeartRating } from './HeartComponents';

type ContactOption = { id: string; name: string; role?: string; company?: string };

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

const FIXED_SOURCES = [
  'LinkedIn', 'Indeed', 'Welcome to the Jungle', 'Apec', 'Pôle Emploi',
  'Site entreprise', 'Réseau', 'Chasseur de tête', 'Cabinet recrutement',
  'Cooptation', 'HelloWork', 'Autre',
];

const SOURCES_WITH_CONTACT = new Set([
  'réseau', 'reseau', 'chasseur de tête', 'chasseur de tete',
  'cabinet recrutement', 'cooptation', 'autre', 'site entreprise',
]);

function showTransmittedByFor(source: string) {
  return SOURCES_WITH_CONTACT.has((source || '').toLowerCase().trim());
}

function ContactPicker({ contacts, contactId, setContactId, freeText, setFreeText, placeholder }: {
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

export default function JobModal({
  editingJobId, newJob, setNewJob, stages,
  importUrl, setImportUrl, addJobMode, setAddJobMode,
  importError, setImportError, importLoading,
  onImport, onSave, onClose, onSetExtra,
}: Props) {

  const [spontCompany, setSpontCompany]         = useState('');
  const [spontTitle, setSpontTitle]             = useState('');
  const [spontLocation, setSpontLocation]       = useState('');
  const [spontWebsite, setSpontWebsite]         = useState('');
  const [spontMotivation, setSpontMotivation]   = useState('');
  const [spontNotes, setSpontNotes]             = useState('');
  const [spontFavorite, setSpontFavorite]       = useState(0);
  const [spontError, setSpontError]             = useState<string | null>(null);
  const [spontContactId, setSpontContactId]     = useState('');
  const [spontContactFree, setSpontContactFree] = useState('');

  const fileInputRef                            = useRef<HTMLInputElement>(null);
  const [fileAnalyzing, setFileAnalyzing]       = useState(false);
  const [fileError, setFileError]               = useState<string | null>(null);
  const [fileName, setFileName]                 = useState<string | null>(null);
  const [dragOver, setDragOver]                 = useState(false);

  const [transmittedById, setTransmittedById]   = useState('');
  const [transmittedByFree, setTransmittedByFree] = useState('');
  const [customSource, setCustomSource]         = useState('');

  // Infos entreprise extraites par l'IA (stockées séparément pour les passer à saveJob)
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite]     = useState('');
  const [companySize, setCompanySize]           = useState('');

  const [contacts, setContacts]                 = useState<ContactOption[]>([]);

  useEffect(() => {
    const token = (window as unknown as { __jfmj_token?: string }).__jfmj_token;
    fetch('/api/contacts', {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(r => r.json())
      .then(d => { if (d.contacts) setContacts(d.contacts); })
      .catch(() => {});
  }, []);

  function resolveContact(contactId: string, freeText: string): string {
    if (contactId && contactId !== '__new__') {
      const c = contacts.find(c => c.id === contactId);
      if (c) return [c.name, c.role, c.company].filter(Boolean).join(' — ');
    }
    return freeText.trim();
  }

  function resolveSource(): string {
    if (['Autre', 'Chasseur de tête', 'Cabinet recrutement'].includes(newJob.source || '')) {
      return customSource.trim() || newJob.source || '';
    }
    return newJob.source || '';
  }

  function handleSpontClose() {
    setSpontCompany(''); setSpontTitle(''); setSpontLocation('');
    setSpontWebsite(''); setSpontMotivation(''); setSpontNotes('');
    setSpontFavorite(0); setSpontError(null);
    setSpontContactId(''); setSpontContactFree('');
    onClose();
  }

  function handleSpontSave() {
    if (!spontCompany.trim()) { setSpontError("Le nom de l'entreprise est obligatoire."); return; }
    const contact = resolveContact(spontContactId, spontContactFree);
    const notesWithContact = [spontNotes.trim(), contact ? `Contact : ${contact}` : ''].filter(Boolean).join('\n');
    setNewJob(() => ({
      title: spontTitle.trim() || 'Candidature spontanée',
      company: spontCompany.trim(),
      location: spontLocation.trim(),
      job_type: 'CDI' as JobType,
      status: 'to_apply' as JobStatus,
      description: spontMotivation.trim(),
      notes: notesWithContact,
      url: spontWebsite.trim(),
      source: 'spontaneous',
      salary: '',
      favorite: spontFavorite,
    }));
    setTimeout(() => { onSave(); }, 50);
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

      // Stocker les infos entreprise dans les états locaux
      if (d.transmitted_by) setTransmittedByFree(d.transmitted_by);
      if (d.company_description) setCompanyDescription(d.company_description);
      if (d.company_website) setCompanyWebsite(d.company_website);
      if (d.company_size) setCompanySize(d.company_size);

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
        // Stocker les infos entreprise dans des champs étendus
        ...(d.company_description ? { company_description: d.company_description } : {}),
        ...(d.company_website     ? { company_website: d.company_website }         : {}),
        ...(d.company_size        ? { company_size: d.company_size }               : {}),
      } as any));
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

  function handleSave() {
    const transmitted = resolveContact(transmittedById, transmittedByFree);
    const resolvedSource = resolveSource();
    // Envoyer les infos entreprise via onSetExtra AVANT setNewJob (synchrone)
    if (onSetExtra && (companyDescription || companyWebsite || companySize)) {
      onSetExtra({
        ...(companyDescription ? { company_description: companyDescription } : {}),
        ...(companyWebsite     ? { company_website: companyWebsite }         : {}),
        ...(companySize        ? { company_size: companySize }               : {}),
      });
    }
    setNewJob(prev => ({
      ...prev,
      source: resolvedSource,
      notes: transmitted
        ? [prev.notes, `Transmis par : ${transmitted}`].filter(Boolean).join('\n')
        : prev.notes,
    }));
    setTimeout(() => { onSave(); }, 50);
  }

  // Détection import fichier : source vide ET (transmis par extrait OU description longue)
  const isFileImport = (!(newJob as any).source || (newJob as any).source === '') &&
    ((companyDescription !== '') || (transmittedByFree !== '') || ((newJob.description || '').length > 200));

  const showTransmitted = showTransmittedByFor(newJob.source || '') || !!transmittedById || !!transmittedByFree;
  const showCustomSource = ['Autre', 'Chasseur de tête', 'Cabinet recrutement'].includes(newJob.source || '');

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
            {editingJobId ? "Modifier l'offre"
              : addJobMode === 'spontaneous' ? '📨 Candidature spontanée'
              : addJobMode === 'file' ? '📄 Importer un fichier'
              : 'Ajouter une offre'}
          </h2>
          <button onClick={addJobMode === 'spontaneous' ? handleSpontClose : onClose}
            style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
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
          <div>
            <button onClick={() => { setAddJobMode(null); setFileError(null); setFileName(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>

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
        )}

        {/* ── Mode manuel ── */}
        {addJobMode === 'manual' && (
          <div>
            {!editingJobId && (
              <button onClick={() => setAddJobMode(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>
            )}

            {isFileImport && (
              <div style={{ background: '#F0FFF4', border: '2px solid #1A7A4A', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1A7A4A' }}>Offre analysée par IA</div>
                  <div style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>Vérifiez et complétez les champs avant de sauvegarder.</div>
                </div>
              </div>
            )}

            {/* Infos entreprise extraites — aperçu lecture seule */}
            {(companyDescription || companyWebsite || companySize) && (
              <div style={{ background: '#F5F0FF', border: '1.5px solid #7C3AED', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5B21B6', marginBottom: 8 }}>🏢 Infos entreprise extraites</div>
                {companyDescription && <p style={{ fontSize: 12, color: '#444', lineHeight: 1.5, margin: '0 0 6px', fontFamily: 'Montserrat,sans-serif' }}>{companyDescription.slice(0, 200)}{companyDescription.length > 200 ? '…' : ''}</p>}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {companySize && <span style={{ fontSize: 11, fontWeight: 700, color: '#5B21B6' }}>👥 {companySize}</span>}
                  {companyWebsite && <span style={{ fontSize: 11, fontWeight: 700, color: '#0A66C2' }}>🔗 {companyWebsite}</span>}
                </div>
              </div>
            )}

            <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coup de cœur ?</div>
              <HeartRating value={newJob.favorite} onChange={v => setNewJob(prev => ({ ...prev, favorite: v }))} />
            </div>

            <div style={{ maxHeight: '62vh', overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Type de contrat</label>
                  <select className="fi" value={newJob.job_type} onChange={e => setNewJob(prev => ({ ...prev, job_type: e.target.value as JobType }))}>
                    {['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Étape</label>
                  <select className="fi" value={newJob.status} onChange={e => setNewJob(prev => ({ ...prev, status: e.target.value as JobStatus }))}>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Intitulé du poste *</label>
                  <input className="fi" value={newJob.title} onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))} placeholder="Chief Marketing Officer H/F" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Entreprise *</label>
                  <input className="fi" value={newJob.company} onChange={e => setNewJob(prev => ({ ...prev, company: e.target.value }))} placeholder="Decathlon" />
                </div>

                <div style={{ marginBottom: showCustomSource ? 8 : 14 }}>
                  <label className="fl">Source</label>
                  <select className="fi" value={newJob.source} onChange={e => {
                    setNewJob(prev => ({ ...prev, source: e.target.value }));
                    setCustomSource('');
                  }}>
                    <option value="">Choisir...</option>
                    {FIXED_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {showCustomSource && (
                  <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                    <label className="fl" style={{ fontSize: 11, color: '#888' }}>
                      {newJob.source === 'Chasseur de tête' ? 'Nom du cabinet / chasseur (optionnel)'
                        : newJob.source === 'Cabinet recrutement' ? 'Nom du cabinet (optionnel)'
                        : 'Précisez (optionnel)'}
                    </label>
                    <input className="fi" value={customSource} onChange={e => setCustomSource(e.target.value)}
                      placeholder={
                        newJob.source === 'Chasseur de tête' ? 'Ex : Michael Page, Heidrick & Struggles...'
                        : newJob.source === 'Cabinet recrutement' ? 'Ex : Robert Half, Hays, Fed Finance...'
                        : 'Ex : Forum emploi, événement réseau...'
                      } />
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Lieu</label>
                  <input className="fi" value={newJob.location} onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))} placeholder="Paris · Hybride" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">Salaire</label>
                  <input className="fi" value={newJob.salary} onChange={e => setNewJob(prev => ({ ...prev, salary: e.target.value }))} placeholder="45-55k€ / an" />
                </div>

                {showTransmitted && (
                  <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                    <label className="fl">👤 Transmis par</label>
                    <ContactPicker
                      contacts={contacts}
                      contactId={transmittedById} setContactId={setTransmittedById}
                      freeText={transmittedByFree} setFreeText={setTransmittedByFree}
                      placeholder="Prénom Nom — personne qui vous a transmis cette offre"
                    />
                  </div>
                )}

                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Lien de l&apos;offre</label>
                  <input className="fi" value={newJob.url} onChange={e => setNewJob(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..." />
                </div>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Description du poste</label>
                  <textarea className="fi" value={newJob.description} onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))} placeholder="Missions, compétences requises..." rows={5} style={{ resize: 'vertical', minHeight: 120 }} />
                </div>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">Mes notes personnelles</label>
                  <textarea className="fi" value={newJob.notes} onChange={e => setNewJob(prev => ({ ...prev, notes: e.target.value }))} placeholder="Mes impressions, points à vérifier..." rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
              <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }}
                onClick={handleSave} disabled={!newJob.title || !newJob.company}>
                {editingJobId ? 'Enregistrer' : "Ajouter l'offre"}
              </button>
            </div>
          </div>
        )}

        {/* ── Mode candidature spontanée ── */}
        {addJobMode === 'spontaneous' && (
          <div>
            <button onClick={() => { setAddJobMode(null); setSpontError(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>← Retour</button>

            <div style={{ background: '#FFF8E0', border: '2px solid #F5C400', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📨</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Candidature spontanée</div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Aucune offre publiée — vous contactez l&apos;entreprise de votre propre initiative.</div>
              </div>
            </div>

            <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coup de cœur ?</div>
              <HeartRating value={spontFavorite} onChange={v => setSpontFavorite(v)} />
            </div>

            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ marginBottom: 16 }}>
                <label className="fl" style={{ fontSize: 13, fontWeight: 900 }}>🏢 Entreprise cible *</label>
                <input className="fi" value={spontCompany}
                  onChange={e => { setSpontCompany(e.target.value); setSpontError(null); }}
                  placeholder="Ex : L'Oréal, Decathlon, BNP Paribas..."
                  style={{ fontSize: 15, fontWeight: 700, border: spontError ? '2px solid #E8151B' : '2px solid #111', boxShadow: '2px 2px 0 #111' }}
                  autoFocus />
                {spontError && <div style={{ fontSize: 12, color: '#E8151B', marginTop: 4, fontWeight: 600 }}>{spontError}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label className="fl">💼 Poste visé</label>
                  <input className="fi" value={spontTitle} onChange={e => setSpontTitle(e.target.value)} placeholder="Ex : Directrice Marketing Digital" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">📍 Lieu</label>
                  <input className="fi" value={spontLocation} onChange={e => setSpontLocation(e.target.value)} placeholder="Paris · Hybride" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="fl">🔗 Site / LinkedIn entreprise</label>
                  <input className="fi" value={spontWebsite} onChange={e => setSpontWebsite(e.target.value)} placeholder="https://loreal.com" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">👤 Contact dans l&apos;entreprise</label>
                <ContactPicker
                  contacts={contacts}
                  contactId={spontContactId} setContactId={setSpontContactId}
                  freeText={spontContactFree} setFreeText={setSpontContactFree}
                  placeholder="Prénom Nom — DRH, manager, relation réseau..."
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">💡 Pourquoi cette entreprise ?</label>
                <textarea className="fi" value={spontMotivation} onChange={e => setSpontMotivation(e.target.value)}
                  placeholder="Leader dans son secteur, culture d'innovation..." rows={4} style={{ resize: 'vertical', minHeight: 100 }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="fl">📝 Notes personnelles</label>
                <textarea className="fi" value={spontNotes} onChange={e => setSpontNotes(e.target.value)}
                  placeholder="Prochaine étape, infos utiles..." rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSpontClose}>Annuler</button>
              <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSpontSave} disabled={!spontCompany.trim()}>
                Ajouter la candidature →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
