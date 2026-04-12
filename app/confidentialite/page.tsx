import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Jean find my Job',
  description: 'Politique de confidentialité et de protection des données personnelles de Jean find my Job.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/confidentialite',
  },
}

export default function ConfidentialitePage() {
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
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Politique de confidentialité</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : avril 2026</p>
        </div>

        {[
          {
            title: '1. Qui sommes-nous ?',
            content: `Jean find my Job (jeanfindmyjob.fr) est une plateforme de suivi de candidatures propulsée par l'IA Claude (Anthropic). Le responsable du traitement des données est Jean find my Job, joignable à l'adresse : hello@jeanfindmyjob.fr.`
          },
          {
            title: '2. Données collectées',
            content: `Nous collectons uniquement les données nécessaires au fonctionnement du service :
- Données de compte : adresse e-mail, mot de passe (chiffré)
- Données de candidature : offres d'emploi, notes, contacts, étapes de suivi
- Données techniques : logs de connexion, adresse IP
- Newsletter : adresse e-mail (sur inscription volontaire uniquement)`
          },
          {
            title: '3. Utilisation des données',
            content: `Vos données sont utilisées exclusivement pour :
- Faire fonctionner votre tableau de bord de candidatures
- Générer votre score ATS via l'IA (vos données ne sont pas utilisées pour entraîner des modèles)
- Vous envoyer la newsletter si vous y avez souscrit
- Améliorer le service de manière anonymisée

🔒 Engagement ferme : Jean find my Job ne vend, ne loue, ne cède et ne communique jamais vos données personnelles à des tiers, partenaires commerciaux ou annonceurs. Vos données vous appartiennent. Elles ne sont pas une marchandise. Cet engagement est conforme à l'Article 5(1)(b) du RGPD (principe de limitation des finalités) et à l'Article 44 du RGPD (interdiction de transfert sans garanties adéquates).`
          },
          {
            title: '4. Hébergement, sécurité et sous-traitants',
            content: `Vos CVs et documents sont stockés de manière chiffrée et sécurisée. L'accès est strictement limité à votre compte personnel — aucun autre utilisateur, aucun employeur, aucun recruteur ne peut y accéder.

Nos sous-traitants techniques sont soigneusement sélectionnés et liés par des obligations contractuelles de confidentialité (Article 28 du RGPD) :
- Supabase (base de données, authentification, stockage des fichiers) — chiffrement AES-256, hébergement EU
- Vercel (hébergement web) — infrastructure sécurisée, hébergement EU
- Anthropic Claude (analyse IA du score ATS) — traitement ponctuel, sans stockage de vos données
- Resend (envoi d'emails transactionnels) — conforme RGPD

Aucun de ces sous-traitants n'est autorisé à utiliser vos données à ses propres fins commerciales.`
          },
          {
           title: '5. Durée de conservation',
            content: `Vos données sont conservées tant que votre compte est actif, et au maximum 2 ans après votre dernière connexion, conformément aux recommandations de la CNIL sur la conservation des données de candidature (délibération CNIL n°2002-017 et lignes directrices RGPD — Article 5(1)(e) du Règlement UE 2016/679).

En cas de suppression de compte, toutes vos données (candidatures, CV, notes, contacts) sont définitivement effacées dans un délai de 30 jours. Vous pouvez demander la suppression immédiate à tout moment en contactant : hello@jeanfindmyjob.fr` 
          },
          {
            title: '6. Vos droits (RGPD)',
            content: `Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement (droit à l'oubli)
- Droit à la portabilité
- Droit d'opposition

Pour exercer vos droits, contactez-nous à : hello@jeanfindmyjob.fr`
          },
          {
            title: '7. Cookies',
            content: `Jean find my Job utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification) et des cookies analytiques anonymes via Google Analytics (GA4). Aucun cookie publicitaire n'est utilisé.`
          },
          {
            title: '8. Contact',
            content: `Pour toute question relative à vos données personnelles : hello@jeanfindmyjob.fr`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/cgu" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Consulter les CGU →</Link>
        </div>
      </main>
    </div>
  )
}