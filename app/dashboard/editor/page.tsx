'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CVFormData, defaultFormData, Experience, Education } from '@/lib/types';
import { TEMPLATES, TemplateId } from '@/lib/templates';
import { pdf } from "@react-pdf/renderer";
import { CVPdf } from "@/lib/pdf-generator";

const FONT = 'Montserrat, sans-serif';
function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── COMPOSANTS PREVIEW HTML ──────────────────────────────────────────

function Initials({ firstName, lastName, bg, size = 48 }: { firstName: string; lastName: string; bg: string; size?: number }) {
  const txt = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: size * 0.35, color: '#fff', flexShrink: 0, fontFamily: FONT }}>
      {txt || '?'}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1.5px solid #111', paddingBottom: 3, marginBottom: 8, marginTop: 14, fontFamily: FONT }}>{children}</div>;
}
function ModernSectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1B4F72', borderBottom: '1.5px solid #1B4F72', paddingBottom: 3, marginBottom: 8, marginTop: 14, fontFamily: FONT }}>{children}</div>;
}
function MinimalSectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 900, color: '#E8151B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 14, fontFamily: FONT }}>{children}</div>;
}
function LeftSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginTop: 12 }}><div style={{ fontSize: 9, fontWeight: 900, color: '#F5C400', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, fontFamily: FONT }}>{title}</div>{children}</div>;
}
function ExpBlock({ exp, accentColor, modern, minimal }: { exp: any; accentColor: string; modern?: boolean; minimal?: boolean }) {
  const lines = (exp.description || '').split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-•]\s*/, '').replace(/\*\*/g, ''));
  return (
    <div style={{ display: 'flex', gap: modern ? 8 : 0, marginBottom: 10 }}>
      {modern && <div style={{ width: 3, background: accentColor, borderRadius: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 12, fontFamily: FONT }}>{minimal ? `${exp.role} · ${exp.company}` : exp.role}</div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: FONT }}>{exp.start}{exp.end ? ` – ${exp.end}` : ''}</div>
        </div>
        {!minimal && <div style={{ fontSize: 11, color: modern ? '#1B4F72' : '#555', marginBottom: 3, fontFamily: FONT }}>{exp.company}</div>}
        {lines.map((line: string, j: number) => <div key={j} style={{ fontSize: 11, marginLeft: 8, marginBottom: 2, lineHeight: 1.5, color: '#333', fontFamily: FONT }}>• {line}</div>)}
      </div>
    </div>
  );
}

function ClassicPreview({ form, photo }: { form: CVFormData; photo: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily: FONT, fontSize: 13 }}>
      <div style={{ background: '#111', padding: '16px 20px', marginBottom: 14, borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {photo ? <img src={photo} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8151B' }} /> : <Initials firstName={form.firstName} lastName={form.lastName} bg="#E8151B" size={56} />}
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 3, fontFamily: FONT }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6, fontFamily: FONT }}>{form.title}</div>
            <div style={{ height: 2, width: 50, background: '#F5C400', marginBottom: 5 }} />
            <div style={{ fontSize: 11, color: '#ccc', fontFamily: FONT }}>{contact}</div>
          </div>
        </div>
      </div>
      {form.summary && <><SectionTitle>Profil professionnel</SectionTitle><p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 10px', fontFamily: FONT }}>{form.summary}</p></>}
      {form.experiences?.length > 0 && <><SectionTitle>Expériences</SectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor="#F5C400" />)}</>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {form.education?.length > 0 && <div><SectionTitle>Formation</SectionTitle>{form.education.map((edu, i) => <div key={i} style={{ marginBottom: 6 }}><div style={{ fontWeight: 700, fontSize: 12, fontFamily: FONT }}>{edu.degree}</div><div style={{ fontSize: 11, color: '#555', fontFamily: FONT }}>{edu.school}</div><div style={{ fontSize: 11, color: '#888', fontFamily: FONT }}>{edu.year}</div></div>)}</div>}
        {form.skills && <div><SectionTitle>Compétences</SectionTitle><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{form.skills.split(',').map((sk, i) => <span key={i} style={{ background: '#111', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 12, fontFamily: FONT }}>{sk.trim()}</span>)}</div></div>}
      </div>
    </div>
  );
}

function ModernPreview({ form, photo }: { form: CVFormData; photo: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', fontFamily: FONT, fontSize: 13, minHeight: 500 }}>
      <div style={{ background: '#1B4F72', padding: '20px 14px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          {photo ? <img src={photo} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} /> : <Initials firstName={form.firstName} lastName={form.lastName} bg="#2980B9" size={64} />}
        </div>
        <div style={{ fontWeight: 900, fontSize: 13, textAlign: 'center', marginBottom: 3, fontFamily: FONT }}>{form.firstName} {form.lastName}</div>
        <div style={{ fontSize: 10, color: '#9bc', textAlign: 'center', marginBottom: 8, fontFamily: FONT }}>{form.title}</div>
        <div style={{ height: 1.5, background: '#F5C400', marginBottom: 12 }} />
        <LeftSection title="Contact">
          {[form.email, form.phone, form.city, form.linkedin].filter(Boolean).map((v, i) => <div key={i} style={{ fontSize: 10, color: '#ccc', marginBottom: 3, fontFamily: FONT }}>{v}</div>)}
        </LeftSection>
        {form.skills && <LeftSection title="Compétences">{form.skills.split(',').map((sk, i) => <div key={i} style={{ background: '#2980B9', fontSize: 10, padding: '2px 6px', borderRadius: 3, marginBottom: 3, color: '#fff', fontFamily: FONT }}>{sk.trim()}</div>)}</LeftSection>}
        {form.education?.length > 0 && <LeftSection title="Formation">{form.education.map((edu, i) => <div key={i} style={{ marginBottom: 6 }}><div style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT }}>{edu.degree}</div><div style={{ fontSize: 9, color: '#9bc', fontFamily: FONT }}>{edu.school}</div><div style={{ fontSize: 9, color: '#F5C400', fontFamily: FONT }}>{edu.year}</div></div>)}</LeftSection>}
      </div>
      <div style={{ padding: '20px 18px' }}>
        {form.summary && <><ModernSectionTitle>Profil professionnel</ModernSectionTitle><p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 10px', color: '#333', fontFamily: FONT }}>{form.summary}</p></>}
        {form.experiences?.length > 0 && <><ModernSectionTitle>Expériences</ModernSectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor="#F5C400" modern />)}</>}
      </div>
    </div>
  );
}

function MinimalPreview({ form, photo }: { form: CVFormData; photo: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily: FONT, fontSize: 13 }}>
      <div style={{ height: 3, background: '#E8151B', marginBottom: 16, borderRadius: 2 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
        {photo ? <img src={photo} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} /> : <Initials firstName={form.firstName} lastName={form.lastName} bg="#E8151B" size={60} />}
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 2, fontFamily: FONT }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize: 12, color: '#E8151B', marginBottom: 3, fontFamily: FONT }}>{form.title}</div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: FONT }}>{contact}</div>
        </div>
      </div>
      <div style={{ height: 0.5, background: '#ddd', margin: '10px 0' }} />
      {form.summary && <p style={{ fontSize: 12, lineHeight: 1.7, color: '#333', margin: '0 0 10px', fontFamily: FONT }}>{form.summary}</p>}
      {form.experiences?.length > 0 && <><MinimalSectionTitle>— Expériences</MinimalSectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor="#E8151B" minimal />)}</>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {form.education?.length > 0 && <div><MinimalSectionTitle>— Formation</MinimalSectionTitle>{form.education.map((edu, i) => <div key={i} style={{ marginBottom: 6 }}><div style={{ fontWeight: 700, fontSize: 12, fontFamily: FONT }}>{edu.degree}</div><div style={{ fontSize: 11, color: '#555', fontFamily: FONT }}>{edu.school}</div><div style={{ fontSize: 11, color: '#E8151B', fontFamily: FONT }}>{edu.year}</div></div>)}</div>}
        {form.skills && <div><MinimalSectionTitle>— Compétences</MinimalSectionTitle><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{form.skills.split(',').map((sk, i) => <span key={i} style={{ background: '#111', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 12, fontFamily: FONT }}>{sk.trim()}</span>)}</div></div>}
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CVFormData>(defaultFormData);
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [cvTitle, setCvTitle] = useState('Mon CV');
  const [generatedCV, setGeneratedCV] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: string; msg: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      if (!cvId) return;
      const res = await fetch('/api/cvs');
      const json = await res.json();
      const cv = (json.cvs || []).find((c: any) => c.id === cvId);
      if (cv) {
        setCvTitle(cv.title);
        setTemplate(cv.template);
        setGeneratedCV(cv.content);
        const fd = cv.form_data;
        setForm({ ...fd, experiences: (fd.experiences || []).map((e: any) => ({ ...e, id: e.id || uid() })), education: (fd.education || []).map((e: any) => ({ ...e, id: e.id || uid() })) });
        setStep(3);
      }
    }
    load();
  }, [cvId, router]);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { setImportStatus({ type: 'error', msg: 'Sélectionne un fichier PDF.' }); return; }
    setImportStatus({ type: 'loading', msg: 'Lecture du PDF...' });
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((s: any) => s.str).join(' ') + '\n';
      }
      setImportStatus({ type: 'loading', msg: 'Claude analyse ton profil...' });
      const res = await fetch('/api/extract-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const d = json.data;
      setForm({ ...form, ...d, experiences: (d.experiences || []).map((e: any) => ({ ...e, id: uid() })), education: (d.education || []).map((e: any) => ({ ...e, id: uid() })) });
      if (d.firstName || d.lastName) setCvTitle(`CV — ${d.firstName} ${d.lastName}`.trim());
      setImportStatus({ type: 'success', msg: 'Profil importé !' });
      setTimeout(() => { setImportStatus(null); setStep(3); }, 1500);
    } catch (e: any) { setImportStatus({ type: 'error', msg: e.message }); }
  }

  function setField(field: keyof CVFormData, value: string) { setForm({ ...form, [field]: value }); }
  function addExp() { setForm({ ...form, experiences: [...form.experiences, { id: uid(), role: '', company: '', start: '', end: '', description: '' }] }); }
  function updateExp(id: string, field: keyof Experience, val: string) { setForm({ ...form, experiences: form.experiences.map(e => e.id === id ? { ...e, [field]: val } : e) }); }
  function removeExp(id: string) { setForm({ ...form, experiences: form.experiences.filter(e => e.id !== id) }); }
  function addEdu() { setForm({ ...form, education: [...form.education, { id: uid(), degree: '', school: '', year: '' }] }); }
  function updateEdu(id: string, field: keyof Education, val: string) { setForm({ ...form, education: form.education.map(e => e.id === id ? { ...e, [field]: val } : e) }); }
  function removeEdu(id: string) { setForm({ ...form, education: form.education.filter(e => e.id !== id) }); }

  async function generate() {
    setIsGenerating(true); setGeneratedCV('');
    try {
      const res = await fetch('/api/generate-cv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setGeneratedCV(json.cv);
      setStep(5);
    } catch (e: any) { alert('Erreur : ' + e.message); }
    finally { setIsGenerating(false); }
  }

  async function saveCV() {
    setIsSaving(true); setSaveMsg('');
    try {
      const res = await fetch('/api/cvs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cvId || undefined, title: cvTitle, template, content: generatedCV, form_data: form }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaveMsg('Sauvegardé !');
      if (!cvId) router.replace(`/dashboard/editor?id=${json.cv.id}`);
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e: any) { setSaveMsg('Erreur : ' + e.message); }
    finally { setIsSaving(false); }
  }

  async function downloadPdf() {
    const blob = await pdf(<CVPdf content={generatedCV} template={template} photo={photo || undefined} formData={form} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${cvTitle}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 9px', fontSize: 12, fontFamily: FONT, border: '2px solid #111', borderRadius: 6, background: '#fff', color: '#111', outline: 'none', boxSizing: 'border-box' };

  const STEPS = ['Choisir un modèle', 'Importer mon CV', 'Vérifier mes infos', 'Générer mon CV', 'Prévisualiser', 'Enregistrer / PDF'];

  const templateMap: Record<TemplateId, string> = { classic: 'classic', modern: 'modern', minimal: 'minimal' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .editor-page { font-family: 'Montserrat', sans-serif; display: flex; height: 100vh; overflow: hidden; }
        .editor-sidebar { width: 180px; min-width: 180px; background: #0f0f0f; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; border-right: 1px solid #1e1e1e; flex-shrink: 0; }
        .editor-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #F7F6F3; }
        .step-hover:hover { background: #f5f5f5; }
      `}</style>

      <div className="editor-page">

        {/* ── Sidebar nav ── */}
        <aside className="editor-sidebar">
          <div onClick={() => router.push('/')} style={{ padding: '16px 14px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: FONT }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#F5C400', fontFamily: FONT }}>find my Job</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {['Tableau de bord', 'Candidatures', 'Contacts', 'Entretiens', 'Événements', 'Statistiques'].map(label => (
              <button key={label} onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', border: 'none', borderLeft: '3px solid transparent', borderRadius: 0, background: 'transparent', color: '#888', fontFamily: FONT, fontWeight: 500, fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
                {label}
              </button>
            ))}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '14px 8px 6px' }}>Outils</div>
            <button onClick={() => router.push('/dashboard/synthese')} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', border: 'none', borderLeft: '3px solid transparent', borderRadius: 0, background: 'transparent', color: '#888', fontFamily: FONT, fontWeight: 500, fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              Synthèse
            </button>
            <button style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', border: 'none', borderLeft: '3px solid #E8151B', borderRadius: 0, background: '#1c1c1c', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              CV Creator
            </button>
          </div>
          <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 8px' }}>
            <button onClick={() => router.push('/dashboard/profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>E</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: FONT }}>Mon profil</div>
            </button>
            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '6px 10px', marginTop: 2, border: 'none', background: 'transparent', color: '#444', fontFamily: FONT, fontWeight: 600, fontSize: 11, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#444'}>
              ⎋ Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="editor-main">

          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 54, flexShrink: 0, background: '#fff', borderBottom: '2px solid #111' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontSize: 12, fontWeight: 700, fontFamily: FONT, padding: 0 }}>← Tableau de bord</button>
              <span style={{ color: '#ddd' }}>|</span>
              <input value={cvTitle} onChange={e => setCvTitle(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 14, fontWeight: 800, color: '#111', padding: '4px 0', outline: 'none', width: 200, fontFamily: FONT }} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {saveMsg && <span style={{ fontSize: 12, fontWeight: 700, color: saveMsg.startsWith('Erreur') ? '#E8151B' : '#1A7A4A', fontFamily: FONT }}>{saveMsg}</span>}
              <button onClick={saveCV} disabled={isSaving} style={{ background: '#F5C400', color: '#111', fontSize: 12, fontWeight: 800, padding: '8px 16px', border: '2px solid #111', borderRadius: 8, cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </header>

          {/* Corps */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden' }}>

            {/* ── Stepper gauche ── */}
            <div style={{ borderRight: '2px solid #111', overflowY: 'auto', background: '#fff', padding: '20px 16px' }}>
              {STEPS.map((label, i) => {
                const n = i + 1;
                const isActive = step === n;
                const isDone = step > n;
                return (
                  <div key={n} style={{ display: 'flex', gap: 12, cursor: 'pointer' }} onClick={() => setStep(n)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${isActive || isDone ? '#111' : '#ccc'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, fontFamily: FONT, color: isActive ? '#fff' : isDone ? '#111' : '#bbb', background: isActive ? '#111' : isDone ? '#F5C400' : '#fff', flexShrink: 0, transition: 'all .2s' }}>
                        {isDone ? '✓' : n}
                      </div>
                      {n < 6 && <div style={{ width: 2, flex: 1, minHeight: 24, background: isDone ? '#111' : '#eee', margin: '3px 0' }} />}
                    </div>
                    <div style={{ paddingBottom: n < 6 ? 20 : 0, flex: 1, paddingTop: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT, color: isActive || isDone ? '#111' : '#bbb', transition: 'color .2s' }}>
                        {label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Panneau droit ── */}
            <div style={{ overflowY: 'auto', padding: '1.5rem', background: '#F7F6F3' }}>

              {/* ÉTAPE 1 — Choisir un modèle */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 16 }}>Choisis ton modèle</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {TEMPLATES.map(t => (
                      <div key={t.id} onClick={() => setTemplate(t.id as TemplateId)} style={{ border: `2px solid ${template === t.id ? '#F5C400' : '#111'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', boxShadow: template === t.id ? '3px 3px 0 #F5C400' : '3px 3px 0 #111', transition: 'all .15s' }}>
                        <div style={{ height: 200, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{t.preview}</div>
                        <div style={{ padding: '10px 12px', borderTop: '2px solid #111', background: '#fff' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#111', fontFamily: FONT }}>{t.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)} style={{ marginTop: 24, padding: '12px 24px', background: '#111', color: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', boxShadow: '3px 3px 0 #F5C400' }}>
                    Continuer →
                  </button>
                </div>
              )}

              {/* ÉTAPE 2 — Importer */}
              {step === 2 && (
                <div style={{ maxWidth: 500 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 16 }}>Importe ton CV</div>
                  <div style={{ background: '#FFF3CD', border: '2px solid #111', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#111', lineHeight: 1.6, marginBottom: 14, fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                    <strong style={{ color: '#E8151B' }}>Comment exporter depuis LinkedIn :</strong><br />
                    Profil → <strong>Plus</strong> → <strong>Enregistrer au format PDF</strong>
                  </div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    style={{ border: `2px dashed ${isDragOver ? '#E8151B' : '#111'}`, borderRadius: 10, padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: isDragOver ? '#FFF3CD' : '#FAFAFA', marginBottom: 14, boxShadow: isDragOver ? '3px 3px 0 #111' : 'none', transition: 'all .15s' }}>
                    <div style={{ width: 44, height: 44, background: '#0A66C2', border: '2px solid #111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white', fontWeight: 900, fontFamily: 'serif', fontSize: 20, boxShadow: '2px 2px 0 #111' }}>in</div>
                    <div style={{ fontWeight: 800, marginBottom: 4, fontSize: 14, fontFamily: FONT, color: '#111' }}>Glisse ton CV LinkedIn</div>
                    <div style={{ fontSize: 12, color: '#666', fontFamily: FONT }}>ou clique pour sélectionner un PDF</div>
                    <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </div>
                  {importStatus && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontFamily: FONT, fontWeight: 700, border: '2px solid #111', background: importStatus.type === 'success' ? '#D4EDDA' : importStatus.type === 'error' ? '#F8D7DA' : '#FFF3CD', color: '#111', boxShadow: '2px 2px 0 #111' }}>
                      {importStatus.type === 'success' ? '✅ ' : importStatus.type === 'error' ? '❌ ' : '⏳ '}{importStatus.msg}
                    </div>
                  )}
                  <button onClick={() => setStep(3)} style={{ padding: '10px 20px', background: '#fff', color: '#111', border: '2px solid #111', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', boxShadow: '2px 2px 0 #111' }}>
                    Remplir manuellement →
                  </button>
                </div>
              )}

              {/* ÉTAPE 3 — Formulaire + aperçu */}
              {step === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Formulaire */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 4 }}>Vérifie tes informations</div>

                    {/* Bloc infos perso */}
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: FONT }}>Informations personnelles</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Prénom</label><input style={inputStyle} value={form.firstName} onChange={e => setField('firstName', e.target.value)} placeholder="Jean" /></div>
                        <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Nom</label><input style={inputStyle} value={form.lastName} onChange={e => setField('lastName', e.target.value)} placeholder="Dupont" /></div>
                      </div>
                      <div style={{ marginBottom: 8 }}><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Titre</label><input style={inputStyle} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Directeur Marketing" /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Email</label><input style={inputStyle} value={form.email} onChange={e => setField('email', e.target.value)} /></div>
                        <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Téléphone</label><input style={inputStyle} value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Ville</label><input style={inputStyle} value={form.city} onChange={e => setField('city', e.target.value)} /></div>
                        <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>LinkedIn</label><input style={inputStyle} value={form.linkedin} onChange={e => setField('linkedin', e.target.value)} /></div>
                      </div>
                      {/* Photo */}
                      <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Photo (optionnel)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {photo ? <img src={photo} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }} /> : <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #111', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0, fontFamily: FONT }}>{(form.firstName?.[0] || '') + (form.lastName?.[0] || '') || '?'}</div>}
                          <button onClick={() => photoRef.current?.click()} style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT, padding: '5px 10px', border: '2px solid #111', borderRadius: 6, background: '#F7F6F3', cursor: 'pointer', boxShadow: '2px 2px 0 #111' }}>{photo ? 'Changer' : 'Ajouter une photo'}</button>
                          {photo && <button onClick={() => setPhoto('')} style={{ fontSize: 11, fontWeight: 700, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>✕</button>}
                          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = ev => setPhoto(ev.target?.result as string); reader.readAsDataURL(f); }} />
                        </div>
                      </div>
                    </div>

                    {/* Résumé */}
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT }}>Résumé</div>
                      <textarea style={{ ...inputStyle, resize: 'vertical' }} value={form.summary} onChange={e => setField('summary', e.target.value)} rows={3} placeholder="5 ans d'expérience en..." />
                    </div>

                    {/* Expériences */}
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT }}>Expériences</div>
                      {form.experiences.map(exp => (
                        <div key={exp.id} style={{ borderTop: '2px solid #111', paddingTop: 10, marginTop: 10 }}>
                          <button onClick={() => removeExp(exp.id)} style={{ float: 'right', fontSize: 10, fontWeight: 800, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>✕</button>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                            <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Poste</label><input style={inputStyle} value={exp.role} onChange={e => updateExp(exp.id, 'role', e.target.value)} /></div>
                            <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Entreprise</label><input style={inputStyle} value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} /></div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                            <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Début</label><input style={inputStyle} value={exp.start} onChange={e => updateExp(exp.id, 'start', e.target.value)} /></div>
                            <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Fin</label><input style={inputStyle} value={exp.end} onChange={e => updateExp(exp.id, 'end', e.target.value)} /></div>
                          </div>
                          <textarea style={{ ...inputStyle, resize: 'vertical' }} value={exp.description} onChange={e => updateExp(exp.id, 'description', e.target.value)} rows={2} placeholder="Missions..." />
                        </div>
                      ))}
                      <button onClick={addExp} style={{ fontSize: 12, fontWeight: 800, color: '#111', background: '#F5C400', border: '2px solid #111', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', marginTop: 8, fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>+ Expérience</button>
                    </div>

                    {/* Formation */}
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT }}>Formation</div>
                      {form.education.map(edu => (
                        <div key={edu.id} style={{ borderTop: '2px solid #111', paddingTop: 8, marginTop: 8 }}>
                          <button onClick={() => removeEdu(edu.id)} style={{ float: 'right', fontSize: 10, fontWeight: 800, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>✕</button>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                            <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Diplôme</label><input style={inputStyle} value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} /></div>
                            <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>École</label><input style={inputStyle} value={edu.school} onChange={e => updateEdu(edu.id, 'school', e.target.value)} /></div>
                          </div>
                          <div><label style={{ display: 'block', fontSize: 9, fontWeight: 700, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Année</label><input style={inputStyle} value={edu.year} onChange={e => updateEdu(edu.id, 'year', e.target.value)} /></div>
                        </div>
                      ))}
                      <button onClick={addEdu} style={{ fontSize: 12, fontWeight: 800, color: '#111', background: '#F5C400', border: '2px solid #111', borderRadius: 6, cursor: 'pointer', padding: '5px 10px', marginTop: 8, fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>+ Formation</button>
                    </div>

                    {/* Compétences */}
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT }}>Compétences</div>
                      <input style={inputStyle} value={form.skills} onChange={e => setField('skills', e.target.value)} placeholder="React, Python, SQL..." />
                    </div>

                    {/* Poste visé */}
                    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '12px', boxShadow: '2px 2px 0 #111' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: FONT }}>Poste visé</div>
                      <input style={inputStyle} value={form.targetJob} onChange={e => setField('targetJob', e.target.value)} placeholder="Chef de projet chez une startup" />
                    </div>

                    <button onClick={() => setStep(4)} style={{ padding: '12px', background: '#111', color: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', boxShadow: '3px 3px 0 #F5C400' }}>
                      Continuer →
                    </button>
                  </div>

                  {/* Aperçu live */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 12 }}>Aperçu</div>
                    <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, padding: '1.5rem', boxShadow: '4px 4px 0 #111', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
                      {template === 'modern' ? <ModernPreview form={form} photo={photo} /> : template === 'minimal' ? <MinimalPreview form={form} photo={photo} /> : <ClassicPreview form={form} photo={photo} />}
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4 — Générer */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>⚡</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: FONT }}>Claude va rédiger et optimiser ton CV pour les ATS</div>
                  <div style={{ fontSize: 13, color: '#666', fontFamily: FONT, maxWidth: 400 }}>Ton CV sera adapté au poste visé, avec un vocabulaire enrichi et tes réalisations mises en avant.</div>
                  <button onClick={generate} disabled={isGenerating} style={{ padding: '16px 40px', fontSize: 16, fontWeight: 900, fontFamily: FONT, background: isGenerating ? '#ccc' : '#E8151B', color: '#fff', border: '2px solid #111', borderRadius: 8, cursor: isGenerating ? 'not-allowed' : 'pointer', boxShadow: isGenerating ? 'none' : '4px 4px 0 #111' }}>
                    {isGenerating ? '⏳ Claude rédige...' : 'Générer mon CV →'}
                  </button>
                  {isGenerating && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[0, 1, 2].map(i => (<div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8151B', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />))}
                      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-8px);opacity:1} }`}</style>
                    </div>
                  )}
                </div>
              )}

              {/* ÉTAPE 5 — Prévisualiser */}
              {step === 5 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT }}>Aperçu</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { navigator.clipboard.writeText(generatedCV); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ background: '#fff', color: '#111', fontSize: 12, fontWeight: 800, padding: '7px 16px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                        {copied ? '✓ Copié' : 'Copier'}
                      </button>
                      <button onClick={downloadPdf} style={{ background: '#F5C400', color: '#111', fontSize: 12, fontWeight: 800, padding: '7px 16px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                        ↓ PDF
                      </button>
                      <button onClick={() => setStep(6)} style={{ background: '#111', color: '#fff', fontSize: 12, fontWeight: 800, padding: '7px 16px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                        Continuer →
                      </button>
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '2rem', boxShadow: '4px 4px 0 #111' }}>
                    {template === 'modern' ? <ModernPreview form={form} photo={photo} /> : template === 'minimal' ? <MinimalPreview form={form} photo={photo} /> : <ClassicPreview form={form} photo={photo} />}
                  </div>
                </div>
              )}

              {/* ÉTAPE 6 — Enregistrer */}
              {step === 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>✦</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111', fontFamily: FONT }}>Ton CV est prêt !</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={saveCV} disabled={isSaving} style={{ padding: '12px 24px', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, fontFamily: FONT, background: '#fff', boxShadow: '3px 3px 0 #111', cursor: 'pointer' }}>
                      {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                    <button onClick={downloadPdf} style={{ padding: '12px 24px', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, fontFamily: FONT, background: '#F5C400', boxShadow: '3px 3px 0 #111', cursor: 'pointer' }}>
                      ↓ Télécharger PDF
                    </button>
                  </div>
                  {saveMsg && <div style={{ fontSize: 13, fontWeight: 700, color: saveMsg.startsWith('Erreur') ? '#E8151B' : '#1A7A4A', fontFamily: FONT }}>{saveMsg}</div>}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: '#111', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Chargement...</div>}>
      <EditorContent />
    </Suspense>
  );
}