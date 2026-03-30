'use client'

import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: "Jean find my Job est-il vraiment gratuit ?",
    a: "Oui, totalement gratuit, Jean find my Job est en phase bêta. Candidatures illimitées, toutes les fonctionnalités incluses — sans carte bancaire. Profitez-en !"
  },
  {
    q: "Comment fonctionne l'import d'offre d'emploi ?",
    a: "Il vous suffit de coller l'URL d'une offre et Jean extrait automatiquement toutes les informations : poste, entreprise, description, compétences requises. En cas de non possibilité, un formulaire à compléter s'ouvre et vous pouvez compléter l'offre manuellement."
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Vos données sont hébergées sur un serveur (infrastructure sécurisée, RGPD) et ne sont jamais partagées avec des tiers. Chaque utilisateur n'a accès qu'à ses propres candidatures."
  },
  {
    q: "Comment fonctionne le CV Creator IA ?",
    a: "En version bêta, importez votre profil LinkedIn en PDF, choisissez un template, et Claude AI rédige automatiquement des formulations percutantes pour chaque section de votre CV. Vous pouvez ensuite ajuster et exporter en PDF en un clic."
  },
  {
    q: "Puis-je suivre plusieurs candidatures en même temps ?",
    a: "Oui, sans limite. Chaque candidature dispose de son propre parcours personnalisable avec des étapes, des contacts associés, des documents et des notes. Vous visualisez tout depuis le tableau de bord global."
  },
  {
    q: "Jean find my Job fonctionne-t-il sur mobile ?",
    a: "L'interface est responsive et fonctionne sur mobile. La visualisation est néanmoins plus pertinente sur votre ordinateur."
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: '2px solid #111',
      borderRadius: 12,
      background: '#fff',
      boxShadow: open ? '4px 4px 0 #F5C400' : '3px 3px 0 #555',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.1rem 1.5rem',
          background: open ? '#FEF9E0' : '#fff',
          border: 'none',
          borderBottom: open ? '2px solid #111' : 'none',
          cursor: 'pointer',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 14,
          fontWeight: 800,
          color: '#111',
          textAlign: 'left',
          gap: 16,
          transition: 'background 0.15s',
        }}
      >
        <span>{q}</span>
        <span style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: open ? '#F5C400' : '#F4F4F4',
          border: '2px solid #111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 900,
          color: '#111',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s, background 0.15s',
          lineHeight: 1,
        }}>
          ↓
        </span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{
          padding: '1rem 1.5rem 1.25rem',
          fontSize: 13,
          color: '#555',
          lineHeight: 1.75,
          fontWeight: 500,
          fontFamily: "'Montserrat', sans-serif",
        }}>
          {a}
        </div>
      </div>
    </div>
  )
}

export default function FaqSection() {
  return (
    <section id="faq" style={{ padding: '5rem 2rem', background: '#111', borderBottom: '2.5px solid #111' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Montserrat', sans-serif" }}>Vos questions</div>
          <h2 style={{ fontSize: '2.2rem', color: '#fff', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem', fontFamily: "'Montserrat', sans-serif" }}>Foire aux questions</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: 14, fontFamily: "'Montserrat', sans-serif" }}>Tout ce que vous avez toujours voulu savoir sur Jean</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginBottom: '1rem', fontFamily: "'Montserrat', sans-serif" }}>Vous avez une autre question ?</p>
          <a
            href="mailto:hello@jeanfindmyjob.fr"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', color: '#F5C400', border: '2.5px solid #F5C400', borderRadius: 8, padding: '11px 24px', fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', boxShadow: '3px 3px 0 #F5C400', letterSpacing: '0.02em' }}
          >
            Contactez-nous →
          </a>
        </div>
      </div>
    </section>
  )
}