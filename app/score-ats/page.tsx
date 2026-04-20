import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Score ATS : testez la compatibilité de votre CV | Jean find my Job",
  description:
    "Analyse ATS contextualisée à chaque offre : score global, notes détaillées, points forts et points faibles. Testez gratuitement la compatibilité de votre CV.",
  openGraph: {
    title: "Score ATS contextualisé offre par offre",
    description: "Analyse ATS contextualisée à chaque offre. Gratuit.",
    url: "https://jeanfindmyjob.fr/score-ats",
    siteName: "Jean find my Job",
    locale: "fr_FR",
    type: "website",
  },
  alternates: {
    canonical: "https://jeanfindmyjob.fr/score-ats",
  },
}

const faqData = [
  {
    question: "Qu'est-ce qu'un score ATS ?",
    answer:
      "Un ATS (Applicant Tracking System) est un logiciel utilisé par les recruteurs pour filtrer automatiquement les CV reçus. Le score ATS mesure la compatibilité de votre CV avec ces filtres automatiques et avec les critères d'une offre précise.",
  },
  {
    question: "En quoi l'analyse de Jean find my Job est différente ?",
    answer:
      "Votre CV est comparé à l'offre précise à laquelle vous postulez. Vous obtenez un score global, des notes détaillées, des points forts clairement identifiés et des points faibles avec recommandations concrètes.",
  },
  {
    question: "L'analyse ATS est-elle vraiment gratuite ?",
    answer:
      "Oui. La création de compte et l'analyse ATS sont entièrement gratuites. Aucune carte bancaire n'est demandée.",
  },
  {
    question: "Mon CV est-il stocké de manière sécurisée ?",
    answer:
      "Vos documents sont stockés de manière sécurisée conformément au RGPD. Vous pouvez les supprimer à tout moment depuis votre espace personnel. Consultez notre politique de confidentialité pour plus de détails.",
  },
  {
    question: "Faut-il créer un compte pour obtenir un score ATS ?",
    answer:
      "Oui. L'analyse étant contextualisée à une offre précise, vous devez créer un compte gratuit, puis enregistrer l'offre visée et téléverser votre CV. Le processus est rapide et vous êtes guidé pas à pas.",
  },
  {
    question: "Que contient l'analyse en retour ?",
    answer:
      "Vous obtenez un score global sur 100, des notes détaillées, une liste de points forts clairement identifiés et une liste de points faibles avec recommandations concrètes pour améliorer votre candidature.",
  },
  {
    question: "Puis-je faire analyser plusieurs CV pour la même offre ?",
    answer:
      "Oui. Vous pouvez tester plusieurs versions de votre CV face à une même offre pour identifier celle qui obtient le meilleur score avant de postuler.",
  },
  {
    question: "Au-delà de l'analyse ATS, que propose la plateforme ?",
    answer:
      "Jean find my Job vous permet de piloter l'ensemble de votre recherche d'emploi : suivi de candidatures, calendrier d'entretiens, carnet de contacts recruteurs et tableau de bord.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
}

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Score ATS : testez la compatibilité de votre CV",
  description: "Analyse ATS contextualisée à chaque offre.",
  url: "https://jeanfindmyjob.fr/score-ats",
  inLanguage: "fr-FR",
  isPartOf: {
    "@type": "WebSite",
    name: "Jean find my Job",
    url: "https://jeanfindmyjob.fr",
  },
}

const points = [
  {
    num: "1",
    titre: "Éviter les tableaux et colonnes multiples",
    desc: "Les ATS lisent le texte de gauche à droite, ligne par ligne. Une mise en page en colonnes peut mélanger les informations.",
  },
  {
    num: "2",
    titre: "Ne pas mettre vos informations dans des images",
    desc: "Une image est invisible pour un ATS. Si votre poste ou vos compétences apparaissent uniquement dans une image, ils sont ignorés.",
  },
  {
    num: "3",
    titre: "Choisir une police standard",
    desc: "Privilégiez des polices classiques : Arial, Calibri, Helvetica, Garamond. Les polices fantaisistes peuvent être mal lues.",
  },
  {
    num: "4",
    titre: "Éviter les en-têtes et pieds de page",
    desc: "Certains ATS ne lisent pas ces zones. Votre nom, votre email ou votre téléphone placés là peuvent disparaître de l'analyse.",
  },
  {
    num: "5",
    titre: "Envoyer un fichier texte, pas une image",
    desc: "Un CV scanné en PDF n'est pas un texte : c'est une image. Sans OCR, les ATS n'en lisent aucun mot.",
  },
  {
    num: "6",
    titre: "Reprendre les mots-clés de l'offre",
    desc: "Les ATS cherchent les mots-clés de l'offre dans votre CV. Reformulez vos intitulés avec les termes utilisés par le recruteur.",
  },
  {
    num: "7",
    titre: "Choisir un format standard",
    desc: "Envoyez un PDF ou un fichier Word (.docx). Évitez les formats comme .pages, .odt ou les fichiers exportés depuis des outils de design.",
  },
  {
    num: "8",
    titre: "Utiliser des titres de sections reconnaissables",
    desc: "Préférez des titres classiques : « Expérience professionnelle », « Formation », « Compétences ». Un titre original peut ne pas être identifié.",
  },
]

const pilotage = [
  { emoji: "📋", titre: "Suivi de candidatures", desc: "Toutes vos candidatures en mode kanban." },
  { emoji: "📅", titre: "Calendrier", desc: "Centralisez entretiens et relances." },
  { emoji: "👥", titre: "Contacts", desc: "Carnet de recruteurs et de contacts." },
  { emoji: "📊", titre: "Tableau de bord", desc: "Vue d'ensemble de votre recherche." },
]

const analyseCards = [
  {
    titre: "Un score global",
    desc: "Une note sur 100 qui vous indique immédiatement le niveau de compatibilité entre votre CV et l'offre que vous visez.",
    shadow: "shadow-[3px_3px_0_#F5C400]",
  },
  {
    titre: "Des points forts identifiés",
    desc: "Ce qui fonctionne déjà dans votre CV face à cette offre. Des arguments concrets que vous pouvez aussi reprendre dans votre lettre de motivation.",
    shadow: "shadow-[3px_3px_0_#1A7A4A]",
  },
  {
    titre: "Des points à améliorer",
    desc: "Les écarts entre votre CV et l'offre, avec des recommandations concrètes pour améliorer votre candidature avant d'envoyer.",
    shadow: "shadow-[3px_3px_0_#E8151B]",
  },
]

const contextualise = [
  {
    titre: "Des recommandations précises",
    desc: "Au lieu de conseils génériques, vous recevez des recommandations liées à l'offre visée.",
    shadow: "shadow-[3px_3px_0_#1B4F72]",
  },
  {
    titre: "Plusieurs versions possibles",
    desc: "Testez différentes versions de votre CV face à une même offre, et identifiez celle qui obtient le meilleur score.",
    shadow: "shadow-[3px_3px_0_#1A7A4A]",
  },
  {
    titre: "Un historique par offre",
    desc: "Chaque analyse est rattachée à une candidature précise. Vous gardez la trace de chaque adéquation CV / offre.",
    shadow: "shadow-[3px_3px_0_#E8151B]",
  },
]

const dimensions = [
  { name: "FORMAT", score: 14, total: 15, percent: 93, color: "#1A7A4A" },
  { name: "LISIBILITÉ", score: 14, total: 15, percent: 93, color: "#1A7A4A" },
  { name: "STRUCTURE", score: 9, total: 10, percent: 90, color: "#1A7A4A" },
  { name: "EXPÉRIENCES", score: 24, total: 30, percent: 80, color: "#1A7A4A" },
  { name: "COMPÉTENCES", score: 10, total: 10, percent: 100, color: "#1A7A4A" },
  { name: "MATCHING", score: 7, total: 10, percent: 70, color: "#E89F1F" },
]

const pointsForts = [
  "Titre parfaitement aligné avec le poste",
  "Pitch percutant axé sur les résultats",
  "Expérience directement pertinente",
  "Compétences techniques exhaustives",
  "Résultats chiffrés concrets",
]

const pointsFaibles = [
  "Niveau d'anglais non mentionné",
  "Compétence clé de l'offre non explicite",
  "Certaines expériences diluées",
  "Surcharge dans une section",
  "Formation initiale éloignée du domaine",
]

const recommandations = [
  { severity: "MAJEURE", text: "Absence de mention du niveau d'anglais (critère explicite de l'offre)" },
  { severity: "MINEURE", text: "Compétence clé non mentionnée explicitement" },
  { severity: "MINEURE", text: "Date de disponibilité non précisée" },
  { severity: "MINEURE", text: "Adéquation culturelle à renforcer" },
]

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
        <section className="border-b-2 border-[#111] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
            <h1 className="font-['Montserrat'] text-4xl font-black leading-tight md:text-6xl">
              Score ATS contextualisé : 6 notes détaillées pour chaque candidature
            </h1>
            <p className="mt-6 max-w-3xl text-lg md:text-xl">
              Jean find my Job compare votre CV à l'offre précise à laquelle vous postulez. Un
              score global, 6 notes détaillées, des points forts et des points faibles
              actionnables.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-block border-2 border-[#111] bg-[#F5C400] px-8 py-4 text-center font-black text-[#111] shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#111]"
              >
                CRÉER MON COMPTE GRATUIT
              </Link>
              <Link
                href="#analyse-complete"
                className="inline-block border-2 border-[#111] bg-white px-8 py-4 text-center font-black text-[#111] shadow-[3px_3px_0_#E8151B] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#E8151B]"
              >
                EN SAVOIR PLUS ↓
              </Link>
            </div>
          </div>
        </section>

        {/* PROBLÈME ATS GÉNÉRIQUE */}
        <section className="border-b-2 border-[#111] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Un score ATS « dans le vide » ne sert à rien
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-lg leading-relaxed">
                  Un CV n'est jamais évalué seul. Il est évalué face à une offre précise, avec
                  ses mots-clés métier, ses exigences, ses critères de sélection propres.
                </p>
                <p className="mt-4 text-lg leading-relaxed">
                  Un score général sur votre CV ne vous dit pas si vous êtes un bon candidat
                  pour l'offre qui vous intéresse aujourd'hui.
                </p>
              </div>
              <div className="border-2 border-[#111] bg-white p-6 shadow-[3px_3px_0_#111]">
                <p className="font-['Montserrat'] text-xl font-black">Notre approche</p>
                <p className="mt-4 text-lg">
                  Jean find my Job analyse votre CV <strong>en contexte</strong> : face à
                  l'offre que vous visez réellement. Le score et les recommandations sont
                  personnalisés.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ANALYSE COMPLÈTE */}
        <section id="analyse-complete" className="border-b-2 border-[#111] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Une analyse complète et contextualisée
            </h2>
            <p className="mt-4 max-w-3xl text-lg">
              Chaque candidature enregistrée dans Jean find my Job peut être analysée pour
              mesurer précisément la compatibilité de votre CV avec l'offre ciblée.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {analyseCards.map((item) => (
                <div
                  key={item.titre}
                  className={`border-2 border-[#111] bg-white p-6 ${item.shadow}`}
                >
                  <h3 className="font-['Montserrat'] text-lg font-black uppercase">
                    {item.titre}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RAPPORT D'ANALYSE - RECONSTITUTION HTML DES 3 CAPTURES */}
        <section className="border-b-2 border-[#111] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Un rapport d'analyse clair et actionnable
            </h2>
            <p className="mt-4 max-w-3xl text-lg">
              Après l'analyse, vous recevez un rapport complet directement dans votre espace.
              Score global, notes détaillées, points forts, points à améliorer et
              recommandations hiérarchisées.
            </p>

            {/* Bloc 1 : Score global + 6 dimensions */}
            <div className="mt-12">
              <div className="rounded-lg bg-[#1a1a1a] p-6 md:p-8">
                <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                  <div className="relative h-24 w-24 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#333" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#1A7A4A"
                        strokeWidth="8"
                        pathLength="100"
                        strokeDasharray="87 100"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-['Montserrat'] text-3xl font-black text-[#1A7A4A]">
                        87
                      </span>
                      <span className="text-xs text-[#1A7A4A]">/100</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-['Montserrat'] text-xs font-black tracking-wider text-[#F5C400]">
                      SCORE ATS
                    </div>
                    <div className="mt-1 font-['Montserrat'] text-xl font-black text-white md:text-2xl">
                      Excellent niveau de compatibilité
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F5C400] px-3 py-1 font-['Montserrat'] text-xs font-black text-[#111]">
                        1 majeure
                      </span>
                      <span className="rounded-full bg-[#444] px-3 py-1 font-['Montserrat'] text-xs text-gray-200">
                        3 mineures
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                {dimensions.map((d) => (
                  <div
                    key={d.name}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="font-['Montserrat'] text-xs font-black tracking-wider text-gray-600">
                      {d.name}
                    </div>
                    <div
                      className="mt-1 font-['Montserrat'] text-2xl font-black"
                      style={{ color: d.color }}
                    >
                      {d.score}
                      <span className="text-sm font-normal text-gray-500">/{d.total}</span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${d.percent}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-sm italic text-gray-600">
                Un score global sur 100 et 6 notes détaillées pour mesurer précisément la
                compatibilité.
              </p>
            </div>

            {/* Blocs 2 et 3 : côte à côte sur desktop, empilés sur mobile */}
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {/* Bloc 2 : Points forts et points faibles */}
              <div>
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2">
                  <div className="rounded-md border border-[#1A7A4A] bg-[#E6F4EA] p-4">
                    <div className="font-['Montserrat'] text-xs font-black tracking-wider text-[#1A7A4A]">
                      POINTS FORTS
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm text-[#1A7A4A]">
                      {pointsForts.map((pt, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-black">+</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md border border-[#E8151B] bg-[#FCE6E7] p-4">
                    <div className="font-['Montserrat'] text-xs font-black tracking-wider text-[#E8151B]">
                      POINTS FAIBLES
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm text-[#A02020]">
                      {pointsFaibles.map((pt, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-black">−</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-center text-sm italic text-gray-600">
                  Points forts et points à améliorer, avec des exemples concrets issus de votre
                  CV.
                </p>
              </div>

              {/* Bloc 3 : Recommandations hiérarchisées */}
              <div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <div className="font-['Montserrat'] text-xs font-black tracking-wider text-gray-700">
                    RECOMMANDATIONS
                  </div>
                  <ul className="mt-4 space-y-3">
                    {recommandations.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className={`shrink-0 px-2 py-0.5 font-['Montserrat'] text-xs font-black ${
                            r.severity === "MAJEURE"
                              ? "bg-[#F5C400] text-[#111]"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {r.severity}
                        </span>
                        <span className="text-sm leading-snug text-gray-700">{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-center text-sm italic text-gray-600">
                  Des recommandations hiérarchisées pour prioriser vos actions avant de postuler.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8 POINTS À VÉRIFIER - STYLE HOMEPAGE */}
        <section className="border-b-2 border-[#111] bg-[#111] text-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black text-[#F5C400] md:text-4xl">
              8 points à vérifier sur votre CV avant de postuler
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-gray-200">
              Quelques bonnes pratiques simples qui améliorent la lecture de votre CV par les
              ATS et par les recruteurs.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {points.map((p) => (
                <div
                  key={p.num}
                  className="flex flex-col items-center border-2 border-[#333] bg-[#1a1a1a] p-6 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#111] bg-[#F5C400] font-['Montserrat'] text-2xl font-black text-[#111]">
                    {p.num}
                  </div>
                  <h3 className="mt-4 font-['Montserrat'] text-base font-black text-white">
                    {p.titre}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POURQUOI L'ANALYSE CONTEXTUALISÉE CHANGE TOUT */}
        <section className="border-b-2 border-[#111] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black md:text-4xl">
              Pourquoi l'analyse contextualisée change tout
            </h2>

            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {contextualise.map((item) => (
                <div
                  key={item.titre}
                  className={`border-2 border-[#111] bg-white p-6 ${item.shadow}`}
                >
                  <h3 className="font-['Montserrat'] text-lg font-black uppercase">
                    {item.titre}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AU-DELÀ DU SCORE : FOND NOIR COMME LA HOME */}
        <section className="border-b-2 border-[#111] bg-[#111] text-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-['Montserrat'] text-3xl font-black text-[#F5C400] md:text-4xl">
              Au-delà du score ATS : pilotez toute votre recherche
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-gray-200">
              L'analyse ATS n'est qu'une fonctionnalité parmi d'autres. Jean find my Job vous
              accompagne sur l'ensemble de votre recherche d'emploi.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {pilotage.map((f) => (
                <div
                  key={f.titre}
                  className="border-2 border-[#333] bg-[#1a1a1a] p-6"
                >
                  <div className="text-3xl">{f.emoji}</div>
                  <h3 className="mt-3 font-['Montserrat'] text-lg font-black text-[#F5C400]">
                    {f.titre}
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/auth/signup"
                className="inline-block border-2 border-[#F5C400] bg-[#F5C400] px-8 py-4 font-black text-[#111] shadow-[3px_3px_0_#E8151B] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#E8151B]"
              >
                DÉCOUVRIR LA PLATEFORME
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b-2 border-[#111] bg-white">
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
              Testez gratuitement l'analyse ATS sur votre première candidature
            </h2>
            <p className="mt-6 text-lg">
              Créez votre compte et obtenez votre score en quelques minutes.
            </p>
            <div className="mt-10">
              <Link
                href="/auth/signup"
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
