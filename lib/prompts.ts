import { CVFormData } from './types';

// ⚠️ Prompt de génération : demande à Claude un JSON structuré (même forme que CVFormData)
// pour que les enrichissements IA (summary retravaillé, descriptions d'expériences orientées résultats,
// compétences reformulées) alimentent directement les templates PDF.
export function buildGeneratePrompt(data: CVFormData): string {
  let p = `Tu es un expert en rédaction de CV ATS-friendly. Optimise ce CV en ${data.lang}, ton ${data.tone}.\n`;

  if (data.targetJob) {
    p += `\nPOSTE VISÉ : "${data.targetJob}"
Adapte le vocabulaire, les verbes d'action et le cadrage du contenu pour ce type de poste. Mets en avant en priorité les expériences et compétences les plus pertinentes pour ce poste (sans jamais en inventer).\n`;
  } else {
    p += `\nAucun poste visé spécifique n'est renseigné — optimise le CV de manière générique, professionnelle et ATS-friendly, en restant fidèle aux données fournies.\n`;
  }

  p += `
⚠️ FORMAT DE SORTIE OBLIGATOIRE :
Tu retournes UNIQUEMENT un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.

Structure exacte attendue (mêmes champs qu'en entrée) :
{
  "firstName": "",
  "lastName": "",
  "title": "",
  "email": "",
  "phone": "",
  "city": "",
  "linkedin": "",
  "summary": "",
  "experiences": [
    { "role": "", "company": "", "start": "", "end": "", "description": "" }
  ],
  "education": [
    { "degree": "", "school": "", "year": "" }
  ],
  "skills": ""
}

⚠️ RÈGLES DE TRANSFORMATION :
- Tu réécris et optimises les champs textuels ("summary", "experiences[].description", "skills") pour qu'ils soient plus dense en mots-clés du métier, plus orientés résultat, plus ATS-friendly.
- Les champs factuels ("firstName", "lastName", "email", "phone", "city", "linkedin", "experiences[].role", "experiences[].company", "experiences[].start", "experiences[].end", "education[].degree", "education[].school", "education[].year", "title") sont REPRIS TELS QUELS, sans modification.
- Tu conserves le MÊME NOMBRE d'expériences et de formations qu'en entrée, dans le MÊME ORDRE. Tu ne supprimes ni n'ajoutes aucune expérience, aucune formation.

⚠️ RÈGLES ANTI-HALLUCINATION (ABSOLUES) :
- Utilise UNIQUEMENT les informations fournies ci-dessous. N'invente AUCUN chiffre, AUCUNE donnée, AUCUN fait.
- Ne jamais ajouter une compétence, un outil, une méthodologie ou une certification absents du CV source. Tu peux reformuler les acquis réels avec un vocabulaire plus pertinent, mais pas inventer un savoir-faire.
- Si une information est absente en entrée, renvoie une chaîne vide "" dans le JSON. Ne complète PAS avec des exemples ou des placeholders.
- Les seuls chiffres autorisés sont ceux explicitement mentionnés dans les données fournies.
- Ne mets pas de placeholder comme [X années] ou [chiffre].

⚠️ RÈGLES DE CONTENU :
- summary : 3 à 4 lignes maximum, dense en mots-clés du métier, sans phrases creuses ni adjectifs gratuits (éviter "dynamique", "passionné", "motivé" sans contexte).
- experiences[].description : 3 à 5 lignes séparées par des retours à la ligne "\\n". Chaque ligne est un bullet orienté résultat plutôt que tâche. Verbes d'action forts en début (Pilote, Déploie, Optimise, Accompagne, Structure, Coordonne…). Quand un résultat mesurable est présent dans les données source, l'inclure explicitement (ex : "Augmentation du CA de 30%", "Équipe de 12 personnes pilotée").
- skills : liste séparée par des virgules, items courts (1 à 4 mots maximum par item), groupés par thème si pertinent.

--- DONNÉES DU CV EN ENTRÉE ---

{
  "firstName": ${JSON.stringify(data.firstName || '')},
  "lastName": ${JSON.stringify(data.lastName || '')},
  "title": ${JSON.stringify(data.title || '')},
  "email": ${JSON.stringify(data.email || '')},
  "phone": ${JSON.stringify(data.phone || '')},
  "city": ${JSON.stringify(data.city || '')},
  "linkedin": ${JSON.stringify(data.linkedin || '')},
  "summary": ${JSON.stringify(data.summary || '')},
  "experiences": ${JSON.stringify(data.experiences || [])},
  "education": ${JSON.stringify(data.education || [])},
  "skills": ${JSON.stringify(data.skills || '')}
}

--- FIN DES DONNÉES ---

Retourne maintenant l'objet JSON optimisé, en respectant strictement TOUTES les règles ci-dessus.`;

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
