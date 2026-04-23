'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CVFormData } from '@/lib/types';
import { TemplateId, FontId } from '@/lib/cv-config';
import RgpdConsentModal from '@/components/RgpdConsentModal';
import SecureStorageNotice from '@/components/SecureStorageNotice';

const FONT = 'Montserrat, sans-serif';

interface Props {
  form: CVFormData;
  template: TemplateId;
  accentColor: string;
  font: FontId;
  generatedCV: string;
  cvTitle: string;
  cvId?: string;
  onDownloadPdf: () => void;
  onTitleChange: (title: string) => void;
}

export function Step6Save({
  form, template, accentColor, font,
  generatedCV, cvTitle, cvId,
  onDownloadPdf, onTitleChange,
}: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [savedId, setSavedId] = useState(cvId || '');
  const [rgpdModalOpen, setRgpdModalOpen] = useState(false);

  // Clic sur "Sauvegarder" → ouvre la modale RGPD au lieu de sauvegarder directement
  function handleSaveClick() {
    setRgpdModalOpen(true);
  }

  // Vraie fonction de sauvegarde, appelée APRÈS acceptation du consentement RGPD
  async function saveCV() {
    setRgpdModalOpen(false);
    setIsSaving(true);
    setSaveMsg('');

    try {
      const token = (window as any).__jfmj_token || '';
      const res = await fetch('/api/cvs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: savedId || undefined,
          title: cvTitle,
          template,
          content: generatedCV || '',
          form_data: {
            ...form,
            experiences: form.experiences || [],
            education: form.education || [],
            skills: form.skills || '',
            accentColor,
            font,
          },
        }),
      });

      // Lecture défensive du body : on récupère le texte brut,
      // puis on tente de le parser en JSON. Ça évite le crash
      // "Unexpected end of JSON input" si la réponse est vide ou malformée.
      const rawText = await res.text();
      let json: any = null;
      if (rawText) {
        try {
          json = JSON.parse(rawText);
        } catch {
          // Réponse non-JSON (probablement une page d'erreur HTML serveur)
          json = null;
        }
      }

      if (!res.ok) {
        // On affiche le message d'erreur du serveur s'il existe,
        // sinon un message générique basé sur le code HTTP.
        const serverMsg = json?.error || json?.message;
        throw new Error(
          serverMsg || `Erreur serveur (${res.status}${res.statusText ? ' ' + res.statusText : ''})`
        );
      }

      // Succès — on essaie de récupérer l'ID du CV créé
      setSaveMsg('✅ Sauvegardé !');
      if (!savedId && json?.cv?.id) {
        setSavedId(json.cv.id);
        router.replace(`/dashboard/editor?id=${json.cv.id}`);
      }
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) {
      const msg = e?.message || 'Erreur inconnue';
      setSaveMsg('❌ Erreur : ' + msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 420, gap: 20, textAlign: 'center',
        fontFamily: FONT, padding: '0 2rem',
      }}>

        {/* Icône succès */}
        <div style={{ fontSize: 52 }}>✦</div>

        {/* Titre */}
        <div style={{ fontSize: 20, fontWeight: 900, color: '#111', fontFamily: FONT }}>
          Ton CV est prêt !
        </div>

        {/* Nom du fichier */}
        <div style={{
          background: '#FAFAFA', border: '2px solid #111',
          borderRadius: 8, padding: '14px 18px',
          boxShadow: '2px 2px 0 #111', width: '100%', maxWidth: 440,
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT, color: '#111', marginBottom: 8 }}>
            Nom du CV
          </div>
          <input
            value={cvTitle}
            onChange={e => onTitleChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', fontSize: 13,
              fontFamily: FONT, border: '2px solid #111',
              borderRadius: 6, background: '#fff', color: '#111',
              outline: 'none', boxSizing: 'border-box' as const,
              fontWeight: 700,
            }}
            placeholder="CV — Jean Dupont"
          />
          <div style={{ fontSize: 10, color: '#888', fontFamily: FONT, marginTop: 6 }}>
            Ce nom sera utilisé comme nom de fichier PDF
          </div>
        </div>

        {/* Boutons principaux */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            style={{
              padding: '14px 28px', border: '2px solid #111',
              borderRadius: 8, fontSize: 14, fontWeight: 800,
              fontFamily: FONT, background: '#fff', color: '#111',
              boxShadow: '3px 3px 0 #111', cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1, transition: 'all .15s',
            }}
          >
            {isSaving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>

          <button
            onClick={onDownloadPdf}
            style={{
              padding: '14px 28px', border: '2px solid #111',
              borderRadius: 8, fontSize: 14, fontWeight: 800,
              fontFamily: FONT, background: '#F5C400', color: '#111',
              boxShadow: '3px 3px 0 #111', cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            ↓ Télécharger PDF
          </button>
        </div>

        {/* Notice RGPD permanente */}
        <SecureStorageNotice style={{ maxWidth: 440, textAlign: 'center' }} />

        {/* Message sauvegarde */}
        {saveMsg && (
          <div style={{
            padding: '10px 18px', borderRadius: 8,
            fontSize: 13, fontFamily: FONT, fontWeight: 700,
            border: '2px solid #111',
            background: saveMsg.startsWith('✅') ? '#D4EDDA' : '#F8D7DA',
            color: '#111', boxShadow: '2px 2px 0 #111',
          }}>
            {saveMsg}
          </div>
        )}

        {/* Récap template */}
        <div style={{
          background: '#FAFAFA', border: '2px solid #111',
          borderRadius: 8, padding: '14px 18px',
          fontSize: 11, color: '#555', fontFamily: FONT,
          lineHeight: 1.8, textAlign: 'left',
          boxShadow: '2px 2px 0 #111', width: '100%', maxWidth: 440,
        }}>
          <div style={{ fontWeight: 900, color: '#111', marginBottom: 8, fontSize: 12 }}>
            Récap de ton CV
          </div>
          <div>🎨 Template : <strong style={{ textTransform: 'capitalize' }}>{template}</strong></div>
          <div>🖊 Police : <strong>{font}</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🎨 Couleur :
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: accentColor, border: '1px solid #111', display: 'inline-block', marginLeft: 4 }} />
            <strong>{accentColor}</strong>
          </div>
          <div>💼 {(form.experiences || []).length} expérience(s)</div>
          <div>🎓 {(form.education || []).length} formation(s)</div>
          {form.skills && <div>🛠 {(form.skills || '').split(',').filter(Boolean).length} compétence(s)</div>}
        </div>

        {/* Actions secondaires */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 20px', border: '2px solid #111',
              borderRadius: 8, fontSize: 12, fontWeight: 800,
              fontFamily: FONT, background: '#fff', color: '#111',
              boxShadow: '2px 2px 0 #111', cursor: 'pointer',
            }}
          >
            ← Retour au tableau de bord
          </button>

          <button
            onClick={() => router.push('/dashboard/editor')}
            style={{
              padding: '10px 20px', border: '2px solid #111',
              borderRadius: 8, fontSize: 12, fontWeight: 800,
              fontFamily: FONT, background: '#F7F6F3', color: '#111',
              boxShadow: '2px 2px 0 #111', cursor: 'pointer',
            }}
          >
            + Créer un nouveau CV
          </button>
        </div>

      </div>

      {/* Modale RGPD — s'affiche avant chaque sauvegarde */}
      <RgpdConsentModal
        isOpen={rgpdModalOpen}
        onClose={() => setRgpdModalOpen(false)}
        onAccept={saveCV}
        documentType="CV"
      />
    </>
  );
}
