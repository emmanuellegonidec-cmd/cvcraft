export interface CV {
  id: string;
  user_id: string;
  title: string;
  template: 'classic' | 'modern' | 'minimal';
  content: string;       // generated CV text
  form_data: CVFormData; // saved form inputs
  created_at: string;
  updated_at: string;
}

export interface CVFormData {
  firstName: string;
  lastName: string;
  photo?: string;
  font?: string;
accentColor?: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  summary: string;
  skills: string;
  experiences: Experience[];
  education: Education[];
  lang: string;
  tone: string;
  targetJob: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  start: string;
  end: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export const defaultFormData: CVFormData = {
  firstName: '', lastName: '', photo: '', title: '', email: '',
  phone: '', city: '', linkedin: '', summary: '',
  skills: '', experiences: [], education: [],
  lang: 'français', tone: 'professionnel', targetJob: '',
};
// ============================================================
// À AJOUTER dans lib/types.ts
// (coller à la fin du fichier existant)
// ============================================================

export type ExchangeType =
  | 'email'
  | 'telephone'
  | 'visio'
  | 'rdv'
  | 'linkedin'
  | 'message'
  | 'autre'

export interface JobExchange {
  id: string
  job_id: string
  user_id: string
  title: string
  exchange_type: ExchangeType
  exchange_date: string       // format ISO date YYYY-MM-DD
  step_label: string | null   // étape du parcours au moment de l'échange
  content: string | null      // Déroulement & impressions
  questions: string | null    // Questions posées
  answers: string | null      // Mes réponses & points à améliorer
  next_step: string | null    // Prochaine étape annoncée
  created_at: string
  updated_at: string
}

export type JobExchangeCreate = Omit<JobExchange, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type JobExchangeUpdate = Partial<Omit<JobExchange, 'id' | 'job_id' | 'user_id' | 'created_at' | 'updated_at'>>

// Labels lisibles pour l'interface
export const EXCHANGE_TYPE_LABELS: Record<ExchangeType, string> = {
  email: 'Email',
  telephone: 'Téléphone',
  visio: 'Visio',
  rdv: 'RDV',
  linkedin: 'LinkedIn',
  message: 'Message',
  autre: 'Autre',
}