import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — Extension Chrome | Jean find my Job',
  description: "Mentions légales de l'extension Chrome Jean find my Job : éditeur, hébergement, propriété intellectuelle, données personnelles et conditions d'utilisation.",
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/extension-mentions-legales',
  },
}

export default function ExtensionMentionsLegalesPage() {
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
          <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Légal — Extension</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Mentions légales — Extension Chrome</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 26 avril 2026</p>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: '#FFF8E1', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, margin: 0 }}>
            La présente page concerne spécifiquement l&apos;extension Chrome <strong>Jean find my Job</strong>, actuellement en cours de développement. Elle complète les <Link href="/mentions-legales" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>mentions légales générales du site</Link> et sera mise à jour à la mise en ligne publique de l&apos;extension sur le Chrome Web Store.
          </p>
        </div>

        {[
          {
            title: '1. Éditeur de l\'extension',
            content: `L'extension Chrome « Jean find my Job » est éditée par :

Emmanuelle Gonidec
Entrepreneur individuel exerçant sous le nom commercial « Jean find my Job »
87 rue Didot, 75014 Paris, France
SIREN : 844 130 245
SIRET : 844 130 245 00013
N° TVA intracommunautaire : FR10844130245
Code APE : 70.22Z (Conseil pour les affaires et autres conseils de gestion)

Site web : jeanfindmyjob.fr
Contact : hello@jeanfindmyjob.fr

Le directeur de la publication est Emmanuelle Gonidec, en sa qualité d'éditrice individuelle.`
          },
          {
            title: '2. Hébergement',
            content: `🌐 Backend et site web (jeanfindmyjob.fr)
Vercel Inc.
440 N Barranca Avenue #4133
Covina, CA 91723, États-Unis
Site web : vercel.com

💾 Base de données et stockage
Supabase Inc.
970 Toa Payoh North #07-04
Singapour 318992
Instance hébergée dans l'Union européenne (région eu-west-1, Irlande)
Site web : supabase.com

🧩 Distribution de l'extension
L'extension Chrome sera distribuée publiquement via le Chrome Web Store, opéré par Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis.

Tant que l'extension n'est pas publiée, elle est utilisée exclusivement en mode développeur local par l'éditeur.`
          },
          {
            title: '3. Description et finalité de l\'extension',
            content: `L'extension Chrome « Jean find my Job » est un assistant à la candidature destiné aux demandeurs d'emploi. Elle fonctionne en complément de la plateforme principale jeanfindmyjob.fr, à laquelle l'utilisateur doit disposer d'un compte actif.

Ses principales fonctionnalités, à la mise en ligne, seront :

• la capture d'offres d'emploi consultées par l'utilisateur sur des sites tiers ;
• l'analyse de compatibilité entre une offre et le CV de l'utilisateur ;
• la génération assistée de lettres de motivation personnalisées ;
• la mise à jour automatique du tableau de suivi de candidatures de l'utilisateur sur Jean find my Job.

L'extension n'envoie aucune candidature de manière automatisée et ne se substitue pas à l'utilisateur dans ses démarches auprès des employeurs ou plateformes tierces.`
          },
          {
            title: '4. Conditions d\'utilisation',
            content: `L'usage de l'extension est gratuit et conditionné à la création préalable d'un compte sur jeanfindmyjob.fr. L'utilisateur s'engage à utiliser l'extension de bonne foi, conformément à sa finalité et dans le respect des conditions générales d'utilisation des sites tiers sur lesquels elle s'exécute (LinkedIn, France Travail, Welcome to the Jungle, etc.).

L'éditeur se réserve le droit de suspendre l'accès à l'extension en cas d'usage abusif, frauduleux, ou contraire aux lois applicables.`
          },
          {
            title: '5. Propriété intellectuelle',
            content: `L'ensemble des éléments composant l'extension (code source, design, marque « Jean find my Job », logo, contenus rédactionnels) est la propriété exclusive d'Emmanuelle Gonidec, ou fait l'objet d'une autorisation d'usage. Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite et susceptible de constituer une contrefaçon au sens des articles L. 335-2 et suivants du Code de la propriété intellectuelle.

Les marques tierces citées dans l'extension (LinkedIn, France Travail, Welcome to the Jungle, etc.) restent la propriété de leurs titulaires respectifs et ne sont mentionnées qu'à des fins descriptives, sans aucune affiliation, partenariat ou cautionnement.`
          },
          {
            title: '6. Données personnelles',
            content: `L'extension traite des données personnelles dans le cadre de son fonctionnement (notamment : email du compte utilisateur, contenu des offres consultées, contenu du CV). Ces traitements sont régis par le Règlement Général sur la Protection des Données (RGPD) et la loi française « Informatique et Libertés ».

Une politique de confidentialité spécifique à l'extension sera publiée avant la mise en ligne sur le Chrome Web Store et disponible à l'adresse jeanfindmyjob.fr/extension-confidentialite. En attendant, les principes généraux applicables sont détaillés dans la politique de confidentialité du site Jean find my Job (jeanfindmyjob.fr/confidentialite).

L'utilisateur dispose à tout moment d'un droit d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition concernant ses données. Ces droits peuvent être exercés en écrivant à : hello@jeanfindmyjob.fr`
          },
          {
            title: '7. Limitation de responsabilité',
            content: `L'extension est fournie en l'état, sans garantie d'aucune sorte. L'éditeur s'efforce d'assurer son bon fonctionnement et l'exactitude des informations qu'elle traite, mais ne saurait être tenu responsable :

• de l'indisponibilité temporaire de l'extension ou des services associés (Jean find my Job, Supabase, API tierces) ;
• d'erreurs ou d'imprécisions dans les analyses de compatibilité d'offres ou les suggestions générées par intelligence artificielle ;
• de modifications unilatérales par les sites tiers (LinkedIn, France Travail, Welcome to the Jungle, etc.) susceptibles d'altérer le fonctionnement de l'extension ;
• des décisions prises par l'utilisateur sur la base des informations affichées par l'extension (notamment les décisions de candidature ou de non-candidature).

L'utilisateur reste seul responsable des candidatures qu'il choisit d'envoyer et des informations qu'il transmet à des tiers via l'extension ou en dehors.`
          },
          {
            title: '8. Relations avec les sites tiers',
            content: `L'extension fonctionne en complément de sites tiers d'offres d'emploi (LinkedIn, France Travail, Welcome to the Jungle, et autres pris en charge ultérieurement). Ces sites ne sont liés à Jean find my Job par aucun partenariat, accord commercial ou affiliation. L'extension se contente de lire, à la demande explicite de l'utilisateur, le contenu d'une page d'offre que celui-ci consulte volontairement.

L'utilisateur est invité à respecter les conditions générales d'utilisation propres à chaque site tiers. L'éditeur de Jean find my Job décline toute responsabilité en cas de litige entre l'utilisateur et un site tiers consécutif à l'usage de l'extension.`
          },
          {
            title: '9. Évolution des présentes mentions',
            content: `L'extension étant en cours de développement actif, les présentes mentions peuvent être modifiées à tout moment pour refléter l'évolution des fonctionnalités, des permissions techniques requises, ou du cadre légal applicable. La date de dernière mise à jour est indiquée en haut de page.

Une version définitive et stable des présentes mentions sera publiée à la mise en ligne de l'extension sur le Chrome Web Store.`
          },
          {
            title: '10. Loi applicable et juridiction compétente',
            content: `Les présentes mentions légales sont soumises au droit français. Tout litige relatif à leur interprétation ou à l'usage de l'extension qui ne pourrait être résolu à l'amiable sera soumis à la compétence exclusive des tribunaux français, et notamment des tribunaux du ressort de Paris pour les litiges entre professionnels.

Conformément aux dispositions des articles L. 611-1 et suivants du Code de la consommation, en cas de litige, les utilisateurs consommateurs ont la possibilité de recourir gratuitement à un médiateur de la consommation en vue d'une résolution amiable.`
          },
          {
            title: '11. Contact',
            content: `Pour toute question concernant les présentes mentions légales, l'extension Chrome ou le traitement des données personnelles, l'utilisateur peut contacter l'éditeur à l'adresse suivante : hello@jeanfindmyjob.fr`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/mentions-legales" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Mentions légales du site →</Link>
          <Link href="/confidentialite" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Politique de confidentialité →</Link>
          <Link href="/cgu" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Consulter les CGU →</Link>
        </div>
      </main>
    </div>
  )
}
