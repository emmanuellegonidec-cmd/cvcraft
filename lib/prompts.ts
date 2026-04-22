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
// Claude le lit visuellement (plus besoin de pdfjs + texte brut côté client).
export function buildExtractPrompt(): string {
  return `Analyse ce CV PDF et retourne UNIQUEMENT un JSON valide sans markdown, sans backticks, sans texte avant ou après.

Format attendu :
{"firstName":"","lastName":"","title":"","email":"","phone":"","city":"","linkedin":"","summary":"","skills":"","experiences":[{"role":"","company":"","start":"","end":"","description":""}],"education":[{"degree":"","school":"","year":""}]}

⚠️ RÈGLES GÉNÉRALES :
- Extrais uniquement ce qui est présent dans le CV, n'invente rien.
- Le CV peut utiliser un layout complexe (multi-colonnes Canva, icônes, blocs séparés) — lis l'ensemble du document visuel et associe chaque information à la bonne section du JSON.
- ANTI-DOUBLON : une même information ne doit apparaître QU'UNE FOIS dans le JSON. Si un thème apparaît à la fois comme titre de section ET comme sous-bullet détaillé, garde UNIQUEMENT la version courte (titre) et place le détail chiffré dans le champ adapté (généralement experiences.description).

⚠️ SPÉCIFICATION PAR CHAMP :

**summary** : 2 à 4 lignes MAXIMUM. L'accroche ou le profil personnel en haut du CV (généralement juste sous le nom ou le titre). Ne copie PAS la liste des compétences ni les expériences ici.

**skills** : UNIQUEMENT des éléments COURTS (1 à 4 mots maximum par item) séparés par des virgules.
Exemples corrects :
  ✅ "HubSpot, Figma, SEO, Management d'équipe, Stratégie marketing 360°, Growth hacking, Anglais courant"
Exemples INCORRECTS à éviter :
  ❌ "Management et structuration d'équipes pluridisciplinaires avec OKRs" (trop long — condense en "Management d'équipe")
  ❌ "Pilotage budgétaire : 1,4 M€ - PGW" (réalisation chiffrée → doit aller dans experiences.description)
  ❌ "Optimisation de la relation client (CSM) : refonte des campagnes emailing" (bullet descriptif → doit aller dans experiences.description)
Règle : si un CV contient un bloc "Compétences clés" avec des titres de thèmes ET des sous-bullets détaillés en dessous, garde UNIQUEMENT les titres des thèmes (condensés si nécessaire), et mets les sous-bullets dans experiences.description de l'expérience concernée.

**experiences[].role** : intitulé du poste uniquement (ex : "Directrice Marketing").
**experiences[].company** : nom de l'entreprise seul, sans tags contextuels type "(CA : 230M€)" ou "SaaS B2B" (ces infos peuvent aller dans description).
**experiences[].start / end** : format "YYYY" ou "YYYY/MM". Utilise "Présent" pour end si c'est le poste actuel.
**experiences[].description** : les bullets/phrases des réalisations, avec chiffres et résultats. C'est ICI que vont les détails techniques et les résultats mesurables (ex : "Pilotage budgétaire 1,4 M€ sur PGW", "Taux d'ouverture email 12% → 50%").

**education[].degree** : intitulé du diplôme ou du programme SEUL. N'inclus PAS :
  ❌ Les parenthèses type "(8 mois)", "(2 mois)", "(18 mois)"
  ❌ Les préfixes "Réalisation : …" ou les descriptions de projets d'école
Exemples corrects :
  ✅ "IA, No Code et transformation digitale"
  ✅ "3ème cycle - Marketing, Commerce & Communication"
  ✅ "Bachelor Growth hacking"
**education[].school** : nom de l'école/institution seul (ex : "ESCP Extension", "ISC Paris", "Université de Rennes").
**education[].year** : année principale (ex : "2025", "1999").

⚠️ SECTIONS À CHERCHER ACTIVEMENT DANS LE CV :
- "Formation", "Études", "Education", "Diplômes", "Cursus" → education[] (ne saute JAMAIS, même si en bas ou colonne latérale)
- "Compétences", "Skills", "Outils", "Technologies", "Logiciels", "Langues" → skills
- "Expériences", "Parcours", "Work Experience" → experiences[]

Capture TOUTES les expériences et TOUTES les formations présentes dans le CV, même en fin de document ou dans une colonne secondaire. Chaque poste/diplôme distinct = une entrée séparée.`;
}
