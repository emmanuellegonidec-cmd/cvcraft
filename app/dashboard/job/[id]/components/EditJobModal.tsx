'use client'

const FONT = "'Montserrat', sans-serif"

interface EditForm {
  title: string
  company: string
  location: string
  job_type: string
  salary_text: string
  description: string
  company_description: string
  company_website: string
  company_size: string
}

interface Props {
  editForm: EditForm
  onChange: (field: keyof EditForm, value: string) => void
  onSave: () => void
  onClose: () => void
}

export default function EditJobModal({ editForm, onChange, onSave, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0 20px' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 540, border: '2px solid #111', boxShadow: '4px 4px 0 #111', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>✏️ Modifier l&apos;offre</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ gridColumn: '1 / -1', marginBottom: 14 }}>
            <label className="fl">Intitulé du poste</label>
            <input className="fi" value={editForm.title} onChange={e => onChange('title', e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Entreprise</label>
            <input className="fi" value={editForm.company} onChange={e => onChange('company', e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Lieu</label>
            <input className="fi" value={editForm.location} onChange={e => onChange('location', e.target.value)} placeholder="Paris · Hybride" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Type de contrat</label>
            <select className="fi" value={editForm.job_type} onChange={e => onChange('job_type', e.target.value)}>
              {['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Salaire</label>
            <input className="fi" value={editForm.salary_text} onChange={e => onChange('salary_text', e.target.value)} placeholder="45-55k€ / an" />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: 14 }}>
            <label className="fl">Description du poste</label>
            <textarea className="fi" value={editForm.description} onChange={e => onChange('description', e.target.value)}
              rows={5} style={{ resize: 'vertical', minHeight: 120, marginBottom: 0 }} />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: 14 }}>
            <label className="fl">🏢 À propos de l&apos;entreprise</label>
            <textarea className="fi" value={editForm.company_description} onChange={e => onChange('company_description', e.target.value)}
              rows={3} style={{ resize: 'vertical', marginBottom: 0 }} placeholder="Secteur d'activité, valeurs, taille, histoire..." />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Site web entreprise</label>
            <input className="fi" value={editForm.company_website} onChange={e => onChange('company_website', e.target.value)} placeholder="https://www.entreprise.com" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">Taille entreprise</label>
            <input className="fi" value={editForm.company_size} onChange={e => onChange('company_size', e.target.value)} placeholder="Ex : 500-1000 salariés, ETI..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>
            Annuler
          </button>
          <button onClick={onSave}
            style={{ flex: 2, background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #E8151B' }}>
            Enregistrer →
          </button>
        </div>
      </div>
    </div>
  )
}
