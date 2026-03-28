'use client';
import { useState } from 'react';
import { JobStatus, JobType } from '@/lib/jobs';
import { NewJobState } from './types';
import { HeartRating } from './HeartComponents';
import { ContactOption, ContactPicker } from './JobModal';

type Props = {
  contacts: ContactOption[];
  setNewJob: (fn: (prev: NewJobState) => NewJobState) => void;
  onSave: () => void;
  onClose: () => void;
  onBack: () => void;
};

export default function SpontaneousMode({ contacts, setNewJob, onSave, onClose, onBack }: Props) {
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

  function resolveContact(contactId: string, freeText: string): string {
    if (contactId && contactId !== '__new__') {
      const c = contacts.find(c => c.id === contactId);
      if (c) return [c.name, c.role, c.company].filter(Boolean).join(' — ');
    }
    return freeText.trim();
  }

  function handleClose() {
    setSpontCompany(''); setSpontTitle(''); setSpontLocation('');
    setSpontWebsite(''); setSpontMotivation(''); setSpontNotes('');
    setSpontFavorite(0); setSpontError(null);
    setSpontContactId(''); setSpontContactFree('');
    onClose();
  }

  function handleSave() {
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

  return (
    <div>
      <button
        onClick={() => { onBack(); setSpontError(null); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>
        ← Retour
      </button>

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
          <input
            className="fi"
            value={spontCompany}
            onChange={e => { setSpontCompany(e.target.value); setSpontError(null); }}
            placeholder="Ex : L'Oréal, Decathlon, BNP Paribas..."
            style={{ fontSize: 15, fontWeight: 700, border: spontError ? '2px solid #E8151B' : '2px solid #111', boxShadow: '2px 2px 0 #111' }}
            autoFocus
          />
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
        <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleClose}>Annuler</button>
        <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave} disabled={!spontCompany.trim()}>
          Ajouter la candidature →
        </button>
      </div>
    </div>
  );
}
