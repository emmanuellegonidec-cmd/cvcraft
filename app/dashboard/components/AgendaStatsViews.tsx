'use client';
import { useEffect, useState } from 'react';
import { Job } from '@/lib/jobs';
import { Stage, isInterviewStage } from './types';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type AgendaProps = {
  jobs: Job[];
  stages: Stage[];
  onJobClick: (job: Job) => void;
  onBackToKanban: () => void;
};

type ContactMin = { id: string; name: string; role?: string | null };

type InterviewEntry = {
  job: Job;
  stageId: string;
  date: Date;
  isMainInterview: boolean;
};

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  telephone:  { label: '📞 Téléphone',  color: '#1A6FA8', bg: '#E8F4FD' },
  visio:      { label: '💻 Visio',      color: '#6B35B5', bg: '#F0EBFB' },
  presentiel: { label: '🏢 Présentiel', color: '#1A7A4A', bg: '#E8F5EE' },
};

const FONT = "'Montserrat', sans-serif";

// IDs par défaut connus
const INTERVIEW_DEFAULT_IDS = new Set(['phone_interview', 'hr_interview', 'manager_interview']);
const NON_INTERVIEW_DEFAULT_IDS = new Set(['to_apply', 'applied', 'offer', 'archived']);

// Un stage est un entretien si :
// - C'est un ID par défaut d'entretien (phone_interview, hr_interview, manager_interview), OU
// - Son label contient "entretien" (pour les étapes custom type "Entretien DRH")
// Les étapes custom sans "entretien" dans le label (Refus, Offre reçue, Abandon...) sont exclues.
function isInterviewByLabel(stageId: string, label: string | null | undefined): boolean {
  if (NON_INTERVIEW_DEFAULT_IDS.has(stageId)) return false;
  if (INTERVIEW_DEFAULT_IDS.has(stageId)) return true;
  if (label) return label.toLowerCase().includes('entretien');
  return false; // Stage custom sans label connu : on n'affiche pas par prudence
}

function getAuthHeaders(): Record<string, string> {
  const token = (typeof window !== 'undefined') ? (window as any).__jfmj_token : null;
  if (!token) return { 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Europe/Paris',
  });
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function parseLocalDate(dateStr: string): Date {
  if (dateStr.length === 10) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

function SectionLabel({ label, past }: { label: string; past: boolean }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700,
      color: past ? '#aaa' : '#888',
      textTransform: 'uppercase', letterSpacing: '0.5px',
      fontFamily: FONT, marginBottom: 6, marginTop: past ? 12 : 0,
    }}>
      {label}
    </p>
  );
}

export function AgendaView({ jobs, stages, onJobClick, onBackToKanban }: AgendaProps) {
  const router = useRouter();
  const [contactsMap, setContactsMap] = useState<Record<string, ContactMin>>({});
  const [stagesLabelMap, setStagesLabelMap] = useState<Record<string, { label: string; color?: string }>>({});
  const [stagesReady, setStagesReady] = useState(false);

  useEffect(() => {
    fetch('/api/contacts', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        if (!data.contacts) return;
        const map: Record<string, ContactMin> = {};
        data.contacts.forEach((c: ContactMin) => { map[c.id] = c; });
        setContactsMap(map);
      })
      .catch(() => {});
  }, []);

  // Charge tous les pipeline_stages de l'utilisateur (user-level + job-level)
  useEffect(() => {
    async function loadAllStages() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setStagesReady(true); return; }
        const { data } = await supabase
          .from('pipeline_stages')
          .select('id, label, color')
          .eq('user_id', session.user.id);
        if (data) {
          const map: Record<string, { label: string; color?: string }> = {};
          data.forEach((s: any) => { map[s.id] = { label: s.label, color: s.color }; });
          setStagesLabelMap(map);
        }
      } catch {}
      setStagesReady(true);
    }
    loadAllStages();
  }, []);

  // Récupère label + couleur d'un stage en cherchant dans les sources disponibles
  function getStageDisplay(stageId: string): { label: string; color: string } {
    const fromProps = stages.find(s => s.id === stageId);
    if (fromProps) return { label: fromProps.label, color: fromProps.color };
    const fromMap = stagesLabelMap[stageId];
    if (fromMap) return { label: fromMap.label, color: fromMap.color || '#888' };
    const DEFAULT_LABELS: Record<string, string> = {
      phone_interview: 'Entretien téléphonique',
      hr_interview: 'Entretien RH',
      manager_interview: 'Entretien manager',
    };
    return { label: DEFAULT_LABELS[stageId] || 'Entretien', color: '#888' };
  }

  // Pour un job, retourne toutes les entries correspondant à des entretiens
  function getAllInterviews(job: Job): InterviewEntry[] {
    const entries: InterviewEntry[] = [];
    const stepDates = (job as any).step_dates as Record<string, string> | null;
    const interviewAt = (job as any).interview_at as string | null;
    const subStatus = (job as any).sub_status as string | null;

    if (stepDates) {
      Object.entries(stepDates).forEach(([stageId, dateStr]) => {
        if (!dateStr) return;
        const { label } = getStageDisplay(stageId);
        if (!isInterviewByLabel(stageId, label)) return;
        try {
          const date = parseLocalDate(dateStr);
          entries.push({
            job, stageId, date,
            isMainInterview: stageId === subStatus,
          });
        } catch {}
      });
    }

    if (entries.length === 0 && interviewAt) {
      const stageId = subStatus || (job.status as string);
      const { label } = getStageDisplay(stageId);
      if (isInterviewByLabel(stageId, label)) {
        entries.push({
          job, stageId,
          date: new Date(interviewAt),
          isMainInterview: true,
        });
      }
    }

    return entries;
  }

  // On attend que les labels soient chargés avant de filtrer
  // (sinon on risque d'exclure des entretiens custom non-résolus)
  const allEntries: InterviewEntry[] = stagesReady
    ? jobs.flatMap(getAllInterviews)
    : [];

  const sorted = [...allEntries].sort((a, b) => a.date.getTime() - b.date.getTime());

  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const upcoming = sorted.filter(e => e.date >= todayMidnight);
  const past     = sorted.filter(e => e.date <  todayMidnight);

  if (!stagesReady) {
    return (
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#888', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT }}>Chargement des entretiens…</div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#888', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8, fontFamily: FONT }}>Aucun entretien planifié</div>
        <button className="btn-main" onClick={onBackToKanban}>Voir le tableau de bord</button>
      </div>
    );
  }

  function renderCard(entry: InterviewEntry, muted: boolean) {
    const { job, stageId, date, isMainInterview } = entry;
    const stageDisplay = getStageDisplay(stageId);

    const timeStart   = isMainInterview ? ((job as any).interview_time as string | null) : null;
    const timeEnd     = isMainInterview ? ((job as any).interview_time_end as string | null) : null;
    const iType       = isMainInterview ? ((job as any).interview_type as string | null) : null;

    const contactsByStep = (job as any).interview_contacts as Record<string, string> | null;
    const contactId = (contactsByStep && contactsByStep[stageId])
      || (isMainInterview ? ((job as any).interview_contact_id as string | null) : null);
    const contact = contactId ? contactsMap[contactId] : null;

    const typeInfo = iType ? TYPE_LABELS[iType] : null;
    const isArchived = (job.status as string) === 'archived';

    const timeLabel = timeStart
      ? (timeEnd ? `${fmtTime(timeStart)} – ${fmtTime(timeEnd)}` : fmtTime(timeStart))
      : null;

    const contactLabel = contact
      ? contact.name + (contact.role ? ` – ${contact.role}` : '')
      : null;

    return (
      <div
        key={`${job.id}-${stageId}-${date.getTime()}`}
        style={{
          background: '#fff',
          border: '2px solid #111',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '2px 2px 0 #111',
          flexWrap: 'wrap',
          opacity: muted ? 0.65 : 1,
          marginBottom: 8,
        }}
      >
        {/* DATE */}
        <div style={{
          background: muted ? '#F5F5F0' : '#FEF9E0',
          border: `2px solid ${muted ? '#DDD' : '#F5C400'}`,
          borderRadius: 8,
          padding: '5px 10px', textAlign: 'center', minWidth: 90, flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: muted ? '#888' : '#111', fontFamily: FONT }}>
            {fmtDate(date.toISOString())}
          </div>
        </div>

        {/* HORAIRE */}
        {timeLabel && (
          <div style={{
            background: muted ? '#F5F5F0' : '#FFF8EC',
            border: `1.5px solid ${muted ? '#DDD' : '#FFD97A'}`,
            borderRadius: 8, padding: '5px 10px', flexShrink: 0,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: muted ? '#888' : '#B8900A', fontFamily: FONT }}>🕐 {timeLabel}</div>
          </div>
        )}

        {/* ÉTAPE */}
        <span style={{
          fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
          background: stageDisplay.color + '22', color: stageDisplay.color,
          border: `1.5px solid ${stageDisplay.color}55`,
          fontFamily: FONT,
        }}>
          {stageDisplay.label}
        </span>

        {/* Badge Archivé */}
        {isArchived && (
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
            background: '#EEE', color: '#666', border: '1.5px solid #CCC',
            fontFamily: FONT,
          }}>
            📦 Archivé
          </span>
        )}

        {/* TITRE · Entreprise · Contact */}
        <div style={{ flex: '1 1 140px', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', fontFamily: FONT }}>{job.title}</span>
          {job.company && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap', fontFamily: FONT }}>· {job.company}</span>
          )}
          {contactLabel && (
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px', flexShrink: 0,
              background: '#FDEAEA', color: '#E8151B', border: '1.5px solid #FFBABA', whiteSpace: 'nowrap',
              fontFamily: FONT,
            }}>
              👤 {contactLabel}
            </span>
          )}
        </div>

        {/* TYPE */}
        {typeInfo && (
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0,
            background: typeInfo.bg, color: typeInfo.color, border: `1.5px solid ${typeInfo.color}44`,
            fontFamily: FONT,
          }}>
            {typeInfo.label}
          </span>
        )}

        {/* BOUTONS */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
          <button className="btn-main" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => onJobClick(job)}>
            RDV
          </button>
          <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => router.push(`/dashboard/job/${job.id}`)}>
            Offre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {upcoming.length > 0 && (
        <>
          <SectionLabel label={`À venir (${upcoming.length})`} past={false} />
          {upcoming.map(entry => renderCard(entry, false))}
        </>
      )}
      {past.length > 0 && (
        <>
          <SectionLabel label={`Passées (${past.length})`} past={true} />
          {past.map(entry => renderCard(entry, true))}
        </>
      )}
    </div>
  );
}

// ── STATS VIEW ────────────────────────────────────────────────────

type StatsProps = {
  jobs: Job[];
  stages: Stage[];
  contactCount: number;
};

export function StatsView({ jobs, stages, contactCount }: StatsProps) {
  const jobsByStatus = (s: string) => jobs.filter(j => j.status === s);
  const interviews   = jobs.filter(j => isInterviewStage(j.status, stages)).length;
  const offers       = jobs.filter(j => j.status === 'offer').length;
  const responseRate = jobs.length
    ? Math.round((jobs.filter(j => isInterviewStage(j.status, stages) || j.status === 'offer').length / jobs.length) * 100)
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', fontFamily: FONT }}>Répartition par statut</div>
        {stages.filter(s => s.id !== 'archived').map(col => {
          const count = jobsByStatus(col.id).length;
          const pct   = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
          return (
            <div key={col.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontFamily: FONT }}>
                <span style={{ fontWeight: 600 }}>{col.label}</span>
                <span style={{ fontWeight: 800 }}>{count}</span>
              </div>
              <div style={{ height: 8, background: '#F4F4F4', borderRadius: 4 }}>
                <div style={{ height: '100%', width: pct + '%', background: col.color, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '1.5rem', boxShadow: '3px 3px 0 #111' }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', fontFamily: FONT }}>Taux de conversion</div>
        {[
          { l: 'Candidatures → Entretien', v: responseRate, c: '#E8151B' },
          { l: 'Entretien → Offre', v: interviews ? Math.round((offers / interviews) * 100) : 0, c: '#1A7A4A' },
        ].map(item => (
          <div key={item.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT }}>{item.l}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ height: 6, width: 100, background: '#F4F4F4', borderRadius: 3 }}>
                <div style={{ height: '100%', width: item.v + '%', background: item.c, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: item.c, minWidth: 36, fontFamily: FONT }}>{item.v}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
