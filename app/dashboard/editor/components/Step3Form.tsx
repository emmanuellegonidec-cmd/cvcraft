'use client';

import { useRef } from 'react';
import { CVFormData, Experience, Education } from '@/lib/types';
import { TemplateId, FontId } from '@/lib/cv-config';

const FONT = 'Montserrat, sans-serif';
function uid() { return Math.random().toString(36).slice(2, 9); }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 9px', fontSize: 12,
  fontFamily: FONT, border: '2px solid #111',
  borderRadius: 6, background: '#fff', color: '#111',
  outline: 'none', boxSizing: 'border-box',
};

const sectionStyle: React.CSSProperties = {
  background: '#FAFAFA', border: '2px solid #111',
  borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111',
  marginBottom: 10,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 10,
  fontFamily: FONT, color: '#111',
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: 9, fontWeight: 700,
  fontFamily: FONT, textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: 3, color: '#111',
};

const row2Style: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: 8, marginBottom: 8,
};

interface Props {
  form: CVFormData;
  photo: string;
  template: TemplateId;
  accentColor: string;
  font: FontId;
  onFormChange: (form: CVFormData) => void;
  onPhotoChange: (photo: string) => void;
  onNext: () => void;
}

export function Step3Form({
  form, photo, template, accentColor, font,
  onFormChange, onPhotoChange, onNext,
}: Props) {
  const photoRef = useRef<HTMLInputElement>(null);

  function setField(field: keyof CVFormData, value: string) {
    onFormChange({ ...form, [field]: value });
  }

  function addExp() {
    onFormChange({
      ...form,
      experiences: [...(form.experiences || []), {
        id: uid(), role: '', company: '', start: '', end: '', description: '',
      }],
    });
  }

  function updateExp(id: string, field: keyof Experience, val: string) {
    onFormChange({
      ...form,
      experiences: (form.experiences || []).map(e =>
        e.id === id ? { ...e, [field]: val } : e
      ),
    });
  }

  function removeExp(id: string) {
    onFormChange({
      ...form,
      experiences: (form.experiences || []).filter(e => e.id !== id),
    });
  }

  function addEdu() {
    onFormChange({
      ...form,
      education: [...(form.education || []), {
        id: uid(), degree: '', school: '', year: '',
      }],
    });
  }

  function updateEdu(id: string, field: keyof Education, val: string) {
    onFormChange({
      ...form,
      education: (form.education || []).map(e =>
        e.id === id ? { ...e, [field]: val } : e
      ),
    });
  }

  function removeEdu(id: string) {
    onFormChange({
      ...form,
      education: (form.education || []).filter(e => e.id !== id),
    });
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
        Vérifie tes informations
      </div>

      {/* ── INFORMATIONS PERSONNELLES ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Informations personnelles</div>
        <div style={row2Style}>
          <div>
            <label style={fieldLabelStyle}>Prénom</label>
            <input style={inputStyle} value={form.firstName || ''} onChange={e => setField('firstName', e.target.value)} placeholder="Jean" />
          </div>
          <div>
            <label style={fieldLabelStyle}>Nom</label>
            <input style={inputStyle} value={form.lastName || ''} onChange={e => setField('lastName', e.target.value)} placeholder="Dupont" />
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={fieldLabelStyle}>Titre actuel</label>
          <input style={inputStyle} value={form.title || ''} onChange={e => setField('title', e.target.value)} placeholder="Directrice Marketing" />
        </div>
        <div style={row2Style}>
          <div>
            <label style={fieldLabelStyle}>Email</label>
            <input style={inputStyle} value={form.email || ''} onChange={e => setField('email', e.target.value)} placeholder="jean@email.com" />
          </div>
          <div>
            <label style={fieldLabelStyle}>Téléphone</label>
            <input style={inputStyle} value={form.phone || ''} onChange={e => setField('phone', e.target.value)} placeholder="06 ..." />
          </div>
        </div>
        <div style={row2Style}>
          <div>
            <label style={fieldLabelStyle}>Ville</label>
            <input style={inputStyle} value={form.city || ''} onChange={e => setField('city', e.target.value)} placeholder="Paris" />
          </div>
          <div>
            <label style={fieldLabelStyle}>LinkedIn</label>
            <input style={inputStyle} value={form.linkedin || ''} onChange={e => setField('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
          </div>
        </div>

        {/* Photo */}
        <div>
          <label style={fieldLabelStyle}>Photo (optionnel)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {photo
              ? <img src={photo} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }} />
              : <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '2px solid #111', background: accentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0, fontFamily: FONT,
                }}>
                  {(form.firstName?.[0] || '') + (form.lastName?.[0] || '') || '?'}
                </div>
            }
            <button
              onClick={() => photoRef.current?.click()}
              style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT, padding: '5px 10px', border: '2px solid #111', borderRadius: 6, background: '#F7F6F3', cursor: 'pointer', boxShadow: '2px 2px 0 #111' }}
            >
              {photo ? 'Changer' : 'Ajouter une photo'}
            </button>
            {photo && (
              <button
                onClick={() => onPhotoChange('')}
                style={{ fontSize: 11, fontWeight: 700, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
              >
                ✕
              </button>
            )}
            <input
              ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = ev => onPhotoChange(ev.target?.result as string);
                reader.readAsDataURL(f);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── RÉSUMÉ ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Résumé / Profil</div>
        <textarea
          style={{ ...inputStyle, resize: 'vertical' }}
          value={form.summary || ''}
          onChange={e => setField('summary', e.target.value)}
          rows={3}
          placeholder="5 ans d'expérience en..."
        />
      </div>

      {/* ── EXPÉRIENCES ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Expériences</div>
        {(form.experiences || []).map(exp => (
          <div key={exp.id} style={{ borderTop: '2px solid #eee', paddingTop: 10, marginTop: 10 }}>
            <button
              onClick={() => removeExp(exp.id)}
              style={{ float: 'right', fontSize: 10, fontWeight: 800, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
            >
              ✕ Supprimer
            </button>
            <div style={row2Style}>
              <div>
                <label style={fieldLabelStyle}>Poste</label>
                <input style={inputStyle} value={exp.role} onChange={e => updateExp(exp.id, 'role', e.target.value)} placeholder="Directrice Marketing" />
              </div>
              <div>
                <label style={fieldLabelStyle}>Entreprise</label>
                <input style={inputStyle} value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} placeholder="Acme" />
              </div>
            </div>
            <div style={row2Style}>
              <div>
                <label style={fieldLabelStyle}>Début</label>
                <input style={inputStyle} value={exp.start} onChange={e => updateExp(exp.id, 'start', e.target.value)} placeholder="Jan 2022" />
              </div>
              <div>
                <label style={fieldLabelStyle}>Fin</label>
                <input style={inputStyle} value={exp.end} onChange={e => updateExp(exp.id, 'end', e.target.value)} placeholder="Présent" />
              </div>
            </div>
            <div>
              <label style={fieldLabelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical' }}
                value={exp.description}
                onChange={e => updateExp(exp.id, 'description', e.target.value)}
                rows={2}
                placeholder="Missions et réalisations..."
              />
            </div>
          </div>
        ))}
        <button
          onClick={addExp}
          style={{ fontSize: 12, fontWeight: 800, color: '#111', background: '#F5C400', border: '2px solid #111', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', marginTop: 8, fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}
        >
          + Ajouter une expérience
        </button>
      </div>

      {/* ── FORMATION ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Formation</div>
        {(form.education || []).map(edu => (
          <div key={edu.id} style={{ borderTop: '2px solid #eee', paddingTop: 8, marginTop: 8 }}>
            <button
              onClick={() => removeEdu(edu.id)}
              style={{ float: 'right', fontSize: 10, fontWeight: 800, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
            >
              ✕
            </button>
            <div style={row2Style}>
              <div>
                <label style={fieldLabelStyle}>Diplôme</label>
                <input style={inputStyle} value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="Master" />
              </div>
              <div>
                <label style={fieldLabelStyle}>École</label>
                <input style={inputStyle} value={edu.school} onChange={e => updateEdu(edu.id, 'school', e.target.value)} placeholder="HEC Paris" />
              </div>
            </div>
            <div>
              <label style={fieldLabelStyle}>Année</label>
              <input style={{ ...inputStyle, width: '50%' }} value={edu.year} onChange={e => updateEdu(edu.id, 'year', e.target.value)} placeholder="2022" />
            </div>
          </div>
        ))}
        <button
          onClick={addEdu}
          style={{ fontSize: 12, fontWeight: 800, color: '#111', background: '#F5C400', border: '2px solid #111', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', marginTop: 8, fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}
        >
          + Ajouter une formation
        </button>
      </div>

      {/* ── COMPÉTENCES ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Compétences</div>
        <input
          style={inputStyle}
          value={form.skills || ''}
          onChange={e => setField('skills', e.target.value)}
          placeholder="React, Python, Management, Excel..."
        />
        <div style={{ fontSize: 9, color: '#888', fontFamily: FONT, marginTop: 6 }}>
          Séparées par des virgules — texte brut pour une compatibilité ATS optimale
        </div>
      </div>

      {/* ── POSTE VISÉ ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Poste visé (optimise le CV)</div>
        <input
          style={inputStyle}
          value={form.targetJob || ''}
          onChange={e => setField('targetJob', e.target.value)}
          placeholder="Directrice Marketing dans une scale-up"
        />
      </div>

      {/* ── LANGUE + TON ── */}
      <div style={{ ...sectionStyle, ...{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } }}>
        <div>
          <label style={fieldLabelStyle}>Langue du CV</label>
          <select style={inputStyle} value={form.lang || 'français'} onChange={e => setField('lang', e.target.value)}>
            <option value="français">Français</option>
            <option value="anglais">Anglais</option>
            <option value="espagnol">Espagnol</option>
            <option value="allemand">Allemand</option>
          </select>
        </div>
        <div>
          <label style={fieldLabelStyle}>Ton</label>
          <select style={inputStyle} value={form.tone || 'professionnel'} onChange={e => setField('tone', e.target.value)}>
            <option value="professionnel">Professionnel</option>
            <option value="moderne et dynamique">Dynamique</option>
            <option value="académique">Académique</option>
            <option value="créatif">Créatif</option>
          </select>
        </div>
      </div>

      {/* ── BOUTON CONTINUER ── */}
      <button
        onClick={onNext}
        style={{
          width: '100%', marginTop: 8, padding: '12px',
          background: '#111', color: '#fff',
          border: '2px solid #111', borderRadius: 8,
          fontSize: 13, fontWeight: 800, fontFamily: FONT,
          cursor: 'pointer', boxShadow: `3px 3px 0 ${accentColor}`,
        }}
      >
        Continuer →
      </button>
    </div>
  );
}