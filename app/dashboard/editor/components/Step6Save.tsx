'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CVFormData } from '@/lib/types';
import { TemplateId, FontId } from '@/lib/cv-config';
import RgpdConsentModal from '@/components/RgpdConsentModal';
import SecureStorageNotice from '@/components/SecureStorageNotice';

const FONT = "var(--font-montserrat), 'Montserrat', sans-serif";

interface Props {
  form: CVFormData;
  template: TemplateId;
  accentColor: string;
  font: FontId;
  generatedCV: string;
  cvTitle: string;
  cvId?: string;
  jobId?: string;
  originalScore?: number;
  newScore?: number | null;
  jobTitle?: string;
  onGetPdfBlob: () => Promise<Blob>;
  onDownloadPdf: () => void;
  onTitleChange: (title: string) => void;
}

export function Step6Save({
  form, template, accentColor, font,
  generatedCV, cvTitle, cvId,
  jobId, originalScore, newScore, jobTitle,
  onGetPdfBlob, onDownloadPdf, onTitleChange,
}: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [savedId, setSavedId] = useState(cvId || '');
  const [rgpdModalOpen, setRgpdModalOpen] = useState(false);

  const fromOffer = !!jobId;

  // Clic sur "Enregistrer" → on demande d'abord le consentement RGPD.
  function handleSaveClick() {
    setRgpdModalOpen(true);
  }

  // Enregistrement du CV éditable dans "Mes CV" (table cvs). Peut lever une exception.
  async function postToMesCv(skipReplace = false) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || (window as any).__jfmj_token || '';
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
    const rawText = await res.text();
    let json: any = null;
    if (rawText) { try { json = JSON.parse(rawText); } catch { json = null; } }
    if (!res.ok) {
      throw new Error(json?.error || json?.message || `Erreur serveur (${res.status})`);
    }
    if (!savedId && json?.cv?.id) {
      setSavedId(json.cv.id);
      if (!skipReplace) {
        const q = jobId ? `?id=${json.cv.id}&job_id=${jobId}` : `?id=${json.cv.id}`;
        router.replace(`/dashboard/editor${q}`);
      }
    }
  }

  // Enregistrer dans Mes CV (cas sans offre).
  async function saveToMesCv() {
    setRgpdModalOpen(false);
    setIsSaving(true);
    setSaveMsg('');
    try {
      await postToMesCv();
      setSaveMsg('✅ Enregistré dans Mes CV !');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) {
      setSaveMsg('❌ Erreur : ' + (e?.message || 'inconnue'));
    } finally {
      setIsSaving(false);
    }
  }

  // Enregistrer sur l'offre : (1) copie éditable dans Mes CV + (2) dépôt du PDF sur l'offre.
  async function saveToOffer() {
    setRgpdModalOpen(false);
    setIsSaving(true);
    setSaveMsg('');
    try {
      // 1. On garde une copie éditable dans Mes CV (sans changer l'URL, on va rediriger).
      await postToMesCv(true);

      // 2. On dépose le PDF dans le dossier de l'offre.
      //    Même convention que la page de l'offre : {userId}/{jobId}/cv.pdf (remplace le précédent).
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expirée, reconnecte-toi.');

      const blob = await onGetPdfBlob();
      const path = `${user.id}/${jobId}/cv.pdf`;

      const { error: upErr } = await supabase.storage
        .from('job-documents')
        .upload(path, blob, { contentType: 'application/pdf', upsert: true });

      if (upErr) {
        throw new Error('CV enregistré dans Mes CV, mais l\'attachement à l\'offre a échoué : ' + upErr.message);
      }

      // 3. On met à jour la fiche de l'offre : lien du CV + score après optimisation.
      //    Sans le lien, la page de l'offre affiche "Aucun fichier" même si le PDF est déposé.
      //    Le score de départ (ats_score) n'est pas touché : on garde les deux.
      const { data: signedData } = await supabase.storage
        .from('job-documents')
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      const jobUpdates: any = {};
      if (signedData?.signedUrl) jobUpdates.cv_url = signedData.signedUrl;
      if (typeof newScore === 'number') {
        jobUpdates.ats_score_optimized = newScore;
        jobUpdates.ats_score_optimized_at = new Date().toISOString();
      }

      if (Object.keys(jobUpdates).length > 0) {
        const { data: { session: sessJ } } = await supabase.auth.getSession();
        const tokenJ = sessJ?.access_token || (window as any).__jfmj_token || '';
        await fetch(`/api/jobs?id=${jobId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenJ ? { Authorization: `Bearer ${tokenJ}` } : {}),
          },
          body: JSON.stringify(jobUpdates),
        });
      }

      setSaveMsg('✅ Enregistré sur l\'offre ! Redirection...');
      setTimeout(() => router.push(`/dashboard/job/${jobId}`), 1200);
    } catch (e: any) {
      setSaveMsg('❌ ' + (e?.message || 'Erreur inconnue'));
    } finally {
      setIsSaving(false);
    }
  }

  function doSave() {
    return fromOffer ? saveToOffer() : saveToMesCv();
  }

  const showScore = fromOffer && typeof originalScore === 'number';

  const bigBtn = (bg: string, color: string): React.CSSProperties => ({
    border: '2px solid #111', borderRadius: 10, background: bg, color,
    boxShadow: '4px 4px 0 #111', padding: '16px', textAlign: 'left' as const,
    cursor: 'pointer', fontFamily: FONT, width: '100%', transition: 'all .12s',
  });

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 18, textAlign: 'center', fontFamily: FONT, padding: '0 2rem' }}>

        <div style={{ fontSize: 44 }}>✦</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#111', fontFamily: FONT }}>Ton CV est prêt !</div>

        {showScore && (
          <div style={{ fontSize: 13, color: '#555', fontFamily: FONT, fontWeight: 700 }}>
            Score ATS : {originalScore}
            {typeof newScore === 'number' && <> → <span style={{ color: '#1A7A4A', fontWeight: 900 }}>{newScore}</span></>}
            {jobTitle && <span style={{ color: '#888', fontWeight: 600 }}> · pour « {jobTitle} »</span>}
          </div>
        )}

        {/* Nom du CV */}
        <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '14px 18px', boxShadow: '2px 2px 0 #111', width: '100%', maxWidth: 460 }}>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT, color: '#111', marginBottom: 8 }}>Nom du CV</div>
          <input
            value={cvTitle}
            onChange={e => onTitleChange(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: FONT, border: '2px solid #111', borderRadius: 6, background: '#fff', color: '#111', outline: 'none', boxSizing: 'border-box' as const, fontWeight: 700 }}
            placeholder="CV — Jean Dupont"
          />
          <div style={{ fontSize: 10, color: '#888', fontFamily: FONT, marginTop: 6 }}>Ce nom sera utilisé comme nom de fichier PDF</div>
        </div>

        {/* 2 actions distinctes, côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%', maxWidth: 560 }}>
          <button onClick={handleSaveClick} disabled={isSaving}
            style={{ ...bigBtn('#1A7A4A', '#fff'), opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>
              {isSaving ? '⏳ Enregistrement...' : (fromOffer ? '📌 Enregistrer sur l\'offre' : '📌 Enregistrer dans Mes CV')}
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.95 }}>
              {fromOffer
                ? 'Rattache ce CV à ta candidature, dans ton tableau de bord.'
                : 'Garde ce CV dans ton espace pour le retrouver et le rééditer.'}
            </div>
          </button>

          <button onClick={onDownloadPdf} style={bigBtn('#F5C400', '#111')}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>⬇️ Télécharger le PDF</div>
            <div style={{ fontSize: 11, lineHeight: 1.5 }}>Le fichier à envoyer sur le site de l&apos;entreprise pour candidater.</div>
          </button>
        </div>

        {/* Notice RGPD */}
        <SecureStorageNotice style={{ maxWidth: 460, textAlign: 'center' }} />

        {/* Message */}
        {saveMsg && (
          <div style={{ padding: '10px 18px', borderRadius: 8, fontSize: 13, fontFamily: FONT, fontWeight: 700, border: '2px solid #111', background: saveMsg.startsWith('✅') ? '#D4EDDA' : '#F8D7DA', color: '#111', boxShadow: '2px 2px 0 #111', maxWidth: 560 }}>
            {saveMsg}
          </div>
        )}

        {/* Récap */}
        <div style={{ background: '#FAFAFA', border: '2px solid #111', borderRadius: 8, padding: '14px 18px', fontSize: 11, color: '#555', fontFamily: FONT, lineHeight: 1.8, textAlign: 'left', boxShadow: '2px 2px 0 #111', width: '100%', maxWidth: 460 }}>
          <div style={{ fontWeight: 900, color: '#111', marginBottom: 8, fontSize: 12 }}>Récap de ton CV</div>
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
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 20px', border: '2px solid #111', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: FONT, background: '#fff', color: '#111', boxShadow: '2px 2px 0 #111', cursor: 'pointer' }}>
            ← Retour au tableau de bord
          </button>
          <button onClick={() => router.push('/dashboard/editor')}
            style={{ padding: '10px 20px', border: '2px solid #111', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: FONT, background: '#F7F6F3', color: '#111', boxShadow: '2px 2px 0 #111', cursor: 'pointer' }}>
            + Créer un nouveau CV
          </button>
        </div>

      </div>

      {/* Modale RGPD — avant chaque enregistrement */}
      <RgpdConsentModal
        isOpen={rgpdModalOpen}
        onClose={() => setRgpdModalOpen(false)}
        onAccept={doSave}
        documentType="CV"
      />
    </>
  );
}
