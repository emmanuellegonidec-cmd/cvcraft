import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — Jean find my Job',
  description: 'Mentions légales de Jean find my Job : éditeur, hébergement, propriété intellectuelle, conformément à la loi LCEN.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/mentions-legales',
  },
}

export default function MentionsLegalesPage() {
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
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Mentions légales</h1>
          <p style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>Dernière mise à jour : 26 avril 2026</p>
        </div>

        {[
          {
            title: '1. Éditeur du site',
            content: `Le site jeanfindmyjob.fr est édité par :

Emmanuelle Gonidec
Entrepreneur individuel exerçant sous le nom commercial « Jean find my Job »
87 rue Didot, 75014 Paris, France
SIREN : 844 130 245
SIRET : 844 130 245 00013
N° TVA intracommunautaire : FR10844130245
Code APE : 70.22Z (Conseil pour les affaires et autres conseils de gestion)

Contact : hello@jeanfindmyjob.fr`
          },
          {
            title: '2. Directrice de la publication',
            content: `La directrice de la publication est Emmanuelle Gonidec, dirigeante de l'entreprise individuelle.`
          },
          {
            title: '3. Hébergement du site',
            content: `Le site est hébergé par les prestataires suivants :

🌐 Hébergeur web (frontend)
Vercel Inc.
440 N Barranca Ave #4133
Covina, CA 91723, États-Unis
Site web : vercel.com

💾 Hébergeur de la base de données et des fichiers
Supabase Inc.
970 Toa Payoh North #07-04
Singapore 318992
Données hébergées en Union Européenne (région eu-west-1, Irlande)
Site web : supabase.com`
          },
          {
            title: '4. Propriété intellectuelle',
            content: `L'ensemble des éléments composant le site jeanfindmyjob.fr (textes, images, vidéos, logos, marques, code source, design, charte graphique, base de données) sont la propriété exclusive d'Emmanuelle Gonidec ou de ses partenaires, et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle, des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de l'éditeur. Toute exploitation non autorisée constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.`
          },
          {
            title: '5. Données personnelles',
            content: `Les modalités de collecte, de traitement et de protection de vos données personnelles sont détaillées dans notre Politique de confidentialité (jeanfindmyjob.fr/confidentialite). L'utilisation des cookies est encadrée par notre Politique des cookies (jeanfindmyjob.fr/cookies).

Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez de droits sur vos données personnelles que vous pouvez exercer à l'adresse : hello@jeanfindmyjob.fr`
          },
          {
            title: '6. Conditions d\'utilisation',
            content: `L'utilisation du service est soumise aux Conditions Générales d'Utilisation (jeanfindmyjob.fr/cgu) consultables en ligne. Toute création de compte vaut acceptation sans réserve de ces conditions.`
          },
          {
            title: '7. Limitation de responsabilité',
            content: `L'éditeur s'efforce de fournir des informations aussi précises que possible. Toutefois, il ne saurait être tenu responsable des omissions, des inexactitudes ou des carences dans la mise à jour, qu'elles soient de son fait ou du fait de tiers partenaires.

L'éditeur ne peut être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site, ni des conséquences éventuelles d'une indisponibilité temporaire du service. Le service est fourni en l'état pendant la phase bêta.`
          },
          {
            title: '8. Liens hypertextes',
            content: `Le site jeanfindmyjob.fr peut contenir des liens hypertextes vers d'autres sites internet. L'éditeur n'exerce aucun contrôle sur le contenu de ces sites tiers et décline toute responsabilité quant à leur contenu, leurs pratiques de confidentialité, ou les éventuels dommages résultant de leur consultation.`
          },
          {
            title: '9. Droit applicable et juridiction compétente',
            content: `Les présentes mentions légales sont régies par le droit français. En cas de litige et à défaut de résolution amiable, les tribunaux français seront seuls compétents.`
          },
          {
            title: '10. Contact',
            content: `Pour toute question relative aux présentes mentions légales : hello@jeanfindmyjob.fr`
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid #111', borderRadius: 12, boxShadow: '3px 3px 0 #111' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/confidentialite" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Politique de confidentialité →</Link>
          <Link href="/cgu" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Consulter les CGU →</Link>
          <Link href="/cookies" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>Politique des cookies →</Link>
        </div>
      </main>
    </div>
  )
}