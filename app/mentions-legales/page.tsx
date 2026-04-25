import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions légales | Jean find my Job',
  description:
    'Mentions légales de Jean find my Job : éditeur, hébergement, propriété intellectuelle, conformément à la loi LCEN.',
};

export default function MentionsLegalesPage() {
  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}
    >
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <Link
          href="/"
          className="inline-block mb-8 text-sm font-bold underline hover:opacity-70"
        >
          ← Retour à l&apos;accueil
        </Link>

        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-600">
          Légal
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-3">Mentions légales</h1>
        <p className="text-sm text-gray-600 mb-10">
          Dernière mise à jour : 25 avril 2026
        </p>

        <section className="space-y-8 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold mb-3">1. Éditeur du site</h2>
            <p className="mb-3">
              Le site <strong>jeanfindmyjob.fr</strong> est édité par :
            </p>
            <div className="border-2 border-black p-5 bg-gray-50">
              <p className="mb-1">
                <strong>GONIDEC E</strong>
              </p>
              <p className="mb-1">Entrepreneur individuel</p>
              <p className="mb-1">87 rue Didot, 75014 Paris, France</p>
              <p className="mb-1">SIREN : 844 130 245</p>
              <p className="mb-1">SIRET : 844 130 245 00013</p>
              <p className="mb-1">N° TVA intracommunautaire : FR10844130245</p>
              <p className="mb-1">
                Code APE : 70.22Z (Conseil pour les affaires et autres conseils de gestion)
              </p>
              <p className="mt-3">
                Contact :{' '}
                <a href="mailto:hello@jeanfindmyjob.fr" className="underline font-bold">
                  hello@jeanfindmyjob.fr
                </a>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">2. Directrice de la publication</h2>
            <p>
              La directrice de la publication est la dirigeante de l&apos;entreprise individuelle GONIDEC E.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">3. Hébergement du site</h2>
            <p className="mb-4">Le site est hébergé par les prestataires suivants :</p>

            <div className="border-2 border-black p-5 mb-3 bg-gray-50">
              <p className="font-bold mb-2">Hébergeur web (frontend) :</p>
              <p className="mb-1">Vercel Inc.</p>
              <p className="mb-1">440 N Barranca Ave #4133</p>
              <p className="mb-1">Covina, CA 91723, États-Unis</p>
              <p>
                Site web :{' '}
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                  vercel.com
                </a>
              </p>
            </div>

            <div className="border-2 border-black p-5 bg-gray-50">
              <p className="font-bold mb-2">Hébergeur de la base de données et des fichiers :</p>
              <p className="mb-1">Supabase Inc.</p>
              <p className="mb-1">970 Toa Payoh North #07-04</p>
              <p className="mb-1">Singapore 318992</p>
              <p className="mb-1">Données hébergées en Union Européenne (région eu-west-1, Irlande)</p>
              <p>
                Site web :{' '}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                  supabase.com
                </a>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">4. Propriété intellectuelle</h2>
            <p className="mb-3">
              L&apos;ensemble des éléments composant le site jeanfindmyjob.fr (textes, images, vidéos, logos, marques, code source, design, charte graphique, base de données) sont la propriété exclusive de GONIDEC E ou de ses partenaires, et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle, des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de l&apos;éditeur. Toute exploitation non autorisée constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">5. Données personnelles</h2>
            <p className="mb-3">
              Les modalités de collecte, de traitement et de protection de vos données personnelles sont détaillées dans notre{' '}
              <Link href="/confidentialite" className="underline font-bold">
                Politique de confidentialité
              </Link>
              . L&apos;utilisation des cookies est encadrée par notre{' '}
              <Link href="/cookies" className="underline font-bold">
                Politique des cookies
              </Link>
              .
            </p>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez de droits sur vos données personnelles que vous pouvez exercer à l&apos;adresse :{' '}
              <a href="mailto:hello@jeanfindmyjob.fr" className="underline font-bold">
                hello@jeanfindmyjob.fr
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">6. Conditions d&apos;utilisation</h2>
            <p>
              L&apos;utilisation du service est soumise aux{' '}
              <Link href="/cgu" className="underline font-bold">
                Conditions Générales d&apos;Utilisation
              </Link>{' '}
              consultables en ligne. Toute création de compte vaut acceptation sans réserve de ces conditions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">7. Limitation de responsabilité</h2>
            <p className="mb-3">
              L&apos;éditeur s&apos;efforce de fournir des informations aussi précises que possible. Toutefois, il ne saurait être tenu responsable des omissions, des inexactitudes ou des carences dans la mise à jour, qu&apos;elles soient de son fait ou du fait de tiers partenaires.
            </p>
            <p>
              L&apos;éditeur ne peut être tenu responsable des dommages directs ou indirects causés au matériel de l&apos;utilisateur lors de l&apos;accès au site, ni des conséquences éventuelles d&apos;une indisponibilité temporaire du service. Le service est fourni en l&apos;état pendant la phase bêta.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">8. Liens hypertextes</h2>
            <p>
              Le site jeanfindmyjob.fr peut contenir des liens hypertextes vers d&apos;autres sites internet. L&apos;éditeur n&apos;exerce aucun contrôle sur le contenu de ces sites tiers et décline toute responsabilité quant à leur contenu, leurs pratiques de confidentialité, ou les éventuels dommages résultant de leur consultation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">9. Droit applicable et juridiction compétente</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">10. Contact</h2>
            <p>
              Pour toute question relative aux présentes mentions légales :{' '}
              <a href="mailto:hello@jeanfindmyjob.fr" className="underline font-bold">
                hello@jeanfindmyjob.fr
              </a>
            </p>
          </div>

          <div className="pt-6 border-t-2 border-black flex flex-wrap gap-4 text-sm">
            <Link href="/confidentialite" className="underline font-bold hover:opacity-70">
              Politique de confidentialité →
            </Link>
            <Link href="/cgu" className="underline font-bold hover:opacity-70">
              CGU →
            </Link>
            <Link href="/cookies" className="underline font-bold hover:opacity-70">
              Politique des cookies →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}