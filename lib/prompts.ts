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

export function buildExtractPrompt(text: string): string {
  return `Extrais les données de ce CV (texte brut issu d'un PDF) et retourne UNIQUEMENT un JSON valide sans markdown, sans backticks, sans texte avant ou après.

Format attendu :
{"firstName":"","lastName":"","title":"","email":"","phone":"","city":"","linkedin":"","summary":"","skills":"","experiences":[{"role":"","company":"","start":"","end":"","description":""}],"education":[{"degree":"","school":"","year":""}]}

Règles :
- Extrais uniquement ce qui est présent dans le texte, n'invente rien.
- Le texte peut être désordonné (layouts multi-colonnes Canva, sections en blocs séparés, ordre de lecture non linéaire) — reconstitue la structure logique en associant chaque information à la bonne section.
- Recherche ACTIVEMENT les sections "Formation", "Études", "Education", "Diplômes", "Cursus" pour remplir "education" — ne saute JAMAIS cette section, même si elle est en bas du CV ou dans une colonne latérale.
- Recherche ACTIVEMENT les sections "Compétences", "Skills", "Outils", "Technologies", "Logiciels", "Langues" pour remplir "skills".
- Pour "experiences", capture TOUTES les expériences professionnelles présentes dans le texte, même celles en fin de CV ou dans une colonne secondaire. Chaque poste distinct doit être une entrée séparée.
- Pour "skills", joins toutes les compétences trouvées en une seule chaîne séparée par des virgules.
- Pour "end", utilise "Présent" si c'est le poste actuel (indicateurs : "aujourd'hui", "présent", "actuel", pas de date de fin).
- Pour "summary", extrais le résumé / profil / bio / accroche présent en haut du CV (généralement juste sous le nom ou le titre).
- Pour les descriptions d'expériences, reprends fidèlement ce qui est écrit (bullets ou texte continu).
- Si tu trouves des caractères bizarres ou des mots collés dus à l'extraction PDF (ex : "DirecteurMarketing"), sépare-les logiquement dans le texte final.

Texte du CV :
${text.substring(0, 100000)}`;
}
