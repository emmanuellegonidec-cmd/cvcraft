import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Jean find my Job',
  description: 'Comment Jean find my Job protège vos données personnelles : conservation 2 ans, chiffrement, droits RGPD, suppression de compte.',
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
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 18 avril 2026</p>
        </div>

        {[
          {
            title: '1. Qui sommes-nous ?',
            content: `Jean find my Job (jeanfindmyjob.fr) est une plateforme de suivi de candidatures propulsée par l'IA Claude (Anthropic). Le responsable du traitement des données est Jean find my Job, joignable à l'adresse : hello@jeanfindmyjob.fr.`
          },
          {
            title: '2. Données collectées',
            content: `Nous collectons uniquement les données nécessaires au fonctionnement du service :
- Données de compte : adresse e-mail, mot de passe (chiffré via bcrypt)
- Données de profil : prénom, nom, poste actuel, poste recherché, secteur, compétences, disponibilité, prétentions salariales (tous ces champs sont optionnels)
- Données de candidature : offres d'emploi suivies, notes personnelles, contacts professionnels, étapes de suivi, échanges (emails, comptes-rendus d'entretiens)
- Documents : CV et lettres de motivation, qu'ils soient uploadés par vos soins depuis la fiche d'une offre ou générés via notre éditeur CV
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
- Supabase (base de données, authentification, stockage des fichiers) — chiffrement AES-256, hébergement en Union Européenne (région eu-west-1)
- Vercel (hébergement web) — infrastructure sécurisée avec hébergement en Union Européenne
- Anthropic Claude (analyse IA du score ATS) — société américaine, traitement ponctuel des données aux États-Unis, sans stockage de vos données au-delà de la requête
- Resend (envoi d'emails transactionnels) — société américaine, routage des emails via leurs serveurs

Aucun de ces sous-traitants n'est autorisé à utiliser vos données à ses propres fins commerciales.

🌍 Transferts de données hors Union Européenne : deux de nos sous-traitants (Anthropic et Resend) sont des sociétés américaines qui traitent ou routent des données aux États-Unis. Ces transferts sont limités au strict nécessaire au fonctionnement du service (génération du score ATS, envoi d'emails de confirmation) et encadrés par les garanties appropriées prévues aux articles 44 à 49 du RGPD, notamment les Clauses Contractuelles Types (CCT) de la Commission Européenne et, le cas échéant, la certification au Data Privacy Framework UE-US. Vous disposez d'un droit d'opposition à ces transferts (voir section 7).`
          },
          {
            title: '5. Durée de conservation',
            content: `Vos données sont conservées tant que votre compte est actif, et au maximum 2 ans après votre dernière connexion, conformément aux recommandations de la CNIL sur la conservation des données de candidature (délibération CNIL n°2002-017 et lignes directrices RGPD — Article 5(1)(e) du Règlement UE 2016/679).

En cas de suppression de compte, toutes vos données (candidatures, CV, notes, contacts) sont définitivement effacées dans un délai de 30 jours. Vous pouvez demander la suppression immédiate à tout moment en contactant : hello@jeanfindmyjob.fr`
          },
          {
            title: '6. Consentement explicite pour les documents (CV et lettres de motivation)',
            content: `Lors de l'upload d'un CV, d'une lettre de motivation ou de la création d'un CV via notre éditeur, un consentement explicite vous est demandé avant tout enregistrement sur nos serveurs.

Cette demande de consentement vous informe :
- De la nature sécurisée du stockage (base de données chiffrée AES-256, hébergée en Union Européenne via Supabase)
- De la durée de conservation (2 ans après votre dernière connexion)
- De vos droits (consultation, modification, suppression — voir section 7 ci-dessous)
- Du lien vers la présente politique de confidentialité

Vous devez cocher explicitement la case "J'ai lu et j'accepte les mentions légales" pour que votre document soit enregistré. Sans ce consentement, aucun document n'est stocké sur nos serveurs.

Ce consentement est renouvelé à chaque upload afin de vous garantir une information claire et actuelle à chaque action sensible, conformément à l'Article 7 du RGPD (conditions applicables au consentement).`
          },
          {
            title: '7. Vos droits (RGPD) et comment les exercer',
            content: `Conformément au Règlement Général sur la Protection des Données (Règlement UE 2016/679, articles 15 à 22), vous disposez des droits suivants sur vos données personnelles :

🔍 Droit d'accès (article 15) — consulter l'ensemble des données que nous détenons à votre sujet.
• Procédure : accessible directement depuis votre espace personnel sur /dashboard/profile. Pour une copie complète au format exportable, contactez-nous à hello@jeanfindmyjob.fr.

✏️ Droit de rectification (article 16) — modifier vos données inexactes ou incomplètes.
• Procédure : modifiable directement depuis /dashboard/profile (informations personnelles, CV, candidatures, contacts). Pour toute donnée non modifiable depuis l'interface, contactez-nous.

🗑️ Droit à l'effacement (article 17) — demander la suppression de vos données ("droit à l'oubli").
• Procédure : supprimez votre compte depuis /dashboard/profile (zone de danger en bas de page, saisie de "SUPPRIMER" pour confirmation). L'effacement complet est effectué sous 30 jours. Pour une suppression immédiate, contactez-nous.

📦 Droit à la portabilité (article 20) — récupérer vos données dans un format lisible et transférable.
• Procédure : demande par email à hello@jeanfindmyjob.fr — nous vous fournissons vos données au format JSON dans les délais légaux.

✋ Droit d'opposition (article 21) — vous opposer au traitement de vos données pour des finalités spécifiques (newsletter, analyses statistiques, transferts hors UE).
• Procédure : désinscription newsletter en un clic dans chaque email envoyé. Autres oppositions par email à hello@jeanfindmyjob.fr.

⏸️ Droit à la limitation du traitement (article 18) — demander le gel temporaire du traitement de vos données (par exemple en cas de contestation de leur exactitude).
• Procédure : demande par email à hello@jeanfindmyjob.fr.

Délai de réponse : conformément à l'article 12 du RGPD, nous vous répondons sous 1 mois à compter de la réception de votre demande. Ce délai peut être prolongé de 2 mois pour les demandes complexes ou nombreuses, avec information préalable de notre part.

Recours auprès de la CNIL : si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) via www.cnil.fr, ou saisir la juridiction compétente.`
          },
          {
            title: '8. Cookies',
            content: `Jean find my Job utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification) et des cookies analytiques anonymes via Google Analytics (GA4). Aucun cookie publicitaire n'est utilisé.`
          },
          {
            title: '9. Contact',
            content: `Pour toute question relative à vos données personnelles, pour exercer vos droits, ou pour toute réclamation : hello@jeanfindmyjob.fr`
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
