import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CVcraft — Créez votre CV avec l\'IA',
  description: 'Importez votre profil LinkedIn et générez un CV professionnel en quelques secondes grâce à Claude AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
