export type TemplateId = 'classic' | 'modern' | 'minimal' | 'elegant' | 'creative' | 'executive';

export type FontId = 'arial' | 'calibri' | 'times' | 'georgia' | 'helvetica' | 'opensans' | 'lato' | 'garamond';

export type AtsLevel = 'excellent' | 'bon' | 'moyen';

export interface CVTemplate {
  id: TemplateId;
  name: string;
  description: string;
  target: string;
  preview: string;
  defaultFont: FontId;
  defaultColor: string;
  atsLevel: AtsLevel;
  atsTip: string;
}

export interface CVFont {
  id: FontId;
  name: string;
  family: string;
  googleUrl?: string;
  atsScore: AtsLevel;
}

export interface CVPalette {
  id: string;
  name: string;
  accent: string;
  dark: string;
}

export interface CVConfig {
  template: TemplateId;
  font: FontId;
  accentColor: string;
}

// ─── RÈGLES ATS GLOBALES (appliquées dans tous les templates PDF) ──────
// 1. Les compétences sont toujours du <Text> réel, jamais une image
// 2. Les compétences s'affichent en liste texte séparée par " · "
//    avec une légère mise en forme visuelle autour (fond coloré possible
//    mais le texte doit rester un <Text> react-pdf lisible)
// 3. Les colonnes multiples (template Modern) sont codées dans le bon
//    ordre de lecture dans le PDF (colonne principale en premier)
// 4. Aucune barre de progression, aucune note chiffrée sur les compétences
// 5. Aucun texte mis en image
// 6. Les en-têtes sombres avec texte blanc sont OK — l'ATS lit le texte <Text>
//    indépendamment de la couleur de fond

// ─── TEMPLATES ────────────────────────────────────────────────────────
export const CV_TEMPLATES: CVTemplate[] = [
  {
    id: 'classic',
    name: 'Classique',
    description: 'En-tête sombre, une colonne',
    target: 'Tous secteurs',
    preview: '◼',
    defaultFont: 'arial',
    defaultColor: '#E8151B',
    atsLevel: 'excellent',
    atsTip: 'Structure linéaire — lecture ATS optimale',
  },
  {
    id: 'modern',
    name: 'Moderne',
    description: '2 colonnes, barre latérale',
    target: 'Digital · Tech · Marketing',
    preview: '◫',
    defaultFont: 'lato',
    defaultColor: '#1B4F72',
    atsLevel: 'bon',
    atsTip: 'Colonne principale lue en premier dans le PDF — compétences en texte réel',
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Épuré, typographie forte',
    target: 'Créatif · Design · Startup',
    preview: '◻',
    defaultFont: 'helvetica',
    defaultColor: '#E8151B',
    atsLevel: 'excellent',
    atsTip: 'Structure simple — excellent passage ATS',
  },
  {
    id: 'elegant',
    name: 'Élégant',
    description: 'Centré, serif, sobre',
    target: 'Finance · Juridique · Conseil',
    preview: '✦',
    defaultFont: 'georgia',
    defaultColor: '#111111',
    atsLevel: 'excellent',
    atsTip: 'Mise en page sobre — très bien reconnu par les ATS',
  },
  {
    id: 'creative',
    name: 'Créatif',
    description: 'Barre latérale accent, dynamique',
    target: 'Communication · RH · Events',
    preview: '▌',
    defaultFont: 'opensans',
    defaultColor: '#E8151B',
    atsLevel: 'bon',
    atsTip: 'Barre décorative ignorée par les ATS — texte toujours lisible',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Dense, sobre, très structuré',
    target: 'Cadre dirigeant · Senior',
    preview: '≡',
    defaultFont: 'calibri',
    defaultColor: '#111111',
    atsLevel: 'excellent',
    atsTip: 'Texte pur linéaire — meilleur score ATS possible',
  },
];

// ─── POLICES ATS-FRIENDLY ─────────────────────────────────────────────
// Classement basé sur la compatibilité avec les ATS majeurs
// (Workday, Taleo, Greenhouse, Lever, iCIMS, SAP SuccessFactors)
export const CV_FONTS: CVFont[] = [
  {
    id: 'arial',
    name: 'Arial',
    family: 'Arial, Helvetica, sans-serif',
    atsScore: 'excellent',
  },
  {
    id: 'calibri',
    name: 'Calibri',
    family: "'Calibri', 'Carlito', Arial, sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Carlito:wght@400;700&display=swap',
    atsScore: 'excellent',
  },
  {
    id: 'times',
    name: 'Times New Roman',
    family: "'Times New Roman', Times, serif",
    atsScore: 'excellent',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: 'Georgia, serif',
    atsScore: 'excellent',
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    family: 'Helvetica, Arial, sans-serif',
    atsScore: 'excellent',
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    family: "'Open Sans', Arial, sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
    atsScore: 'excellent',
  },
  {
    id: 'lato',
    name: 'Lato',
    family: "'Lato', Arial, sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap',
    atsScore: 'bon',
  },
  {
    id: 'garamond',
    name: 'Garamond',
    family: "'EB Garamond', Garamond, Georgia, serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&display=swap',
    atsScore: 'bon',
  },
];

// ─── PALETTES DE COULEURS ─────────────────────────────────────────────
// Les couleurs n'affectent PAS la compatibilité ATS
// (l'ATS lit le texte <Text>, pas les couleurs de fond)
export const CV_PALETTES: CVPalette[] = [
  { id: 'noir',      name: 'Noir classique', accent: '#111111', dark: '#000000' },
  { id: 'rouge',     name: 'Rouge JFMJ',     accent: '#E8151B', dark: '#B8101A' },
  { id: 'marine',    name: 'Marine',          accent: '#1B4F72', dark: '#0F2F45' },
  { id: 'foret',     name: 'Vert forêt',      accent: '#2D6A4F', dark: '#1B3F2F' },
  { id: 'bordeaux',  name: 'Bordeaux',        accent: '#7B2D2D', dark: '#551F1F' },
  { id: 'ardoise',   name: 'Ardoise',         accent: '#4A5568', dark: '#2D3748' },
  { id: 'indigo',    name: 'Indigo',          accent: '#3730A3', dark: '#251F80' },
  { id: 'teal',      name: 'Teal',            accent: '#0F6E56', dark: '#084A3A' },
  { id: 'bronze',    name: 'Bronze',          accent: '#854F0B', dark: '#5A3508' },
  { id: 'amethyste', name: 'Améthyste',       accent: '#534AB7', dark: '#3B3489' },
];

// ─── CONFIG PAR DÉFAUT ────────────────────────────────────────────────
export const DEFAULT_CV_CONFIG: CVConfig = {
  template: 'classic',
  font: 'arial',
  accentColor: '#E8151B',
};

// ─── HELPERS ──────────────────────────────────────────────────────────
export function getTemplate(id: TemplateId): CVTemplate {
  return CV_TEMPLATES.find(t => t.id === id) ?? CV_TEMPLATES[0];
}

export function getFont(id: FontId): CVFont {
  return CV_FONTS.find(f => f.id === id) ?? CV_FONTS[0];
}

export function getPalette(accentColor: string): CVPalette | undefined {
  return CV_PALETTES.find(p => p.accent === accentColor);
}

export function getAtsLabel(level: AtsLevel): string {
  switch (level) {
    case 'excellent': return '✅ Excellent ATS';
    case 'bon':       return '✔ Bon ATS';
    case 'moyen':     return '⚠ ATS moyen';
  }
}

// ─── RÈGLE DE RENDU DES COMPÉTENCES ──────────────────────────────────
// Dans TOUS les templates PDF, les compétences doivent être rendues
// comme du texte réel avec cette fonction, jamais comme des images :
export function formatSkillsForPdf(skills: string): string {
  return skills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .join('  ·  ');
}

// Pour l'aperçu HTML (visuellement des badges mais texte réel) :
export function splitSkills(skills: string): string[] {
  return skills.split(',').map(s => s.trim()).filter(Boolean);
}