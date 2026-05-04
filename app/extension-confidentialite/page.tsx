import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Extension Chrome — Jean find my Job',
  description: 'Politique de confidentialité dédiée à l\'extension Chrome Jean find my Job : finalité unique, permissions demandées, données collectées, conformité Chrome Web Store et RGPD.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/extension-confidentialite',
  },
}

export default function ExtensionConfidentialitePage() {
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
          <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Légal — Extension Chrome</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Politique de confidentialité de l&apos;extension Chrome</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 4 mai 2026</p>
        </div>

        {/* Encart de contexte */}
        <div style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: '#FFF8E1', border: '2px solid #F5C400', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
            Cette politique de confidentialité concerne <strong>uniquement l&apos;extension Chrome Jean find my Job</strong>. Elle complète la <Link href="/confidentialite" style={{ color: '#111', fontWeight: 700, textDecoration: 'underline' }}>politique de confidentialité générale du site</Link> et les <Link href="/extension-mentions-legales" style={{ color: '#111', fontWeight: 700, textDecoration: 'underline' }}>mentions légales de l&apos;extension</Link>. En cas de divergence sur un point spécifique à l&apos;extension Chrome, la présente page prévaut.
          </p>
        </div>

        {[
          {
            title: '1. Qui sommes-nous ?',
            content: `L'extension Chrome « Jean find my Job » est éditée par Emmanuelle Gonidec, entrepreneur individuel exerçant sous le nom commercial « Jean find my Job » (siège social : 87 rue Didot, 75014 Paris, France — SIREN 844 130 245).

Le responsable du traitement des données est Jean find my Job, joignable à l'adresse : hello@jeanfindmyjob.fr. Pour toute question spécifique à l'extension, vous pouvez utiliser cette même adresse en précisant « Extension Chrome » dans l'objet du message.

Les mentions légales complètes de l'extension sont disponibles sur la page dédiée /extension-mentions-legales.`
          },
          {
            title: '2. Finalité unique de l\'extension',
            content: `Conformément aux exigences du Chrome Web Store (Single Purpose Policy), l'extension Jean find my Job a une finalité unique et clairement définie :

🎯 Permettre aux utilisateurs de capturer une offre d'emploi consultée sur LinkedIn, France Travail ou Welcome to the Jungle (et autres sites de recherche d'emploi pris en charge ultérieurement), afin de la suivre dans leur tableau de bord de candidatures Jean find my Job, et d'analyser la compatibilité de leur CV avec cette offre.

Toutes les fonctionnalités de l'extension (capture d'offres, analyse de CV, marquage « J'ai postulé ») servent exclusivement cette finalité unique.`
          },
          {
            title: '3. Données collectées par l\'extension',
            content: `L'extension collecte uniquement les données strictement nécessaires à son fonctionnement.

📌 Données d'authentification (stockées localement dans votre navigateur) :
- Le jeton de session (token) délivré par notre fournisseur d'authentification lorsque vous vous connectez à votre compte Jean find my Job depuis l'extension. Ce jeton est stocké dans chrome.storage.local et n'est ni envoyé ni partagé avec un tiers.
- Votre adresse e-mail de compte (lue depuis le jeton de session, uniquement pour personnaliser l'affichage et nommer correctement les fichiers téléchargés).

📌 Données d'offres d'emploi (envoyées à votre tableau de bord Jean) :
Quand vous cliquez sur « Capturer cette offre », l'extension lit uniquement les informations publiques de l'offre affichée à l'écran : titre du poste, nom de l'entreprise, lieu, type de contrat, rythme de travail, salaire (si publié), description, compétences, niveau d'expérience, formation, qualification, secteur, date de publication. Ces données sont transmises au serveur Jean find my Job et stockées dans la base de données associée à votre compte.

📌 Données d'analyse CV (si vous lancez l'analyse) :
Quand vous lancez « Analyser cette offre avec ton CV », l'extension envoie au serveur Jean find my Job la référence du CV que vous avez sélectionné (CV déjà présent dans votre compte, jamais re-uploadé depuis l'extension). Le serveur Jean lit alors ce CV pour réaliser l'analyse via l'IA Claude. Aucun nouveau document n'est créé par l'extension elle-même.

📌 Données de statut de candidature :
Quand vous cliquez sur « J'ai postulé », l'extension transmet uniquement l'identifiant de la candidature concernée pour mettre à jour son statut côté serveur Jean.

❌ Données que l'extension NE collecte PAS :
- L'historique de navigation
- Les pages visitées en dehors de LinkedIn, France Travail et Welcome to the Jungle
- Les contenus saisis dans des formulaires (e-mails, mots de passe, recherches)
- Les données personnelles affichées sur LinkedIn (profils tiers, messagerie, fil d'actualité)
- Aucune donnée biométrique, financière ou de santé`
          },
          {
            title: '4. Justification des permissions Chrome demandées',
            content: `Chrome impose à toute extension de justifier explicitement chaque permission demandée. Voici les nôtres et leur usage strict.

🔑 Permission « storage » : utilisée pour conserver localement votre jeton de session entre deux ouvertures du navigateur, afin que vous n'ayez pas à vous reconnecter à chaque clic. Aucune autre donnée n'est stockée via cette permission.

🔑 Permission « activeTab » : utilisée uniquement au moment où vous cliquez sur le bouton « Capturer cette offre ». L'extension lit alors la page d'offre que vous regardez activement, et exclusivement cette page. Elle n'a aucun accès aux autres onglets ouverts.

🔑 Permission « sidePanel » : utilisée pour afficher le panneau latéral Jean à droite de votre navigateur (offre capturée, score ATS, boutons d'action). Cette permission n'autorise aucune lecture de contenu.

🔑 host_permissions :
- https://kjsqfgpewjzierlxzdyj.supabase.co/* — pour vous authentifier auprès de notre fournisseur d'identité Supabase et lire/écrire vos données dans votre espace personnel (votre compte uniquement).
- https://jeanfindmyjob.fr/* — pour appeler les API du service Jean (création de candidature, analyse ATS, marquage « J'ai postulé »).
- https://www.linkedin.com/* — pour activer la capture d'offre uniquement sur les pages d'offres LinkedIn.
- https://candidat.francetravail.fr/* — pour activer la capture d'offre uniquement sur les pages d'offres France Travail.
- https://www.welcometothejungle.com/* — pour activer la capture d'offre uniquement sur les pages d'offres Welcome to the Jungle.

L'extension ne demande pas la permission « <all_urls> » ni aucune autorisation globale d'accès au web. Elle ne s'exécute que sur les domaines explicitement listés ci-dessus.`
          },
          {
            title: '5. Comportement de l\'extension sur les sites pris en charge',
            content: `Sur les sites de recherche d'emploi pris en charge (LinkedIn, France Travail, Welcome to the Jungle — et autres ajoutés ultérieurement), l'extension reste passive jusqu'à ce que vous cliquiez sur le bouton « Capturer cette offre » qu'elle affiche en bas à droite de la page.

Au clic, l'extension lit uniquement les éléments publics d'une page d'offre d'emploi (titre du poste, entreprise, description, lieu, contrat, etc.). Elle ne lit pas et ne transmet pas :
- Les données privées de votre profil utilisateur sur le site visité
- Les contenus de votre messagerie ou de vos conversations
- Les profils ou contenus d'autres utilisateurs
- Les fils d'actualité ou contenus en dehors des pages d'offres d'emploi

Sur LinkedIn spécifiquement, l'extension n'accède pas à votre profil personnel, à vos contacts, à votre messagerie, ni à aucune donnée privée d'autres utilisateurs. Elle ne s'active que sur les pages d'offres d'emploi.

Sur tout site qui n'est pas dans la liste des sites pris en charge, l'extension est totalement inactive : aucune lecture, aucun bouton affiché, aucune requête envoyée.`
          },
          {
            title: '6. Mentions sur les marques et sites tiers',
            content: `Les marques tierces citées dans la présente politique (LinkedIn, France Travail, Welcome to the Jungle, et autres ajoutées ultérieurement) restent la propriété exclusive de leurs titulaires respectifs. Elles ne sont mentionnées qu'à des fins descriptives, pour identifier les sites sur lesquels l'extension est techniquement compatible.

Aucune affiliation, partenariat, sponsoring, accord commercial ou cautionnement n'existe entre Jean find my Job et ces sites. L'extension lit, à la demande explicite de l'utilisateur, le contenu d'une page d'offre que celui-ci consulte volontairement.

L'utilisateur est invité à respecter les conditions générales d'utilisation propres à chaque site tiers. L'éditeur de Jean find my Job décline toute responsabilité en cas de litige entre l'utilisateur et un site tiers consécutif à l'usage de l'extension.`
          },
          {
            title: '7. Hébergement et sous-traitants',
            content: `Les données collectées par l'extension sont transmises à votre espace personnel Jean find my Job, hébergé chez nos sous-traitants techniques :

- Supabase (base de données, authentification, stockage des fichiers) — chiffrement AES-256, hébergement en Union Européenne (région eu-west-1)
- Vercel (hébergement web) — infrastructure sécurisée avec hébergement en Union Européenne
- Anthropic Claude (analyse IA du score ATS uniquement) — société américaine, traitement ponctuel des données aux États-Unis, sans stockage de vos données au-delà de la requête

Aucun de ces sous-traitants n'est autorisé à utiliser vos données à ses propres fins commerciales.

🌍 Transferts hors UE : seul le calcul du score ATS implique un transfert ponctuel vers Anthropic (États-Unis). Ce transfert est encadré par les Clauses Contractuelles Types (CCT) de la Commission Européenne et, le cas échéant, la certification au Data Privacy Framework UE-US, conformément aux articles 44 à 49 du RGPD. Vous disposez d'un droit d'opposition (voir section 10).

Pour le détail complet de notre architecture et de nos engagements de sécurité, consultez la politique de confidentialité générale.`
          },
          {
            title: '8. Durée de conservation',
            content: `Les données capturées via l'extension sont conservées dans votre espace personnel Jean tant que votre compte est actif, et au maximum 2 ans après votre dernière connexion, conformément aux recommandations de la CNIL et à l'article 5(1)(e) du RGPD.

En cas de désinstallation de l'extension, les données déjà capturées dans votre tableau de bord Jean restent disponibles tant que votre compte n'est pas supprimé. Pour effacer une candidature précise ou supprimer entièrement votre compte, rendez-vous dans /dashboard ou /dashboard/profile (zone de danger en bas de page).

Le jeton de session stocké localement dans votre navigateur est effacé automatiquement à la désinstallation de l'extension.`
          },
          {
            title: '9. Conformité Chrome Web Store',
            content: `Conformément aux règles du programme développeur Chrome Web Store, nous nous engageons explicitement sur les points suivants.

🔒 Limited Use Policy : les données collectées via l'extension sont utilisées exclusivement pour fournir le service décrit dans la finalité unique (section 2). Elles ne sont jamais :
- Vendues, louées ou cédées à des tiers
- Utilisées à des fins publicitaires ou de profilage commercial
- Transférées à des annonceurs, courtiers de données, ou tout autre acteur externe à des fins de monétisation
- Utilisées pour entraîner des modèles d'IA

🔒 Données utilisateur : nous ne collectons que les données nécessaires à la finalité unique de l'extension. Aucune collecte secondaire, aucune télémétrie comportementale en dehors des actions volontaires de l'utilisateur (clic sur « Capturer », « Analyser », « J'ai postulé »).

🔒 Sécurité : la transmission des données entre l'extension et nos serveurs est chiffrée en HTTPS/TLS. Le jeton d'authentification est limité dans le temps et révocable à tout moment via la déconnexion.

🔒 Modifications : toute évolution significative de la collecte de données ou des permissions demandées sera communiquée via une mise à jour de cette politique et, si nécessaire, via un message dans l'extension.`
          },
          {
            title: '10. Vos droits (RGPD) et comment les exercer',
            content: `L'extension étant un point d'entrée vers votre compte Jean find my Job, l'exercice de vos droits RGPD se fait dans les mêmes conditions que pour le service principal.

🔍 Droit d'accès (article 15) — consulter l'ensemble des données capturées via l'extension : accessible directement depuis /dashboard.

✏️ Droit de rectification (article 16) — modifier ou supprimer une candidature capturée : depuis la page détail de la candidature dans /dashboard.

🗑️ Droit à l'effacement (article 17) — supprimer une candidature spécifique ou l'intégralité de votre compte : suppression unitaire depuis le tableau de bord, suppression de compte depuis /dashboard/profile.

📦 Droit à la portabilité (article 20) — récupérer vos données au format JSON : demande à hello@jeanfindmyjob.fr.

✋ Droit d'opposition (article 21) — vous opposer à un traitement spécifique (notamment le transfert vers Anthropic pour l'analyse ATS) : il vous suffit de ne pas utiliser cette fonctionnalité ; vous pouvez également désinstaller l'extension à tout moment sans conséquence sur le reste du service.

⏸️ Droit à la limitation (article 18) : demande à hello@jeanfindmyjob.fr.

Délai de réponse : 1 mois conformément à l'article 12 du RGPD.

Recours auprès de la CNIL : si vous estimez vos droits non respectés, vous pouvez introduire une réclamation auprès de la CNIL via www.cnil.fr.`
          },
          {
            title: '11. Désinstallation de l\'extension',
            content: `Vous pouvez désinstaller l'extension à tout moment depuis la page chrome://extensions/ de votre navigateur, ou en faisant un clic droit sur l'icône Jean dans la barre d'outils Chrome, puis « Supprimer de Chrome ».

À la désinstallation :
- Le jeton de session stocké localement (chrome.storage.local) est effacé automatiquement par Chrome.
- Les données déjà capturées dans votre tableau de bord Jean restent intactes — vous pouvez continuer à les consulter et les gérer depuis jeanfindmyjob.fr.
- Pour supprimer aussi ces données, rendez-vous dans /dashboard (suppression unitaire) ou /dashboard/profile (suppression complète du compte).`
          },
          {
            title: '12. Modifications de cette politique',
            content: `Cette politique peut évoluer pour refléter des changements techniques de l'extension, des évolutions réglementaires, ou de nouvelles exigences du Chrome Web Store.

Toute modification significative sera signalée par :
- Une mise à jour de la date « Dernière mise à jour » en haut de cette page
- Si la modification touche la collecte ou la finalité, une notification claire dans l'extension elle-même lors de votre prochaine session

Nous vous encourageons à consulter cette page périodiquement.`
          },
          {
            title: '13. Contact',
            content: `Pour toute question, demande d'exercice de vos droits, ou réclamation relative à l'extension Chrome Jean find my Job :

📧 hello@jeanfindmyjob.fr (en précisant « Extension Chrome » dans l'objet)

Vous pouvez aussi consulter :
- Les mentions légales de l'extension : /extension-mentions-legales
- La politique de confidentialité générale du service : /confidentialite
- Les conditions générales d'utilisation : /cgu`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/confidentialite" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Confidentialité générale du site →</Link>
          <Link href="/extension-mentions-legales" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Mentions légales extension →</Link>
          <Link href="/cgu" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>CGU →</Link>
        </div>
      </main>
    </div>
  )
}
