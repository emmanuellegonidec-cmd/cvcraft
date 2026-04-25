import type { Metadata } from 'next';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  metadataBase: new URL('https://jeanfindmyjob.fr'),
  title: "Jean find my Job — Suivez et optimisez vos candidatures",
  description:
    "Suivez vos candidatures, organisez vos relances et optimisez votre CV avec le score ATS. Outil gratuit pour réussir votre recherche d'emploi.",
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
      "Suivez vos candidatures, organisez vos relances et optimisez votre CV avec le score ATS. Outil gratuit pour réussir votre recherche d'emploi.",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}