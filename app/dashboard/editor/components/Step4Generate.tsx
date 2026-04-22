'use client';

import { useState } from 'react';
import { CVFormData } from '@/lib/types';

const FONT = 'Montserrat, sans-serif';

interface Props {
  form: CVFormData;
  onGenerated: (cv: string) => void;
  onFormUpdate: (enriched: Partial<CVFormData>) => void;
  onNext: () => void;
}

export function Step4Generate({ form, onGenerated, onFormUpdate, onNext }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  async function generate() {
    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      // L'API renvoie maintenant { data: CVFormData enrichi, cv: markdown lisible }.
      // On met à jour `form` avec les champs enrichis (summary, experiences[].description, skills)
      // pour que les templates PDF reflètent la version optimisée par l'IA.
      if (json.data) onFormUpdate(json.data);
      onGenerated(json.cv);
      // 🐞 DEBUG TEMPORAIRE : capture avant/après pour diagnostiquer
      setDebugInfo({
        inputSummary: form.summary || '(vide)',
        outputSummary: json.data?.summary || '(manquant dans réponse)',
        inputFirstExpDesc: form.experiences?.[0]?.description || '(vide)',
        outputFirstExpDesc: json.data?.experiences?.[0]?.description || '(manquant dans réponse)',
        inputSkills: form.skills || '(vide)',
        outputSkills: json.data?.skills || '(manquant dans réponse)',
        hasData: !!json.data,
        rawCvPreview: (json.cv || '').substring(0, 200),
      });
      // Auto-next désactivé en mode debug pour qu'on puisse lire les infos
      // onNext();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: 420, gap: 24, textAlign: 'center',
      fontFamily: FONT, padding: '0 2rem',
    }}>

      {/* Icône */}
      <div style={{ fontSize: 52 }}>⚡</div>

      {/* Titre */}
      <div style={{ fontSize: 18, fontWeight: 900, color: '#111', fontFamily: FONT }}>
        Claude va rédiger et optimiser<br />ton CV pour les ATS
      </div>

      {/* Description */}
      <div style={{
        fontSize: 13, color: '#666', fontFamily: FONT,
        maxWidth: 420, lineHeight: 1.7,
      }}>
        Ton CV sera adapté au poste visé, avec un vocabulaire
        enrichi, tes réalisations mises en avant et les
        mots-clés attendus par les recruteurs.
      </div>


      {/* Bouton */}
      <button
        onClick={generate}
        disabled={isGenerating}
        style={{
          padding: '16px 48px', fontSize: 16, fontWeight: 900,
          fontFamily: FONT,
          background: isGenerating ? '#ccc' : '#E8151B',
          color: '#fff', border: '2px solid #111',
          borderRadius: 8, cursor: isGenerating ? 'not-allowed' : 'pointer',
          boxShadow: isGenerating ? 'none' : '4px 4px 0 #111',
          transition: 'all .15s',
        }}
      >
        {isGenerating ? '⏳ Claude rédige...' : 'Générer mon CV →'}
      </button>

      {/* Animation */}
      {isGenerating && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#E8151B',
                animation: 'bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#888', fontFamily: FONT }}>
            Claude analyse ton profil et rédige ton CV...
          </div>
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: .4; }
              40% { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Erreur */}
      {error && !isGenerating && (
        <div style={{
          background: '#F8D7DA', border: '2px solid #111',
          borderRadius: 8, padding: '12px 16px',
          color: '#111', fontSize: 13, fontFamily: FONT,
          fontWeight: 700, boxShadow: '2px 2px 0 #111',
          maxWidth: 420,
        }}>
          ❌ {error}
        </div>
      )}

      {/* 🐞 DEBUG TEMPORAIRE — à retirer après diagnostic */}
      {debugInfo && (
        <div style={{
          background: '#FFF9E6', border: '2px solid #E8151B',
          borderRadius: 8, padding: '16px 20px',
          fontSize: 11, fontFamily: 'monospace',
          lineHeight: 1.5, textAlign: 'left',
          boxShadow: '3px 3px 0 #111', width: '100%', maxWidth: 700,
        }}>
          <div style={{ fontWeight: 900, color: '#E8151B', marginBottom: 10, fontSize: 13, fontFamily: FONT }}>
            🐞 DEBUG — réponse de l'IA
          </div>
          <div style={{ marginBottom: 8 }}><strong>hasData:</strong> {String(debugInfo.hasData)}</div>

          <div style={{ marginTop: 12, fontWeight: 700, color: '#E8151B' }}>SUMMARY</div>
          <div><strong>Avant (input) :</strong> {debugInfo.inputSummary}</div>
          <div><strong>Après (IA) :</strong> {debugInfo.outputSummary}</div>
          <div style={{ marginTop: 4, color: debugInfo.inputSummary === debugInfo.outputSummary ? '#E8151B' : '#1A7A4A', fontWeight: 700 }}>
            {debugInfo.inputSummary === debugInfo.outputSummary ? '⚠️ IDENTIQUE' : '✅ TRANSFORMÉ'}
          </div>

          <div style={{ marginTop: 12, fontWeight: 700, color: '#E8151B' }}>1ère EXPÉRIENCE (description)</div>
          <div><strong>Avant :</strong> {debugInfo.inputFirstExpDesc}</div>
          <div><strong>Après :</strong> {debugInfo.outputFirstExpDesc}</div>
          <div style={{ marginTop: 4, color: debugInfo.inputFirstExpDesc === debugInfo.outputFirstExpDesc ? '#E8151B' : '#1A7A4A', fontWeight: 700 }}>
            {debugInfo.inputFirstExpDesc === debugInfo.outputFirstExpDesc ? '⚠️ IDENTIQUE' : '✅ TRANSFORMÉ'}
          </div>

          <div style={{ marginTop: 12, fontWeight: 700, color: '#E8151B' }}>SKILLS</div>
          <div><strong>Avant :</strong> {debugInfo.inputSkills}</div>
          <div><strong>Après :</strong> {debugInfo.outputSkills}</div>
          <div style={{ marginTop: 4, color: debugInfo.inputSkills === debugInfo.outputSkills ? '#E8151B' : '#1A7A4A', fontWeight: 700 }}>
            {debugInfo.inputSkills === debugInfo.outputSkills ? '⚠️ IDENTIQUE' : '✅ TRANSFORMÉ'}
          </div>

          <button
            onClick={onNext}
            style={{
              marginTop: 16, padding: '10px 20px',
              background: '#111', color: '#fff',
              border: '2px solid #111', borderRadius: 6,
              fontSize: 13, fontWeight: 800, fontFamily: FONT,
              cursor: 'pointer', boxShadow: '2px 2px 0 #E8151B',
            }}
          >
            Continuer vers l'étape 5 →
          </button>
        </div>
      )}

      {/* Récap des données */}
      <div style={{
        background: '#FAFAFA', border: '2px solid #111',
        borderRadius: 8, padding: '14px 18px',
        fontSize: 11, color: '#555', fontFamily: FONT,
        lineHeight: 1.8, textAlign: 'left', maxWidth: 420,
        boxShadow: '2px 2px 0 #111', width: '100%',
      }}>
        <div style={{ fontWeight: 900, color: '#111', marginBottom: 6, fontSize: 12 }}>
          Récap de ton profil
        </div>
        <div>👤 <strong>{form.firstName} {form.lastName}</strong> — {form.title}</div>
        {form.targetJob && <div>🎯 Poste visé : <strong>{form.targetJob}</strong></div>}
        <div>💼 {form.experiences?.length || 0} expérience(s)</div>
        <div>🎓 {form.education?.length || 0} formation(s)</div>
        {form.skills && <div>🛠 {form.skills.split(',').filter(Boolean).length} compétence(s)</div>}
        <div>🌐 CV en <strong>{form.lang || 'français'}</strong> · Ton <strong>{form.tone || 'professionnel'}</strong></div>
      </div>

    </div>
  );
}