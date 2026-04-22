'use client';

import { useRef, useState } from 'react';
import { CVFormData } from '@/lib/types';

const FONT = 'Montserrat, sans-serif';

interface Props {
  form: CVFormData;
  onFormChange: (form: CVFormData) => void;
  onImportSuccess: (data: Partial<CVFormData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function Step2Import({ form, onFormChange, onImportSuccess, onNext, onSkip }: Props) {
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
    setStatus({ type: 'loading', msg: 'L\'IA analyse ton CV...' });
    try {
      // ⚠️ Claude Vision : on envoie le PDF directement à Claude qui le lit visuellement.
      // Bien plus fiable que pdfjs pour les layouts complexes (Canva, multi-colonnes, icônes).
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Format : "data:application/pdf;base64,XXXXX" — on ne garde que XXXXX
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
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
    padding: '24px 10px', textAlign: 'center',
    cursor: 'pointer', flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all .15s',
  };

  const blocStyle: React.CSSProperties = {
    border: '2px solid #111', borderRadius: 10,
    background: '#fff', boxShadow: '3px 3px 0 #111',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  };

  const blocHeadStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderBottom: '2px solid #111',
    background: '#F7F6F3',
  };

  const blocBodyStyle: React.CSSProperties = {
    padding: '16px', fontSize: 13, color: '#444',
    lineHeight: 1.6, fontFamily: FONT, fontWeight: 600,
    flex: 1, display: 'flex', flexDirection: 'column', gap: 14,
  };

  return (
    <div style={{ fontFamily: FONT }}>

      {/* ── BARRE PARAMÉTRAGE IA (déplacée ici depuis l'étape 3) ── */}
      <div style={{
        background: '#fff', border: '2px solid #111', borderRadius: 10,
        padding: '16px 20px', marginBottom: 22, boxShadow: '3px 3px 0 #111',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#111', fontFamily: FONT, marginBottom: 12,
        }}>
          ⚡ Paramétrage de l'optimisation IA
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, color: '#111', fontFamily: FONT }}>Poste visé (optimise le CV)</label>
            <input
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: FONT, border: '2px solid #111', borderRadius: 6, background: '#fff', color: '#111', outline: 'none', boxSizing: 'border-box' }}
              value={form.targetJob || ''}
              onChange={e => onFormChange({ ...form, targetJob: e.target.value })}
              placeholder="Directrice Marketing dans une scale-up"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, color: '#111', fontFamily: FONT }}>Langue du CV</label>
            <select
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: FONT, border: '2px solid #111', borderRadius: 6, background: '#fff', color: '#111', outline: 'none', boxSizing: 'border-box' }}
              value={form.lang || 'français'}
              onChange={e => onFormChange({ ...form, lang: e.target.value })}
            >
              <option value="français">Français</option>
              <option value="anglais">Anglais</option>
              <option value="espagnol">Espagnol</option>
              <option value="allemand">Allemand</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, color: '#111', fontFamily: FONT }}>Ton</label>
            <select
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: FONT, border: '2px solid #111', borderRadius: 6, background: '#fff', color: '#111', outline: 'none', boxSizing: 'border-box' }}
              value={form.tone || 'professionnel'}
              onChange={e => onFormChange({ ...form, tone: e.target.value })}
            >
              <option value="professionnel">Professionnel</option>
              <option value="moderne et dynamique">Dynamique</option>
              <option value="académique">Académique</option>
              <option value="créatif">Créatif</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT, marginBottom: 16 }}>
        Importe ton CV
      </div>

      {/* ── CONSEIL ATS ── */}
      <div style={{ background: '#F0FFF4', border: '1.5px solid #2D6A4F', borderRadius: 8, padding: '12px 16px', marginBottom: 22, fontSize: 13, color: '#2D6A4F', lineHeight: 1.6, fontFamily: FONT, fontWeight: 600 }}>
        ✅ <strong style={{ fontWeight: 800 }}>Conseil ATS :</strong> L'IA nettoie automatiquement les données importées pour qu'elles soient lisibles par les logiciels de recrutement.
      </div>

      {/* ── 3 BLOCS EN COLONNES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* BLOC 1 — Remplir manuellement */}
        <div style={blocStyle}>
          <div style={blocHeadStyle}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #111', background: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>✏</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontFamily: FONT }}>Remplir manuellement</div>
          </div>
          <div style={blocBodyStyle}>
            <div>Tu saisis tes informations directement dans le formulaire à l'étape suivante.</div>
            <button
              onClick={onSkip}
              style={{ display: 'block', padding: '10px 14px', border: '2px solid #111', borderRadius: 7, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '2px 2px 0 #111', background: '#fff', color: '#111', textAlign: 'center', fontFamily: FONT, width: '100%' }}
            >
              Continuer sans importer →
            </button>
          </div>
        </div>

        {/* BLOC 2 — Importer un CV PDF */}
        <div style={blocStyle}>
          <div style={blocHeadStyle}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #111', background: '#E8F4FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontFamily: FONT }}>Importer un CV PDF</div>
          </div>
          <div style={blocBodyStyle}>
            <div>L'IA extrait automatiquement tes informations depuis ton CV existant.</div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOverPdf(true); }}
              onDragLeave={() => setIsDragOverPdf(false)}
              onDrop={e => { e.preventDefault(); setIsDragOverPdf(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{ ...dropBase, background: isDragOverPdf ? '#FFF3CD' : '#FAFAFA', boxShadow: isDragOverPdf ? '2px 2px 0 #111' : 'none' }}
            >
              <div style={{ fontSize: 26, color: '#888', lineHeight: 1 }}>⬆</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111', fontFamily: FONT }}>Glisse ton CV ici</div>
              <div style={{ fontSize: 12, color: '#888', fontFamily: FONT, fontWeight: 600 }}>ou clique pour sélectionner un PDF</div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>

        {/* BLOC 3 — LinkedIn */}
        <div style={blocStyle}>
          <div style={blocHeadStyle}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #111', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: 'serif', flexShrink: 0 }}>in</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontFamily: FONT }}>Profil LinkedIn</div>
          </div>
          <div style={blocBodyStyle}>
            <div style={{ background: '#FFF3CD', border: '2px solid #111', borderRadius: 7, padding: '10px 12px', fontSize: 12, color: '#111', lineHeight: 1.6, boxShadow: '2px 2px 0 #111' }}>
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
              <div style={{ fontSize: 26, color: '#0A66C2', fontFamily: 'serif', fontWeight: 900, lineHeight: 1 }}>in</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111', fontFamily: FONT }}>Glisse ton export LinkedIn</div>
              <div style={{ fontSize: 12, color: '#888', fontFamily: FONT, fontWeight: 600 }}>ou clique pour sélectionner</div>
            </div>
            <input ref={linkedinRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>

      </div>

      {/* ── STATUT ── */}
      {status && (
        <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 14, fontFamily: FONT, fontWeight: 700, border: '2px solid #111', background: status.type === 'success' ? '#D4EDDA' : status.type === 'error' ? '#F8D7DA' : '#FFF3CD', color: '#111', boxShadow: '2px 2px 0 #111' }}>
          {status.type === 'success' ? '✅ ' : status.type === 'error' ? '❌ ' : '⏳ '}
          {status.msg}
        </div>
      )}
    </div>
  );
}
