import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Jean find my Job",
  description: "Conditions Générales d'Utilisation de la plateforme Jean find my Job.",
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/cgu',
  },
}

export default function CguPage() {
  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#fff', borderBottom: '2.5px solid #111', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', fontWeight: 900, color: '#111' }}>
            Jean <span style={{ color: '#E8151B' }}>find my Job</span>
          </span>
        </Link>
        <Link href="/" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#111', textDecoration: 'none', fontWeight: 700 }}>← Retour à l&apos;accueil</Link>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Légal</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Conditions Générales d&apos;Utilisation</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 10 avril 2026</p>
        </div>

        {[
          {
            title: '1. Objet',
            content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Jean find my Job accessible à l'adresse jeanfindmyjob.fr. En créant un compte, vous acceptez sans réserve les présentes CGU.`
          },
          {
            title: '2. Description du service',
            content: `Jean find my Job est une plateforme en ligne de suivi de candidatures permettant à ses utilisateurs de :
- Centraliser et organiser leurs candidatures via un tableau de bord Kanban
- Suivre chaque candidature avec un parcours personnalisé
- Analyser leur CV grâce à un score ATS généré par intelligence artificielle
- Importer des offres d'emploi depuis des URL ou des fichiers`
          },
          {
            title: '3. Accès au service',
            content: `Le service est accessible gratuitement (version bêta) après création d'un compte avec une adresse e-mail valide. Jean find my Job se réserve le droit de modifier les conditions d'accès, notamment en introduisant des offres payantes, avec un préavis de 30 jours.`
          },
          {
            title: '4. Obligations de l\'utilisateur',
            content: `L'utilisateur s'engage à :
- Fournir des informations exactes lors de l'inscription
- Ne pas utiliser le service à des fins illicites ou frauduleuses
- Ne pas tenter de compromettre la sécurité de la plateforme
- Respecter les droits de propriété intellectuelle de Jean find my Job`
          },
          {
            title: '5. Données personnelles',
            content: `Le traitement de vos données personnelles est décrit dans notre Politique de Confidentialité disponible à l'adresse jeanfindmyjob.fr/confidentialite. Conformément au RGPD, vous disposez de droits sur vos données que vous pouvez exercer à : hello@jeanfindmyjob.fr`
          },
          {
            title: '6. Propriété intellectuelle',
            content: `L'ensemble des éléments constituant la plateforme (code, design, contenus, logo) sont la propriété exclusive de Jean find my Job. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.`
          },
          {
            title: '7. Limitation de responsabilité',
            content: `Jean find my Job est un outil d'aide à la recherche d'emploi. Nous ne garantissons pas l'obtention d'un emploi grâce à l'utilisation du service. Le service est fourni "en l'état" pendant la phase bêta. Jean find my Job ne peut être tenu responsable d'une interruption de service ou de la perte de données.`
          },
          {
            title: '8. Modification des CGU',
            content: `Jean find my Job se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par e-mail de toute modification substantielle. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles CGU.`
          },
          {
            title: '9. Droit applicable',
            content: `Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.`
          },
          {
            title: '10. Contact',
            content: `Pour toute question relative aux présentes CGU : hello@jeanfindmyjob.fr`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/confidentialite" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Consulter la politique de confidentialité →</Link>
        </div>
      </main>
    </div>
  )
}