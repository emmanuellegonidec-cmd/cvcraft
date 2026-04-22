import { CVFormData } from './types';

export function buildGeneratePrompt(data: CVFormData): string {
  let p = `Tu es un expert en rédaction de CV ATS-friendly. Génère un CV professionnel en ${data.lang}, ton ${data.tone}.\n`;

  if (data.targetJob) {
    p += `\nPOSTE VISÉ : "${data.targetJob}"
Adapte le vocabulaire, les verbes d'action et le cadrage du contenu pour ce type de poste. Mets en avant en priorité les expériences et compétences les plus pertinentes pour ce poste (sans jamais en inventer).\n`;
  } else {
    p += `\nAucun poste visé spécifique n'est renseigné — génère un CV générique, professionnel et ATS-friendly, en restant fidèle aux données fournies.\n`;
  }

  p += `\n⚠️ RÈGLES ANTI-HALLUCINATION (ABSOLUES) :
- Utilise UNIQUEMENT les informations fournies ci-dessous. N'invente AUCUN chiffre, AUCUNE donnée, AUCUN fait.
- Ne jamais ajouter une compétence, un outil, une méthodologie ou une certification absents du CV source. Tu peux reformuler les acquis réels avec un vocabulaire plus pertinent, mais pas inventer un savoir-faire.
- Si une information est absente, ne la mentionne pas. Ne complète pas avec des exemples.
- Les seuls chiffres autorisés sont ceux explicitement mentionnés dans les données fournies.
- Ne mets pas de placeholder comme [X années] ou [chiffre].

⚠️ RÈGLES ATS (optimisation pour les robots de tri des CV) :
- Format : une seule page, sections claires dans l'ordre : En-tête → Profil → Expériences → Formation → Compétences.
- Pas de tableaux imbriqués, pas de colonnes parallèles dans le texte, pas de caractères décoratifs exotiques.
- Utiliser des verbes d'action forts en début de bullet (Pilote, Déploie, Optimise, Accompagne, Structure, Coordonne…).
- Quand un résultat mesurable est présent dans les données source, l'inclure explicitement dans le bullet (ex : "Augmentation du CA de 30%", "Équipe de 12 personnes pilotée").

⚠️ RÈGLES DE CONTENU :
- PROFIL : 3 à 4 lignes maximum, dense en mots-clés du métier, sans phrases creuses ni adjectifs gratuits (éviter "dynamique", "passionné", "motivé" sans contexte).
- EXPÉRIENCES : 3 à 5 bullets par expérience, orientés résultat plutôt que tâche (répondre à "qu'est-ce que j'ai produit ?" plus qu'à "qu'est-ce que j'ai fait ?").
- FORMATION : concise, chronologique inverse (plus récente en premier).
- COMPÉTENCES : liste lisible, groupée par thème si pertinent (ex : "Management", "Outils", "Langues").

--- DONNÉES DU CV ---\n`;

  p += `\nNom : ${data.firstName} ${data.lastName}`;
  if (data.title) p += ` | Titre : ${data.title}`;
  if (data.email) p += ` | Email : ${data.email}`;
  if (data.phone) p += ` | Tél : ${data.phone}`;
  if (data.city) p += ` | Ville : ${data.city}`;
  if (data.linkedin) p += ` | LinkedIn : ${data.linkedin}`;

  if (data.summary) p += `\n\nPROFIL PROFESSIONNEL :\n${data.summary}`;

  if (data.experiences.length) {
    p += `\n\nEXPÉRIENCES PROFESSIONNELLES :`;
    data.experiences.forEach(e => {
      p += `\n• ${e.role} chez ${e.company} (${e.start} – ${e.end})`;
      if (e.description) p += `\n  ${e.description}`;
    });
  }

  if (data.education.length) {
    p += `\n\nFORMATION :`;
    data.education.forEach(e => {
      p += `\n• ${e.degree} — ${e.school}`;
      if (e.year) p += ` (${e.year})`;
    });
  }

  if (data.skills) p += `\n\nCOMPÉTENCES :\n${data.skills}`;

  p += `\n\n--- FIN DES DONNÉES ---

Génère maintenant le CV en respectant strictement TOUTES les règles ci-dessus.
Structure de sortie : En-tête → Profil → Expériences → Formation → Compétences.
Longueur : maximum une page (environ 500 mots).`;

  return p;
}

// ⚠️ Prompt d'extraction pour Claude Vision : le PDF est attaché directement au message,
// Claude le lit visuellement. Prompt volontairement simple pour éviter qu'il ré-interprète
// ou redistribue du contenu entre les sections.
export function buildExtractPrompt(): string {
  return `Extrais les données de ce CV PDF et retourne UNIQUEMENT un JSON valide, sans markdown, sans backticks, sans texte avant ou après.

Format attendu :
{"firstName":"","lastName":"","title":"","email":"","phone":"","city":"","linkedin":"","summary":"","skills":"","experiences":[{"role":"","company":"","start":"","end":"","description":""}],"education":[{"degree":"","school":"","year":""}]}

Règles strictes :

1. Extrais ce qui est écrit dans le CV, n'invente rien et ne déplace rien entre les sections.

2. Chaque expérience dans "experiences" = UN poste unique avec SES propres dates et SEULEMENT les bullets/texte qui lui sont directement associés dans le CV. Ne mélange JAMAIS le contenu de deux expériences différentes. Si tu as un doute, isole le contenu dans l'expérience la plus pertinente uniquement.

3. "skills" : UNIQUEMENT des items courts (1 à 4 mots maximum par item) séparés par des virgules. Typiquement : outils/logiciels, langues, compétences techniques courtes, thèmes de compétence condensés. N'inclus PAS de phrases descriptives longues, PAS de réalisations chiffrées, PAS de bullets détaillés. Si tu trouves des bullets longs dans une section "Compétences clés", condense-les en titre court ou ignore-les.

4. "education[].degree" : intitulé du diplôme SEUL. Exclus les parenthèses type "(8 mois)", exclus les préfixes "Réalisation : …" ou descriptions de projets d'école.
   Exemple : "ESCP Extension (8 mois) — IA, No Code et transformation digitale — Réalisation : Plateforme IA de veille…" → degree = "IA, No Code et transformation digitale", school = "ESCP Extension".

5. "summary" : 2 à 4 lignes maximum, uniquement l'accroche/profil personnel en haut du CV. Ne copie pas les compétences ni les expériences.

6. Cherche activement les sections "Formation/Études/Diplômes", "Compétences/Skills/Outils", "Expériences/Parcours", même si elles sont en colonne latérale ou en bas de page. Capture TOUTES les entrées.

7. Dates d'expérience : utilise le format tel qu'écrit dans le CV (ex : "2021", "2021/24", "2025/26"). Pour "end", utilise "Présent" si pas de date de fin.`;
}
