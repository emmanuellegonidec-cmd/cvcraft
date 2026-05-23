import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Extension Chrome — Jean find my Job',
  description: 'Politique de confidentialité de l\'extension Chrome Jean find my Job : finalité unique, permissions, données collectées, conformité Chrome Web Store et RGPD.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/extension-confidentialite',
  },
}

export default function ExtensionConfidentialitePage() {
  return (
    <div style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#fff', borderBottom: '2.5px solid #111', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: '0.95rem', fontWeight: 900, color: '#111' }}>
            Jean <span style={{ color: '#E8151B' }}>find my Job</span>
          </span>
        </Link>
        <Link href="/" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: 13, color: '#111', textDecoration: 'none', fontWeight: 700 }}>← Retour à l&apos;accueil</Link>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Légal — Extension Chrome</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Politique de confidentialité de l&apos;extension Chrome</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 23 mai 2026</p>
        </div>

        {/* Encart de contexte */}
        <div style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: '#FFF8E1', border: '2px solid #F5C400', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
            Cette politique concerne <strong>uniquement l&apos;extension Chrome Jean find my Job</strong>. Elle complète la <Link href="/confidentialite" style={{ color: '#111', fontWeight: 700, textDecoration: 'underline' }}>politique générale du site</Link> et les <Link href="/extension-mentions-legales" style={{ color: '#111', fontWeight: 700, textDecoration: 'underline' }}>mentions légales de l&apos;extension</Link>.
          </p>
        </div>

        {[
          {
            title: '1. Responsable du traitement',
            content: `L'extension Chrome « Jean find my Job » est éditée par Emmanuelle Gonidec, entrepreneur individuel exerçant sous le nom commercial « Jean find my Job » (SIREN 844 130 245, 87 rue Didot, 75014 Paris, France).

Responsable du traitement : Jean find my Job, joignable à hello@jeanfindmyjob.fr (objet : « Extension Chrome »).`
          },
          {
            title: '2. Finalité unique de l\'extension',
            content: `Conformément à la Single Purpose Policy du Chrome Web Store, l'extension a une finalité unique :

🎯 Permettre à l'utilisateur de capturer une offre d'emploi consultée sur une plateforme de recrutement compatible, afin de la suivre dans son tableau de bord Jean find my Job et d'analyser sa compatibilité avec son CV.

Toutes les fonctionnalités (capture, analyse, marquage de candidature) servent exclusivement cette finalité.`
          },
          {
            title: '3. Données collectées',
            content: `L'extension collecte uniquement les données strictement nécessaires à son fonctionnement.

📌 Données d'authentification — stockées localement dans votre navigateur :
Un jeton de session vous permet de rester connecté à votre compte Jean find my Job. Ce jeton n'est partagé avec aucun tiers.

📌 Données d'offres d'emploi — envoyées à votre tableau de bord Jean :
Lors d'un clic volontaire sur « Capturer cette offre », l'extension lit les données publiques affichées dans l'annonce (intitulé, employeur, localisation, contrat, conditions, description et autres informations visibles). Ces données sont transmises à votre espace personnel.

📌 Données d'analyse de CV — uniquement si vous lancez l'analyse :
L'extension transmet une référence vers le CV que vous avez sélectionné dans votre compte (le CV n'est jamais ré-uploadé depuis l'extension). L'analyse est réalisée par un service tiers d'intelligence artificielle.

📌 Données de statut de candidature :
Le clic sur « J'ai postulé » met à jour le statut de la candidature dans votre tableau de bord.

❌ Données que l'extension NE collecte PAS :
- Aucun historique de navigation
- Aucune donnée en dehors des pages d'offres des plateformes compatibles
- Aucune donnée saisie dans des formulaires (e-mails, mots de passe, recherches)
- Aucune donnée privée affichée sur les plateformes (profils, messagerie, fil d'actualité)
- Aucune donnée biométrique, financière ou de santé`
          },
          {
            title: '4. Justification des permissions Chrome',
            content: `Chrome impose à toute extension de justifier explicitement chaque permission demandée.

🔑 storage : conservation locale du jeton de session entre deux ouvertures du navigateur, pour éviter une reconnexion à chaque clic.

🔑 sidePanel : affichage du panneau latéral Jean dans votre navigateur.

🔑 host_permissions :
- https://kjsqfgpewjzierlxzdyj.supabase.co/* — URL technique de notre fournisseur d'authentification et de base de données.
- https://jeanfindmyjob.fr/* — URL de notre service.
- https://www.linkedin.com/* — activation de la capture uniquement sur les pages d'offres de ce domaine.
- https://candidat.francetravail.fr/* — activation de la capture uniquement sur les pages d'offres de ce domaine.
- https://www.welcometothejungle.com/* — activation de la capture uniquement sur les pages d'offres de ce domaine.
- https://www.apec.fr/* — activation de la capture uniquement sur les pages d'offres de ce domaine.

L'extension ne demande pas la permission « <all_urls> » et ne s'exécute que sur les domaines explicitement listés ci-dessus.`
          },
          {
            title: '5. Comportement sur les sites compatibles',
            content: `Sur les plateformes de recrutement compatibles listées en section 4, l'extension reste passive jusqu'à un clic explicite de votre part sur le bouton « Capturer cette offre ».

Sur tout autre site, l'extension est totalement inactive : aucune lecture, aucun bouton affiché, aucune requête envoyée.`
          },
          {
            title: '6. Sites tiers',
            content: `Les domaines listés en section 4 correspondent à des plateformes de recrutement publiques sur lesquelles l'extension est techniquement compatible. Ils sont mentionnés à des fins strictement descriptives, conformément aux exigences du Chrome Web Store.

Aucune affiliation, partenariat ou cautionnement n'existe entre Jean find my Job et ces plateformes. L'extension se contente, à votre demande explicite, de lire le contenu d'une page que vous consultez volontairement.

Vous êtes invité(e) à respecter les conditions générales de chaque plateforme tierce. L'éditeur décline toute responsabilité en cas de litige entre vous et une plateforme tierce.`
          },
          {
            title: '7. Sous-traitants et transferts',
            content: `Vos données sont traitées par des sous-traitants techniques sélectionnés pour leur conformité au RGPD :

- Un fournisseur d'hébergement web et de base de données situé dans l'Union Européenne.
- Un fournisseur de services d'intelligence artificielle situé aux États-Unis, sollicité uniquement au moment où vous lancez une analyse de CV.

Aucun de ces sous-traitants n'est autorisé à utiliser vos données à ses propres fins commerciales.

🌍 Transferts hors UE : le calcul du score de compatibilité implique un transfert ponctuel vers les États-Unis. Ce transfert est encadré par les garanties prévues aux articles 44 à 49 du RGPD (Clauses Contractuelles Types et, le cas échéant, certification au cadre transatlantique en vigueur). Vous disposez d'un droit d'opposition (voir section 10).`
          },
          {
            title: '8. Durée de conservation',
            content: `Les données capturées sont conservées dans votre espace personnel tant que votre compte est actif, et au maximum 2 ans après votre dernière connexion, conformément aux recommandations de la CNIL et à l'article 5(1)(e) du RGPD.

Vous pouvez supprimer une candidature précise ou l'intégralité de votre compte à tout moment depuis votre espace personnel.

Le jeton de session stocké localement dans votre navigateur est automatiquement effacé à la désinstallation de l'extension.`
          },
          {
            title: '9. Conformité Chrome Web Store',
            content: `Conformément au programme développeur Chrome Web Store :

🔒 Limited Use Policy — les données collectées sont utilisées exclusivement pour la finalité unique décrite en section 2. Elles ne sont jamais vendues, louées, partagées à des fins publicitaires, ni utilisées pour entraîner des modèles d'intelligence artificielle.

🔒 Aucune collecte secondaire — pas de télémétrie comportementale en dehors des actions volontaires de l'utilisateur.

🔒 Sécurité — la transmission entre l'extension et nos serveurs est chiffrée en HTTPS/TLS. Le jeton d'authentification est limité dans le temps et révocable.

🔒 Modifications — toute évolution significative de la collecte de données sera communiquée via une mise à jour de cette politique.`
          },
          {
            title: '10. Vos droits (RGPD)',
            content: `Vous disposez des droits suivants concernant vos données :

🔍 Droit d'accès (art. 15)
✏️ Droit de rectification (art. 16)
🗑️ Droit à l'effacement (art. 17)
📦 Droit à la portabilité (art. 20)
✋ Droit d'opposition (art. 21)
⏸️ Droit à la limitation (art. 18)

L'essentiel de ces droits s'exerce directement depuis votre espace personnel (consultation, rectification, suppression d'une candidature, suppression du compte). Pour toute autre demande (portabilité au format JSON, limitation, opposition à l'analyse par IA), écrivez à hello@jeanfindmyjob.fr.

Délai de réponse : 1 mois (article 12 du RGPD).

Si vous estimez vos droits non respectés, vous pouvez introduire une réclamation auprès de la CNIL via www.cnil.fr.`
          },
          {
            title: '11. Désinstallation',
            content: `Vous pouvez désinstaller l'extension à tout moment depuis la page chrome://extensions/ de votre navigateur, ou par clic droit sur l'icône Jean dans la barre d'outils Chrome.

À la désinstallation, le jeton de session local est automatiquement effacé. Les données déjà capturées dans votre tableau de bord Jean restent intactes — pour les supprimer, rendez-vous dans votre espace personnel.`
          },
          {
            title: '12. Modifications',
            content: `Cette politique peut évoluer pour refléter des changements techniques, réglementaires, ou de nouvelles exigences du Chrome Web Store. Toute modification significative sera signalée par une mise à jour de la date en haut de page et, si nécessaire, par une notification dans l'extension.`
          },
          {
            title: '13. Contact',
            content: `Pour toute question ou demande relative à vos données :

📧 hello@jeanfindmyjob.fr (objet : « Extension Chrome »)

Voir aussi :
- Mentions légales de l'extension : /extension-mentions-legales
- Politique de confidentialité générale : /confidentialite
- Conditions générales d'utilisation : /cgu`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/confidentialite" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Confidentialité générale du site →</Link>
          <Link href="/extension-mentions-legales" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Mentions légales extension →</Link>
          <Link href="/cgu" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>CGU →</Link>
        </div>
      </main>
    </div>
  )
}