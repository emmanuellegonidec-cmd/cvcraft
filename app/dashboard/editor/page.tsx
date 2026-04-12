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
function renderMarkdown(text: string): string {
  return text
    .split('\n').map(line => {
      if (/^## (.+)/.test(line)) return `<h2 style="font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #111;padding-bottom:4px;margin:20px 0 8px;">${line.replace(/^## /, '')}</h2>`;
      if (/^### (.+)/.test(line)) return `<h3 style="font-size:13px;font-weight:800;margin:10px 0 3px;">${line.replace(/^### /, '')}</h3>`;
      if (line.trim() === '') return '<br/>';
      return `<p style="margin:2px 0;font-size:13px;line-height:1.7;">${line}</p>`;
    }).join('')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#555;">$1</em>');
}
function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get('id');

  const [tab, setTab] = useState<'import' | 'form'>('import');
  const [form, setForm] = useState<CVFormData>(defaultFormData);
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [cvTitle, setCvTitle] = useState('Mon CV');
  const [generatedCV, setGeneratedCV] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: string; msg: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState<string>('');
const photoRef = useRef<HTMLInputElement>(null);
const fileRef = useRef<HTMLInputElement>(null);

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
        setForm({
          ...fd,
          experiences: (fd.experiences || []).map((e: any) => ({ ...e, id: e.id || uid() })),
          education: (fd.education || []).map((e: any) => ({ ...e, id: e.id || uid() })),
        });
        setTab('form');
      }
    }
    load();
  }, [cvId, router]);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { setImportStatus({ type: 'error', msg: 'Sélectionnez un fichier PDF.' }); return; }
    setImportStatus({ type: 'loading', msg: 'Lecture du PDF...' });
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((s: any) => s.str).join(' ') + '\n';
      }
      setImportStatus({ type: 'loading', msg: 'Claude analyse votre profil...' });
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const d = json.data;
      setForm({
        ...form, ...d,
        experiences: (d.experiences || []).map((e: any) => ({ ...e, id: uid() })),
        education: (d.education || []).map((e: any) => ({ ...e, id: uid() })),
      });
      if (d.firstName || d.lastName) setCvTitle(`CV — ${d.firstName} ${d.lastName}`.trim());
      setImportStatus({ type: 'success', msg: 'Profil LinkedIn importé !' });
      setTimeout(() => { setImportStatus(null); setTab('form'); }, 1500);
    } catch (e: any) {
      setImportStatus({ type: 'error', msg: e.message });
    }
  }

  function setField(field: keyof CVFormData, value: string) { setForm({ ...form, [field]: value }); }
  function addExp() { setForm({ ...form, experiences: [...form.experiences, { id: uid(), role: '', company: '', start: '', end: '', description: '' }] }); }
  function updateExp(id: string, field: keyof Experience, val: string) { setForm({ ...form, experiences: form.experiences.map(e => e.id === id ? { ...e, [field]: val } : e) }); }
  function removeExp(id: string) { setForm({ ...form, experiences: form.experiences.filter(e => e.id !== id) }); }
  function addEdu() { setForm({ ...form, education: [...form.education, { id: uid(), degree: '', school: '', year: '' }] }); }
  function updateEdu(id: string, field: keyof Education, val: string) { setForm({ ...form, education: form.education.map(e => e.id === id ? { ...e, [field]: val } : e) }); }
  function removeEdu(id: string) { setForm({ ...form, education: form.education.filter(e => e.id !== id) }); }

  async function generate() {
    setIsGenerating(true); setError(''); setGeneratedCV('');
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setGeneratedCV(json.cv);
    } catch (e: any) { setError(e.message); }
    finally { setIsGenerating(false); }
  }

  async function saveCV() {
    if (!generatedCV) { alert('Générez d\'abord votre CV.'); return; }
    setIsSaving(true); setSaveMsg('');
    try {
      const res = await fetch('/api/cvs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cvId || undefined, title: cvTitle, template, content: generatedCV, form_data: form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaveMsg('Sauvegardé !');
      if (!cvId) router.replace(`/dashboard/editor?id=${json.cv.id}`);
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e: any) { setSaveMsg('Erreur : ' + e.message); }
    finally { setIsSaving(false); }
  }

 async function downloadPdf() {
  const blob = await pdf(
    <CVPdf content={generatedCV} template={template} photo={photo || undefined} formData={form} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${cvTitle}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: FONT,
    border: '2px solid #111', borderRadius: 6, background: '#fff',
    color: '#111', outline: 'none', boxSizing: 'border-box',
  };

  const navBtnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '9px 12px',
    border: 'none', borderLeft: '3px solid transparent', borderRadius: 0,
    background: 'transparent', color: '#888', fontFamily: FONT,
    fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'left',
    width: '100%', transition: 'all 0.12s',
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

        {/* ── Sidebar ── */}
        <aside className="editor-sidebar">
          <div onClick={() => router.push('/')} style={{ padding: '18px 16px 16px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#F5C400' }}>find my Job</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 8px' }}>Recherche</div>
            {['Tableau de bord', 'Candidatures', 'Contacts', 'Entretiens', 'Événements', 'Statistiques'].map(label => (
              <button key={label} onClick={() => router.push('/dashboard')} style={navBtnBase}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
                {label}
              </button>
            ))}

            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 8px' }}>Outils</div>

            <button onClick={() => router.push('/dashboard/synthese')} style={navBtnBase}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              Synthèse
            </button>

            {/* CV Creator actif */}
            <button style={{ ...navBtnBase, borderLeft: '3px solid #E8151B', background: '#1c1c1c', color: '#fff', fontWeight: 700 }}>
              CV Creator
            </button>

            <button onClick={() => router.push('/dashboard/help')} style={navBtnBase}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              Help
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 10px 8px', flexShrink: 0 }}>
            <button onClick={() => router.push('/dashboard/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; (e.currentTarget as HTMLButtonElement).style.background = '#161616'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff', flexShrink: 0 }}>E</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', textAlign: 'left' }}>Mon profil</div>
            </button>
            <button onClick={() => router.push('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', marginTop: 2, border: 'none', borderRadius: 6, background: 'transparent', color: '#444', fontFamily: FONT, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'color 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#444'}>
              ⎋ Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="editor-main">

          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 58, flexShrink: 0, background: '#fff', borderBottom: '2px solid #111', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontSize: 13, fontWeight: 700, fontFamily: FONT, padding: 0 }}>
                ← Tableau de bord
              </button>
              <span style={{ color: '#ddd' }}>|</span>
              <input value={cvTitle} onChange={e => setCvTitle(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: 15, fontWeight: 800, color: '#111', padding: '4px 0', outline: 'none', width: 220, fontFamily: FONT }} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {saveMsg && <span style={{ fontSize: 13, fontWeight: 700, color: saveMsg.startsWith('Erreur') ? '#E8151B' : '#1A7A4A', fontFamily: FONT }}>{saveMsg}</span>}
              <button onClick={saveCV} disabled={isSaving} style={{ background: '#F5C400', color: '#111', fontSize: 13, fontWeight: 800, padding: '9px 18px', border: '2px solid #111', borderRadius: 8, cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </header>

          {/* Corps — panneau gauche + aperçu */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>

            {/* Panneau gauche */}
            <div style={{ borderRight: '2px solid #111', overflowY: 'auto', background: '#fff' }}>
              <div style={{ padding: '1.25rem' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', background: '#F7F6F3', border: '2px solid #111', borderRadius: 8, padding: 3, marginBottom: '1.25rem', gap: 4 }}>
                  {(['import', 'form'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontFamily: FONT, fontWeight: 800, background: tab === t ? '#111' : 'transparent', color: tab === t ? '#fff' : '#111', border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {t === 'import' ? 'Import LinkedIn' : 'Formulaire'}
                    </button>
                  ))}
                </div>

                {/* Import tab */}
                {tab === 'import' && (
                  <div>
                    <div style={{ background: '#FFF3CD', border: '2px solid #111', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#111', lineHeight: 1.6, marginBottom: 14, fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                      <strong style={{ color: '#E8151B' }}>Comment exporter depuis LinkedIn :</strong><br />
                      Profil → <strong>Plus</strong> → <strong>Enregistrer au format PDF</strong>
                    </div>
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                      style={{ border: `2px dashed ${isDragOver ? '#E8151B' : '#111'}`, borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: isDragOver ? '#FFF3CD' : '#FAFAFA', transition: 'all 0.15s', boxShadow: isDragOver ? '3px 3px 0 #111' : 'none' }}>
                      <div style={{ width: 44, height: 44, background: '#0A66C2', border: '2px solid #111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white', fontWeight: 900, fontFamily: 'serif', fontSize: 20, boxShadow: '2px 2px 0 #111' }}>in</div>
                      <div style={{ fontWeight: 800, marginBottom: 4, fontSize: 14, fontFamily: FONT, color: '#111' }}>Glissez votre CV LinkedIn</div>
                      <div style={{ fontSize: 12, color: '#666', fontFamily: FONT }}>ou cliquez pour sélectionner un PDF</div>
                      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    </div>
                    {importStatus && (
                      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontFamily: FONT, fontWeight: 700, border: '2px solid #111', background: importStatus.type === 'success' ? '#D4EDDA' : importStatus.type === 'error' ? '#F8D7DA' : '#FFF3CD', color: '#111', boxShadow: '2px 2px 0 #111' }}>
                        {importStatus.type === 'success' ? '✅ ' : importStatus.type === 'error' ? '❌ ' : '⏳ '}{importStatus.msg}
                      </div>
                    )}
                  </div>
                )}

                {/* Form tab */}
                {tab === 'form' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Section title="Informations personnelles">
                      <Row2>
                        <Field label="Prénom"><input style={inputStyle} value={form.firstName} onChange={e => setField('firstName', e.target.value)} placeholder="Jean" /></Field>
                        <Field label="Nom"><input style={inputStyle} value={form.lastName} onChange={e => setField('lastName', e.target.value)} placeholder="Dupont" /></Field>
                      </Row2>
                      <Field label="Titre actuel"><input style={inputStyle} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Développeur Full Stack" /></Field>
                      <Row2>
                        <Field label="Email"><input style={inputStyle} value={form.email} onChange={e => setField('email', e.target.value)} placeholder="jean@email.com" /></Field>
                        <Field label="Téléphone"><input style={inputStyle} value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+33 6 ..." /></Field>
                      </Row2>
                      <Row2>
                        <Field label="Ville"><input style={inputStyle} value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Paris" /></Field>
                        <Field label="LinkedIn"><input style={inputStyle} value={form.linkedin} onChange={e => setField('linkedin', e.target.value)} placeholder="linkedin.com/in/..." /></Field>
                      </Row2>
                      <Field label="Photo (optionnel)">
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    {photo
      ? <img src={photo} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #111', objectFit: 'cover' }} />
      : <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #111', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff', flexShrink: 0 }}>
          {(form.firstName?.[0] || '') + (form.lastName?.[0] || '') || '?'}
        </div>
    }
    <button onClick={() => photoRef.current?.click()}
      style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT, padding: '6px 12px', border: '2px solid #111', borderRadius: 6, background: '#F7F6F3', cursor: 'pointer', boxShadow: '2px 2px 0 #111' }}>
      {photo ? 'Changer la photo' : 'Ajouter une photo'}
    </button>
    {photo && (
      <button onClick={() => setPhoto('')}
        style={{ fontSize: 11, fontWeight: 700, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
        ✕
      </button>
    )}
    <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
      onChange={e => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => setPhoto(ev.target?.result as string);
        reader.readAsDataURL(f);
      }} />
  </div>
</Field>
                    </Section>

                    <Section title="Résumé">
                      <Field label="Votre profil">
                        <textarea style={{ ...inputStyle, resize: 'vertical' }} value={form.summary} onChange={e => setField('summary', e.target.value)} rows={3} placeholder="5 ans d'expérience en..." />
                      </Field>
                    </Section>

                    <Section title="Expériences">
                      {form.experiences.map(exp => (
                        <div key={exp.id} style={{ borderTop: '2px solid #111', paddingTop: 10, marginTop: 10 }}>
                          <button onClick={() => removeExp(exp.id)} style={{ float: 'right', fontSize: 11, fontWeight: 800, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>✕ Supprimer</button>
                          <Row2>
                            <Field label="Poste"><input style={inputStyle} value={exp.role} onChange={e => updateExp(exp.id, 'role', e.target.value)} placeholder="Développeur" /></Field>
                            <Field label="Entreprise"><input style={inputStyle} value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} placeholder="Acme" /></Field>
                          </Row2>
                          <Row2>
                            <Field label="Début"><input style={inputStyle} value={exp.start} onChange={e => updateExp(exp.id, 'start', e.target.value)} placeholder="Jan 2022" /></Field>
                            <Field label="Fin"><input style={inputStyle} value={exp.end} onChange={e => updateExp(exp.id, 'end', e.target.value)} placeholder="Présent" /></Field>
                          </Row2>
                          <Field label="Description"><textarea style={{ ...inputStyle, resize: 'vertical' }} value={exp.description} onChange={e => updateExp(exp.id, 'description', e.target.value)} rows={2} placeholder="Missions..." /></Field>
                        </div>
                      ))}
                      <AddBtn onClick={addExp}>+ Ajouter une expérience</AddBtn>
                    </Section>

                    <Section title="Formation">
                      {form.education.map(edu => (
                        <div key={edu.id} style={{ borderTop: '2px solid #111', paddingTop: 10, marginTop: 10 }}>
                          <button onClick={() => removeEdu(edu.id)} style={{ float: 'right', fontSize: 11, fontWeight: 800, color: '#E8151B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>✕ Supprimer</button>
                          <Row2>
                            <Field label="Diplôme"><input style={inputStyle} value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="Master" /></Field>
                            <Field label="Établissement"><input style={inputStyle} value={edu.school} onChange={e => updateEdu(edu.id, 'school', e.target.value)} placeholder="Université" /></Field>
                          </Row2>
                          <Field label="Année"><input style={inputStyle} value={edu.year} onChange={e => updateEdu(edu.id, 'year', e.target.value)} placeholder="2022" /></Field>
                        </div>
                      ))}
                      <AddBtn onClick={addEdu}>+ Ajouter une formation</AddBtn>
                    </Section>

                    <Section title="Compétences">
                      <Field label="Séparées par des virgules">
                        <input style={inputStyle} value={form.skills} onChange={e => setField('skills', e.target.value)} placeholder="React, Python, SQL..." />
                      </Field>
                    </Section>

                    <Section title="Options">
                      <Row2>
                        <Field label="Langue">
                          <select style={{ ...inputStyle }} value={form.lang} onChange={e => setField('lang', e.target.value)}>
                            <option value="français">Français</option>
                            <option value="anglais">Anglais</option>
                            <option value="espagnol">Espagnol</option>
                            <option value="allemand">Allemand</option>
                          </select>
                        </Field>
                        <Field label="Ton">
                          <select style={{ ...inputStyle }} value={form.tone} onChange={e => setField('tone', e.target.value)}>
                            <option value="professionnel">Professionnel</option>
                            <option value="moderne et dynamique">Dynamique</option>
                            <option value="académique">Académique</option>
                            <option value="créatif">Créatif</option>
                          </select>
                        </Field>
                      </Row2>
                      <Field label="Poste visé (optimise le CV)">
                        <input style={inputStyle} value={form.targetJob} onChange={e => setField('targetJob', e.target.value)} placeholder="Chef de projet chez une startup" />
                      </Field>
                    </Section>

                    <Section title="Template visuel">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {TEMPLATES.map(t => (
                          <button key={t.id} onClick={() => setTemplate(t.id)} style={{ padding: '12px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', border: '2px solid #111', background: template === t.id ? '#F5C400' : '#fff', boxShadow: template === t.id ? '3px 3px 0 #111' : '2px 2px 0 #111', transition: 'all 0.15s', fontFamily: FONT, transform: template === t.id ? 'translate(-1px,-1px)' : 'none' }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{t.preview}</div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#111' }}>{t.name}</div>
                          </button>
                        ))}
                      </div>
                    </Section>
                  </div>
                )}

                {/* Bouton Générer */}
                <button onClick={generate} disabled={isGenerating} style={{ width: '100%', marginTop: 16, padding: '14px', fontSize: 15, fontWeight: 900, fontFamily: FONT, background: isGenerating ? '#ccc' : '#E8151B', color: '#fff', border: '2px solid #111', borderRadius: 8, cursor: isGenerating ? 'not-allowed' : 'pointer', boxShadow: isGenerating ? 'none' : '4px 4px 0 #111', transition: 'all 0.15s' }}>
                  {isGenerating ? '⏳ Claude rédige...' : 'Générer mon CV →'}
                </button>
              </div>
            </div>

            {/* Panneau droit — Aperçu */}
            <div style={{ overflowY: 'auto', padding: '1.5rem', background: '#F7F6F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT }}>Aperçu</span>
                {generatedCV && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { navigator.clipboard.writeText(generatedCV); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ background: '#fff', color: '#111', fontSize: 13, fontWeight: 800, padding: '7px 16px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                      {copied ? '✓ Copié' : 'Copier'}
                    </button>
                    <button onClick={downloadPdf} style={{ background: '#F5C400', color: '#111', fontSize: 13, fontWeight: 800, padding: '7px 16px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                      ↓ PDF
                    </button>
                  </div>
                )}
              </div>

              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '2rem', minHeight: 500, boxShadow: '4px 4px 0 #111' }}>
                {isGenerating && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[0, 1, 2].map(i => (<div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8151B', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />))}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT, color: '#111' }}>Claude rédige votre CV...</span>
                    <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-8px);opacity:1} }`}</style>
                  </div>
                )}
                {error && !isGenerating && (
                  <div style={{ background: '#F8D7DA', border: '2px solid #111', borderRadius: 8, padding: '12px 16px', color: '#111', fontSize: 14, fontFamily: FONT, fontWeight: 700, boxShadow: '2px 2px 0 #111' }}>❌ Erreur : {error}</div>
                )}
                {!generatedCV && !isGenerating && !error && (
                  <div style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: '5rem', lineHeight: 2, fontFamily: FONT }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
                    Importez votre LinkedIn ou remplissez le formulaire,<br />
                    puis cliquez sur <strong style={{ color: '#111' }}>Générer</strong>.
                  </div>
                )}
                {generatedCV && !isGenerating && (
  <div style={{ fontFamily: FONT, color: '#111' }}>
    {template === 'modern'
      ? <ModernPreview form={form} photo={photo} />
      : template === 'minimal'
      ? <MinimalPreview form={form} photo={photo} />
      : <ClassicPreview form={form} photo={photo} />
    }
  </div>
)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '1rem 1.1rem', boxShadow: '2px 2px 0 #111' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Montserrat, sans-serif' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 4, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>;
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ fontSize: 13, fontWeight: 800, color: '#111', background: '#F5C400', border: '2px solid #111', borderRadius: 6, cursor: 'pointer', padding: '6px 12px', marginTop: 8, fontFamily: 'Montserrat, sans-serif', boxShadow: '2px 2px 0 #111' }}>
      {children}
    </button>
  );
}
function Initials({ firstName, lastName, bg, size = 48 }: { firstName: string, lastName: string, bg: string, size?: number }) {
  const txt = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: size * 0.35, color: '#fff', flexShrink: 0 }}>
      {txt || '?'}
    </div>
  );
}

function ClassicPreview({ form, photo }: { form: CVFormData, photo: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>
      {/* Header */}
      <div style={{ background: '#111', padding: '16px 20px', marginBottom: 14, borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {photo
            ? <img src={photo} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8151B' }} />
            : <Initials firstName={form.firstName} lastName={form.lastName} bg="#E8151B" size={56} />
          }
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 3 }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>{form.title}</div>
            <div style={{ height: 2, width: 50, background: '#F5C400', marginBottom: 5 }} />
            <div style={{ fontSize: 11, color: '#ccc' }}>{contact}</div>
          </div>
        </div>
      </div>
      {form.summary && <><SectionTitle>Profil professionnel</SectionTitle><p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 10px' }}>{form.summary}</p></>}
      {form.experiences?.length > 0 && <><SectionTitle>Expériences</SectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor="#F5C400" />)}</>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {form.education?.length > 0 && <div><SectionTitle>Formation</SectionTitle>{form.education.map((edu, i) => <div key={i} style={{ marginBottom: 6 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div><div style={{ fontSize: 11, color: '#555' }}>{edu.school}</div><div style={{ fontSize: 11, color: '#888' }}>{edu.year}</div></div>)}</div>}
        {form.skills && <div><SectionTitle>Compétences</SectionTitle><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{form.skills.split(',').map((sk, i) => <span key={i} style={{ background: '#111', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>{sk.trim()}</span>)}</div></div>}
      </div>
    </div>
  );
}

function ModernPreview({ form, photo }: { form: CVFormData, photo: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', fontFamily: 'Montserrat, sans-serif', fontSize: 13, minHeight: 600 }}>
      {/* Colonne gauche */}
      <div style={{ background: '#1B4F72', padding: '20px 14px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          {photo
            ? <img src={photo} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
            : <Initials firstName={form.firstName} lastName={form.lastName} bg="#2980B9" size={64} />
          }
        </div>
        <div style={{ fontWeight: 900, fontSize: 13, textAlign: 'center', marginBottom: 3 }}>{form.firstName} {form.lastName}</div>
        <div style={{ fontSize: 10, color: '#9bc', textAlign: 'center', marginBottom: 8 }}>{form.title}</div>
        <div style={{ height: 1.5, background: '#F5C400', marginBottom: 12 }} />
        <LeftSection title="Contact">
          {[form.email, form.phone, form.city, form.linkedin].filter(Boolean).map((v, i) => <div key={i} style={{ fontSize: 10, color: '#ccc', marginBottom: 3 }}>{v}</div>)}
        </LeftSection>
        {form.skills && <LeftSection title="Compétences">{form.skills.split(',').map((sk, i) => <div key={i} style={{ background: '#2980B9', fontSize: 10, padding: '2px 6px', borderRadius: 3, marginBottom: 3, color: '#fff' }}>{sk.trim()}</div>)}</LeftSection>}
        {form.education?.length > 0 && <LeftSection title="Formation">{form.education.map((edu, i) => <div key={i} style={{ marginBottom: 6 }}><div style={{ fontSize: 10, fontWeight: 700 }}>{edu.degree}</div><div style={{ fontSize: 9, color: '#9bc' }}>{edu.school}</div><div style={{ fontSize: 9, color: '#F5C400' }}>{edu.year}</div></div>)}</LeftSection>}
      </div>
      {/* Colonne droite */}
      <div style={{ padding: '20px 18px' }}>
        {form.summary && <><ModernSectionTitle>Profil professionnel</ModernSectionTitle><p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 10px', color: '#333' }}>{form.summary}</p></>}
        {form.experiences?.length > 0 && <><ModernSectionTitle>Expériences</ModernSectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor="#F5C400" modern />)}</>}
      </div>
    </div>
  );
}

function MinimalPreview({ form, photo }: { form: CVFormData, photo: string }) {
  const contact = [form.email, form.phone, form.city, form.linkedin].filter(Boolean).join('  ·  ');
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>
      <div style={{ height: 3, background: '#E8151B', marginBottom: 16, borderRadius: 2 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
        {photo
          ? <img src={photo} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
          : <Initials firstName={form.firstName} lastName={form.lastName} bg="#E8151B" size={60} />
        }
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 2 }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize: 12, color: '#E8151B', marginBottom: 3 }}>{form.title}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{contact}</div>
        </div>
      </div>
      <div style={{ height: 0.5, background: '#ddd', margin: '10px 0' }} />
      {form.summary && <p style={{ fontSize: 12, lineHeight: 1.7, color: '#333', margin: '0 0 10px' }}>{form.summary}</p>}
      {form.experiences?.length > 0 && <><MinimalSectionTitle>— Expériences</MinimalSectionTitle>{form.experiences.map((exp, i) => <ExpBlock key={i} exp={exp} accentColor="#E8151B" minimal />)}</>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        {form.education?.length > 0 && <div><MinimalSectionTitle>— Formation</MinimalSectionTitle>{form.education.map((edu, i) => <div key={i} style={{ marginBottom: 6 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div><div style={{ fontSize: 11, color: '#555' }}>{edu.school}</div><div style={{ fontSize: 11, color: '#E8151B' }}>{edu.year}</div></div>)}</div>}
        {form.skills && <div><MinimalSectionTitle>— Compétences</MinimalSectionTitle><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{form.skills.split(',').map((sk, i) => <span key={i} style={{ background: '#111', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>{sk.trim()}</span>)}</div></div>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1.5px solid #111', paddingBottom: 3, marginBottom: 8, marginTop: 14 }}>{children}</div>;
}
function ModernSectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1B4F72', borderBottom: '1.5px solid #1B4F72', paddingBottom: 3, marginBottom: 8, marginTop: 14 }}>{children}</div>;
}
function MinimalSectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 900, color: '#E8151B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 14 }}>{children}</div>;
}
function LeftSection({ title, children }: { title: string, children: React.ReactNode }) {
  return <div style={{ marginTop: 12 }}><div style={{ fontSize: 9, fontWeight: 900, color: '#F5C400', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{title}</div>{children}</div>;
}
function ExpBlock({ exp, accentColor, modern, minimal }: { exp: any, accentColor: string, modern?: boolean, minimal?: boolean }) {
  const lines = (exp.description || '').split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-•]\s*/, '').replace(/\*\*/g, ''));
  return (
    <div style={{ display: 'flex', gap: modern ? 8 : 0, marginBottom: 10 }}>
      {modern && <div style={{ width: 3, background: accentColor, borderRadius: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 12 }}>{minimal ? `${exp.role} · ${exp.company}` : exp.role}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{exp.start}{exp.end ? ` – ${exp.end}` : ''}</div>
        </div>
        {!minimal && <div style={{ fontSize: 11, color: modern ? '#1B4F72' : '#555', marginBottom: 3 }}>{exp.company}</div>}
        {lines.map((line: string, j: number) => <div key={j} style={{ fontSize: 11, marginLeft: 8, marginBottom: 2, lineHeight: 1.5, color: '#333' }}>• {line}</div>)}
      </div>
    </div>
  );
}
export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: '#111', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Chargement...</div>}>
      <EditorContent />
    </Suspense>
  );
}
