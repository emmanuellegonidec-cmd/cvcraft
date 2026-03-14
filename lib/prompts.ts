import { CVFormData } from './types';

export function buildGeneratePrompt(data: CVFormData): string {
  let p = `Tu es un expert en rédaction de CV. Génère un CV complet en ${data.lang}, ton ${data.tone}.\n`;
  if (data.targetJob) p += `Optimise pour ce poste : "${data.targetJob}"\n`;
  p += `\nNom : ${data.firstName} ${data.lastName} | Titre : ${data.title}`;
  if (data.email) p += ` | Email : ${data.email}`;
  if (data.phone) p += ` | Tél : ${data.phone}`;
  if (data.city) p += ` | Ville : ${data.city}`;
  if (data.linkedin) p += ` | LinkedIn : ${data.linkedin}`;
  if (data.summary) p += `\n\nPROFIL :\n${data.summary}`;
  if (data.experiences.length) {
    p += `\n\nEXPÉRIENCES :\n`;
    data.experiences.forEach(e => {
      p += `\n• ${e.role} chez ${e.company} (${e.start} – ${e.end})\n  ${e.description}`;
    });
  }
  if (data.education.length) {
    p += `\n\nFORMATION :\n`;
    data.education.forEach(e => { p += `• ${e.degree} — ${e.school} (${e.year})\n`; });
  }
  if (data.skills) p += `\n\nCOMPÉTENCES :\n${data.skills}`;
  p += `\n\nRègles : verbes d'action forts, quantifie les résultats, sections claires, 400-600 mots.`;
  return p;
}

export function buildExtractPrompt(text: string): string {
  return `Extrais les données de ce CV LinkedIn (texte brut PDF) et retourne UNIQUEMENT un JSON valide sans markdown.

Format attendu :
{"firstName":"","lastName":"","title":"","email":"","phone":"","city":"","linkedin":"","summary":"","skills":"","experiences":[{"role":"","company":"","start":"","end":"","description":""}],"education":[{"degree":"","school":"","year":""}]}

Texte : ${text.substring(0, 10000)}`;
}
