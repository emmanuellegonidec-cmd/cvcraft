import type { Metadata } from 'next'
import Link from 'next/link'
import CookiePreferencesButton from './CookiePreferencesButton'

export const metadata: Metadata = {
  title: 'Politique des cookies — Jean find my Job',
  description: 'Politique des cookies de Jean find my Job : quels cookies nous utilisons, pourquoi, et comment gérer vos préférences.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/cookies',
  },
}

export default function CookiesPage() {
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
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Politique des cookies</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 25 avril 2026</p>
        </div>

        {[
          {
            title: '1. Qu\'est-ce qu\'un cookie ?',
            content: `Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, smartphone) lors de votre visite sur un site web. Il permet au site de mémoriser des informations sur votre visite, comme votre langue préférée ou votre statut de connexion, pour faciliter votre navigation et améliorer votre expérience.`
          },
          {
            title: '2. Quels cookies utilisons-nous ?',
            content: `Jean find my Job utilise deux catégories de cookies :

🔒 Cookies strictement nécessaires (toujours actifs)
Indispensables au fonctionnement du site : authentification de votre compte, mémorisation de vos préférences de cookies. Ces cookies ne nécessitent pas votre consentement (article 82 de la loi Informatique et Libertés). Sans eux, le site ne peut pas fonctionner correctement. Durée : de 1 heure à 12 mois selon leur finalité.

📊 Cookies analytiques (soumis à votre consentement)
Ces cookies, déposés via Google Analytics, nous aident à comprendre comment notre site est utilisé (pages visitées, durée, parcours) afin de l'améliorer. Ils ne sont déposés qu'après votre consentement explicite. Les données collectées sont anonymisées (adresse IP masquée). Durée : 13 mois maximum.

Aucune donnée personnelle identifiable n'est collectée. Aucun cookie publicitaire n'est utilisé sur ce site.`
          },
          {
            title: '3. Comment gérer vos préférences ?',
            content: `Vous pouvez à tout moment modifier vos choix concernant les cookies analytiques. Le retrait de votre consentement est aussi simple que son recueil — utilisez le bouton ci-dessous.

Vous pouvez également bloquer ou supprimer les cookies directement depuis les paramètres de votre navigateur (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge).

Note : refuser les cookies strictement nécessaires (notamment l'authentification) empêchera le fonctionnement du service.`
          },
          {
            title: '4. Cadre légal',
            content: `Cette politique est conforme aux exigences de la CNIL (Commission Nationale de l'Informatique et des Libertés), du RGPD (Règlement UE 2016/679) et de l'article 82 de la loi Informatique et Libertés du 6 janvier 1978 modifiée.

Conformément aux recommandations CNIL 2021, le bouton "Tout refuser" est aussi visible que le bouton "Tout accepter", aucune case n'est pré-cochée par défaut, et votre choix est mémorisé pour une durée maximale de 12 mois.`
          },
          {
            title: '5. Contact',
            content: `Pour toute question relative aux cookies ou à la protection de vos données : hello@jeanfindmyjob.fr`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <CookiePreferencesButton />
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/confidentialite" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Politique de confidentialité →</Link>
          <Link href="/cgu" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Consulter les CGU →</Link>
          <Link href="/mentions-legales" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Mentions légales →</Link>
        </div>
      </main>
    </div>
  )
}