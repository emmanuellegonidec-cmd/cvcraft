'use client';

import { useEffect, useState } from 'react';

const FONT = "'Montserrat', sans-serif";

const SCREENS = [
  {
    title: 'Bienvenue sur Jean Find My Job',
    content: (
      <div>
        <p style={{ margin: '0 0 12px', fontFamily: FONT }}>
          Jean, c'est ton espace personnel pour ne plus jamais perdre le fil de ta recherche d'emploi.
        </p>
        <p style={{ margin: 0, color: '#555', fontFamily: FONT }}>
          On t'explique les étapes clés en <strong>1 minute chrono</strong>. C'est parti !
        </p>
      </div>
    ),
  },
  {
    title: 'Ajouter une offre',
    content: (
      <div>
        <p style={{ margin: '0 0 12px', fontFamily: FONT }}>
          Clique sur{' '}
          <strong style={{ background: '#F5C400', border: '1.5px solid #111', padding: '1px 7px' }}>
            + Ajouter une offre
          </strong>{' '}
          en haut du tableau de bord.
        </p>
        {[
          { icon: '🔗', label: 'Coller une URL', sub: "LinkedIn, Indeed, Welcome to the Jungle… Jean analyse automatiquement" },
          { icon: '📄', label: 'Importer un fichier', sub: "PDF, Word, image — l'IA extrait les infos" },
          { icon: '✏️', label: 'Saisir à la main', sub: "Si tu as déjà toutes les infos" },
          { icon: '⭐', label: 'Candidature spontanée', sub: "Tu cibles une entreprise sans offre publiée", yellow: true },
        ].map((item) => (
          <div key={item.label} style={{ border: '2px solid #111', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '2px 2px 0 #111', marginBottom: 7, background: item.yellow ? '#FFFDE7' : '#fff', borderRadius: 8 }}>
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 1, fontFamily: FONT }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Le tableau de bord Kanban',
    content: (
      <div>
        <p style={{ margin: '0 0 14px', fontFamily: FONT }}>
          Tes offres sont organisées en <strong>5 étapes</strong>. Glisse une carte d'une colonne à l'autre dès que ta situation évolue.
        </p>
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { bg: '#888888', label: 'Envie de postuler' },
            { bg: '#1A6FDB', label: 'Postulé' },
            { bg: '#B8900A', label: 'En cours' },
            { bg: '#1A7A4A', label: 'Offre reçue' },
            { bg: '#AAAAAA', label: 'Archivé' },
          ].map((col) => (
            <div key={col.label} style={{ flex: 1, border: '2px solid #111', borderRadius: 6, overflow: 'hidden', boxShadow: '2px 2px 0 #111' }}>
              <div style={{ backgroundColor: col.bg, color: '#fff', fontSize: 9, fontWeight: 800, padding: '10px 4px', textAlign: 'center' as const, lineHeight: 1.3, fontFamily: FONT, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {col.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Chaque offre a son dossier',
    content: (
      <div>
        <p style={{ margin: '0 0 12px', fontFamily: FONT }}>Clique sur une offre pour ouvrir son dossier complet. Tout est centralisé au même endroit.</p>
        {[
          { color: '#111111', label: 'Parcours de candidature', sub: 'Les étapes franchies avec leurs dates' },
          { color: '#1A6FDB', label: 'Échanges', sub: "Notes d'entretien, questions, réponses, prochaine étape" },
          { color: '#F5C400', label: 'Actions par étape', sub: 'Deadline, rappel, CV envoyé, lettre de motivation' },
        ].map((item) => (
          <div key={item.label} style={{ borderLeft: `4px solid ${item.color}`, padding: '9px 12px', background: '#fafafa', marginBottom: 8, borderTop: '1px solid #eee', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', borderRadius: '0 8px 8px 0' }}>
            <strong style={{ fontSize: 13, display: 'block', fontFamily: FONT }}>{item.label}</strong>
            <span style={{ fontSize: 11, color: '#555', fontFamily: FONT }}>{item.sub}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Calendrier',
    content: (
      <div>
        <p style={{ margin: '0 0 12px', fontFamily: FONT }}>
          Le calendrier affiche automatiquement tous tes entretiens et actions à venir. Vue <strong>semaine</strong> ou <strong>mois</strong>.
        </p>
        <div style={{ border: '2px solid #111', boxShadow: '3px 3px 0 #111', overflow: 'hidden', borderRadius: 8 }}>
          <div style={{ background: '#111', color: '#F5C400', fontSize: 10, fontWeight: 700, padding: '6px 10px', letterSpacing: 1, fontFamily: FONT }}>CALENDRIER</div>
          <div style={{ padding: 8 }}>
            {[
              { bg: '#fce8e8', bc: '#E8151B', tc: '#A32D2D', label: 'Entretien RH · Doctolib · 10h00' },
              { bg: '#ede8fc', bc: '#7C3AED', tc: '#3C3489', label: '⚡ Atelier CV · France Travail · 14h → 16h' },
              { bg: '#FFFDE7', bc: '#F5C400', tc: '#633806', label: 'Offre reçue · Renault · à confirmer' },
            ].map((ev) => (
              <div key={ev.label} style={{ backgroundColor: ev.bg, borderLeft: `3px solid ${ev.bc}`, padding: '5px 8px', fontSize: 11, marginBottom: 5, borderRadius: 2 }}>
                <strong style={{ color: ev.tc, fontFamily: FONT }}>{ev.label}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: '#555', fontFamily: FONT }}>
          {[['#E8151B', 'Entretien'], ['#7C3AED', 'Action'], ['#F5C400', 'Offre reçue']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, backgroundColor: c, borderRadius: 2, display: 'inline-block', border: c === '#F5C400' ? '1px solid #ccc' : 'none' }} />
              {l}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Actions',
    content: (
      <div>
        <p style={{ margin: '0 0 12px', fontFamily: FONT }}>
          Ta recherche ne se résume pas aux candidatures. Suis tout ce qui gravite autour depuis la section <strong>Actions</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
          {['🎓 Atelier CV / Formation', '🤝 Coaching / Bilan', '📡 Networking / Salon', '🏢 RDV France Travail'].map((item) => (
            <div key={item} style={{ border: '2px solid #111', padding: '8px 10px', boxShadow: '2px 2px 0 #111', fontSize: 12, fontWeight: 600, borderRadius: 8, fontFamily: FONT }}>{item}</div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#555', fontFamily: FONT }}>
          Chaque action apparaît en <strong style={{ color: '#7C3AED' }}>violet ⚡</strong> dans ton calendrier avec sa plage horaire.
        </p>
      </div>
    ),
  },
  {
    title: "C'est parti !",
    content: (
      <div>
        <p style={{ margin: '0 0 16px', fontFamily: FONT }}>
          Ta recherche mérite d'être bien organisée. Commence dès maintenant en ajoutant ta première offre.
        </p>
        <div style={{ border: '2px solid #111', borderRadius: 12, padding: '20px 16px', background: '#FFFDE7', boxShadow: '3px 3px 0 #111', textAlign: 'center' as const }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#111', fontFamily: FONT, marginBottom: 4 }}>Jean Find My Job</div>
          <div style={{ fontSize: 12, color: '#555', fontFamily: FONT }}>Ton allié pour une recherche organisée</div>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 11, color: '#888', textAlign: 'center' as const, fontFamily: FONT }}>
          Des questions ? <strong style={{ color: '#111' }}>hello@jeanfindmyjob.fr</strong>
        </p>
      </div>
    ),
  },
];

const STORAGE_KEY = 'jfmj_onboarding_done';

export default function OnboardingModal({ onAddJob }: { onAddJob: () => void }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  function next() {
    if (current < SCREENS.length - 1) setCurrent(current + 1);
    else { close(); onAddJob(); }
  }

  function prev() {
    if (current > 0) setCurrent(current - 1);
  }

  if (!visible) return null;

  const screen = SCREENS[current];
  const isLast = current === SCREENS.length - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}>
      <div style={{ background: '#fff', border: '3px solid #111', boxShadow: '6px 6px 0 #111', borderRadius: 12, width: '100%', maxWidth: 500, overflow: 'hidden' }}>

        {/* HEADER blanc — logo + titre, sans emoji */}
        <div style={{ background: '#fff', borderBottom: '3px solid #111', padding: '16px 22px 14px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="Jean Find My Job"
            style={{ height: 80, width: 'auto', display: 'block' }}
          />
          <button onClick={close} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer', padding: 0 }}>✕</button>
          <div style={{ color: '#111', fontWeight: 900, fontSize: 17, marginTop: 10, lineHeight: 1.25, fontFamily: FONT }}>
            {screen.title}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '18px 22px 6px', minHeight: 160, fontSize: 13, color: '#111', lineHeight: 1.65 }}>
          {screen.content}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '0 22px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {SCREENS.map((_, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === current ? '#111' : '#ddd', border: '1.5px solid #111', display: 'inline-block' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {current > 0 && (
              <button onClick={prev} style={{ flex: 1, padding: 10, border: '2px solid #111', background: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer', borderRadius: 8 }}>
                ← Précédent
              </button>
            )}
            <button onClick={next} style={{ flex: 2, padding: 10, border: '2px solid #111', background: isLast ? '#111' : '#F5C400', color: isLast ? '#F5C400' : '#111', fontFamily: FONT, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: isLast ? '3px 3px 0 #F5C400' : '3px 3px 0 #111', borderRadius: 8 }}>
              {isLast ? '+ Ajouter ma première offre →' : current === 0 ? 'Commencer →' : 'Suivant →'}
            </button>
          </div>
          <div onClick={close} style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#aaa', cursor: 'pointer', textDecoration: 'underline', fontFamily: FONT }}>
            Passer l'introduction
          </div>
        </div>

      </div>
    </div>
  );
}