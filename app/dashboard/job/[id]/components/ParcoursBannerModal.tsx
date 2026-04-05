'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  jobId: string;
  status: string;
  stepDates: Record<string, string> | null | undefined;
};

export default function ParcoursBannerModal({ jobId, status, stepDates }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Affiche la modale si le job est en cours et qu'aucune étape n'a été validée
    const hasSteps = stepDates && Object.keys(stepDates).length > 0;
    if (status === 'in_progress' && !hasSteps) {
      // Petit délai pour ne pas bloquer le rendu de la page
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [status, stepDates]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,14,12,0.55)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={() => setVisible(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '3px solid #111',
          borderRadius: 14,
          boxShadow: '6px 6px 0 #111',
          padding: '2rem',
          maxWidth: 480,
          width: '100%',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        {/* Icône + titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: '#F5C400', border: '2px solid #111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            👋
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#111', lineHeight: 1.3 }}>
            Le parcours n&apos;est pas encore renseigné
          </div>
        </div>

        {/* Message */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#444', lineHeight: 1.7, marginBottom: 20 }}>
          Cette candidature a été ajoutée directement en <strong>&quot;En cours&quot;</strong> sans passer par les étapes.
          <br /><br />
          Pour que Jean vous accompagne vraiment, il faut <strong>repartir du début</strong> et valider chaque étape
          une par une depuis le parcours de candidature ci-dessous :
          <br />
          <span style={{ color: '#B8900A', fontWeight: 800 }}>
            Envie de postuler → Postulé → étape en cours
          </span>
        </div>

        {/* Étapes visuelles */}
        <div style={{
          background: '#FAFAFA', border: '1.5px solid #E0E0E0',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {[
            { label: 'Envie de postuler', color: '#888' },
            { label: 'Postulé', color: '#1A6FDB' },
            { label: 'Votre étape en cours (ex : Entretien téléphonique)', color: '#B8900A' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: step.color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setVisible(false)}
            style={{
              flex: 1, padding: '10px', fontSize: 12, fontWeight: 700,
              background: '#fff', border: '2px solid #CCC', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', color: '#888',
            }}
          >
            Fermer
          </button>
          <button
            onClick={() => {
              setVisible(false);
              // Scroll vers le parcours de candidature
              const el = document.getElementById('parcours-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            style={{
              flex: 2, padding: '10px', fontSize: 12, fontWeight: 800,
              background: '#F5C400', border: '2px solid #111', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', color: '#111',
              boxShadow: '3px 3px 0 #111',
            }}
          >
            Mettre à jour le parcours →
          </button>
        </div>
      </div>
    </div>
  );
}
