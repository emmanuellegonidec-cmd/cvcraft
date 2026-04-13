'use client';

import { useState } from 'react';
import { CVFormData } from '@/lib/types';
import { TemplateId, FontId } from '@/lib/cv-config';
import { CVPreview } from './CVPreview';

const FONT = 'Montserrat, sans-serif';

interface Props {
  form: CVFormData;
  photo: string;
  template: TemplateId;
  accentColor: string;
  font: FontId;
  cvTitle: string;
  onDownloadPdf: () => void;
  onNext: () => void;
}

export function Step5Preview({
  form, photo, template, accentColor, font,
  cvTitle, onDownloadPdf, onNext,
}: Props) {
  const [copied, setCopied] = useState(false);

  function copyText() {
    const text = [
      `${form.firstName} ${form.lastName}`,
      form.title,
      [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join(' · '),
      '',
      form.summary,
      '',
      'EXPÉRIENCES',
      ...(form.experiences || []).flatMap(exp => [
        `${exp.role} — ${exp.company} (${exp.start}${exp.end ? ` – ${exp.end}` : ''})`,
        ...(exp.description || '').split('\n').filter(Boolean).map(l => `• ${l.replace(/^[-•]\s*/, '')}`),
      ]),
      '',
      'FORMATION',
      ...(form.education || []).map(edu => `${edu.degree} — ${edu.school} (${edu.year})`),
      '',
      'COMPÉTENCES',
      form.skills,
    ].filter(l => l !== undefined && l !== null).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ fontFamily: FONT }}>

      {/* ── EN-TÊTE ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT }}>
            Aperçu final
          </div>
          <div style={{ fontSize: 12, color: '#888', fontFamily: FONT, marginTop: 2 }}>
            {cvTitle}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={copyText}
            style={{ background: '#fff', color: '#111', fontSize: 13, fontWeight: 800, padding: '9px 18px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
            {copied ? '✓ Copié' : 'Copier le texte'}
          </button>
          <button onClick={onDownloadPdf}
            style={{ background: '#F5C400', color: '#111', fontSize: 13, fontWeight: 800, padding: '9px 18px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
            ↓ Télécharger PDF
          </button>
          <button onClick={onNext}
            style={{ background: '#111', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 18px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: `2px 2px 0 ${accentColor}` }}>
            Sauvegarder →
          </button>
        </div>
      </div>

      {/* ── INFO ATS ── */}
      <div style={{
        background: '#F0FFF4', border: '1px solid #2D6A4F',
        borderRadius: 8, padding: '11px 14px',
        fontSize: 13, color: '#2D6A4F', fontFamily: FONT,
        lineHeight: 1.6, marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>✅</span>
        <span><strong>CV optimisé pour les ATS</strong> — compétences en texte réel, structure linéaire, mots-clés du poste visé intégrés.</span>
      </div>

      {/* ── CONSEILS AVANT D'ENVOYER ── */}
      <div style={{
        marginBottom: 16, background: '#FAFAFA',
        border: '2px solid #111', borderRadius: 8,
        padding: '14px 18px', boxShadow: '2px 2px 0 #111',
      }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#111', fontFamily: FONT, marginBottom: 10 }}>
          💡 Conseils avant d'envoyer
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { icon: '📄', text: 'Envoie toujours le PDF — jamais le Word ni le texte copié-collé' },
            { icon: '📝', text: 'Vérifie que ton nom de fichier est professionnel : CV_Prenom_Nom.pdf' },
            { icon: '🎯', text: 'Adapte le poste visé pour chaque candidature et régénère si besoin' },
            { icon: '🔍', text: 'Relis une dernière fois les dates et l\'orthographe avant d\'envoyer' },
            { icon: '📧', text: 'Pour les portails en ligne, copie-colle le texte brut dans les champs formulaire' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#333', fontFamily: FONT, lineHeight: 1.5 }}>
              <span style={{ flexShrink: 0 }}>{tip.icon}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── APERÇU ── */}
      <CVPreview
        form={form}
        photo={photo}
        template={template}
        accentColor={accentColor}
        fontFamily={font}
      />

    </div>
  );
}