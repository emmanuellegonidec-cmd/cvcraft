'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CVFormData, defaultFormData } from '@/lib/types';
import { TemplateId, FontId, DEFAULT_CV_CONFIG } from '@/lib/cv-config';
import { pdf } from '@react-pdf/renderer';
import { CVPdf } from '@/lib/pdf-generator';

import { StepperNav } from './components/StepperNav';
import { Step1Templates } from './components/Step1Templates';
import { Step2Import } from './components/Step2Import';
import { Step3Form } from './components/Step3Form';
import { Step4Generate } from './components/Step4Generate';
import { Step5Preview } from './components/Step5Preview';
import { Step6Save } from './components/Step6Save';

const FONT = 'Montserrat, sans-serif';

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get('id');

  // ── ÉTAT GLOBAL ────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CVFormData>(defaultFormData);
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_CV_CONFIG.template);
  const [accentColor, setAccentColor] = useState(DEFAULT_CV_CONFIG.accentColor);
  const [font, setFont] = useState<FontId>(DEFAULT_CV_CONFIG.font);
  const [photo, setPhoto] = useState('');
  const [cvTitle, setCvTitle] = useState('Mon CV');
  const [generatedCV, setGeneratedCV] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ── CHARGEMENT CV EXISTANT ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  (window as any).__jfmj_token = session.access_token;
}
      if (!user) { router.push('/auth/login'); return; }
      if (!cvId) return;

      const res = await fetch('/api/cvs');
      const json = await res.json();
      const cv = (json.cvs || []).find((c: any) => c.id === cvId);
      if (!cv) return;

      setCvTitle(cv.title);
      setGeneratedCV(cv.content || '');

      const fd = cv.form_data || {};
      setForm({
        ...defaultFormData, ...fd,
        experiences: (fd.experiences || []).map((e: any) => ({
          ...e, id: e.id || Math.random().toString(36).slice(2, 9),
        })),
        education: (fd.education || []).map((e: any) => ({
          ...e, id: e.id || Math.random().toString(36).slice(2, 9),
        })),
      });

      if (fd.accentColor) setAccentColor(fd.accentColor);
      if (fd.font) setFont(fd.font as FontId);
      if (cv.template) setTemplate(cv.template as TemplateId);
      setStep(3);
    }
    load();
  }, [cvId, router]);

  // ── TÉLÉCHARGEMENT PDF ─────────────────────────────────────────────
  async function downloadPdf() {
    const blob = await pdf(
      <CVPdf
        formData={form}
        template={template}
        accentColor={accentColor}
        font={font}
        photo={photo || undefined}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cvTitle.replace(/\s+/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── NAVIGATION ÉTAPES ──────────────────────────────────────────────
  function goTo(n: number) { setStep(n); }
  function next() { setStep(s => Math.min(s + 1, 6)); }

  // ── LAYOUT ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .editor-page { font-family: 'Montserrat', sans-serif; display: flex; height: 100vh; overflow: hidden; }
        .editor-sidebar { width: 180px; min-width: 180px; background: #0f0f0f; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; border-right: 1px solid #1e1e1e; flex-shrink: 0; }
        .editor-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #F7F6F3; }
      `}</style>

      <div className="editor-page">

        {/* ── SIDEBAR NAV ── */}
        <aside className="editor-sidebar">
          <div
            onClick={() => router.push('/')}
            style={{ padding: '16px 14px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: FONT }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#F5C400', fontFamily: FONT }}>find my Job</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {['Tableau de bord', 'Candidatures', 'Contacts', 'Entretiens', 'Événements', 'Statistiques'].map(label => (
              <button
                key={label}
                onClick={() => router.push('/dashboard')}
                style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', border: 'none', borderLeft: '3px solid transparent', borderRadius: 0, background: 'transparent', color: '#888', fontFamily: FONT, fontWeight: 500, fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
              >
                {label}
              </button>
            ))}

            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '14px 8px 6px', fontFamily: FONT }}>
              Outils
            </div>

            <button
              onClick={() => router.push('/dashboard/synthese')}
              style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', border: 'none', borderLeft: '3px solid transparent', borderRadius: 0, background: 'transparent', color: '#888', fontFamily: FONT, fontWeight: 500, fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
            >
              Synthèse
            </button>

            <button
              style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', border: 'none', borderLeft: '3px solid #E8151B', borderRadius: 0, background: '#1c1c1c', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              CV Creator
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 8px' }}>
            <button
              onClick={() => router.push('/dashboard/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>E</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: FONT }}>Mon profil</div>
            </button>
            <button
              onClick={() => router.push('/')}
              style={{ width: '100%', padding: '6px 10px', marginTop: 2, border: 'none', background: 'transparent', color: '#444', fontFamily: FONT, fontWeight: 600, fontSize: 11, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#444'}
            >
              ⎋ Déconnexion
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="editor-main">

          {/* Header */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1.5rem', height: 54, flexShrink: 0,
            background: '#fff', borderBottom: '2px solid #111',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontSize: 12, fontWeight: 700, fontFamily: FONT, padding: 0 }}
              >
                ← Tableau de bord
              </button>
              <span style={{ color: '#ddd' }}>|</span>
              <input
                value={cvTitle}
                onChange={e => setCvTitle(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: 14, fontWeight: 800, color: '#111', padding: '4px 0', outline: 'none', width: 220, fontFamily: FONT }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {saveMsg && (
                <span style={{ fontSize: 12, fontWeight: 700, color: saveMsg.startsWith('✅') ? '#1A7A4A' : '#E8151B', fontFamily: FONT }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </header>

          {/* Corps — stepper + panneau */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', overflow: 'hidden' }}>

            {/* Stepper gauche */}
            <div style={{ borderRight: '2px solid #111', overflowY: 'auto', background: '#fff' }}>
              <StepperNav currentStep={step} onStepClick={goTo} />
            </div>

            {/* Panneau droit */}
            <div style={{ overflowY: 'auto', background: '#F7F6F3' }}>

              {/* Étape 1 + aperçu sur 2 colonnes */}
              {step === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, height: '100%' }}>
                  <div style={{ padding: '1.5rem', borderRight: '2px solid #111', overflowY: 'auto' }}>
                    <Step1Templates
                      template={template}
                      accentColor={accentColor}
                      font={font}
                      onTemplateChange={t => { setTemplate(t); }}
                      onColorChange={setAccentColor}
                      onFontChange={setFont}
                      onNext={next}
                    />
                  </div>
                  <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#fff' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 12 }}>
                      Aperçu du template
                    </div>
                    <div style={{ background: '#F7F6F3', border: '2px solid #111', borderRadius: 10, padding: '1.5rem', boxShadow: '3px 3px 0 #111', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', color: '#888', fontSize: 13, fontFamily: FONT, lineHeight: 2 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>
                          {['classic','modern','minimal','elegant','creative','executive'].includes(template) ? '◼' : '◼'}
                        </div>
                        Template <strong style={{ color: '#111', textTransform: 'capitalize' }}>{template}</strong><br />
                        Couleur <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: accentColor, border: '1px solid #111', verticalAlign: 'middle', marginLeft: 4 }} /><br />
                        Police <strong style={{ color: '#111' }}>{font}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 2 */}
              {step === 2 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step2Import
                    onImportSuccess={data => setForm(prev => ({ ...prev, ...data }))}
                    onNext={next}
                    onSkip={next}
                  />
                </div>
              )}

              {/* Étape 3 — formulaire + aperçu live */}
              {step === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, height: '100%' }}>
                  <div style={{ padding: '1.5rem', borderRight: '2px solid #111', overflowY: 'auto' }}>
                    <Step3Form
                      form={form}
                      photo={photo}
                      template={template}
                      accentColor={accentColor}
                      font={font}
                      onFormChange={setForm}
                      onPhotoChange={setPhoto}
                      onNext={next}
                    />
                  </div>
                  <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 12 }}>
                      Aperçu live
                    </div>
                    {/* Import dynamique CVPreview pour éviter les erreurs SSR */}
                    <CVPreviewWrapper form={form} photo={photo} template={template} accentColor={accentColor} font={font} />
                  </div>
                </div>
              )}

              {/* Étape 4 */}
              {step === 4 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step4Generate
                    form={form}
                    onGenerated={setGeneratedCV}
                    onNext={next}
                  />
                </div>
              )}

              {/* Étape 5 */}
              {step === 5 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step5Preview
                    form={form}
                    photo={photo}
                    template={template}
                    accentColor={accentColor}
                    font={font}
                    cvTitle={cvTitle}
                    onDownloadPdf={downloadPdf}
                    onNext={next}
                  />
                </div>
              )}

              {/* Étape 6 */}
              {step === 6 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step6Save
                    form={form}
                    template={template}
                    accentColor={accentColor}
                    font={font}
                    generatedCV={generatedCV}
                    cvTitle={cvTitle}
                    cvId={cvId || undefined}
                    onDownloadPdf={downloadPdf}
                    onTitleChange={setCvTitle}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Wrapper pour CVPreview (évite les erreurs d'import circulaire)
function CVPreviewWrapper({ form, photo, template, accentColor, font }: any) {
  const { CVPreview } = require('./components/CVPreview');
  return (
    <CVPreview
      form={form}
      photo={photo}
      template={template}
      accentColor={accentColor}
      font={font}
    />
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '4rem', textAlign: 'center', color: '#111', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
        Chargement...
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}