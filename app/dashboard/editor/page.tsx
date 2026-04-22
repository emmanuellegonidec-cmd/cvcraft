'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CVFormData, defaultFormData } from '@/lib/types';
import { TemplateId, FontId, DEFAULT_CV_CONFIG, CV_TEMPLATES, CV_PALETTES, CV_FONTS } from '@/lib/cv-config';
import { pdf } from '@react-pdf/renderer';
import { CVPdf } from '@/lib/pdf-generator';

import { StepperNav } from './components/StepperNav';
import { Step2Import } from './components/Step2Import';
import { Step3Form } from './components/Step3Form';
import { Step4Generate } from './components/Step4Generate';
import { Step5Preview } from './components/Step5Preview';
import { Step6Save } from './components/Step6Save';

const FONT = 'Montserrat, sans-serif';

const DEMO_FORM: Partial<CVFormData> = {
  firstName: 'Jean', lastName: 'Doe',
  title: 'CEO — Jean find my Job',
  email: 'jean@jeanfindmyjob.fr',
  phone: '06 12 34 56 78',
  city: 'Paris',
  linkedin: 'linkedin.com/in/jeandoe',
  summary: 'Entrepreneur passionné par l\'emploi et la tech RH. Fondateur de Jean find my Job, plateforme de suivi de candidatures. 10 ans d\'expérience en Product Management dans des startups françaises à forte croissance.',
  experiences: [
    { id: '1', role: 'CEO & Fondateur', company: 'Jean find my Job', start: '2023', end: 'Présent', description: 'Conception et développement de la plateforme No-Code & IA\nAcquisition des 1 000 premiers utilisateurs en 3 mois\nLevée de fonds amorçage 500K€' },
    { id: '2', role: 'Head of Product', company: 'Jobteaser', start: '2019', end: '2023', description: 'Pilotage roadmap produit · équipe de 8 personnes · 2M utilisateurs\nLancement de 3 nouvelles fonctionnalités clés en 12 mois\nOKR produit alignés avec la stratégie commerciale' },
    { id: '3', role: 'Product Manager', company: 'Welcome to the Jungle', start: '2016', end: '2019', description: 'Refonte UX plateforme candidats · +40% taux de conversion\nGestion backlog Agile · sprints bimensuels' },
  ],
  education: [
    { id: '1', degree: 'MBA Entrepreneuriat', school: 'HEC Paris', year: '2019' },
    { id: '2', degree: 'Programmation', school: 'École 42', year: '2015' },
    { id: '3', degree: 'Master Marketing Digital', school: 'Sciences Po Paris', year: '2014' },
  ],
  skills: 'Product Management, IA & No-Code, Growth Hacking, Next.js, Leadership, Agile/Scrum, Data Analytics, UX Design',
  targetJob: '',
  lang: 'français',
  tone: 'professionnel',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  marginBottom: 5, color: '#111',
};

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  fontFamily: 'Montserrat, sans-serif', border: '2px solid #111',
  borderRadius: 6, background: '#fff', color: '#111',
  outline: 'none', boxSizing: 'border-box' as const,
};

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CVFormData>(defaultFormData);
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_CV_CONFIG.template);
  const [accentColor, setAccentColor] = useState(DEFAULT_CV_CONFIG.accentColor);
  const [font, setFont] = useState<FontId>(DEFAULT_CV_CONFIG.font);
  const [photo, setPhoto] = useState('');
  const [cvTitle, setCvTitle] = useState('');
  const [generatedCV, setGeneratedCV] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) (window as any).__jfmj_token = session.access_token;
      if (!user) { router.push('/auth/login'); return; }
      if (!cvId) return;
      const res = await fetch('/api/cvs', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const json = await res.json();
      const cv = (json.cvs || []).find((c: any) => c.id === cvId);
      if (!cv) return;
      setCvTitle(cv.title);
      setGeneratedCV(cv.content || '');
      const fd = cv.form_data || {};
      setForm({
        ...defaultFormData, ...fd,
        experiences: (fd.experiences || []).map((e: any) => ({ ...e, id: e.id || Math.random().toString(36).slice(2, 9) })),
        education: (fd.education || []).map((e: any) => ({ ...e, id: e.id || Math.random().toString(36).slice(2, 9) })),
      });
      if (fd.accentColor) setAccentColor(fd.accentColor);
      if (fd.font) setFont(fd.font as FontId);
      if (cv.template) setTemplate(cv.template as TemplateId);
      setStep(3);
    }
    load();
  }, [cvId, router]);

  async function downloadPdf() {
    const blob = await pdf(
      <CVPdf formData={form} template={template} accentColor={accentColor} font={font} photo={photo || undefined} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(cvTitle || 'Mon_CV').replace(/\s+/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function goTo(n: number) { setStep(n); }
  function next() { setStep(s => Math.min(s + 1, 6)); }

  const sideNavBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '9px 12px',
    border: 'none', borderLeft: '3px solid transparent', borderRadius: 0,
    background: 'transparent', color: '#888', fontFamily: FONT,
    fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .editor-page { font-family: 'Montserrat', sans-serif; display: flex; height: 100vh; overflow: hidden; }
        .editor-sidebar { width: 200px; min-width: 200px; background: #0f0f0f; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; border-right: 1px solid #1e1e1e; flex-shrink: 0; }
        .editor-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #F7F6F3; }
      `}</style>

      <div className="editor-page">

        {/* ── SIDEBAR ── */}
        <aside className="editor-sidebar">
          <div onClick={() => router.push('/')} style={{ padding: '18px 16px 16px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', fontFamily: FONT }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#F5C400', fontFamily: FONT }}>find my Job</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 8px', fontFamily: FONT }}>Recherche</div>
            {['Tableau de bord', 'Candidatures', 'Contacts', 'Entretiens', 'Événements', 'Statistiques'].map(label => (
              <button key={label} onClick={() => router.push('/dashboard')} style={sideNavBtn}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
                {label}
              </button>
            ))}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 8px', fontFamily: FONT }}>Outils</div>
            <button onClick={() => router.push('/dashboard/synthese')} style={sideNavBtn}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              Synthèse
            </button>
            <button onClick={() => router.push('/dashboard/editor')}
              style={{ ...sideNavBtn, borderLeft: '3px solid #E8151B', background: '#1c1c1c', color: '#fff', fontWeight: 700 }}>
              CV Creator
            </button>
            <button onClick={() => router.push('/dashboard/cv-creator')}
              style={{ ...sideNavBtn, paddingLeft: 24, fontSize: 13, color: '#666' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F5C400'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#666'; }}>
              Mes CV
            </button>
            <button onClick={() => router.push('/dashboard/help')} style={sideNavBtn}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              Help
            </button>
          </div>
          <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 10px 8px', flexShrink: 0 }}>
            <button onClick={() => router.push('/dashboard/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; (e.currentTarget as HTMLButtonElement).style.background = '#161616'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff', flexShrink: 0 }}>E</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', fontFamily: FONT }}>Mon profil</div>
            </button>
            <button onClick={() => router.push('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', marginTop: 2, border: 'none', borderRadius: 6, background: 'transparent', color: '#444', fontFamily: FONT, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#444'}>
              ⎋ Déconnexion
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="editor-main">

          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 54, flexShrink: 0, background: '#fff', borderBottom: '2px solid #111' }}>
            <input
              value={cvTitle}
              onChange={e => setCvTitle(e.target.value)}
              style={{ border: '2px solid #111', background: '#fff', fontSize: 14, fontWeight: 800, color: '#111', padding: '5px 14px', outline: 'none', width: 420, fontFamily: FONT, borderRadius: 6, boxShadow: '2px 2px 0 #111' }}
              placeholder="Titre de mon CV"
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {saveMsg && <span style={{ fontSize: 12, fontWeight: 700, color: saveMsg.startsWith('✅') ? '#1A7A4A' : '#E8151B', fontFamily: FONT }}>{saveMsg}</span>}
            </div>
          </header>

          {/* Corps */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden' }}>

            {/* Stepper */}
            <div style={{ borderRight: '2px solid #111', overflowY: 'auto', background: '#fff' }}>
              <StepperNav currentStep={step} onStepClick={goTo} />
            </div>

            {/* Panneau droit */}
            <div style={{ overflowY: 'auto', background: '#F7F6F3' }}>

              {/* ÉTAPE 1 */}
              {step === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', height: '100%' }}>
                  <div style={{ padding: '1.5rem', borderRight: '2px solid #111', overflowY: 'auto', background: '#fff' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 14 }}>
                      Choisis ton modèle
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {CV_TEMPLATES.map(t => {
                        const isSelected = template === t.id;
                        return (
                          <div key={t.id} onClick={() => setTemplate(t.id as TemplateId)}
                            style={{ border: `2px solid ${isSelected ? accentColor : '#111'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', boxShadow: isSelected ? `2px 2px 0 ${accentColor}` : '2px 2px 0 #111', transition: 'all .15s', transform: isSelected ? 'translate(-1px,-1px)' : 'none', background: isSelected ? '#FFFBF0' : '#fff' }}>
                            <div style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: '#111', fontFamily: FONT }}>{t.name}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, color: t.atsLevel === 'excellent' ? '#155724' : '#856404', background: t.atsLevel === 'excellent' ? '#D4EDDA' : '#FFF3CD', whiteSpace: 'nowrap' as const }}>
                                  {t.atsLevel === 'excellent' ? '✅ Excellent ATS' : '✔ Bon ATS'}
                                </div>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#333', fontFamily: FONT }}>{t.description}</div>
                              <div style={{ fontSize: 10, color: '#666', fontFamily: FONT, marginTop: 2 }}>{t.target}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT, color: '#111' }}>Couleur d'accent</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {CV_PALETTES.map(p => (
                          <div key={p.id} onClick={() => setAccentColor(p.accent)} title={p.name}
                            style={{ width: 26, height: 26, borderRadius: '50%', background: p.accent, cursor: 'pointer', border: accentColor === p.accent ? '3px solid #111' : '2px solid transparent', boxShadow: accentColor === p.accent ? '0 0 0 2px #fff inset' : 'none', transition: 'all .15s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#555', fontFamily: FONT, marginTop: 6, fontWeight: 600 }}>
                        {CV_PALETTES.find(p => p.accent === accentColor)?.name} — la couleur n'affecte pas les ATS
                      </div>
                    </div>
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111', marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT, color: '#111' }}>Police</div>
                      <select value={font} onChange={e => setFont(e.target.value as FontId)}
                        style={{ width: '100%', padding: '7px 9px', fontSize: 13, fontFamily: FONT, border: '2px solid #111', borderRadius: 6, background: '#fff', color: '#111', outline: 'none' }}>
                        {CV_FONTS.map(f => (
                          <option key={f.id} value={f.id}>{f.name} — {f.atsScore === 'excellent' ? '✅ Excellent ATS' : '✔ Bon ATS'}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={next}
                      style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', boxShadow: `3px 3px 0 ${accentColor}` }}>
                      Continuer →
                    </button>
                  </div>
                  <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#F7F6F3' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 14 }}>
                      Aperçu du template
                    </div>
                    <CVPreviewWrapper form={{ ...defaultFormData, ...DEMO_FORM }} photo="" template={template} accentColor={accentColor} font={font} />
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 */}
              {step === 2 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step2Import
                    form={form}
                    onFormChange={setForm}
                    onImportSuccess={data => setForm(prev => ({ ...prev, ...data }))}
                    onNext={next}
                    onSkip={next}
                  />
                </div>
              )}

              {/* ÉTAPE 3 */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* ── FORMULAIRE + APERÇU ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderRight: '2px solid #111', overflowY: 'auto' }}>
                      <Step3Form
                        form={form} photo={photo} template={template}
                        accentColor={accentColor} font={font}
                        onFormChange={setForm} onPhotoChange={setPhoto} onNext={next}
                      />
                    </div>
                    <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 12 }}>
                        Aperçu live
                      </div>
                      <CVPreviewWrapper form={form} photo={photo} template={template} accentColor={accentColor} font={font} />
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4 */}
              {step === 4 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step4Generate
                    form={form}
                    onGenerated={setGeneratedCV}
                    onFormUpdate={enriched => setForm(prev => ({ ...prev, ...enriched }))}
                    onNext={next}
                  />
                </div>
              )}

              {/* ÉTAPE 5 */}
              {step === 5 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step5Preview
                    form={form} photo={photo} template={template}
                    accentColor={accentColor} font={font}
                    cvTitle={cvTitle} onDownloadPdf={downloadPdf} onNext={next}
                  />
                </div>
              )}

              {/* ÉTAPE 6 */}
              {step === 6 && (
                <div style={{ padding: '1.5rem' }}>
                  <Step6Save
                    form={form} template={template} accentColor={accentColor}
                    font={font} generatedCV={generatedCV} cvTitle={cvTitle}
                    cvId={cvId || undefined} onDownloadPdf={downloadPdf} onTitleChange={setCvTitle}
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

function CVPreviewWrapper({ form, photo, template, accentColor, font }: any) {
  const { CVPreview } = require('./components/CVPreview');
  const { getFont } = require('@/lib/cv-config');
  const fontFamily = getFont(font).family;
  return (
    <CVPreview form={form} photo={photo} template={template} accentColor={accentColor} fontFamily={fontFamily} />
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