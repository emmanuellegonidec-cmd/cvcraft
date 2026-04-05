'use client';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Job } from '@/lib/jobs';
import { Stage, DETAIL_STAGES, formatDate, getGlobalStatus, isInterviewStage } from './types';
import { HeartDisplay } from './HeartComponents';

type Contact = { id: string; name: string; role?: string; company?: string };

type Props = {
  job: Job;
  stages: Stage[];
  userId: string | null;
  accessToken: string | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onFieldUpdate: (id: string, field: string, value: any) => void;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
};

function getAuthHeaders(): Record<string, string> {
  const token = (typeof window !== 'undefined') ? (window as any).__jfmj_token : null;
  if (!token) return { 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const INTERVIEW_TYPES = [
  { id: 'telephone',  label: '📞 Téléphone' },
  { id: 'visio',      label: '💻 Visio' },
  { id: 'presentiel', label: '🏢 Présentiel' },
];

// Mapping status global → sub_status par défaut quand sub_status est null
const STATUS_TO_SUBSTATUS: Record<string, string> = {
  'to_apply':    'to_apply',
  'applied':     'applied',
  'in_progress': 'phone_interview',
  'offer':       'offer',
  'archived':    'archived',
};

export default function JobDetailPanel({ job, stages, userId, accessToken, onClose, onStatusChange, onFieldUpdate, onEdit, onDelete }: Props) {
  const router = useRouter();
  const cvInputRef = useRef<HTMLInputElement>(null);
  const lmInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingLm, setUploadingLm] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  // ✅ NOUVEAU — stages custom spécifiques à CE job, chargés depuis pipeline_stages
  const [jobCustomStages, setJobCustomStages] = useState<Stage[]>([]);

  const isInterview = isInterviewStage(job.status, stages);
  const isSpontaneous = (job as any).source_platform === 'spontaneous';

  useEffect(() => {
    if (!isInterview) return;
    fetch('/api/contacts', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => { if (data.contacts) setContacts(data.contacts); })
      .catch(() => {});
  }, [isInterview]);

  // ✅ Charge les pipeline_stages spécifiques à ce job (stages custom avec job_id)
  // → permet de résoudre le label "Entretien DRH" à partir de son UUID
  useEffect(() => {
    async function loadJobStages() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('pipeline_stages')
          .select('*')
          .eq('job_id', job.id);
        if (data && data.length > 0) {
          setJobCustomStages(data.map((s: any) => ({
            id: s.id,
            label: s.label,
            color: s.color || '#B8900A',
            position: s.position ?? 3,
            is_default: false,
            global_status: 'in_progress',
          })));
        }
      } catch {}
    }
    loadJobStages();
  }, [job.id]);

  // Étapes masquées pour cette offre (ex: hr_interview supprimé pour ESCP)
  const hiddenSteps = Array.isArray((job as any).hidden_steps)
    ? (job as any).hidden_steps as string[]
    : [];

  // Stages custom depuis la prop (stages globaux non-default)
  const customFromProp: Stage[] = stages.filter(s => !s.is_default).map(s => ({ ...s, global_status: 'in_progress' }));

  // ✅ Fusion : stages custom prop + stages custom du job depuis BDD (sans doublons)
  const allCustomStages: Stage[] = [
    ...customFromProp,
    ...jobCustomStages.filter(jc => !customFromProp.find(cp => cp.id === jc.id)),
  ];

  // Build detailStages en excluant les étapes masquées
  let detailStages: Stage[] = [
    ...DETAIL_STAGES.filter(s => !['offer', 'archived'].includes(s.id) && !hiddenSteps.includes(s.id)),
    ...allCustomStages,
    DETAIL_STAGES.find(s => s.id === 'offer')!,
    DETAIL_STAGES.find(s => s.id === 'archived')!,
  ].filter(Boolean) as Stage[];

  // Résolution du sub_status courant
  const rawSubStatus = (job as any).sub_status as string | null | undefined;
  const currentSubStatus = (rawSubStatus && rawSubStatus !== job.status)
    ? rawSubStatus
    : (STATUS_TO_SUBSTATUS[job.status] ?? 'to_apply');

  let stageIndex = detailStages.findIndex(s => s.id === currentSubStatus);

  // Sécurité : si UUID toujours introuvable (données pas encore chargées ou stage supprimé),
  // on insère un placeholder dynamique après "Postulé"
  if (stageIndex === -1 && rawSubStatus && rawSubStatus !== job.status) {
    const found = allCustomStages.find(s => s.id === rawSubStatus);
    const dynamicEntry: Stage = {
      id: rawSubStatus,
      label: found?.label || 'En cours',
      color: found?.color || '#B8900A',
      position: 3,
      global_status: 'in_progress',
    };
    const appliedIdx = detailStages.findIndex(s => s.id === 'applied');
    const insertAt = appliedIdx >= 0 ? appliedIdx + 1 : 2;
    detailStages = [
      ...detailStages.slice(0, insertAt),
      dynamicEntry,
      ...detailStages.slice(insertAt),
    ];
    stageIndex = insertAt;
  }

  const effectiveIndex = stageIndex >= 0 ? stageIndex : 0;
  const completedStages = detailStages.slice(0, effectiveIndex + 1);

  async function uploadDocument(file: File, type: 'cv' | 'lm') {
    if (!userId || !accessToken) return;
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${userId}/${job.id}/${type}.${ext}`;
    const { error } = await supabase.storage.from('job-documents').upload(path, file, { upsert: true });
    if (error) { alert('Erreur upload : ' + error.message); return; }
    const { data: signedData } = await supabase.storage.from('job-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
    const field      = type === 'cv' ? 'cv_url' : 'cover_letter_url';
    const checkField = type === 'cv' ? 'cv_sent' : 'cover_letter_sent';
    onFieldUpdate(job.id, field, signedData?.signedUrl ?? '');
    onFieldUpdate(job.id, checkField, true);
  }

  const interviewType      = (job as any).interview_type       || '';
  const interviewContactId = (job as any).interview_contact_id || '';
  const selectedContact    = contacts.find(c => c.id === interviewContactId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.5)', zIndex: 200 }} onClick={onClose}>
      <div
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 480, background: '#fff', borderLeft: '2px solid #111', padding: '1.5rem', overflowY: 'auto', boxShadow: '-4px 0 0 #111' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 3, fontWeight: 600 }}>{job.company}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 6 }}>{job.title}</div>

            {/* Badge Candidature spontanée */}
            {isSpontaneous && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#FFF8E0', border: '2px solid #F5C400',
                borderRadius: 8, padding: '4px 10px', marginBottom: 8,
              }}>
                <span style={{ fontSize: 14 }}>📨</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E' }}>Candidature spontanée</span>
              </div>
            )}

            {/* Bouton Voir l'offre complète */}
            <button
              onClick={() => router.push(`/dashboard/job/${job.id}`)}
              style={{
                fontSize: 11, fontWeight: 700, color: '#111',
                background: '#F5C400', border: '2px solid #111',
                borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
                fontFamily: 'Montserrat,sans-serif',
                boxShadow: '2px 2px 0 #111',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              Voir l&apos;offre complète →
            </button>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #111', background: '#fff', cursor: 'pointer', fontWeight: 800, flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Pills localisation + salaire */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {job.location && <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0' }}>{job.location}</span>}
          {(job as any).salary_text && <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A' }}>💶 {(job as any).salary_text}</span>}
        </div>

        {(job as any).favorite > 0 && <div style={{ marginBottom: '0.75rem' }}><HeartDisplay value={(job as any).favorite} /></div>}
        <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: '1rem' }}>📅 Créé le {formatDate(job.created_at)}</div>

        {/* ── PARCOURS ── */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="fl">Parcours</label>

          {/* Bandeau d'alerte si parcours non renseigné (ajout direct en "En cours") */}
          {(job as any).status === 'in_progress' && (!rawSubStatus || rawSubStatus === job.status) && (
            <div style={{
              background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 8,
              padding: '12px 14px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', marginBottom: 6 }}>
                👋 Le parcours n&apos;est pas encore renseigné
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>
                Pour que Jean vous accompagne vraiment, il faut repartir du début et valider chaque étape
                dans la fiche complète : <em>Envie de postuler → Postulé → étape en cours</em>.
              </div>
              <button
                onClick={() => router.push(`/dashboard/job/${job.id}`)}
                style={{
                  fontSize: 11, fontWeight: 800, color: '#111',
                  background: '#F5C400', border: '2px solid #111',
                  borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
                  fontFamily: 'Montserrat,sans-serif', boxShadow: '2px 2px 0 #111',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                Mettre à jour le parcours →
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {completedStages.map((s, i) => {
              const isLast = i === completedStages.length - 1;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: isLast ? s.color : s.color + '88',
                      border: `2px solid ${s.color}`,
                      flexShrink: 0,
                    }} />
                    {!isLast && <div style={{ width: 2, flex: 1, minHeight: 10, background: '#E0E0E0', marginTop: 2 }} />}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: isLast ? 800 : 600,
                    color: isLast ? s.color : '#888',
                    background: isLast ? s.color + '18' : 'transparent',
                    padding: isLast ? '2px 8px' : '2px 0',
                    borderRadius: 6,
                  }}>
                    {s.label}
                  </span>
                  {isLast && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: s.color, borderRadius: 4, padding: '1px 6px', marginLeft: 2 }}>
                      ACTUEL
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION ENTRETIEN ── */}
        {isInterview && (
          <div style={{ background: '#FEF9E0', border: '2px solid #F5C400', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#B8900A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>📅 Entretien</div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Date</label>
              <input
                type="date"
                defaultValue={job.interview_at ? job.interview_at.slice(0, 10) : ''}
                className="fi"
                style={{ fontSize: 12, padding: '6px 8px', width: '100%', boxSizing: 'border-box' }}
                onBlur={e => onFieldUpdate(job.id, 'interview_at', e.target.value || null)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Début</label>
                <input
                  type="time"
                  defaultValue={(job as any).interview_time || ''}
                  className="fi"
                  style={{ fontSize: 12, padding: '6px 8px' }}
                  onBlur={e => onFieldUpdate(job.id, 'interview_time', e.target.value || null)}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Fin</label>
                <input
                  type="time"
                  defaultValue={(job as any).interview_time_end || ''}
                  className="fi"
                  style={{ fontSize: 12, padding: '6px 8px' }}
                  onBlur={e => onFieldUpdate(job.id, 'interview_time_end', e.target.value || null)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>Type</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {INTERVIEW_TYPES.map(t => (
                  <button key={t.id}
                    onClick={() => onFieldUpdate(job.id, 'interview_type', interviewType === t.id ? null : t.id)}
                    style={{
                      flex: 1, padding: '6px 4px', fontSize: 10, fontWeight: 700, borderRadius: 7,
                      border: `2px solid ${interviewType === t.id ? '#F5C400' : '#E0E0E0'}`,
                      background: interviewType === t.id ? '#F5C400' : '#fff',
                      color: interviewType === t.id ? '#111' : '#888',
                      cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>Contact pour l&apos;entretien</label>
              <select
                value={interviewContactId}
                onChange={e => onFieldUpdate(job.id, 'interview_contact_id', e.target.value || null)}
                className="fi"
                style={{ fontSize: 12, padding: '6px 8px' }}
              >
                <option value="">— Aucun contact —</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.role ? ` · ${c.role}` : ''}{c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </select>
              {selectedContact && (
                <div style={{ fontSize: 11, color: '#B8900A', fontWeight: 600, marginTop: 4 }}>
                  👤 {selectedContact.name}{selectedContact.role ? ` · ${selectedContact.role}` : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        {job.status !== 'to_apply' && (
          <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Documents</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={'check-box' + ((job as any).cv_sent ? ' checked' : '')} onClick={() => onFieldUpdate(job.id, 'cv_sent', !(job as any).cv_sent)}>
                  {(job as any).cv_sent && '✔'}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>CV</span>
                <button className={'doc-btn' + ((job as any).cv_url ? ' done' : '')}
                  onClick={() => { if ((job as any).cv_url) window.open((job as any).cv_url); else cvInputRef.current?.click(); }}>
                  {(job as any).cv_url ? '📄 Voir' : '📄 Joindre'}
                </button>
                <input ref={cvInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={async e => { const f = e.target.files?.[0]; if (f) { setUploadingCv(true); await uploadDocument(f, 'cv'); setUploadingCv(false); } }} />
                {uploadingCv && <span style={{ fontSize: 10, color: '#888' }}>⏳</span>}
              </div>
              <div style={{ width: 1, background: '#E0E0E0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={'check-box' + ((job as any).cover_letter_sent ? ' checked' : '')} onClick={() => onFieldUpdate(job.id, 'cover_letter_sent', !(job as any).cover_letter_sent)}>
                  {(job as any).cover_letter_sent && '✔'}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>LM</span>
                <button className={'doc-btn' + ((job as any).cover_letter_url ? ' done' : '')}
                  onClick={() => { if ((job as any).cover_letter_url) window.open((job as any).cover_letter_url); else lmInputRef.current?.click(); }}>
                  {(job as any).cover_letter_url ? '📄 Voir' : '📄 Joindre'}
                </button>
                <input ref={lmInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={async e => { const f = e.target.files?.[0]; if (f) { setUploadingLm(true); await uploadDocument(f, 'lm'); setUploadingLm(false); } }} />
                {uploadingLm && <span style={{ fontSize: 10, color: '#888' }}>⏳</span>}
              </div>
            </div>
          </div>
        )}

        {/* Synthèse entretien */}
        {isInterview && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="fl">Synthèse de l&apos;entretien</label>
            <textarea
              defaultValue={(job as any).interview_summary || ''}
              placeholder="Notes sur le déroulement, questions posées, impressions..."
              className="fi" rows={4} style={{ resize: 'vertical' }}
              onBlur={async e => onFieldUpdate(job.id, 'interview_summary', e.target.value)}
            />
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="fl">Description</label>
            <div style={{ background: '#FAFAFA', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.6, maxHeight: 180, overflowY: 'auto' }}>
              {job.description}
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="fl">Mes notes</label>
          <textarea defaultValue={job.notes || ''} placeholder="Notes, impressions..." className="fi" style={{ resize: 'vertical', minHeight: 70 }}
            onBlur={async e => onFieldUpdate(job.id, 'notes', e.target.value)} />
        </div>

        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => onEdit(job)}>
          ✏️ Modifier l&apos;offre
        </button>
        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: '#E8151B', borderColor: '#FDEAEA' }} onClick={() => onDelete(job.id)}>
          Supprimer
        </button>
      </div>
    </div>
  );
}
