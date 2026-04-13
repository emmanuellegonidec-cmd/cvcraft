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
  const [isDragOver, setIsDragOver] = useState(false);
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
      setStatus({ type: 'loading', msg: 'Claude analyse ton profil...' });
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
      setStatus({ type: 'error', msg: e.message || 'Erreur lors de l\'import.' });
    }
  }

  return (
    <div style={{ fontFamily: FONT, maxWidth: 520 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
        Importe ton CV
      </div>

      {/* ── CONSEIL LINKEDIN ── */}
      <div style={{
        background: '#FFF3CD', border: '2px solid #111',
        borderRadius: 8, padding: '12px 14px', fontSize: 12,
        color: '#111', lineHeight: 1.6, marginBottom: 16,
        fontFamily: FONT, boxShadow: '2px 2px 0 #111',
      }}>
        <strong style={{ color: '#E8151B' }}>Exporter depuis LinkedIn :</strong><br />
        Profil → <strong>Plus</strong> → <strong>Enregistrer au format PDF</strong>
      </div>

      {/* ── ZONE DRAG & DROP ── */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        style={{
          border: `2px dashed ${isDragOver ? '#E8151B' : '#111'}`,
          borderRadius: 10, padding: '2.5rem',
          textAlign: 'center', cursor: 'pointer',
          background: isDragOver ? '#FFF3CD' : '#FAFAFA',
          marginBottom: 14,
          boxShadow: isDragOver ? '3px 3px 0 #111' : 'none',
          transition: 'all .15s',
        }}
      >
        <div style={{
          width: 44, height: 44, background: '#0A66C2',
          border: '2px solid #111', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', color: 'white',
          fontWeight: 900, fontFamily: 'serif',
          fontSize: 20, boxShadow: '2px 2px 0 #111',
        }}>
          in
        </div>
        <div style={{ fontWeight: 800, marginBottom: 4, fontSize: 14, fontFamily: FONT, color: '#111' }}>
          Glisse ton CV LinkedIn
        </div>
        <div style={{ fontSize: 12, color: '#666', fontFamily: FONT }}>
          ou clique pour sélectionner un PDF
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* ── STATUT IMPORT ── */}
      {status && (
        <div style={{
          marginBottom: 14, padding: '10px 14px',
          borderRadius: 8, fontSize: 13, fontFamily: FONT,
          fontWeight: 700, border: '2px solid #111',
          background: status.type === 'success' ? '#D4EDDA'
            : status.type === 'error' ? '#F8D7DA' : '#FFF3CD',
          color: '#111', boxShadow: '2px 2px 0 #111',
        }}>
          {status.type === 'success' ? '✅ ' : status.type === 'error' ? '❌ ' : '⏳ '}
          {status.msg}
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onSkip}
          style={{
            padding: '10px 20px', background: '#fff', color: '#111',
            border: '2px solid #111', borderRadius: 8, fontSize: 12,
            fontWeight: 800, fontFamily: FONT, cursor: 'pointer',
            boxShadow: '2px 2px 0 #111',
          }}
        >
          Remplir manuellement →
        </button>
      </div>

      {/* ── INFO ATS ── */}
      <div style={{
        marginTop: 20, padding: '10px 14px',
        background: '#F0FFF4', border: '1px solid #2D6A4F',
        borderRadius: 8, fontSize: 11, color: '#2D6A4F',
        fontFamily: FONT, lineHeight: 1.6,
      }}>
        ✅ <strong>Conseil ATS :</strong> Claude nettoie automatiquement les données
        importées pour qu'elles soient lisibles par les logiciels de recrutement.
      </div>
    </div>
  );
}