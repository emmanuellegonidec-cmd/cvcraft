import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Score ATS : testez la compatibilité de votre CV | Jean Find My Job',
  description: 'Analyse ATS contextualisée à chaque offre : 6 dimensions évaluées, points forts et points faibles détaillés. Testez gratuitement la compatibilité de votre CV.',
  openGraph: {
    title: 'Score ATS contextualisé offre par offre',
    description: 'Analyse ATS sur 6 dimensions, contextualisée à chaque offre. Gratuit.',
    url: 'https://jeanfindmyjob.fr/score-ats',
    siteName: 'Jean Find My Job',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/score-ats',
  },
}

const faqData = [
  {
    question: "Qu'est-ce qu'un score ATS ?",
    answer: "Un ATS (Applicant Tracking System) est un logiciel utilisé par les recruteurs pour filtrer automatiquement les CV reçus. Le score ATS mesure la compatibilité de votre CV avec ces filtres automatiques et avec les critères d'une offre précise.",
  },
  {
    question: "En quoi l'analyse de Jean Find My Job est différente des autres outils ?",
    answer: "La plupart des outils analysent votre CV dans le vide, sans tenir compte de l'offre visée. Jean Find My Job compare votre CV à l'offre précise à laquelle vous postulez, sur 6 dimensions : format, lisibilité, structure, expériences, compétences et matching.",
  },
  {
    question: "L'analyse ATS est-elle vraiment gratuite ?",
    answer: "Oui. La création de compte et l'analyse ATS sont entièrement gratuites. Aucune carte bancaire n'est demandée.",
  },
  {
    question: "Mon CV est-il stocké de manière sécurisée ?",
    answer: "Vos documents sont stockés de manière sécurisée conformément au RGPD. Vous pouvez les supprimer à tout moment depuis votre espace personnel. Consultez notre politique de confidentialité pour plus de détails.",
  },
  {
    question: "Faut-il créer un compte pour obtenir un score ATS ?",
    answer: "Oui. L'analyse étant contextualisée à une offre précise, vous devez créer un compte gratuit, puis enregistrer l'offre visée et téléverser votre CV. Le processus est rapide et vous êtes guidé pas à pas.",
  },
  {
    question: "Que contient l'analyse en retour ?",
    answer: "Vous obtenez un score global sur 100, une note pour chacune des 6 dimensions analysées, une liste de points forts clairement identifiés et une liste de points faibles avec recommandations concrètes pour améliorer votre candidature.",
  },
  {
    question: "Puis-je faire analyser plusieurs CV pour la même offre ?",
    answer: "Oui. Vous pouvez tester plusieurs versions de votre CV face à une même offre pour identifier celle qui obtient le meilleur score avant de postuler.",
  },
  {
    question: "Au-delà de l'analyse ATS, que propose la plateforme ?",
    answer: "Jean Find My Job vous permet de piloter l'ensemble de votre recherche d'emploi : suivi de vos candidatures en pipeline, calendrier d'entretiens, carnet de contacts recruteurs et tableau de bord.",
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Score ATS : testez la compatibilité de votre CV',
  description: 'Analyse ATS contextualisée à chaque offre, sur 6 dimensions.',
  url: 'https://jeanfindmyjob.fr/score-ats',
  inLanguage: 'fr-FR',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Jean Find My Job',
    url: 'https://jeanfindmyjob.fr',
  },
}

export default function ScoreAtsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <main className="min-h-screen bg-white text-[#111]">
        {/* HERO */}
        <section className="border-b-2 border-[#111] bg-[#F5C400]">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
            <div className="mb-6 inline-block border-2 border-[#111] bg-white px-4 py-2 text-sm font-black uppercase tracking-wide">
              🇫🇷 Nouvelle plateforme française — gratuit
            </div>
            <h1 className="font-['Montserrat'] text-4xl font-black leading-tight md:text-6xl">
              Score ATS contextualisé : 6 dimensions analysées pour chaque candidature
            </h1>
            <p className="mt-6 max-w-3xl text-lg md:text-xl">
              Contrairement aux analyseurs génériques, Jean Find My Job compare votre CV à l'offre
              précise à laquelle vous postulez. Un score global, 6 notes détaillées, des points
              forts et des points faibles actionnables.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-block border-2 border-[#111] bg-[#111] px-8 py-4 text-center font-black text-[#F5C400] shadow-[3px_3px_0_#E8151B] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#E8151B]"
              >
                CRÉER MON COMPTE GRATUIT
              </Link>
<a              
                href="#comment-ca-marche"
                className="inline-block border-2 border-[#111] bg-white px-8 py-4 text-center font-black text-[#111] shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#111]"
              >
                VOIR COMMENT ÇA MARCHE ↓
              </a>
            </div>
          </div>
        </section>

        {/* PROBLÈME ATS GÉNÉRIQUE */}
        <section className="border-b-2 border-[#111]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Un score ATS « dans le vide » ne sert à rien
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-lg leading-relaxed">
                  La plupart des outils d'analyse ATS se contentent de vérifier la forme de votre
                  CV : format, mots-clés génériques, structure. Résultat : vous obtenez un score
                  global déconnecté de la réalité du recrutement.
                </p>
                <p className="mt-4 text-lg leading-relaxed">
                  Pourtant, un CV n'est jamais évalué seul. Il est évalué <strong>face à une
                  offre précise</strong>, avec ses mots-clés métier, ses exigences, ses critères de
                  sélection propres.
                </p>
              </div>
              <div className="border-2 border-[#111] bg-[#F5C400] p-6 shadow-[3px_3px_0_#111]">
                <p className="font-['Montserrat'] text-xl font-black">
                  Notre différence
                </p>
                <p className="mt-4 text-lg">
                  Jean Find My Job analyse votre CV <strong>en contexte</strong> : face à l'offre
                  que vous visez réellement. Le score et les recommandations sont personnalisés,
                  pas génériques.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE : 6 DIMENSIONS */}
        <section id="comment-ca-marche" className="border-b-2 border-[#111] bg-gray-50">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Les 6 dimensions analysées
            </h2>
            <p className="mt-4 max-w-3xl text-lg">
              Chaque candidature enregistrée dans Jean Find My Job peut être analysée sur 6
              critères précis. Vous obtenez un score détaillé qui vous permet de savoir
              exactement où améliorer votre CV.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  titre: 'FORMAT',
                  note: '/15',
                  desc: 'Compatibilité technique avec les ATS : type de fichier, lisibilité automatique, absence d\'éléments qui bloquent la lecture.',
                },
                {
                  titre: 'LISIBILITÉ',
                  note: '/15',
                  desc: 'Clarté visuelle, hiérarchie de l\'information, choix typographiques. Un CV lisible par une machine doit aussi l\'être par un humain.',
                },
                {
                  titre: 'STRUCTURE',
                  note: '/10',
                  desc: 'Organisation des sections, ordre logique des informations, titres reconnaissables par les ATS.',
                },
                {
                  titre: 'EXPÉRIENCES',
                  note: '/30',
                  desc: 'Qualité des descriptions d\'expériences, présence de réalisations chiffrées, pertinence face à l\'offre visée.',
                },
                {
                  titre: 'COMPÉTENCES',
                  note: '/10',
                  desc: 'Adéquation entre les compétences présentées et celles demandées par l\'offre. Détection des mots-clés attendus.',
                },
                {
                  titre: 'MATCHING',
                  note: '/10',
                  desc: 'Degré de correspondance global entre votre profil et l\'offre. Le cœur de l\'analyse contextualisée.',
                },
              ].map((item) => (
                <div
                  key={item.titre}
                  className="border-2 border-[#111] bg-white p-6 shadow-[3px_3px_0_#111]"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-['Montserrat'] text-lg font-black uppercase tracking-wide">
                      {item.titre}
                    </h3>
                    <span className="text-sm font-bold text-[#888]">{item.note}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CAPTURE D'ÉCRAN PLACEHOLDER */}
        <section className="border-b-2 border-[#111]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Un rapport d'analyse détaillé et actionnable
            </h2>
            <p className="mt-4 max-w-3xl text-lg">
              Après l'analyse, vous recevez un rapport complet : score global, notes détaillées
              par dimension, points forts et points faibles avec recommandations concrètes.
            </p>

            {/* EMPLACEMENT CAPTURE 1 */}
            <div className="mt-10 border-2 border-dashed border-[#888] bg-gray-50 p-12 text-center">
              <p className="font-['Montserrat'] text-lg font-black text-[#888]">
                [CAPTURE 1 : rapport d'analyse complet]
              </p>
              <p className="mt-2 text-sm text-[#888]">
                À remplacer par une capture d'écran du modal « Score ATS » avec score global et 6
                dimensions visibles.
              </p>
              <p className="mt-4 text-xs text-[#888]">
                Fichier à placer dans : /public/images/score-ats-rapport.png
              </p>
            </div>

            {/* EMPLACEMENT CAPTURE 2 */}
            <div className="mt-6 border-2 border-dashed border-[#888] bg-gray-50 p-12 text-center">
              <p className="font-['Montserrat'] text-lg font-black text-[#888]">
                [CAPTURE 2 : points forts et points faibles]
              </p>
              <p className="mt-2 text-sm text-[#888]">
                À remplacer par une capture d'écran des blocs « Points forts » (vert) et « Points
                faibles » (rouge).
              </p>
              <p className="mt-4 text-xs text-[#888]">
                Fichier à placer dans : /public/images/score-ats-points.png
              </p>
            </div>
          </div>
        </section>

        {/* 8 ERREURS QUI TUENT LE SCORE ATS */}
        <section className="border-b-2 border-[#111] bg-[#111] text-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black text-[#F5C400] md:text-4xl">
              Les 8 erreurs qui tuent votre score ATS
            </h2>
            <p className="mt-4 max-w-3xl text-lg">
              Avant même d'analyser votre CV, certains choix de forme le disqualifient auprès des
              filtres automatiques. Vérifiez que vous n'en commettez aucun.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                {
                  num: '01',
                  titre: 'Les tableaux et colonnes multiples',
                  desc: 'Les ATS lisent le texte de gauche à droite, ligne par ligne. Une mise en page en colonnes mélange les informations de manière illisible.',
                },
                {
                  num: '02',
                  titre: 'Les images et photos intégrées au texte',
                  desc: 'Une image est invisible pour un ATS. Si votre poste ou vos compétences apparaissent dans une image, ils sont simplement ignorés.',
                },
                {
                  num: '03',
                  titre: 'Les polices exotiques',
                  desc: 'Privilégiez des polices standards : Arial, Calibri, Helvetica, Garamond. Les polices fantaisistes peuvent être mal lues ou rejetées.',
                },
                {
                  num: '04',
                  titre: 'Les en-têtes et pieds de page',
                  desc: 'Certains ATS ne lisent pas les zones d\'en-tête et de pied de page. Votre nom, votre email ou votre téléphone placés là peuvent disparaître.',
                },
                {
                  num: '05',
                  titre: 'Les fichiers scannés ou images de CV',
                  desc: 'Un CV scanné en PDF n\'est pas un texte : c\'est une image. Sans OCR, les ATS n\'en lisent aucun mot.',
                },
                {
                  num: '06',
                  titre: 'L\'absence de mots-clés métier',
                  desc: 'Les ATS cherchent les mots-clés de l\'offre dans votre CV. Si vous écrivez « responsable de projet » alors que l\'offre demande un « chef de projet », vous êtes filtré.',
                },
                {
                  num: '07',
                  titre: 'Les formats non standards',
                  desc: 'Envoyez toujours un PDF ou un fichier Word (.docx). Évitez les formats comme .pages, .odt ou les fichiers exportés depuis des outils de design.',
                },
                {
                  num: '08',
                  titre: 'Les titres de sections fantaisistes',
                  desc: 'Utilisez des titres reconnaissables : « Expérience professionnelle », « Formation », « Compétences ». Un titre original comme « Mon parcours » peut ne pas être identifié.',
                },
              ].map((err) => (
                <div
                  key={err.num}
                  className="border-2 border-[#F5C400] bg-[#111] p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-['Montserrat'] text-3xl font-black text-[#F5C400]">
                      {err.num}
                    </span>
                    <div>
                      <h3 className="font-['Montserrat'] text-lg font-black">{err.titre}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-200">{err.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POURQUOI L'ANALYSE CONTEXTUALISÉE CHANGE TOUT */}
        <section className="border-b-2 border-[#111]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Pourquoi l'analyse contextualisée change tout
            </h2>

            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <div className="border-2 border-[#111] bg-white p-6 shadow-[3px_3px_0_#1B4F72]">
                <h3 className="font-['Montserrat'] text-lg font-black uppercase">
                  Des recommandations précises
                </h3>
                <p className="mt-3 text-sm leading-relaxed">
                  Au lieu de conseils génériques (« ajoutez des mots-clés »), vous recevez des
                  recommandations liées à l'offre visée : quel mot-clé manque, quelle compétence
                  renforcer, quelle expérience mieux mettre en valeur.
                </p>
              </div>
              <div className="border-2 border-[#111] bg-white p-6 shadow-[3px_3px_0_#1A7A4A]">
                <h3 className="font-['Montserrat'] text-lg font-black uppercase">
                  Plusieurs versions possibles
                </h3>
                <p className="mt-3 text-sm leading-relaxed">
                  Vous pouvez tester différentes versions de votre CV face à une même offre, et
                  identifier celle qui obtient le meilleur score avant de postuler.
                </p>
              </div>
              <div className="border-2 border-[#111] bg-white p-6 shadow-[3px_3px_0_#E8151B]">
                <h3 className="font-['Montserrat'] text-lg font-black uppercase">
                  Un historique par offre
                </h3>
                <p className="mt-3 text-sm leading-relaxed">
                  Chaque analyse est rattachée à une candidature précise. Vous gardez la trace de
                  l'adéquation de votre CV pour chaque offre à laquelle vous postulez.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AU-DELÀ DU SCORE : PITCH PRODUIT */}
        <section className="border-b-2 border-[#111] bg-[#F5C400]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Au-delà du score ATS : pilotez toute votre recherche
            </h2>
            <p className="mt-4 max-w-3xl text-lg">
              L'analyse ATS n'est qu'une fonctionnalité parmi d'autres. Jean Find My Job vous
              accompagne sur l'ensemble de votre recherche d'emploi, du premier contact jusqu'à
              la signature du contrat.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { emoji: '📋', titre: 'Pipeline', desc: 'Suivez toutes vos candidatures en mode kanban.' },
                { emoji: '📅', titre: 'Calendrier', desc: 'Centralisez entretiens et relances.' },
                { emoji: '👥', titre: 'Contacts', desc: 'Carnet de recruteurs et de contacts réseau.' },
                { emoji: '📊', titre: 'Tableau de bord', desc: 'Vue d\'ensemble de votre recherche.' },
              ].map((f) => (
                <div
                  key={f.titre}
                  className="border-2 border-[#111] bg-white p-6 shadow-[3px_3px_0_#111]"
                >
                  <div className="text-3xl">{f.emoji}</div>
                  <h3 className="mt-3 font-['Montserrat'] text-lg font-black">{f.titre}</h3>
                  <p className="mt-2 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-block border-2 border-[#111] bg-[#111] px-8 py-4 font-black text-[#F5C400] shadow-[3px_3px_0_#E8151B] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#E8151B]"
              >
                DÉCOUVRIR LA PLATEFORME GRATUITEMENT
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b-2 border-[#111]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Questions fréquentes
            </h2>
            <div className="mt-10 space-y-4">
              {faqData.map((item, idx) => (
                <details
                  key={idx}
                  className="group border-2 border-[#111] bg-white p-6 shadow-[3px_3px_0_#111]"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-['Montserrat'] text-lg font-black">
                    {item.question}
                    <span className="ml-4 text-2xl transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-[#111] text-white">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <h2 className="font-['Montserrat'] text-3xl font-black text-[#F5C400] md:text-5xl">
              Ne laissez plus les ATS filtrer vos candidatures
            </h2>
            <p className="mt-6 text-lg">
              Créez votre compte gratuit et testez l'analyse ATS sur votre première candidature.
            </p>
            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-block border-2 border-[#F5C400] bg-[#F5C400] px-10 py-5 font-black text-[#111] shadow-[4px_4px_0_#E8151B] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#E8151B]"
              >
                CRÉER MON COMPTE GRATUIT
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              Gratuit · Sans carte bancaire · Données protégées (RGPD)
            </p>
          </div>
        </section>
      </main>
    </>
  )
}