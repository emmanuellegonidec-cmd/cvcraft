'use client';

import { useState } from 'react';
import { CVFormData } from '@/lib/types';

const FONT = "var(--font-montserrat), 'Montserrat', sans-serif";

interface Reco { priorite?: number; impact?: string; action?: string; }
type ChoiceMode = 'accept' | 'refuse' | 'reformulate';

interface Props {
  form: CVFormData;
  recommandations?: Reco[];
  onGenerated: (cv: string) => void;
  onFormUpdate: (enriched: Partial<CVFormData>) => void;
  onNext: () => void;
}

export function Step4Generate({
  form, recommandations = [], onGenerated, onFormUpdate, onNext,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  // Arbitrage des recos : par reco (index) → { mode, text }. Absent = neutre (non traité).
  const [choices, setChoices] = useState<Record<number, { mode: ChoiceMode; text: string }>>({});

  const recos = (recommandations || []).slice().sort((a, b) => (a.priorite || 99) - (b.priorite || 99));
  const hasRecos = recos.length > 0;

  function setMode(i: number, mode: ChoiceMode) {
    setChoices(prev => {
      const cur = prev[i];
      // Recliquer sur le même choix (hors reformuler) = revenir en neutre.
      if (cur?.mode === mode && mode !== 'reformulate') {
        const n = { ...prev }; delete n[i]; return n;
      }
      const text = mode === 'reformulate' ? (cur?.text || recos[i].action || '') : (cur?.text || '');
      return { ...prev, [i]: { mode, text } };
    });
  }
  function setText(i: number, text: string) {
    setChoices(prev => ({ ...prev, [i]: { mode: 'reformulate', text } }));
  }

  const accepted = Object.values(choices).filter(c => c.mode === 'accept').length;
  const refused = Object.values(choices).filter(c => c.mode === 'refuse').length;
  const reformulated = Object.values(choices).filter(c => c.mode === 'reformulate').length;
  const undecided = recos.length - (accepted + refused + reformulated);

  async function generate() {
    setIsGenerating(true);
    setError('');
    try {
      // ⚠️ Étape UX uniquement : les choix d'arbitrage ne sont pas encore envoyés à l'IA.
      // Le branchement au prompt se fera dans une étape ultérieure.
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) onFormUpdate(json.data);
      onGenerated(json.cv);
      onNext(); // on avance vers l'écran 5 (plus de bloc debug intermédiaire)
    } catch (e: any) {
      setError(
        e.message?.includes('overloaded') || e.message?.includes('529')
          ? 'L\'IA est temporairement surchargée. Réessaie dans quelques minutes.'
          : e.message || 'Erreur lors de la génération.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const impactStyle = (impact?: string) => {
    if (impact === 'critique') return { bg: '#FFEBEE', color: '#C62828' };
    if (impact === 'majeur') return { bg: '#FFF3CD', color: '#B8900A' };
    return { bg: '#E8F5E9', color: '#2E7D32' };
  };

  const dots = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8151B', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity:.4 } 40% { transform: translateY(-8px); opacity:1 } }`}</style>
    </div>
  );

  // ── Cas SANS recos (pas d'offre / pas d'analyse ATS) : écran de génération simple ──
  if (!hasRecos) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 24, textAlign: 'center', fontFamily: FONT, padding: '0 2rem' }}>
        <div style={{ fontSize: 52 }}>⚡</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>
          Claude va rédiger et optimiser<br />ton CV pour les ATS
        </div>
        <div style={{ fontSize: 13, color: '#666', maxWidth: 420, lineHeight: 1.7 }}>
          Ton CV sera adapté au poste visé, avec un vocabulaire enrichi, tes réalisations mises en avant et les mots-clés attendus par les recruteurs.
        </div>
        <button onClick={generate} disabled={isGenerating}
          style={{ padding: '16px 48px', fontSize: 16, fontWeight: 900, fontFamily: FONT, background: isGenerating ? '#ccc' : '#E8151B', color: '#fff', border: '2px solid #111', borderRadius: 8, cursor: isGenerating ? 'not-allowed' : 'pointer', boxShadow: isGenerating ? 'none' : '4px 4px 0 #111' }}>
          {isGenerating ? '⏳ Claude rédige...' : 'Générer mon CV →'}
        </button>
        {isGenerating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {dots}
            <div style={{ fontSize: 13, color: '#888' }}>Claude analyse ton profil et rédige ton CV...</div>
          </div>
        )}
        {error && !isGenerating && (
          <div style={{ background: '#F8D7DA', border: '2px solid #111', borderRadius: 8, padding: '12px 16px', color: '#111', fontSize: 13, fontWeight: 700, boxShadow: '2px 2px 0 #111', maxWidth: 420 }}>
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // ── Cas AVEC recos : arbitrage ──
  return (
    <div style={{ fontFamily: FONT, maxWidth: 820, margin: '0 auto', padding: '0.25rem 0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#111', textAlign: 'center', marginBottom: 4 }}>
        Choisis les améliorations à appliquer
      </div>
      <div style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 }}>
        L&apos;IA n&apos;optimisera ton CV que selon TES choix ci-dessous.
      </div>

      {recos.map((r, i) => {
        const mode = choices[i]?.mode;
        const imp = impactStyle(r.impact);
        const border = mode === 'accept' ? '#1A7A4A' : mode === 'reformulate' ? '#1B4F72' : mode === 'refuse' ? '#ccc' : '#111';
        return (
          <div key={i} style={{
            border: `2px solid ${border}`, borderRadius: 10,
            background: mode === 'refuse' ? '#F7F6F3' : '#fff',
            boxShadow: mode === 'refuse' ? 'none' : `3px 3px 0 ${border}`,
            padding: 14, marginBottom: 12, opacity: mode === 'refuse' ? 0.7 : 1,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 5, background: imp.bg, color: imp.color, textTransform: 'uppercase', flexShrink: 0, marginTop: 2, fontFamily: FONT }}>
                {r.impact || 'à faire'}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: mode === 'refuse' ? '#999' : '#222', textDecoration: mode === 'refuse' ? 'line-through' : 'none', fontFamily: FONT }}>
                {r.action}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([['accept', '✅ Accepter', '✅ Accepté', '#1A7A4A'], ['refuse', '❌ Refuser', '❌ Refusé', '#E8151B'], ['reformulate', '✍️ Reformuler', '✍️ Reformuler', '#1B4F72']] as [ChoiceMode, string, string, string][]).map(([m, label, activeLabel, col]) => {
                const active = mode === m;
                return (
                  <button key={m} onClick={() => setMode(i, m)}
                    style={{ background: active ? col : '#fff', color: active ? '#fff' : '#555', border: `2px solid ${active ? '#111' : '#ddd'}`, borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', boxShadow: active ? '2px 2px 0 #111' : 'none' }}>
                    {active ? activeLabel : label}
                  </button>
                );
              })}
            </div>
            {mode === 'reformulate' && (
              <textarea
                value={choices[i]?.text || ''}
                onChange={e => setText(i, e.target.value)}
                rows={2}
                placeholder="Réécris l'amélioration à ta façon..."
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, border: '2px solid #111', borderRadius: 6, padding: 8, fontSize: 12, fontFamily: FONT, resize: 'vertical', color: '#111', outline: 'none' }}
              />
            )}
          </div>
        );
      })}

      {/* Barre de génération */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#666', fontWeight: 700, fontFamily: FONT }}>
          {accepted} acceptée{accepted > 1 ? 's' : ''} · {reformulated} reformulée{reformulated > 1 ? 's' : ''} · {refused} refusée{refused > 1 ? 's' : ''}
          {undecided > 0 && <span style={{ color: '#B8900A' }}> · {undecided} à traiter</span>}
        </div>
        <button onClick={generate} disabled={isGenerating}
          style={{ background: isGenerating ? '#ccc' : '#E8151B', color: '#fff', border: '2px solid #111', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 900, fontFamily: FONT, cursor: isGenerating ? 'not-allowed' : 'pointer', boxShadow: isGenerating ? 'none' : '4px 4px 0 #111' }}>
          {isGenerating ? '⏳ Claude rédige...' : 'Générer mon CV →'}
        </button>
      </div>

      {error && !isGenerating && (
        <div style={{ marginTop: 14, background: '#F8D7DA', border: '2px solid #111', borderRadius: 8, padding: '12px 16px', color: '#111', fontSize: 13, fontFamily: FONT, fontWeight: 700, boxShadow: '2px 2px 0 #111' }}>
          ❌ {error}
        </div>
      )}
      {isGenerating && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {dots}
          <div style={{ fontSize: 13, color: '#888', fontFamily: FONT }}>Claude rédige ton CV optimisé...</div>
        </div>
      )}
    </div>
  );
}
