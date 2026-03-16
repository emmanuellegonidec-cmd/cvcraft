import { CVFormData } from './types';

export function buildGeneratePrompt(data: CVFormData): string {
  let p = `Tu es un expert en rédaction de CV. Génère un CV professionnel en ${data.lang}, ton ${data.tone}.\n`;
  
  if (data.targetJob) p += `Objectif : optimise ce CV pour ce poste : "${data.targetJob}"\n`;
  
  p += `\n⚠️ RÈGLES ABSOLUES :
- Utilise UNIQUEMENT les informations fournies ci-dessous. N'invente AUCUN chiffre, AUCUNE donnée, AUCUN fait.
- Si une information est absente, ne la mentionne pas. Ne complète pas avec des exemples.
- Les seuls chiffres autorisés sont ceux explicitement mentionnés dans les données fournies.
- Format : une seule page, sections claires, verbes d'action forts.
- Ne mets pas de placeholder comme [X années] ou [chiffre].

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

Génère maintenant le CV en respectant strictement les règles ci-dessus. 
Structure : En-tête → Profil → Expériences → Formation → Compétences.
Longueur : maximum une page (500 mots environ).`;

  return p;
}

export function buildExtractPrompt(text: string): string {
  return `Extrais les données de ce CV LinkedIn (texte brut PDF) et retourne UNIQUEMENT un JSON valide sans markdown, sans backticks, sans texte avant ou après.

Format attendu :
{"firstName":"","lastName":"","title":"","email":"","phone":"","city":"","linkedin":"","summary":"","skills":"","experiences":[{"role":"","company":"","start":"","end":"","description":""}],"education":[{"degree":"","school":"","year":""}]}

Règles :
- Extrais uniquement ce qui est présent dans le texte, n'invente rien
- Pour "skills", joins toutes les compétences en une chaîne séparée par des virgules
- Pour "end", utilise "Présent" si c'est le poste actuel
- Extrais le résumé/bio LinkedIn pour "summary"
- Pour les descriptions d'expériences, reprends fidèlement ce qui est écrit

Texte du CV LinkedIn :
${text.substring(0, 10000)}`;
}
