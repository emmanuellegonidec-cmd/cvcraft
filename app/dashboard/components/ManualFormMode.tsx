'use client';
import { JobStatus, JobType } from '@/lib/jobs';
import { Stage, NewJobState } from './types';
import { HeartRating } from './HeartComponents';
import { ContactOption, ContactPicker } from './JobModal';

const FIXED_SOURCES = [
  'LinkedIn', 'Indeed', 'Welcome to the Jungle', 'Apec', 'France Travail',
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

type CompanyExtras = {
  company_description?: string;
  company_website?: string;
  company_size?: string;
  recruitment_process?: string;
};

type Props = {
  editingJobId: string | null;
  newJob: NewJobState;
  setNewJob: (fn: (prev: NewJobState) => NewJobState) => void;
  stages: Stage[];
  contacts: ContactOption[];
  isFileImport: boolean;
  companyExtras: CompanyExtras;
  setCompanyExtras?: (fn: (prev: CompanyExtras) => CompanyExtras) => void;
  transmittedById: string;
  setTransmittedById: (v: string) => void;
  transmittedByFree: string;
  setTransmittedByFree: (v: string) => void;
  customSource: string;
  setCustomSource: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  onBack: () => void;
};

export default function ManualFormMode({
  editingJobId, newJob, setNewJob, stages, contacts,
  isFileImport, companyExtras, setCompanyExtras,
  transmittedById, setTransmittedById, transmittedByFree, setTransmittedByFree,
  customSource, setCustomSource,
  onSave, onClose, onBack,
}: Props) {

  const showTransmitted = showTransmittedByFor(newJob.source || '') || !!transmittedById || !!transmittedByFree;
  const showCustomSource = ['Autre', 'Chasseur de tête', 'Cabinet recrutement'].includes(newJob.source || '');

  function updateCompanyExtra(field: keyof CompanyExtras, value: string) {
    if (setCompanyExtras) {
      setCompanyExtras(prev => ({ ...prev, [field]: value }));
    }
  }

  return (
    <div>
      {!editingJobId && (
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 16, fontFamily: 'Montserrat,sans-serif' }}>
          ← Retour
        </button>
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
            <textarea className="fi" value={newJob.description} onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Missions, compétences requises..." rows={5} style={{ resize: 'vertical', minHeight: 120 }} />
          </div>

          {/* ── À propos de l'entreprise ── */}
          <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
            <label className="fl">🏢 À propos de l&apos;entreprise</label>
            <textarea className="fi"
              value={companyExtras.company_description || ''}
              onChange={e => updateCompanyExtra('company_description', e.target.value)}
              placeholder="Secteur d'activité, valeurs, taille, histoire de l'entreprise..."
              rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
            <label className="fl">🗂️ Processus de recrutement</label>
            <textarea className="fi"
              value={companyExtras.recruitment_process || ''}
              onChange={e => updateCompanyExtra('recruitment_process', e.target.value)}
              placeholder="Ex : 1 entretien RH, test technique, 1 entretien manager..."
              rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Site web entreprise</label>
            <input className="fi"
              value={companyExtras.company_website || ''}
              onChange={e => updateCompanyExtra('company_website', e.target.value)}
              placeholder="https://www.entreprise.com" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Taille entreprise</label>
            <input className="fi"
              value={companyExtras.company_size || ''}
              onChange={e => updateCompanyExtra('company_size', e.target.value)}
              placeholder="Ex : 500-1000 salariés, ETI, Grand groupe..." />
          </div>

          <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
            <label className="fl">Mes notes personnelles</label>
            <textarea className="fi" value={newJob.notes} onChange={e => setNewJob(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Mes impressions, points à vérifier..." rows={3} style={{ resize: 'vertical' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
        <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }}
          onClick={onSave} disabled={!newJob.title || !newJob.company}>
          {editingJobId ? 'Enregistrer' : "Ajouter l'offre"}
        </button>
      </div>
    </div>
  );
}
