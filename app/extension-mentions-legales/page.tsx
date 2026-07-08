import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — Extension Chrome | Jean find my Job',
  description: "Mentions légales de l'extension Chrome Jean find my Job.",
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/extension-mentions-legales',
  },
}

export default function ExtensionMentionsLegalesPage() {
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
          <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Légal — Extension</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Mentions légales — Extension Chrome</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 17 mai 2026</p>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: '#FFF8E1', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, margin: 0 }}>
            La présente page concerne spécifiquement l&apos;extension Chrome <strong>Jean find my Job</strong>. Elle complète les <Link href="/mentions-legales" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>mentions légales générales du site</Link> et la <Link href="/extension-confidentialite" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>politique de confidentialité de l&apos;extension</Link>.
          </p>
        </div>

        {[
          {
            title: '1. Éditeur',
            content: `EG
Entrepreneur individuel exerçant sous le nom commercial « Jean find my Job »
SIREN : 844 130 245
N° TVA intracommunautaire : FR10844130245

Contact : hello@jeanfindmyjob.fr
Directeur de la publication : EG.`
          },
          {
            title: '2. Hébergement',
            content: `Hébergeur web :
Vercel Inc. — 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis — vercel.com

Hébergeur de la base de données :
Supabase Inc. — 970 Toa Payoh North #07-04, Singapour 318992 — supabase.com (instance hébergée dans l'Union européenne)

Distribution de l'extension :
Chrome Web Store — Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis.`
          },
          {
            title: '3. Description de l\'extension',
            content: `« Jean find my Job » est un assistant à la candidature destiné aux demandeurs d'emploi, fonctionnant en complément de la plateforme jeanfindmyjob.fr. Ses fonctionnalités principales : capture d'offres consultées par l'utilisateur sur des plateformes de recrutement compatibles, analyse de compatibilité avec son CV, et mise à jour de son tableau de candidatures.

L'extension n'envoie aucune candidature automatisée et ne se substitue pas à l'utilisateur dans ses démarches.`
          },
          {
            title: '4. Conditions d\'utilisation',
            content: `L'usage de l'extension est gratuit et conditionné à la création préalable d'un compte sur jeanfindmyjob.fr. L'utilisateur s'engage à l'utiliser de bonne foi, conformément à sa finalité et dans le respect des conditions générales d'utilisation des plateformes sur lesquelles elle s'exécute.

L'éditeur se réserve le droit de suspendre l'accès en cas d'usage abusif, frauduleux ou contraire aux lois applicables.`
          },
          {
            title: '5. Propriété intellectuelle',
            content: `L'ensemble des éléments composant l'extension (code, design, marque « Jean find my Job », logo, contenus) est la propriété exclusive d'EG, ou fait l'objet d'une autorisation d'usage. Toute reproduction, représentation ou exploitation non autorisée est interdite, conformément aux articles L. 335-2 et suivants du Code de la propriété intellectuelle.

Les marques des plateformes sur lesquelles l'extension est techniquement compatible restent la propriété de leurs titulaires respectifs et ne sont pas reprises sur la présente page.`
          },
          {
            title: '6. Données personnelles',
            content: `L'extension traite des données personnelles dans le cadre de son fonctionnement. Ces traitements sont régis par le RGPD et la loi française « Informatique et Libertés ».

Le détail des traitements (catégories de données, finalités, durées de conservation, droits) est précisé dans la politique de confidentialité dédiée à l'extension : jeanfindmyjob.fr/extension-confidentialite.

Pour exercer vos droits : hello@jeanfindmyjob.fr`
          },
          {
            title: '7. Limitation de responsabilité',
            content: `L'extension est fournie en l'état, sans garantie. L'éditeur ne saurait être tenu responsable :

• de l'indisponibilité temporaire de l'extension ou des services associés ;
• d'erreurs ou d'imprécisions dans les analyses générées par intelligence artificielle ;
• de modifications unilatérales par les plateformes tierces susceptibles d'altérer le fonctionnement de l'extension ;
• des décisions prises par l'utilisateur sur la base des informations affichées par l'extension.

L'utilisateur reste seul responsable des candidatures qu'il choisit d'envoyer.`
          },
          {
            title: '8. Plateformes tierces',
            content: `L'extension fonctionne en complément de plateformes tierces de recrutement (la liste technique des domaines compatibles figure dans la politique de confidentialité de l'extension). Ces plateformes ne sont liées à Jean find my Job par aucun partenariat, accord commercial ou affiliation.

L'utilisateur est invité à respecter les conditions générales d'utilisation propres à chaque plateforme tierce. L'éditeur décline toute responsabilité en cas de litige entre l'utilisateur et une plateforme tierce.`
          },
          {
            title: '9. Évolution des présentes mentions',
            content: `Les présentes mentions peuvent être modifiées pour refléter l'évolution des fonctionnalités, des permissions techniques ou du cadre légal applicable. La date de dernière mise à jour est indiquée en haut de page.`
          },
          {
            title: '10. Loi applicable',
            content: `Les présentes mentions sont soumises au droit français. Tout litige relatif à leur interprétation ou à l'usage de l'extension qui ne pourrait être résolu à l'amiable sera soumis à la compétence exclusive des tribunaux français.

En cas de litige avec un utilisateur consommateur, conformément aux articles L. 611-1 et suivants du Code de la consommation, ce dernier peut recourir gratuitement à un médiateur de la consommation.`
          },
          {
            title: '11. Contact',
            content: `Pour toute question : hello@jeanfindmyjob.fr`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/mentions-legales" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Mentions légales du site →</Link>
          <Link href="/extension-confidentialite" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Confidentialité extension →</Link>
          <Link href="/cgu" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>CGU →</Link>
        </div>
      </main>
    </div>
  )
}
