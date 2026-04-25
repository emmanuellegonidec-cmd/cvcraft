import type { Metadata } from 'next'
import Link from 'next/link'
import CookiePreferencesButton from './CookiePreferencesButton'

export const metadata: Metadata = {
  title: 'Politique des cookies | Jean find my Job',
  description:
    'Politique des cookies de Jean find my Job : quels cookies nous utilisons, pourquoi, et comment gérer vos préférences.',
}

export default function CookiesPage() {
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

        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-600">Légal</p>
        <h1 className="text-4xl md:text-5xl font-black mb-3">Politique des cookies</h1>
        <p className="text-sm text-gray-600 mb-10">Dernière mise à jour : 25 avril 2026</p>

        <section className="space-y-8 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold mb-3">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, smartphone) lors de votre visite sur un site web. Il permet au site de mémoriser des informations sur votre visite, comme votre langue préférée ou votre statut de connexion, pour faciliter votre navigation et améliorer votre expérience.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">2. Quels cookies utilisons-nous ?</h2>
            <p className="mb-4">
              Jean find my Job utilise deux catégories de cookies :
            </p>

            <div className="border-2 border-black p-5 mb-4 bg-gray-50">
              <h3 className="font-bold text-base mb-2">🔒 Cookies strictement nécessaires (toujours actifs)</h3>
              <p className="text-sm mb-3">
                Indispensables au fonctionnement du site, ces cookies ne nécessitent pas votre consentement (article 82 de la loi Informatique et Libertés). Sans eux, le site ne peut pas fonctionner correctement.
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#111', color: 'white' }}>
                    <th className="text-left p-2 border border-black">Cookie</th>
                    <th className="text-left p-2 border border-black">Finalité</th>
                    <th className="text-left p-2 border border-black">Durée</th>
                    <th className="text-left p-2 border border-black">Émetteur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-black font-mono">sb-access-token</td>
                    <td className="p-2 border border-black">Session d&apos;authentification</td>
                    <td className="p-2 border border-black">1 heure</td>
                    <td className="p-2 border border-black">Supabase</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-black font-mono">sb-refresh-token</td>
                    <td className="p-2 border border-black">Renouvellement de session</td>
                    <td className="p-2 border border-black">7 jours</td>
                    <td className="p-2 border border-black">Supabase</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-black font-mono">jfmj_cookie_consent</td>
                    <td className="p-2 border border-black">Mémorisation de vos choix de cookies</td>
                    <td className="p-2 border border-black">12 mois</td>
                    <td className="p-2 border border-black">Jean find my Job</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-2 border-black p-5 bg-gray-50">
              <h3 className="font-bold text-base mb-2">📊 Cookies analytiques (soumis à votre consentement)</h3>
              <p className="text-sm mb-3">
                Ces cookies nous aident à comprendre comment notre site est utilisé (pages visitées, durée, parcours) afin de l&apos;améliorer. Ils ne sont déposés <strong>qu&apos;après votre consentement explicite</strong>. Les données collectées sont anonymisées.
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#111', color: 'white' }}>
                    <th className="text-left p-2 border border-black">Cookie</th>
                    <th className="text-left p-2 border border-black">Finalité</th>
                    <th className="text-left p-2 border border-black">Durée</th>
                    <th className="text-left p-2 border border-black">Émetteur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-black font-mono">_ga</td>
                    <td className="p-2 border border-black">Distinction des visiteurs (anonyme)</td>
                    <td className="p-2 border border-black">13 mois</td>
                    <td className="p-2 border border-black">Google Analytics</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-black font-mono">_ga_LKZHGMP0WG</td>
                    <td className="p-2 border border-black">Persistance de session GA4</td>
                    <td className="p-2 border border-black">13 mois</td>
                    <td className="p-2 border border-black">Google Analytics</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs mt-3 italic">
                Adresse IP anonymisée. Aucune donnée personnelle identifiable n&apos;est collectée. Aucun cookie publicitaire n&apos;est utilisé sur ce site.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">3. Comment gérer vos préférences ?</h2>
            <p className="mb-4">
              Vous pouvez à tout moment modifier vos choix concernant les cookies analytiques. Le retrait de votre consentement est aussi simple que son recueil.
            </p>
            <CookiePreferencesButton />
            <p className="text-sm mt-4">
              Vous pouvez également bloquer ou supprimer les cookies directement depuis les paramètres de votre navigateur :
            </p>
            <ul className="text-sm mt-2 ml-5 list-disc space-y-1">
              <li>
                
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                
                  href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                
                  href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70"
                >
                  Safari
                </a>
              </li>
              <li>
                
                  href="https://support.microsoft.com/fr-fr/microsoft-edge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p className="text-sm mt-3 italic">
              Note : refuser les cookies strictement nécessaires (notamment l&apos;authentification) empêchera le fonctionnement du service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">4. Cadre légal</h2>
            <p>
              Cette politique est conforme aux exigences de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés), du RGPD (Règlement UE 2016/679) et de l&apos;article 82 de la loi Informatique et Libertés du 6 janvier 1978 modifiée.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">5. Contact</h2>
            <p>
              Pour toute question relative aux cookies ou à la protection de vos données :{' '}
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
          </div>
        </section>
      </div>
    </main>
  )
}