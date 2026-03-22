import { Job, Contact, JobStatus, JobType } from '@/lib/jobs';

export type View = 'kanban' | 'list' | 'contacts' | 'agenda' | 'stats';

export type Stage = {
  id: string;
  label: string;
  color: string;
  position: number;
  is_default?: boolean;
  global_status?: string; // pour les étapes personnalisées → quelle colonne globale
};

// ── Kanban global (5 grandes étapes) ──────────────────────────────────────────
export const DEFAULT_STAGES: Stage[] = [
  { id: 'to_apply',     label: 'Envie de postuler',  color: '#888',    position: 1,  is_default: true, global_status: 'to_apply' },
  { id: 'applied',      label: 'Postulé',             color: '#1A6FDB', position: 2,  is_default: true, global_status: 'applied' },
  { id: 'in_progress',  label: 'En cours',            color: '#B8900A', position: 3,  is_default: true, global_status: 'in_progress' },
  { id: 'offer',        label: 'Offre reçue',         color: '#1A7A4A', position: 6,  is_default: true, global_status: 'offer' },
  { id: 'archived',     label: 'Archivé',             color: '#aaa',    position: 99, is_default: true, global_status: 'archived' },
];

// ── Pipeline détaillé (panneau par offre) ─────────────────────────────────────
export const DETAIL_STAGES: Stage[] = [
  { id: 'to_apply',           label: 'Envie de postuler',       color: '#888',    position: 1,  global_status: 'to_apply' },
  { id: 'applied',            label: 'Postulé',                 color: '#1A6FDB', position: 2,  global_status: 'applied' },
  { id: 'phone_interview',    label: 'Entretien téléphonique',  color: '#B8900A', position: 3,  global_status: 'in_progress' },
  { id: 'hr_interview',       label: 'Entretien RH',            color: '#B8500A', position: 4,  global_status: 'in_progress' },
  { id: 'manager_interview',  label: 'Entretien manager',       color: '#7A1ADB', position: 5,  global_status: 'in_progress' },
  { id: 'offer',              label: 'Offre reçue',             color: '#1A7A4A', position: 6,  global_status: 'offer' },
  { id: 'archived',           label: 'Archivé',                 color: '#aaa',    position: 99, global_status: 'archived' },
];

// Retourne le status global correspondant à une sous-étape
export function getGlobalStatus(subStatus: string, customStages: Stage[]): string {
  const detail = DETAIL_STAGES.find(s => s.id === subStatus);
  if (detail) return detail.global_status || 'in_progress';
  const custom = customStages.find(s => s.id === subStatus);
  return custom?.global_status || 'in_progress';
}

// Label court pour le badge sur la carte kanban
export function getSubStatusLabel(subStatus: string | null, customStages: Stage[]): string | null {
  if (!subStatus) return null;
  const detail = DETAIL_STAGES.find(s => s.id === subStatus);
  if (detail) return detail.label;
  const custom = customStages.find(s => s.id === subStatus);
  return custom?.label || null;
}

export const EMPTY_JOB = {
  status: 'to_apply' as JobStatus,
  job_type: 'CDI' as JobType,
  title: '',
  company: '',
  location: '',
  description: '',
  notes: '',
  salary: '',
  source: '',
  url: '',
  favorite: 0,
};

export type NewJobState = typeof EMPTY_JOB;

export function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRelative(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7) return `Il y a ${diff} jours`;
  return formatDate(dateStr) || '';
}

export function cleanJobTitle(title: string | null | undefined): string {
  if (!title) return '';
  return title
    .replace(/\s*[\|]\s*(LinkedIn|Indeed|APEC|HelloWork|Welcome to the Jungle).*$/i, '')
    .replace(/\s*-\s*(LinkedIn|Indeed|APEC|HelloWork|Welcome to the Jungle).*$/i, '')
    .trim();
}

export function cleanLocation(location: string | null | undefined): string {
  if (!location) return '';
  return location.replace(/^(Ville de |Province de |Région de |Department of )/i, '').trim();
}

export function detectSource(url: string | null | undefined): string {
  if (!url) return '';
  const u = url.toLowerCase();
  if (u.includes('linkedin.com')) return 'LinkedIn';
  if (u.includes('indeed.')) return 'Indeed';
  if (u.includes('apec.fr')) return 'Apec';
  if (u.includes('hellowork.com')) return 'HelloWork';
  if (u.includes('welcometothejungle.com')) return 'Welcome to the Jungle';
  return 'Autre';
}

export function isInterviewStage(status: string, stages: Stage[]): boolean {
  return status === 'in_progress' ||
    ['phone_interview', 'hr_interview', 'manager_interview'].includes(status) ||
    !!stages.find(s => s.id === status && !s.is_default);
}

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #E0E0E0; border-radius: 3px; }
  .nav-btn { display: flex; align-items: center; gap: 9px; padding: 8px 12px; margin: 1px 6px; border-radius: 8px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); cursor: pointer; border: none; background: transparent; width: calc(100% - 12px); text-align: left; font-family: 'Montserrat', sans-serif; transition: all 0.15s; }
  .nav-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
  .nav-btn.active { background: rgba(232,21,27,0.2); color: #fff; border-left: 3px solid #E8151B; padding-left: 9px; }
  .jcard { background: #fff; border: 2px solid #111; border-radius: 8px; padding: 10px; margin-bottom: 7px; cursor: pointer; box-shadow: 2px 2px 0 #111; transition: all 0.15s; }
  .jcard:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; border-color: #E8151B; }
  .btn-main { display: inline-flex; align-items: center; gap: 6px; background: #111; color: #F5C400; border: 2px solid #111; border-radius: 8px; padding: 9px 18px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 #E8151B; letter-spacing: 0.02em; transition: all 0.15s; }
  .btn-main:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; }
  .btn-main:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-ghost { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #111; border: 2px solid #111; border-radius: 8px; padding: 9px 18px; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 #E0E0E0; transition: all 0.15s; }
  .btn-ghost:hover { background: #F4F4F4; }
  .pill { display: inline-flex; align-items: center; border-radius: 5px; padding: 2px 7px; font-size: 10px; font-weight: 700; }
  .fi { width: 100%; border: 2px solid #E0E0E0; border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: 'Montserrat', sans-serif; outline: none; transition: border-color 0.15s; background: #fff; }
  .fi:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(17,17,17,0.06); }
  .fl { display: block; font-size: 10px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .modal-bg { position: fixed; inset: 0; background: rgba(15,14,12,0.6); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .modal { background: #fff; border: 2px solid #111; border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 680px; max-height: 94vh; overflow-y: auto; box-shadow: 6px 6px 0 #111; }
  .stat-card { background: #fff; border: 2px solid #111; border-radius: 10px; padding: 0.875rem; box-shadow: 2px 2px 0 #111; }
  .add-card { border: 2px dashed #E0E0E0; border-radius: 8px; padding: 8px; text-align: center; font-size: 11px; color: #888; cursor: pointer; font-weight: 700; transition: all 0.15s; }
  .add-card:hover { border-color: #E8151B; color: #E8151B; background: #FDEAEA; }
  .date-tag { font-size: 9px; color: #aaa; font-weight: 600; margin-top: 5px; display: flex; align-items: center; gap: 3px; }
  .lrow { display: grid; grid-template-columns: 2fr 1fr 0.8fr 1fr 0.8fr 60px; gap: 12px; padding: 11px 16px; border-bottom: 1.5px solid #E0E0E0; align-items: center; cursor: pointer; transition: background 0.15s; }
  .lrow:hover { background: #FAFAFA; }
  .ccard { background: #fff; border: 2px solid #111; border-radius: 10px; padding: 1rem; box-shadow: 2px 2px 0 #111; transition: all 0.2s; }
  .ccard:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #E8151B; }
  .cbtn { flex: 1; padding: 5px; border-radius: 6px; border: 1.5px solid #E0E0E0; background: transparent; font-size: 11px; font-weight: 700; color: #888; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.15s; }
  .cbtn:hover { background: #FDEAEA; color: #E8151B; border-color: #E8151B; }
  .doc-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 6px; border: 1.5px solid #E0E0E0; background: #fff; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.15s; }
  .doc-btn:hover { border-color: #111; background: #F4F4F4; }
  .doc-btn.done { border-color: #1A7A4A; background: #E8F5EE; color: #1A7A4A; }
  .check-box { width: 16px; height: 16px; border: 2px solid #E0E0E0; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
  .check-box.checked { background: #1A7A4A; border-color: #1A7A4A; color: #fff; font-size: 10px; }
`;
