export type TemplateId = 'classic' | 'modern' | 'minimal';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  accent: string;
  preview: string; // emoji placeholder
}

export const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classique',
    description: 'Élégant et intemporel, idéal pour tous secteurs',
    accent: '#1A1814',
    preview: '📄',
  },
  {
    id: 'modern',
    name: 'Moderne',
    description: 'Mise en page dynamique avec accent coloré',
    accent: '#2D5BE3',
    preview: '🎨',
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Épuré et sobre, laisse le contenu parler',
    accent: '#1A7A4A',
    preview: '✦',
  },
];
