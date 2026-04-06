'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FONT = "'Montserrat', sans-serif";

const TOPICS = [
  {
    title: 'Ajouter une offre',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '🔗', label: 'Coller une URL', sub: 'LinkedIn, Indeed, Welcome to the Jungle… Jean analyse automatiquement' },
          { icon: '📄', label: 'Importer un fichier', sub: "PDF, Word, image — l'IA extrait les infos" },
          { icon: '✏️', label: 'Saisir à la main', sub: 'Si tu as déjà toutes les infos' },
          { icon: '⭐', label: 'Candidature spontanée', sub: 'Tu cibles une entreprise sans offre publiée', yellow: true },
        ].map((item) => (
          <div key={item.label} style={{ border: '2px solid #111', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '2px 2px 0 #111', background: item.yellow ? '#FFFDE7' : '#fff', borderRadius: 8 }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#555', fontFamily: FONT }}>{item.sub}</div>
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
        <p style={{ margin: '0 0 14px', fontFamily: FONT, fontSize: 13, color: '#555' }}>
          Tes offres sont organisées en <strong style={{ color: '#111' }}>5 étapes</strong>. Glisse une carte d'une colonne à l'autre dès que ta situation évolue.
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
              <div style={{ backgroundColor: col.bg, color: '#fff', fontSize: 9, fontWeight: 800, padding: '8px 4px', textAlign: 'center', lineHeight: 1.3, fontFamily: FONT }}>{col.label}</div>
              <div style={{ backgroundColor: '#fafafa', height: 36 }} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Le dossier par offre',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: '0 0 8px', fontFamily: FONT, fontSize: 13, color: '#555' }}>Clique sur une offre pour ouvrir son dossier complet.</p>
        {[
          { color: '#111', label: 'Parcours de candidature', sub: 'Les étapes franchies avec leurs dates' },
          { color: '#1A6FDB', label: 'Échanges', sub: "Notes d'entretien, questions, réponses, prochaine étape" },
          { color: '#F5C400', label: 'Actions par étape', sub: 'Deadline, rappel, CV envoyé, lettre de motivation' },
        ].map((item) => (
          <div key={item.label} style={{ borderLeft: `4px solid ${item.color}`, padding: '8px 12px', background: '#fafafa', borderTop: '1px solid #eee', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', borderRadius: '0 8px 8px 0' }}>
            <strong style={{ fontSize: 13, display: 'block', fontFamily: FONT }}>{item.label}</strong>
            <span style={{ fontSize: 12, color: '#555', fontFamily: FONT }}>{item.sub}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Calendrier',
    content: (
      <div>
        <p style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 13, color: '#555' }}>
          Le calendrier affiche automatiquement tous tes entretiens et actions. Vue <strong>semaine</strong> ou <strong>mois</strong>.
        </p>
        <div style={{ border: '2px solid #111', boxShadow: '3px 3px 0 #111', overflow: 'hidden', borderRadius: 8 }}>
          <div style={{ background: '#111', color: '#F5C400', fontSize: 10, fontWeight: 700, padding: '6px 10px', letterSpacing: 1, fontFamily: FONT }}>CALENDRIER</div>
          <div style={{ padding: 8 }}>
            {[
              { bg: '#fce8e8', bc: '#E8151B', tc: '#A32D2D', label: 'Entretien RH · Doctolib · 10h00' },
              { bg: '#ede8fc', bc: '#7C3AED', tc: '#3C3489', label: '⚡ Atelier CV · France Travail · 14h → 16h' },
              { bg: '#FFFDE7', bc: '#F5C400', tc: '#633806', label: 'Offre reçue · Renault · à confirmer' },
            ].map((ev) => (
              <div key={ev.label} style={{ backgroundColor: ev.bg, borderLeft: `3px solid ${ev.bc}`, padding: '5px 8px', fontSize: 12, marginBottom: 5, borderRadius: 2 }}>
                <strong style={{ color: ev.tc, fontFamily: FONT }}>{ev.label}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#555', fontFamily: FONT }}>
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
        <p style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 13, color: '#555' }}>
          Suis tout ce qui gravite autour de ta recherche depuis la section <strong style={{ color: '#111' }}>Actions</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
          {['🎓 Atelier CV / Formation', '🤝 Coaching / Bilan', '📡 Networking / Salon', '🏢 RDV France Travail'].map((item) => (
            <div key={item} style={{ border: '2px solid #111', padding: '8px 10px', boxShadow: '2px 2px 0 #111', fontSize: 12, fontWeight: 600, borderRadius: 8, fontFamily: FONT }}>{item}</div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#555', fontFamily: FONT }}>
          Chaque action apparaît en <strong style={{ color: '#7C3AED' }}>violet ⚡</strong> dans le calendrier avec sa plage horaire.
        </p>
      </div>
    ),
  },
  {
    title: 'Contacts',
    content: (
      <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
        Ajoute les personnes de ton réseau liées à ta recherche. Chaque contact peut être rattaché à une offre, avec un historique de tes échanges (appel, email, RDV, LinkedIn…).
      </p>
    ),
  },
  {
    title: 'Besoin d\'aide ?',
    content: (
      <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
        Tu as une question ou tu rencontres un problème ? Écris-nous à{' '}
        <a href="mailto:hello@jeanfindmyjob.fr" style={{ color: '#E8151B', fontWeight: 700 }}>hello@jeanfindmyjob.fr</a>.
        On te répond rapidement !
      </p>
    ),
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: FONT }}>

      {/* Sidebar simplifiée */}
      <div style={{ width: 220, background: '#111', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '20px 0' }}>
        <div style={{ padding: '0 16px 20px' }}>
          <img src="/logo.png" alt="Jean Find My Job" style={{ width: '100%', height: 'auto' }} />
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', color: '#ccc', fontFamily: FONT, fontSize: 13, fontWeight: 600 }}
        >
          ← Retour au tableau de bord
        </button>
      </div>

      {/* Contenu */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#111', fontFamily: FONT }}>❓ Centre d'aide</div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 4, fontFamily: FONT }}>Tout ce qu'il faut savoir pour bien utiliser Jean Find My Job</div>
          </div>

          {/* Accordéon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TOPICS.map((topic, i) => (
              <div key={i} style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, boxShadow: '3px 3px 0 #111', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 900, fontSize: 15, color: '#111', textAlign: 'left' }}
                >
                  <span>{topic.title}</span>
                  <span style={{ fontSize: 18, color: '#888', transform: openIndex === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                </button>
                {openIndex === i && (
                  <div style={{ padding: '0 18px 16px', borderTop: '2px solid #111' }}>
                    <div style={{ paddingTop: 14 }}>{topic.content}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA bas */}
          <div style={{ marginTop: '2rem', background: '#FFFDE7', border: '2px solid #111', borderRadius: 10, boxShadow: '3px 3px 0 #111', padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#111', fontFamily: FONT, marginBottom: 6 }}>Tu n'as pas trouvé ta réponse ?</div>
            <a href="mailto:hello@jeanfindmyjob.fr" style={{ color: '#E8151B', fontWeight: 700, fontFamily: FONT, fontSize: 14 }}>hello@jeanfindmyjob.fr</a>
          </div>
        </div>
      </main>
    </div>
  );
}