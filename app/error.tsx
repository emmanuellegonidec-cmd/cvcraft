'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur capturée par error.tsx :', error);
  }, [error]);

  return (
    <main
      className="min-h-screen bg-white flex items-center justify-center px-6 py-12"
      style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}
    >
      <div className="max-w-2xl w-full text-center">
        <div
          className="inline-block border-4 border-black px-8 py-6 mb-8"
          style={{
            backgroundColor: '#E8151B',
            color: 'white',
            boxShadow: '8px 8px 0 0 rgba(0,0,0,1)',
          }}
        >
          <p className="text-5xl md:text-6xl font-black leading-none">⚠️ Oups</p>
        </div>

        <h1 className="text-3xl md:text-4xl font-black mb-4">
          Une erreur s&apos;est produite
        </h1>

        <p className="text-base md:text-lg mb-8 leading-relaxed">
          Notre serveur a rencontré un problème inattendu.
          <br />
          Ce n&apos;est pas vous, c&apos;est nous. On s&apos;en occupe.
        </p>

        {error.digest && (
          <div className="border-2 border-black p-3 mb-8 bg-gray-50 inline-block">
            <p className="text-xs font-mono">
              Code d&apos;erreur : <strong>{error.digest}</strong>
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => reset()}
            className="px-6 py-3 font-bold border-2 border-black transition-all text-base"
            style={{
              backgroundColor: '#F5C400',
              color: '#111',
              boxShadow: '4px 4px 0 0 rgba(0,0,0,1)',
            }}
          >
            🔄 Réessayer
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white font-bold border-2 border-black hover:bg-black hover:text-white transition-colors text-base"
            style={{ color: '#111' }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <div className="border-t-2 border-black pt-8">
          <p className="text-sm leading-relaxed">
            Si le problème persiste, n&apos;hésitez pas à nous contacter avec le code d&apos;erreur ci-dessus :
            <br />
            <a href="mailto:hello@jeanfindmyjob.fr" className="underline font-bold">
              hello@jeanfindmyjob.fr
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}