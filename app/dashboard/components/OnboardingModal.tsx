'use client';

import { useEffect, useState } from 'react';

const SCREENS = [
  {
    emoji: '👋',
    title: 'Bienvenue sur Jean Find My Job',
    content: (
      <div>
        <p style={{ margin: '0 0 12px' }}>
          Jean, c'est ton espace personnel pour ne plus jamais perdre le fil de ta recherche d'emploi.
        </p>
        <p style={{ margin: 0, color: '#555' }}>
          On t'explique les étapes clés en <strong>1 minute chrono</strong>. C'est parti !
        </p>
      </div>
    ),
  },
  {
    emoji: '📋',
    title: 'Ajouter une offre',
    content: (
      <div>
        <p style={{ margin: '0 0 12px' }}>
          Clique sur{' '}
          <strong style={{ background: '#F5C400', border: '1.5px solid #111', padding: '1px 7px' }}>
            + Ajouter une offre
          </strong>{' '}
          en haut du tableau de bord.
        </p>
        {[
          { icon: '🔗', label: 'Coller une URL', sub: 'LinkedIn, Indeed, Welcome to the Jungle… Jean analyse automatiquement' },
          { icon: '📄', label: 'Importer un fichier', sub: 'PDF, Word, image — l\'IA extrait les infos' },
          { icon: '✏️', label: 'Saisir à la main', sub: 'Si tu as déjà toutes les infos' },
          { icon: '⭐', label: 'Candidature spontanée', sub: 'Tu cibles une entreprise sans offre publiée', yellow: true },
        ].map((item) => (
          <div key={item.label} style={{ border: '2px solid #111', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '2px 2px 0 #111', marginBottom: 7, background: item.yellow ? '#FFFDE7' : '#fff' }}>
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: '🗂️',
    title: 'Le tableau de bord Kanban',
    content: (
      <div>
        <p style={{ margin: '0 0 12px' }}>
          Tes offres sont organisées en <strong>5 étapes</strong>. Glisse une carte d'une colonne à l'autre dès que ta situation évolue.
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { bg: '#888', label: 'Envie de postuler', cards: 1 },
            { bg: '#1A6FDB', label: 'Postulé', cards: 2 },
            { bg: '#B8900A', label: 'En cours', cards: 1 },
            { bg: '#1A7A4A', label: 'Offre reçue', cards: 0 },
            { bg: '#aaa', label: 'Archivé', cards: 0 },
          ].map((col) => (
            <div key={col.label} style={{ flex: 1 }}>
              <div style={{ background: col.bg, color: '#fff', fontSize: 9, fontWeight: 700, padding: '5px 4px', textAlign: 'center', border: '1.5px solid #111', borderBottom: 'none', lineHeight: 1.3 }}>{col.label}</div>
              <div style={{ border: '1.5px solid #111', borderTop: 'none', height: 60, background: '#fafafa', padding: 3 }}>
                {Array.from({ length: col.cards }).map((_, i) => (
                  <div key={i} style={{ background: '#fff', border: '1.5px solid #111', height: 20, marginBottom: 3, boxShadow: '1px 1px 0 #111' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    emoji: '📁',
    title: 'Chaque offre a son dossier',
    content: (
      <div>
        <p style={{ margin: '0 0 12px' }}>Clique sur une offre pour ouvrir son dossier complet. Tout est centralisé au même endroit.</p>
        {[
          { color: '#111', label: 'Ton parcours de candidature', sub: 'Les étapes franchies avec leurs dates' },
          { color: '#1A6FDB', label: 'Tes échanges', sub: 'Notes d\'entretien, questions, réponses, prochaine étape' },
          { color: '#F5C400', label: 'Tes actions par étape', sub: 'Deadline, rappel, CV envoyé, lettre de motivation' },
        ].map((item) => (
          <div key={item.label} style={{ borderLeft: `4px solid ${item.color}`, padding: '7px 10px', background: '#fafafa', marginBottom: 7, borderTop: '1px solid #eee', borderRight: '1px solid #eee', borderBottom: '1px solid #eee' }}>
            <strong style={{ fontSize: 13, display: 'block' }}>{item.label}</strong>
            <span style={{ fontSize: 11, color: '#555' }}>{item.sub}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: '📅',
    title: 'Le calendrier',
    content: (
      <div>
        <p style={{ margin: '0 0 12px' }}>
          Le calendrier affiche automatiquement tous tes entretiens et actions à venir. Vue <strong>semaine</strong> ou <strong>mois</strong>.
        </p>
        <div style={{ border: '2px solid #111', boxShadow: '3px 3px 0 #111', overflow: 'hidden' }}>
          <div style={{ background: '#111', color: '#F5C400', fontSize: 10, fontWeight: 700, padding: '5px 10px', letterSpacing: 1 }}>CALENDRIER</div>
          <div style={{ padding: 8 }}>
            {[
              { bg: '#fce8e8', bc: '#E8151B', tc: '#A32D2D', label: 'Entretien RH · Doctolib · 10h00' },
              { bg: '#ede8fc', bc: '#7C3AED', tc: '#3C3489', label: '⚡ Atelier CV · France Travail · 14h00 → 16h00' },
              { bg: '#FFFDE7', bc: '#F5C400', tc: '#633806', label: 'Offre reçue · Renault · à confirmer' },
            ].map((ev) => (
              <div key={ev.label} style={{ background: ev.bg, borderLeft: `3px solid ${ev.bc}`, padding: '5px 8px', fontSize: 11, marginBottom: 5, borderRadius: 2 }}>
                <strong style={{ color: ev.tc }}>{ev.label}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: '#555' }}>
          {[['#E8151B', 'Entretien'], ['#7C3AED', 'Action'], ['#F5C400', 'Offre reçue']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, background: c, borderRadius: 1, display: 'inline-block', border: c === '#F5C400' ? '1px solid #ccc' : 'none' }} />
              {l}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    emoji: '⚡',
    title: 'Les Actions',
    content: (
      <div>
        <p style={{ margin: '0 0 12px' }}>
          Ta recherche ne se résume pas aux candidatures. Suis tout ce qui gravite autour depuis la section <strong>Actions</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
          {['🎓 Atelier CV / Formation', '🤝 Coaching / Bilan', '📡 Networking / Salon', '🏢 RDV France Travail'].map((item) => (
            <div key={item} style={{ border: '2px solid #111', padding: '8px 10px', boxShadow: '2px 2px 0 #111', fontSize: 12, fontWeight: 600 }}>{item}</div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#555' }}>
          Chaque action apparaît en <strong style={{ color: '#7C3AED' }}>violet ⚡</strong> dans ton calendrier avec sa plage horaire.
        </p>
      </div>
    ),
  },
  {
    emoji: '🚀',
    title: "C'est parti !",
    content: (
      <div>
        <p style={{ margin: '0 0 14px' }}>Ta recherche mérite d'être bien organisée. Commence dès maintenant en ajoutant ta première offre.</p>
        <div style={{ background: '#111', color: '#F5C400', fontWeight: 900, fontSize: 20, textAlign: 'center', padding: 14, letterSpacing: 2, border: '2px solid #111' }}>
          JEAN FIND MY JOB
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 11, color: '#555', textAlign: 'center' }}>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ background: '#fff', border: '3px solid #111', boxShadow: '6px 6px 0 #111', borderRadius: 4, width: '100%', maxWidth: 500, overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ background: '#111', padding: '18px 22px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: '#F5C400', color: '#111', fontWeight: 900, fontSize: 16, padding: '3px 9px', border: '2px solid #F5C400', letterSpacing: 1 }}>JEAN</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Find My Job</span>
          </div>
          <button onClick={close} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>✕</button>
          <div style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>{screen.emoji}</div>
          <div style={{ color: '#F5C400', fontWeight: 900, fontSize: 19, marginTop: 5, lineHeight: 1.25 }}>{screen.title}</div>
        </div>

        {/* BODY */}
        <div style={{ padding: '18px 22px 6px', minHeight: 160, fontSize: 13, color: '#111', lineHeight: 1.65 }}>
          {screen.content}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '0 22px 18px' }}>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {SCREENS.map((_, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === current ? '#111' : '#ddd', border: '1.5px solid #111', display: 'inline-block' }} />
            ))}
          </div>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {current > 0 && (
              <button onClick={prev} style={{ flex: 1, padding: 10, border: '2px solid #111', background: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                ← Précédent
              </button>
            )}
            <button onClick={next} style={{ flex: 2, padding: 10, border: '2px solid #111', background: isLast ? '#111' : '#F5C400', color: isLast ? '#F5C400' : '#111', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: isLast ? '3px 3px 0 #F5C400' : '3px 3px 0 #111' }}>
              {isLast ? '+ Ajouter ma première offre →' : current === 0 ? 'Commencer →' : 'Suivant →'}
            </button>
          </div>
          <div onClick={close} style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}>
            Passer l'introduction
          </div>
        </div>
      </div>
    </div>
  );
}