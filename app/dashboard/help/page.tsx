'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FONT = "'Montserrat', sans-serif";

const TOPICS = [
  {
    icon: '📋',
    title: 'Ajouter une offre',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555', fontFamily: FONT, lineHeight: 1.6 }}>
          Clique sur <strong style={{ background: '#F5C400', padding: '1px 6px', border: '1.5px solid #111' }}>+ Ajouter une offre</strong> en haut du tableau de bord. 4 façons d'ajouter :
        </p>
        {[
          { icon: '🔗', label: 'Coller une URL', sub: 'Ajoute une url… Jean analyse automatiquement et complète par ce qui manque' },
          { icon: '📄', label: 'Importer un fichier', sub: "PDF, Word, image — l'IA extrait les infos" },
          { icon: '✏️', label: 'Saisir à la main', sub: 'Si tu as déjà toutes les infos' },
          { icon: '⭐', label: 'Candidature spontanée', sub: 'Tu cibles une entreprise sans offre publiée', yellow: true },
        ].map((item) => (
          <div key={item.label} style={{ border: '2px solid #111', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '2px 2px 0 #111', background: item.yellow ? '#FFFDE7' : '#fff', borderRadius: 8 }}>
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, fontFamily: FONT, color: '#111' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2, fontFamily: FONT }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '🗂️',
    title: 'Tableau de bord Kanban',
    content: (
      <div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555', fontFamily: FONT, lineHeight: 1.6 }}>
          Tes offres sont organisées en <strong style={{ color: '#111' }}>5 étapes</strong>. Glisse une carte d'une colonne à l'autre dès que ta situation évolue.
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { bg: '#888888', label: 'Envie de postuler' },
            { bg: '#1A6FDB', label: 'Postulé' },
            { bg: '#B8900A', label: 'En cours' },
            { bg: '#1A7A4A', label: 'Offre reçue' },
            { bg: '#AAAAAA', label: 'Archivé' },
          ].map((col) => (
            <div key={col.label} style={{ flex: 1, border: '2px solid #111', borderRadius: 6, overflow: 'hidden', boxShadow: '2px 2px 0 #111' }}>
              <div style={{ backgroundColor: col.bg, color: '#fff', fontSize: 9, fontWeight: 800, padding: '10px 4px', textAlign: 'center', lineHeight: 1.3, fontFamily: FONT }}>{col.label}</div>
              <div style={{ backgroundColor: '#fafafa', height: 40 }} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: '📁',
    title: 'Dossier par offre',
    content: (
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555', fontFamily: FONT, lineHeight: 1.6 }}>
          Clique sur une offre pour ouvrir son dossier complet. Tout est centralisé au même endroit.
        </p>
        {[
          { color: '#111', label: 'Parcours de candidature', sub: 'Les étapes franchies avec leurs dates' },
          { color: '#1A6FDB', label: 'Échanges', sub: "Notes d'entretien, questions, réponses, prochaine étape" },
          { color: '#F5C400', label: 'Actions par étape', sub: 'Deadline, rappel, CV envoyé, lettre de motivation' },
        ].map((item) => (
          <div key={item.label} style={{ borderLeft: `4px solid ${item.color}`, padding: '10px 14px', background: '#fafafa', marginBottom: 8, border: '1px solid #eee', borderLeftWidth: 4, borderLeftColor: item.color, borderLeftStyle: 'solid', borderRadius: '0 8px 8px 0' }}>
            <strong style={{ fontSize: 13, display: 'block', fontFamily: FONT, color: '#111' }}>{item.label}</strong>
            <span style={{ fontSize: 12, color: '#666', fontFamily: FONT }}>{item.sub}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '📅',
    title: 'Calendrier',
    content: (
      <div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#555', fontFamily: FONT, lineHeight: 1.6 }}>
          Le calendrier affiche automatiquement tous tes entretiens et actions à venir. Vue <strong>semaine</strong> ou <strong>mois</strong>.
        </p>
        <div style={{ border: '2px solid #111', boxShadow: '3px 3px 0 #111', overflow: 'hidden', borderRadius: 8 }}>
          <div style={{ background: '#111', color: '#F5C400', fontSize: 11, fontWeight: 800, padding: '7px 12px', letterSpacing: 1, fontFamily: FONT }}>CALENDRIER</div>
          <div style={{ padding: 10 }}>
            {[
              { bg: '#fce8e8', bc: '#E8151B', tc: '#A32D2D', label: 'Entretien RH · Doctolib · 10h00' },
              { bg: '#ede8fc', bc: '#7C3AED', tc: '#3C3489', label: '⚡ Atelier CV · France Travail · 14h → 16h' },
              { bg: '#FFFDE7', bc: '#F5C400', tc: '#633806', label: 'Offre reçue · Renault · à confirmer' },
            ].map((ev) => (
              <div key={ev.label} style={{ backgroundColor: ev.bg, borderLeft: `3px solid ${ev.bc}`, padding: '6px 10px', fontSize: 12, marginBottom: 6, borderRadius: 2 }}>
                <strong style={{ color: ev.tc, fontFamily: FONT }}>{ev.label}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#555', fontFamily: FONT, flexWrap: 'wrap' }}>
          {[['#E8151B', 'Entretien'], ['#7C3AED', 'Action'], ['#F5C400', 'Offre reçue']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, backgroundColor: c, borderRadius: 2, display: 'inline-block', border: c === '#F5C400' ? '1px solid #ccc' : 'none', flexShrink: 0 }} />
              {l}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: '⚡',
    title: 'Actions',
    content: (
      <div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#555', fontFamily: FONT, lineHeight: 1.6 }}>
          Ta recherche ne se résume pas aux candidatures. Suis tout ce qui gravite autour depuis la section <strong style={{ color: '#111' }}>Actions</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {['🎓 Atelier CV / Formation', '🤝 Coaching / Bilan', '📡 Networking / Salon', '🏢 RDV France Travail'].map((item) => (
            <div key={item} style={{ border: '2px solid #111', padding: '10px 12px', boxShadow: '2px 2px 0 #111', fontSize: 12, fontWeight: 700, borderRadius: 8, fontFamily: FONT, color: '#111' }}>{item}</div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#555', fontFamily: FONT }}>
          Chaque action apparaît en <strong style={{ color: '#7C3AED' }}>violet ⚡</strong> dans le calendrier avec sa plage horaire.
        </p>
      </div>
    ),
  },
  {
    icon: '👤',
    title: 'Contacts',
    content: (
      <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
        Ajoute les personnes de ton réseau liées à ta recherche. Chaque contact peut être rattaché à une offre, avec un historique complet de vos échanges — appel, email, RDV, LinkedIn…
      </p>
    ),
  },
  {
    icon: '✉️',
    title: 'Nous contacter',
    content: (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p style={{ margin: '0 0 16px', fontFamily: FONT, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
          Tu as une question ou tu rencontres un problème ? On te répond rapidement.
        </p>
        <a href="mailto:hello@jeanfindmyjob.fr" style={{ display: 'inline-block', background: '#111', color: '#F5C400', fontWeight: 900, fontFamily: FONT, fontSize: 14, padding: '10px 24px', border: '2px solid #111', boxShadow: '3px 3px 0 #F5C400', borderRadius: 8, textDecoration: 'none' }}>
          hello@jeanfindmyjob.fr
        </a>
      </div>
    ),
  },
];

const navBtnBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '9px 12px',
  border: 'none',
  borderLeft: '3px solid transparent',
  borderRadius: 0,
  background: 'transparent',
  color: '#888',
  fontFamily: FONT,
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'all 0.12s',
};

export default function HelpPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: FONT }}>

      {/* Sidebar */}
      <aside style={{ width: 200, minWidth: 200, background: '#0f0f0f', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, borderRight: '1px solid #1e1e1e', overflow: 'hidden' }}>

        <div onClick={() => router.push('/')} style={{ padding: '18px 16px 16px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Jean </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#F5C400' }}>find my Job</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 8px' }}>Recherche</div>
          {['Tableau de bord','Candidatures','Contacts','Entretiens','Actions','Statistiques'].map(label => (
            <button key={label} style={navBtnBase} onClick={() => router.push('/dashboard')}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
            >{label}</button>
          ))}

          <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 8px' }}>Outils</div>
          <button style={navBtnBase} onClick={() => router.push('/dashboard/synthese')}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
          >Synthèse</button>
          <button style={{ ...navBtnBase, borderLeft: '3px solid #E8151B', background: '#1c1c1c', color: '#fff', fontWeight: 700 }}>
            Help
          </button>
        </div>

        <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 10px 8px', flexShrink: 0 }}>
          <button
            onClick={() => router.push('/dashboard/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; (e.currentTarget as HTMLButtonElement).style.background = '#161616'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff', flexShrink: 0 }}>E</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Mon profil</div>
            </div>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', marginTop: 2, border: 'none', borderRadius: 6, background: 'transparent', color: '#444', fontFamily: FONT, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'color 0.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#444'}
          >⎋ Déconnexion</button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 2rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', padding: '4px 14px', borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: FONT, letterSpacing: 1, marginBottom: 14, boxShadow: '2px 2px 0 #111' }}>
              CENTRE D'AIDE
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#111', fontFamily: FONT, lineHeight: 1.15, marginBottom: 10 }}>
              Won't you please,<br />please, help me?
            </div>
            <div style={{ fontSize: 13, color: '#aaa', fontFamily: FONT }}>
              Tout ce qu'il faut savoir pour bien utiliser Jean find my Job.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TOPICS.map((topic, i) => (
              <div key={i} style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, boxShadow: openIndex === i ? '4px 4px 0 #F5C400' : '3px 3px 0 #111', overflow: 'hidden', transition: 'box-shadow 0.15s' }}>
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: openIndex === i ? '#FAFAFA' : '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 15, color: '#111', textAlign: 'left' as const, borderBottom: openIndex === i ? '2px solid #111' : 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{topic.icon}</span>
                    {topic.title}
                  </span>
                  <span style={{ fontSize: 20, color: '#aaa', transform: openIndex === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', lineHeight: 1 }}>›</span>
                </button>
                {openIndex === i && (
                  <div style={{ padding: '18px 20px' }}>
                    {topic.content}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}