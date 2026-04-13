'use client';

import { useRef, useState } from 'react';
import { CVFormData } from '@/lib/types';

const FONT = 'Montserrat, sans-serif';

interface Props {
  onImportSuccess: (data: Partial<CVFormData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function Step2Import({ onImportSuccess, onNext, onSkip }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const linkedinRef = useRef<HTMLInputElement>(null);
  const [isDragOverPdf, setIsDragOverPdf] = useState(false);
  const [isDragOverLi, setIsDragOverLi] = useState(false);
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error'; msg: string } | null>(null);

  function uid() { return Math.random().toString(36).slice(2, 9); }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setStatus({ type: 'error', msg: 'Sélectionne un fichier PDF.' });
      return;
    }
    setStatus({ type: 'loading', msg: 'Lecture du PDF...' });
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
      setStatus({ type: 'loading', msg: 'L\'IA analyse ton profil...' });
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const d = json.data;
      onImportSuccess({
        ...d,
        experiences: (d.experiences || []).map((e: any) => ({ ...e, id: uid() })),
        education: (d.education || []).map((e: any) => ({ ...e, id: uid() })),
      });
      setStatus({ type: 'success', msg: 'Profil importé avec succès !' });
      setTimeout(() => { setStatus(null); onNext(); }, 1500);
    } catch (e: any) {
      setStatus({
        type: 'error',
        msg: e.message?.includes('overloaded') || e.message?.includes('529')
          ? 'L\'IA est temporairement surchargée. Réessaie dans quelques minutes.'
          : e.message || 'Erreur lors de l\'import.',
      });
    }
  }

  const dropBase: React.CSSProperties = {
    border: '2px dashed #111', borderRadius: 8,
    padding: '20px 10px', textAlign: 'center',
    cursor: 'pointer', flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all .15s',
  };

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 16 }}>
        Importe ton CV
      </div>

      {/* ── CONSEIL ATS ── */}
      <div style={{ background: '#F0FFF4', border: '1.5px solid #2D6A4F', borderRadius: 8, padding: '11px 14px', marginBottom: 20, fontSize: 12, color: '#2D6A4F', lineHeight: 1.6, fontFamily: FONT, fontWeight: 600 }}>
        ✅ <strong style={{ fontWeight: 800 }}>Conseil ATS :</strong> L'IA nettoie automatiquement les données importées pour qu'elles soient lisibles par les logiciels de recrutement.
      </div>

      {/* ── 3 BLOCS EN COLONNES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 16 }}>

        {/* BLOC 1 — Remplir manuellement */}
        <div style={{ border: '2px solid #111', borderRadius: 10, background: '#fff', boxShadow: '3px 3px 0 #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '2px solid #111', background: '#F7F6F3' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #111', background: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>✏</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#111', fontFamily: FONT }}>Remplir manuellement</div>
          </div>
          <div style={{ padding: '14px', fontSize: 11, color: '#444', lineHeight: 1.6, fontFamily: FONT, fontWeight: 600, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>Tu saisis tes informations directement dans le formulaire à l'étape suivante.</div>
            <button
              onClick={onSkip}
              style={{ display: 'block', padding: '9px 14px', border: '2px solid #111', borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: '2px 2px 0 #111', background: '#fff', color: '#111', textAlign: 'center', fontFamily: FONT, width: '100%' }}
            >
              Continuer sans importer →
            </button>
          </div>
        </div>

        {/* BLOC 2 — Importer un CV PDF */}
        <div style={{ border: '2px solid #111', borderRadius: 10, background: '#fff', boxShadow: '3px 3px 0 #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '2px solid #111', background: '#F7F6F3' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #111', background: '#E8F4FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>📄</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#111', fontFamily: FONT }}>Importer un CV PDF</div>
          </div>
          <div style={{ padding: '14px', fontSize: 11, color: '#444', lineHeight: 1.6, fontFamily: FONT, fontWeight: 600, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>L'IA extrait automatiquement tes informations depuis ton CV existant.</div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOverPdf(true); }}
              onDragLeave={() => setIsDragOverPdf(false)}
              onDrop={e => { e.preventDefault(); setIsDragOverPdf(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{ ...dropBase, background: isDragOverPdf ? '#FFF3CD' : '#FAFAFA', boxShadow: isDragOverPdf ? '2px 2px 0 #111' : 'none' }}
            >
              <div style={{ fontSize: 22, color: '#888', lineHeight: 1 }}>⬆</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#111', fontFamily: FONT }}>Glisse ton CV ici</div>
              <div style={{ fontSize: 10, color: '#888', fontFamily: FONT, fontWeight: 600 }}>ou clique pour sélectionner un PDF</div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>

        {/* BLOC 3 — LinkedIn */}
        <div style={{ border: '2px solid #111', borderRadius: 10, background: '#fff', boxShadow: '3px 3px 0 #111', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '2px solid #111', background: '#F7F6F3' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #111', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'serif', flexShrink: 0 }}>in</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#111', fontFamily: FONT }}>Profil LinkedIn</div>
          </div>
          <div style={{ padding: '14px', fontSize: 11, color: '#444', lineHeight: 1.6, fontFamily: FONT, fontWeight: 600, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#FFF3CD', border: '2px solid #111', borderRadius: 7, padding: '8px 10px', fontSize: 10, color: '#111', lineHeight: 1.6, boxShadow: '2px 2px 0 #111' }}>
              <strong style={{ color: '#E8151B', fontWeight: 800 }}>Exporter depuis LinkedIn :</strong><br />
              Profil → <strong style={{ fontWeight: 800 }}>Plus</strong> → <strong style={{ fontWeight: 800 }}>Enregistrer au format PDF</strong>
            </div>
            <div
              onClick={() => linkedinRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOverLi(true); }}
              onDragLeave={() => setIsDragOverLi(false)}
              onDrop={e => { e.preventDefault(); setIsDragOverLi(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{ ...dropBase, background: isDragOverLi ? '#FFF3CD' : '#FAFAFA', boxShadow: isDragOverLi ? '2px 2px 0 #111' : 'none' }}
            >
              <div style={{ fontSize: 22, color: '#0A66C2', fontFamily: 'serif', fontWeight: 900, lineHeight: 1 }}>in</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#111', fontFamily: FONT }}>Glisse ton export LinkedIn</div>
              <div style={{ fontSize: 10, color: '#888', fontFamily: FONT, fontWeight: 600 }}>ou clique pour sélectionner</div>
            </div>
            <input ref={linkedinRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>

      </div>

      {/* ── STATUT ── */}
      {status && (
        <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontFamily: FONT, fontWeight: 700, border: '2px solid #111', background: status.type === 'success' ? '#D4EDDA' : status.type === 'error' ? '#F8D7DA' : '#FFF3CD', color: '#111', boxShadow: '2px 2px 0 #111' }}>
          {status.type === 'success' ? '✅ ' : status.type === 'error' ? '❌ ' : '⏳ '}
          {status.msg}
        </div>
      )}
    </div>
  );
}