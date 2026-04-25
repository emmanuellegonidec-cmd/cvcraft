import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page introuvable | Jean find my Job',
  description: 'La page que vous cherchez n\'existe pas ou a été déplacée.',
};

export default function NotFound() {
  return (
    <main
      className="min-h-screen bg-white flex items-center justify-center px-6 py-12"
      style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}
    >
      <div className="max-w-2xl w-full text-center">
        <div
          className="inline-block border-4 border-black px-8 py-6 mb-8"
          style={{
            backgroundColor: '#F5C400',
            boxShadow: '8px 8px 0 0 rgba(0,0,0,1)',
          }}
        >
          <p className="text-7xl md:text-8xl font-black leading-none">404</p>
        </div>

        <h1 className="text-3xl md:text-4xl font-black mb-4">
          Cette page a pris la fuite 🏃‍♂️
        </h1>

        <p className="text-base md:text-lg mb-8 leading-relaxed">
          La page que vous cherchez n&apos;existe pas, a été déplacée, ou peut-être que vous avez tapé une mauvaise URL.
          <br />
          Pas de panique, on vous remet sur la bonne voie.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/"
            className="px-6 py-3 font-bold border-2 border-black transition-all text-base"
            style={{
              backgroundColor: '#F5C400',
              color: '#111',
              boxShadow: '4px 4px 0 0 rgba(0,0,0,1)',
            }}
          >
            ← Retour à l&apos;accueil
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white font-bold border-2 border-black hover:bg-black hover:text-white transition-colors text-base"
            style={{ color: '#111' }}
          >
            Mon tableau de bord
          </Link>
        </div>

        <div className="border-t-2 border-black pt-8">
          <p className="text-sm font-bold mb-4">Vous cherchiez peut-être :</p>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <Link href="/blog" className="underline font-bold hover:opacity-70">
              Le blog
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/dashboard/profile" className="underline font-bold hover:opacity-70">
              Mon profil
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/cookies" className="underline font-bold hover:opacity-70">
              Politique des cookies
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/confidentialite" className="underline font-bold hover:opacity-70">
              Confidentialité
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-10">
          Un problème persistant ?{' '}
          <a href="mailto:hello@jeanfindmyjob.fr" className="underline font-bold">
            hello@jeanfindmyjob.fr
          </a>
        </p>
      </div>
    </main>
  );
}