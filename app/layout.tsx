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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "FAQPage", "mainEntity": [
              { "@type": "Question", "name": "Jean find my Job est-il vraiment gratuit ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, totalement gratuit, Jean find my Job est en phase bêta. Candidatures illimitées, toutes les fonctionnalités incluses — sans carte bancaire. Profitez-en !" } },
              { "@type": "Question", "name": "Comment fonctionne l'import d'offre d'emploi ?", "acceptedAnswer": { "@type": "Answer", "text": "Il vous suffit de coller l'URL d'une offre et Jean extrait automatiquement toutes les informations : poste, entreprise, description, compétences requises. En cas de non possibilité, un formulaire à compléter s'ouvre et vous pouvez compléter l'offre manuellement." } },
              { "@type": "Question", "name": "Mes données sont-elles sécurisées ?", "acceptedAnswer": { "@type": "Answer", "text": "Absolument. Vos données sont hébergées sur un serveur sécurisé (RGPD) et ne sont jamais partagées avec des tiers. Chaque utilisateur n'a accès qu'à ses propres candidatures." } },
              { "@type": "Question", "name": "Comment fonctionne le CV Creator IA ?", "acceptedAnswer": { "@type": "Answer", "text": "En version bêta, importez votre profil LinkedIn en PDF, choisissez un template, et Claude AI rédige automatiquement des formulations percutantes pour chaque section de votre CV. Vous pouvez ensuite ajuster et exporter en PDF en un clic." } },
              { "@type": "Question", "name": "Puis-je suivre plusieurs candidatures en même temps ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, sans limite. Chaque candidature dispose de son propre parcours personnalisable avec des étapes, des contacts associés, des documents et des notes. Vous visualisez tout depuis le tableau de bord global." } },
              { "@type": "Question", "name": "Jean find my Job fonctionne-t-il sur mobile ?", "acceptedAnswer": { "@type": "Answer", "text": "L'interface est responsive et fonctionne sur mobile. La visualisation est néanmoins plus pertinente sur votre ordinateur." } }
            ]},
            { "@type": "SoftwareApplication", "name": "Jean Find My Job", "url": "https://jeanfindmyjob.fr", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" }, "description": "Jean Find My Job centralise votre recherche d'emploi : tableau de bord Kanban, pipeline de candidature, relances, entretiens et score ATS pour optimiser vos candidatures.", "inLanguage": "fr", "author": { "@type": "Organization", "name": "Jean Find My Job", "url": "https://jeanfindmyjob.fr" } }
          ]
        })}} />
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