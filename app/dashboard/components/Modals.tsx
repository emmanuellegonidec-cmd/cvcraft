'use client';
import { Contact } from '@/lib/jobs';
import { Stage } from './types';

// ── CONTACT MODAL ─────────────────────────────────────────────────

type ContactModalProps = {
  newContact: Partial<Contact>;
  setNewContact: (fn: (prev: Partial<Contact>) => Partial<Contact>) => void;
  onSave: () => void;
  onClose: () => void;
};

export function ContactModal({ newContact, setNewContact, onSave, onClose }: ContactModalProps) {
  const fields = [
    { l: 'Nom complet *', k: 'name', p: 'Sophie Martin' },
    { l: 'Rôle', k: 'role', p: 'Talent Acquisition' },
    { l: 'Entreprise', k: 'company', p: 'BNP Paribas' },
    { l: 'Email', k: 'email', p: 's.martin@bnp.fr' },
    { l: 'Téléphone', k: 'phone', p: '+33 6 12 34 56 78' },
    { l: 'LinkedIn', k: 'linkedin', p: 'linkedin.com/in/...' },
  ];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Ajouter un contact</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
        {fields.map(f => (
          <div key={f.k} style={{ marginBottom: 12 }}>
            <label className="fl">{f.l}</label>
            <input className="fi" value={(newContact as any)[f.k] || ''} onChange={e => setNewContact(prev => ({ ...prev, [f.k]: e.target.value }))} placeholder={f.p} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
          <button className="btn-main" style={{ flex: 2, justifyContent: 'center' }} onClick={onSave} disabled={!newContact.name}>Ajouter le contact</button>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────

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

export function SettingsModal({
  stages, newStageName, setNewStageName,
  newStageColor, setNewStageColor,
  newStagePosition, setNewStagePosition,
  onAddStage, onDeleteStage, onClose,
}: SettingsModalProps) {
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
            <div>
              <label className="fl">Nom de l&apos;étape</label>
              <input className="fi" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Ex: Test technique" />
            </div>
            <div>
              <label className="fl">Couleur</label>
              <input type="color" value={newStageColor} onChange={e => setNewStageColor(e.target.value)} style={{ width: 44, height: 42, border: '2px solid #E0E0E0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
            </div>
            <div>
              <label className="fl">Position</label>
              <input type="number" className="fi" value={newStagePosition} onChange={e => setNewStagePosition(Number(e.target.value))} style={{ width: 60 }} min={1} max={98} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
            💡 La position détermine l&apos;ordre. Ex: 3.5 s&apos;insère entre la position 3 et 4.
          </div>
          <button className="btn-main" style={{ width: '100%', justifyContent: 'center' }} onClick={onAddStage} disabled={!newStageName.trim()}>
            + Ajouter cette étape
          </button>
        </div>
      </div>
    </div>
  );
}
