export type JobStatus = 'to_apply' | 'applied' | 'interview' | 'offer' | 'archived';
export type JobType = 'CDI' | 'CDD' | 'Freelance' | 'Stage' | 'Alternance';

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  status: JobStatus;
  description: string;
  notes: string;
  contact_name: string;
  contact_email: string;
  applied_at: string | null;
  interview_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  linkedin: string;
  notes: string;
  job_id: string | null;     // ← NOUVEAU : lien vers un job existant
  job_manual: string | null; // ← NOUVEAU : poste saisi manuellement
  created_at: string;
}

export const STATUS_LABELS: Record<JobStatus, string> = {
  to_apply: 'Envie de postuler',
  applied: 'Postulé',
  interview: 'Entretien',
  offer: 'Offre reçue',
  archived: 'Archivé',
};

export const STATUS_COLORS: Record<JobStatus, { bg: string; color: string }> = {
  to_apply: { bg: '#f2ede2', color: '#7a7670' },
  applied: { bg: '#ebf0fd', color: '#1a56db' },
  interview: { bg: '#fef3c7', color: '#d97706' },
  offer: { bg: '#e6f5ee', color: '#0e7c4a' },
  archived: { bg: '#f0eeea', color: '#aaa' },
};
