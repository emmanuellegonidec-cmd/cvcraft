'use client';

import { CV_TEMPLATES, CV_PALETTES, CV_FONTS, TemplateId, FontId, getAtsLabel } from '@/lib/cv-config';

const FONT = 'Montserrat, sans-serif';

interface Props {
  template: TemplateId;
  accentColor: string;
  font: FontId;
  onTemplateChange: (t: TemplateId) => void;
  onColorChange: (c: string) => void;
  onFontChange: (f: FontId) => void;
  onNext: () => void;
}

export function Step1Templates({
  template, accentColor, font,
  onTemplateChange, onColorChange, onFontChange,
  onNext,
}: Props) {

  const inputStyle = {
    width: '100%', padding: '7px 9px', fontSize: 12,
    fontFamily: FONT, border: '2px solid #111',
    borderRadius: 6, background: '#fff', color: '#111',
    outline: 'none',
  };

  const sectionLabel = {
    fontSize: 9, fontWeight: 900, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT, color: '#111',
  };

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
        Choisis ton modèle
      </div>

      {/* ── GRILLE 6 TEMPLATES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {CV_TEMPLATES.map(t => {
          const isSelected = template === t.id;
          return (
            <div
              key={t.id}
              onClick={() => onTemplateChange(t.id)}
              style={{
                border: `2px solid ${isSelected ? accentColor : '#111'}`,
                borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                boxShadow: isSelected ? `3px 3px 0 ${accentColor}` : '3px 3px 0 #111',
                transition: 'all .15s',
                transform: isSelected ? 'translate(-1px,-1px)' : 'none',
              }}
            >
              {/* Aperçu miniature */}
              <div style={{
                height: 140, background: '#F7F6F3',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 36,
                borderBottom: '2px solid #111',
              }}>
                {t.preview}
              </div>

              {/* Infos template */}
              <div style={{ padding: '10px 12px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#111', fontFamily: FONT }}>
                    {t.name}
                  </div>
                  <div style={{
                    fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                    background: t.atsLevel === 'excellent' ? '#D4EDDA' : '#FFF3CD',
                    color: t.atsLevel === 'excellent' ? '#155724' : '#856404',
                    fontFamily: FONT,
                  }}>
                    {getAtsLabel(t.atsLevel)}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#666', fontFamily: FONT, marginBottom: 2 }}>
                  {t.description}
                </div>
                <div style={{ fontSize: 9, color: '#aaa', fontFamily: FONT }}>
                  {t.target}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── COULEUR D'ACCENT ── */}
      <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '14px', boxShadow: '2px 2px 0 #111', marginBottom: 14 }}>
        <div style={sectionLabel}>Couleur d'accent</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CV_PALETTES.map(p => (
            <div
              key={p.id}
              onClick={() => onColorChange(p.accent)}
              title={p.name}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: p.accent, cursor: 'pointer',
                border: accentColor === p.accent ? '3px solid #111' : '2px solid transparent',
                boxShadow: accentColor === p.accent ? '0 0 0 2px #fff inset' : 'none',
                transition: 'all .15s',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#888', fontFamily: FONT, marginTop: 8 }}>
          {CV_PALETTES.find(p => p.accent === accentColor)?.name || 'Personnalisée'}
          {' '}— la couleur n'affecte pas la lisibilité ATS
        </div>
      </div>

      {/* ── POLICE ── */}
      <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '14px', boxShadow: '2px 2px 0 #111', marginBottom: 24 }}>
        <div style={sectionLabel}>Police</div>
        <select
          value={font}
          onChange={e => onFontChange(e.target.value as FontId)}
          style={inputStyle}
        >
          {CV_FONTS.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.atsScore === 'excellent' ? '✅ Excellent ATS' : '✔ Bon ATS'}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: '#888', fontFamily: FONT, marginTop: 8 }}>
          Toutes les polices listées passent les ATS majeurs (Workday, Taleo, Greenhouse…)
        </div>
      </div>

      {/* ── BOUTON CONTINUER ── */}
      <button
        onClick={onNext}
        style={{
          padding: '12px 24px', background: '#111', color: '#fff',
          border: '2px solid #111', borderRadius: 8, fontSize: 13,
          fontWeight: 800, fontFamily: FONT, cursor: 'pointer',
          boxShadow: `3px 3px 0 ${accentColor}`,
        }}
      >
        Continuer →
      </button>
    </div>
  );
}