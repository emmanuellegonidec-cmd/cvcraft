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

const FONT = "var(--font-montserrat), 'Montserrat', sans-serif";

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

// Session 14 : structure minimale des recommandations ATS lues depuis l'offre
// (colonne `ats_result` de la table jobs, écrite par la route ats-from-extension).
interface AtsRecommendation { priorite?: number; impact?: string; action?: string; }
interface AtsResult {
  score_global?: number;
  recommandations?: AtsRecommendation[];
  erreurs?: { critiques?: string[]; majeures?: string[]; mineures?: string[] };
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get('id');
  // Session 14 : arrivée depuis "Optimiser ce CV pour cette offre".
  // job_id = l'offre visée (pour le poste + les recommandations ATS).
  // cv_ref = le CV source à pré-remplir automatiquement (format "upload:user_id/.../fichier.pdf").
  const jobId = searchParams.get('job_id');
  const cvRef = searchParams.get('cv_ref');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CVFormData>(defaultFormData);
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_CV_CONFIG.template);
  const [accentColor, setAccentColor] = useState(DEFAULT_CV_CONFIG.accentColor);
  const [font, setFont] = useState<FontId>(DEFAULT_CV_CONFIG.font);
  const [photo, setPhoto] = useState('');
  const [cvTitle, setCvTitle] = useState('');
  const [generatedCV, setGeneratedCV] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  // Session 14 : contexte "offre" (poste + recommandations ATS) affiché en bandeau.
  const [jobContext, setJobContext] = useState<{ title: string; ats: AtsResult | null } | null>(null);

  // Session 14 : pré-remplissage automatique depuis le CV source (cv_ref).
  // prefillStatus : null | 'loading' | 'done' | 'error' — pilote l'affichage du statut.
  const [prefillStatus, setPrefillStatus] = useState<null | 'loading' | 'done' | 'error'>(null);
  const [prefillError, setPrefillError] = useState('');
  // Évite de relancer l'extraction plusieurs fois (une seule tentative par session).
  const [prefillDone, setPrefillDone] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) (window as any).__jfmj_token = session.access_token;
      if (!user) { router.push('/auth/login'); return; }
      if (!cvId) return;
      try {
        // Appel direct au mode "single CV" de l'API : /api/cvs?id=xxx
        // renvoie { cv: { id, title, template, content, form_data, ... } }
        const res = await fetch(`/api/cvs?id=${encodeURIComponent(cvId)}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        // Parsing JSON défensif
        const rawText = await res.text();
        let json: any = null;
        if (rawText) {
          try { json = JSON.parse(rawText); } catch { json = null; }
        }
        if (!res.ok || !json?.cv) {
          setLoadError(json?.error || `Impossible de charger le CV (${res.status})`);
          return;
        }
        const cv = json.cv;
        setCvTitle(cv.title || '');
        setGeneratedCV(cv.content || '');
        const fd = cv.form_data || {};
        setForm({
          ...defaultFormData, ...fd,
          experiences: (fd.experiences || []).map((e: any) => ({ ...e, id: e.id || Math.random().toString(36).slice(2, 9) })),
          education: (fd.education || []).map((e: any) => ({ ...e, id: e.id || Math.random().toString(36).slice(2, 9) })),
        });
        if (fd.accentColor) setAccentColor(fd.accentColor);
        if (fd.font) setFont(fd.font as FontId);
        if (fd.photo) setPhoto(fd.photo);
        if (cv.template) setTemplate(cv.template as TemplateId);
        setStep(3);
      } catch (e: any) {
        console.error('Erreur chargement CV:', e);
        setLoadError(e?.message || 'Erreur inconnue');
      }
    }
    load();
  }, [cvId, router]);

  // ─── Session 14 : chargement du contexte offre (parcours "Optimiser ce CV") ───
  // Quand l'éditeur est ouvert avec ?job_id=..., on charge l'offre correspondante
  // pour : (1) pré-remplir le poste visé (targetJob = titre de l'offre),
  // (2) afficher les recommandations ATS déjà enregistrées sur l'offre (ats_result).
  // On ne relit PAS le PDF ici (ce sera l'étape "pré-remplissage auto" ultérieure).
  useEffect(() => {
    async function loadJobContext() {
      if (!jobId) return;
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || (window as any).__jfmj_token || '';
        const res = await fetch(`/api/jobs?id=${encodeURIComponent(jobId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const rawText = await res.text();
        let json: any = null;
        if (rawText) { try { json = JSON.parse(rawText); } catch { json = null; } }
        if (!res.ok || !json?.job) return; // silencieux : le CV Creator reste utilisable même si l'offre n'est pas trouvée

        const job = json.job;
        const ats: AtsResult | null = job.ats_result || null;

        setJobContext({ title: job.title || '', ats });

        // Pré-remplissage du poste visé (sans écraser une saisie éventuelle déjà présente)
        if (job.title) {
          setForm(prev => ({ ...prev, targetJob: prev.targetJob || job.title }));
        }
        // Pré-remplissage du titre du CV au nom du poste s'il est encore vide
        if (job.title) {
          setCvTitle(prev => prev || `CV — ${job.title}`);
        }
      } catch (e) {
        // silencieux : ne jamais bloquer l'éditeur à cause du contexte offre
        console.warn('Contexte offre non chargé:', e);
      }
    }
    loadJobContext();
  }, [jobId]);

  // ─── Session 14 : pré-remplissage automatique du formulaire depuis le CV source ───
  // Déclenché au passage de l'étape 1 → 2 quand on est arrivé avec ?cv_ref=...
  // Étapes : (1) télécharger le PDF depuis le storage (bucket job-documents),
  // (2) le convertir en base64, (3) l'envoyer à /api/extract-pdf (Claude Vision),
  // (4) pré-remplir le formulaire (même mapping que Step2Import), (5) aller à l'étape 3.
  // Ne bloque JAMAIS l'éditeur : en cas d'échec, on laisse la personne continuer à la main.
  async function runPrefillFromCvRef() {
    if (!cvRef || prefillDone) return;
    setPrefillDone(true);
    setPrefillStatus('loading');
    setPrefillError('');
    try {
      // Le cv_ref a la forme "upload:user_id/job_id/fichier.pdf".
      // Seuls les CV uploadés (PDF) sont lisibles ici ; un CV Creator (creator:) n'a pas de PDF.
      if (!cvRef.startsWith('upload:')) {
        throw new Error('Ce CV n\'est pas un PDF importé, pré-remplissage impossible.');
      }
      const filePath = cvRef.slice('upload:'.length);

      const supabase = createClient();
      const { data: fileData, error: dlError } = await supabase
        .storage
        .from('job-documents')
        .download(filePath);
      if (dlError || !fileData) {
        throw new Error('Impossible de récupérer le CV depuis le stockage.');
      }

      // Conversion Blob -> base64 (sans le préfixe "data:...;base64,").
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileData);
      });

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction impossible.');

      const d = json.data || {};
      const uid = () => Math.random().toString(36).slice(2, 9);
      // Même mapping que Step2Import : on régénère des id pour les listes.
      setForm(prev => ({
        ...prev,
        ...d,
        // On conserve le poste visé déjà pré-rempli depuis l'offre s'il existe.
        targetJob: prev.targetJob || d.targetJob || '',
        experiences: (d.experiences || []).map((e: any) => ({ ...e, id: uid() })),
        education: (d.education || []).map((e: any) => ({ ...e, id: uid() })),
      }));

      setPrefillStatus('done');
      setStep(3); // on saute l'écran d'import et on va directement vérifier les infos
    } catch (e: any) {
      setPrefillStatus('error');
      setPrefillError(e?.message || 'Pré-remplissage impossible.');
      // On amène quand même à l'étape 2 pour que la personne puisse importer/saisir à la main.
      setStep(2);
    }
  }

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

  // ─── Session 14 : bandeau "Recommandations pour cette offre" ───
  // Affiché en haut du panneau droit dès qu'on arrive via ?job_id=...
  // Reprend les recommandations priorisées + les erreurs critiques/majeures/mineures
  // déjà calculées et stockées sur l'offre (ats_result).
  function JobRecoBanner() {
    if (!jobContext) return null;
    const ats = jobContext.ats;
    const recos = ats?.recommandations || [];
    const critiques = ats?.erreurs?.critiques || [];
    const majeures = ats?.erreurs?.majeures || [];
    const mineures = ats?.erreurs?.mineures || [];

    const hasContent = recos.length > 0 || critiques.length > 0 || majeures.length > 0 || mineures.length > 0;

    const impactColor = (impact?: string) => {
      if (impact === 'critique') return { bg: '#FFEBEE', color: '#C62828' };
      if (impact === 'majeur') return { bg: '#FFF3CD', color: '#B8900A' };
      return { bg: '#E8F5E9', color: '#2E7D32' };
    };

    return (
      <div style={{
        background: '#fff', border: '2px solid #111', borderRadius: 10,
        padding: '16px 20px', marginBottom: 20, boxShadow: '3px 3px 0 #F5C400',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111', fontFamily: FONT }}>
            🎯 Recommandations pour cette offre
          </div>
          {jobContext.title && (
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', fontFamily: FONT }}>
              {jobContext.title}
              {typeof ats?.score_global === 'number' && (
                <span style={{ marginLeft: 10, background: '#111', color: '#F5C400', padding: '2px 8px', borderRadius: 6, fontWeight: 900 }}>
                  Score {ats.score_global}/100
                </span>
              )}
            </div>
          )}
        </div>

        {!hasContent && (
          <div style={{ fontSize: 13, color: '#888', fontFamily: FONT, fontWeight: 500 }}>
            Aucune recommandation enregistrée pour cette offre. Lance d&apos;abord une analyse ATS depuis l&apos;extension.
          </div>
        )}

        {recos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: (critiques.length || majeures.length || mineures.length) ? 14 : 0 }}>
            {recos
              .slice()
              .sort((a, b) => (a.priorite || 99) - (b.priorite || 99))
              .map((r, i) => {
                const c = impactColor(r.impact);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 5, background: c.bg, color: c.color, textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: FONT, flexShrink: 0, marginTop: 1 }}>
                      {r.impact || 'à faire'}
                    </span>
                    <span style={{ fontSize: 13, color: '#333', lineHeight: 1.5, fontFamily: FONT, fontWeight: 500 }}>
                      {r.action}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {(critiques.length > 0 || majeures.length > 0 || mineures.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Critiques', items: critiques, color: '#C62828' },
              { label: 'Majeures', items: majeures, color: '#B8900A' },
              { label: 'Mineures', items: mineures, color: '#2E7D32' },
            ].filter(g => g.items.length > 0).map((g, gi) => (
              <div key={gi}>
                <div style={{ fontSize: 11, fontWeight: 800, color: g.color, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT, marginBottom: 3 }}>
                  {g.label}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {g.items.map((it, ii) => (
                    <li key={ii} style={{ fontSize: 12.5, color: '#444', lineHeight: 1.5, fontFamily: FONT, fontWeight: 500, marginBottom: 2 }}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Session 14 : bouton "Continuer et pré-remplir" — réutilisé en haut (sous le
  // bandeau recommandations) ET en bas de l'étape 1, pour qu'il soit toujours visible.
  function PrefillButton() {
    return (
      <button onClick={cvRef ? runPrefillFromCvRef : next} disabled={prefillStatus === 'loading'}
        style={{ width: '100%', padding: '12px', background: prefillStatus === 'loading' ? '#888' : '#111', color: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, fontFamily: FONT, cursor: prefillStatus === 'loading' ? 'wait' : 'pointer', boxShadow: `3px 3px 0 ${accentColor}` }}>
        {prefillStatus === 'loading' ? 'Pré-remplissage en cours…' : (cvRef ? 'Continuer et pré-remplir mon CV →' : 'Continuer →')}
      </button>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .editor-page { font-family: var(--font-montserrat), 'Montserrat', sans-serif; display: flex; height: 100vh; overflow: hidden; }
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
              {loadError && <span style={{ fontSize: 12, fontWeight: 700, color: '#E8151B', fontFamily: FONT }}>⚠ {loadError}</span>}
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
                    {/* Session 14 : bandeau recommandations si on vient d'une offre */}
                    <JobRecoBanner />
                    {/* Session 14 : bouton d'action visible en HAUT quand on vient d'une offre
                        (évite de scroller jusqu'en bas pour lancer le pré-remplissage). */}
                    {cvRef && (
                      <div style={{ marginBottom: 16 }}>
                        <PrefillButton />
                      </div>
                    )}
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
                    {/* Session 14 : statut du pré-remplissage automatique (si arrivée avec cv_ref) */}
                    {prefillStatus === 'loading' && (
                      <div style={{ background: '#FFF3CD', border: '2px solid #111', borderRadius: 8, padding: '10px 14px', marginBottom: 12, boxShadow: '2px 2px 0 #111', fontSize: 13, color: '#111', fontFamily: FONT, fontWeight: 700 }}>
                        ⏳ L&apos;IA lit votre CV et pré-remplit vos informations…
                      </div>
                    )}
                    {prefillStatus === 'error' && (
                      <div style={{ background: '#F8D7DA', border: '2px solid #E8151B', borderRadius: 8, padding: '10px 14px', marginBottom: 12, boxShadow: '2px 2px 0 #E8151B', fontSize: 13, color: '#111', fontFamily: FONT, fontWeight: 600, lineHeight: 1.5 }}>
                        ⚠️ {prefillError} Vous pouvez importer ou saisir vos informations manuellement.
                      </div>
                    )}
                    <PrefillButton />
                  </div>
                  <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#F7F6F3' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 14 }}>
                      Aperçu du template
                    </div>
                    {/* Session 14 : avertissement — l'aperçu utilise un contenu de démonstration,
                        pas les vraies informations de l'utilisateur (celles-ci arrivent à l'étape suivante). */}
                    <div style={{ background: '#FFF3CD', border: '2px solid #111', borderRadius: 8, padding: '10px 14px', marginBottom: 14, boxShadow: '2px 2px 0 #111', fontSize: 12.5, color: '#111', fontFamily: FONT, fontWeight: 600, lineHeight: 1.5 }}>
                      ⚠️ <strong style={{ fontWeight: 800 }}>Contenu de démonstration</strong> — cet aperçu montre uniquement le style du modèle. Vos vraies informations seront ajoutées à l&apos;étape suivante.
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
      <div style={{ padding: '4rem', textAlign: 'center', color: '#111', fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontWeight: 700 }}>
        Chargement...
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
