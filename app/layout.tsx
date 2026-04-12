import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://jeanfindmyjob.fr'),
  title: "Jean find my Job — Suivez et optimisez vos candidatures",
  description:
    "Jean find my Job centralise votre recherche d'emploi : tableau de bord Kanban, pipeline de candidature, relances, entretiens et score ATS pour optimiser vos candidatures face aux recruteurs.",
  keywords: [
    "suivi candidatures",
    "recherche emploi",
    "tableau de bord candidature",
    "gestion offres emploi",
    "pipeline recrutement",
    "score ATS",
    "optimisation candidatures",
    "ATS recrutement",
  ],
  openGraph: {
    title: "Jean find my Job — Suivez et optimisez vos candidatures",
    description:
      "Organisez votre recherche d'emploi avec un tableau de bord Kanban, un suivi étape par étape, des rappels automatiques et un score ATS pour maximiser vos candidatures.",
    url: "https://jeanfindmyjob.fr",
    siteName: "Jean Find My Job",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: '/logojeanfindmyjob.webp',
        width: 1200,
        height: 630,
        alt: 'Jean Find My Job — Suivez et optimisez vos candidatures',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Analytics GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LKZHGMP0WG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LKZHGMP0WG');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}