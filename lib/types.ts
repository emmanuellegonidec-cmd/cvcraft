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
  firstName: '', lastName: '', title: '', email: '',
  phone: '', city: '', linkedin: '', summary: '',
  skills: '', experiences: [], education: [],
  lang: 'français', tone: 'professionnel', targetJob: '',
};
