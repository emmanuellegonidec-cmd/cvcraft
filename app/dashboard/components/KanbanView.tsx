'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from '@dnd-kit/core';
import { useState } from 'react';
import { Job } from '@/lib/jobs';
import { Stage, formatRelative, getSubStatusLabel, isJobToProcess } from './types';
import { HeartDisplay } from './HeartComponents';

const FONT = "'Montserrat', sans-serif"

const SOURCE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  'linkedin':              { bg: '#0A66C2', color: '#fff',    label: 'LinkedIn' },
  'indeed':                { bg: '#003A9B', color: '#fff',    label: 'Indeed' },
  'welcome to the jungle': { bg: '#1DBE6E', color: '#fff',    label: 'WTTJ' },
  'wttj':                  { bg: '#1DBE6E', color: '#fff',    label: 'WTTJ' },
  'apec':                  { bg: '#E8151B', color: '#fff',    label: 'APEC' },
  'france travail':        { bg: '#005F9E', color: '#fff',    label: 'France Travail' },
  'site entreprise':       { bg: '#444',    color: '#fff',    label: 'Site co.' },
  'réseau':                { bg: '#7C3AED', color: '#fff',    label: '🤝 Réseau' },
  'reseau':                { bg: '#7C3AED', color: '#fff',    label: '🤝 Réseau' },
  'hellowork':             { bg: '#FF6B35', color: '#fff',    label: 'HelloWork' },
  'chasseur de tête':      { bg: '#0D9488', color: '#fff',    label: '🎯 Chasseur de tête' },
  'chasseur de tete':      { bg: '#0D9488', color: '#fff',    label: '🎯 Chasseur de tête' },
  'cabinet recrutement':   { bg: '#0D9488', color: '#fff',    label: '🎯 Cabinet de recrutement' },
  'cooptation':            { bg: '#7C3AED', color: '#fff',    label: '🤝 Cooptation' },
  'spontaneous':           { bg: '#F5C400', color: '#92400E', label: '📨 Spontanée' },
  'autre':                 { bg: '#888',    color: '#fff',    label: 'Autre' },
};

// Ordre des colonnes pour détecter les déplacements en arrière
const COLUMN_ORDER = ['to_apply', 'applied', 'in_progress', 'to_process', 'offer']

const COLUMN_LABELS: Record<string, string> = {
  to_apply:    'Envie de postuler',
  applied:     'Postulé',
  in_progress: 'En cours',
  to_process:  'À traiter',
  offer:       'Offre reçue',
  archived:    'Archivé',
}

function getSourceBadge(source?: string) {
  if (!source || source === 'file') return null;
  const key = source.toLowerCase().trim();
  if (SOURCE_MAP[key]) return SOURCE_MAP[key];
  const label = source.length > 18 ? source.slice(0, 16) + '…' : source;
  return { bg: '#666', color: '#fff', label };
}

// ─── Détecte si une offre a au moins une relance dépassée ─────────────────────
// On regarde toutes les étapes où une relance a été configurée et activée.
// Si au moins une date est <= aujourd'hui ET que la relance n'a pas été envoyée,
// on affiche le badge "À relancer".
function hasOverdueFollowUp(job: Job): boolean {
  const dates = (job as any).follow_up_dates as Record<string, string> | null
  const enabled = (job as any).follow_up_enabled as Record<string, boolean> | null
  const sentDates = (job as any).follow_up_sent_dates as Record<string, string> | null
  if (!dates || Object.keys(dates).length === 0) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (const stepId of Object.keys(dates)) {
    const date = dates[stepId]
    if (!date) continue
    // Si la relance a déjà été envoyée pour cette étape, on n'affiche plus le badge
    if (sentDates && sentDates[stepId]) continue
    // par défaut activée si pas explicitement désactivée
    const isEnabled = !enabled || enabled[stepId] !== false
    if (!isEnabled) continue
    const followUp = new Date(date); followUp.setHours(0, 0, 0, 0)
    if (followUp.getTime() <= today.getTime()) return true
  }
  return false
}

// ─── Carte draggable ───────────────────────────────────────────────────────────
function DraggableCard({ job, colId, stages, stagesLabelMap, onClick }: {
  job: Job; colId: string; stages: Stage[];
  stagesLabelMap: Record<string, string>;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id, data: { job, fromColId: colId },
  });

  const subStatus = (job as any).sub_status as string | null;
  let subLabel: string | null = null;
  if (colId === 'in_progress' && subStatus) {
    subLabel = getSubStatusLabel(subStatus, stages);
    if (!subLabel && stagesLabelMap[subStatus]) {
      subLabel = stagesLabelMap[subStatus];
    }
  }

  const sourceBadge = getSourceBadge((job as any).source_platform);

  // ── Badge "À relancer" si au moins une relance est dépassée ──
  const showFollowUpBadge = hasOverdueFollowUp(job)

  // ── Calcul date à afficher ──
  const stepDatesMap = (job as any).step_dates as Record<string, string> | null;
  const stepDate = (colId === 'in_progress' && subStatus && stepDatesMap?.[subStatus])
    ? stepDatesMap[subStatus] : null;

  const stepLabel = stepDate && subStatus
    ? (stagesLabelMap[subStatus] || getSubStatusLabel(subStatus, stages))
    : null;

  const futureLabel = (() => {
    if (!stepDate) return null;
    const [y, m, d] = stepDate.split('-').map(Number);
    const stepDateObj = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((stepDateObj.getTime() - today.getTime()) / 86400000);
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays > 1) return `Dans ${diffDays} jours`;
    return null;
  })();

  const dateColor = futureLabel ? '#1A7A4A' : '#555';
  const dateText = futureLabel ?? formatRelative(job.created_at);

  return (
    <div
      ref={setNodeRef} {...listeners} {...attributes}
      className="jcard" onClick={onClick}
      style={{
        opacity: isDragging ? 0.35 : 1,
        transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        // Liseré rouge si relance dépassée
        ...(showFollowUpBadge ? { borderLeft: '4px solid #E8151B' } : {}),
      }}
    >
      <div style={{ fontSize: 12, color: '#555', fontWeight: 600, marginBottom: 3 }}>{job.company}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{job.title}</div>

      {(sourceBadge || subLabel || showFollowUpBadge) && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5, alignItems: 'center' }}>
          {showFollowUpBadge && (
            <span style={{
              background: '#E8151B', color: '#fff',
              fontSize: 10, fontWeight: 800,
              padding: '2px 8px', borderRadius: 20,
              lineHeight: 1.4, whiteSpace: 'nowrap',
              fontFamily: FONT,
            }}>
              ⚠️ À relancer
            </span>
          )}
          {sourceBadge && (
            <span style={{
              background: sourceBadge.bg, color: sourceBadge.color,
              fontSize: 10, fontWeight: 800,
              padding: '2px 8px', borderRadius: 20,
              lineHeight: 1.4, whiteSpace: 'nowrap',
            }}>
              {sourceBadge.label}
            </span>
          )}
          {subLabel && (
            <span style={{
              background: '#FFFBF0', color: '#B8900A',
              border: '1.5px solid #B8900A',
              fontSize: 10, fontWeight: 700,
              padding: '1px 6px', borderRadius: 4,
              lineHeight: 1.4, whiteSpace: 'nowrap',
            }}>
              {subLabel}
            </span>
          )}
        </div>
      )}

      {(job.location || (job as any).salary_text) && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 3 }}>
          {job.location && (
            <span className="pill" style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0', fontSize: 10 }}>
              {job.location}
            </span>
          )}
          {(job as any).salary_text && (
            <span className="pill" style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A', fontSize: 10 }}>
              💰 {(job as any).salary_text}
            </span>
          )}
        </div>
      )}

      {(job as any).favorite > 0 && <HeartDisplay value={(job as any).favorite} />}

      <div className="date-tag" style={{ color: dateColor }}>
        📅 {stepLabel ? `${stepLabel} · ` : ''}{dateText}
      </div>
    </div>
  );
}

// ─── Colonne droppable ────────────────────────────────────────────────────────
function DroppableColumn({ col, jobs, stages, stagesLabelMap, onCardClick, onAddJob, isDragOver }: {
  col: Stage; jobs: Job[]; stages: Stage[];
  stagesLabelMap: Record<string, string>;
  onCardClick: (job: Job) => void; onAddJob: (stageId: string) => void; isDragOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: col.id });
  const isToProcess = col.id === 'to_process'
  return (
    <div ref={setNodeRef} style={{
      background: isDragOver ? '#FFFDE7' : '#F4F4F4',
      border: isDragOver ? `2px solid ${col.color}` : '1.5px solid #E0E0E0',
      borderRadius: 10, padding: 10, flex: '1 1 0', minWidth: 0,
      transition: 'background .15s, border .15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3 }}>
          {col.label}
        </div>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: col.color + '22', color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
          {jobs.length}
        </div>
      </div>
      {jobs.map(job => (
        <DraggableCard
          key={job.id} job={job} colId={col.id} stages={stages}
          stagesLabelMap={stagesLabelMap}
          onClick={() => onCardClick(job)}
        />
      ))}
      {!isToProcess && (
        <div className="add-card" onClick={() => onAddJob(col.id)}>+ Ajouter</div>
      )}
    </div>
  );
}

// ─── Carte fantôme ────────────────────────────────────────────────────────────
function GhostCard({ job }: { job: Job }) {
  return (
    <div className="jcard" style={{ opacity: 0.9, transform: 'rotate(2deg)', boxShadow: '4px 4px 0 #E8151B', cursor: 'grabbing', pointerEvents: 'none', minWidth: 160 }}>
      <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 2 }}>{job.company}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{job.title}</div>
    </div>
  );
}

// ─── Modale confirmation déplacement en arrière ───────────────────────────────
function BackwardMoveModal({ job, fromCol, toCol, onConfirm, onCancel }: {
  job: Job; fromCol: string; toCol: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '0 20px', fontFamily: FONT,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 460,
        border: '2px solid #F5C400', boxShadow: '4px 4px 0 #111',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>
            Déplacer cette offre en arrière ?
          </h3>
        </div>

        <div style={{ background: '#F9F9F7', border: '1.5px solid #E0E0E0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', fontFamily: FONT }}>{job.title}</div>
          <div style={{ fontSize: 12, color: '#666', fontWeight: 500, fontFamily: FONT }}>{job.company}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: '#E8F0FE', color: '#1A6FDB', fontFamily: FONT }}>
            {COLUMN_LABELS[fromCol]}
          </span>
          <span style={{ fontSize: 18, color: '#E8151B', fontWeight: 900 }}>←</span>
          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: '#FFF8E1', color: '#B8900A', fontFamily: FONT }}>
            {COLUMN_LABELS[toCol]}
          </span>
        </div>

        <div style={{ background: '#FFF8E1', border: '1.5px solid #F5C400', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#111', margin: '0 0 8px', fontWeight: 700, fontFamily: FONT }}>
            ℹ️ Vos données ne sont pas perdues
          </p>
          <p style={{ fontSize: 12, color: '#555', margin: '0 0 6px', lineHeight: 1.6, fontFamily: FONT }}>
            Tous vos échanges, actions et documents restent intacts dans le dossier de l&apos;offre.
          </p>
          <p style={{ fontSize: 12, color: '#B8900A', margin: 0, lineHeight: 1.6, fontWeight: 600, fontFamily: FONT }}>
            En revanche, l&apos;étape active dans le parcours détaillé sera modifiée. Vous devrez rouvrir le dossier de l&apos;offre et remettre le parcours à l&apos;étape en cours.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #E8151B' }}>
            Déplacer quand même →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
type Props = {
  jobs: Job[]; stages: Stage[];
  stagesLabelMap: Record<string, string>;
  contactJobIds: Set<string>;
  onJobClick: (job: Job) => void; onAddJob: (stageId: string) => void;
  onOpenSettings: () => void; onRefresh: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
};

export default function KanbanView({ jobs, stages, stagesLabelMap, contactJobIds, onJobClick, onAddJob, onRefresh, onStatusChange }: Props) {
  const router = useRouter();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [overColId, setOverColId] = useState<string | null>(null);

  const [pendingMove, setPendingMove] = useState<{ job: Job; fromCol: string; toCol: string } | null>(null)

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') onRefresh(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [onRefresh]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const jobsByStatus = (s: string): Job[] => {
    if (s === 'to_process') {
      return jobs.filter(j => isJobToProcess(j, contactJobIds));
    }
    if (s === 'applied') {
      return jobs.filter(j => j.status === 'applied' && !isJobToProcess(j, contactJobIds));
    }
    return jobs.filter(j => j.status === s);
  };

  function handleDragStart(event: DragStartEvent) {
    const job = (event.active.data.current as any)?.job as Job;
    if (job) setActiveJob(job);
  }

  function handleDragOver(event: any) { setOverColId(event.over?.id ?? null); }

  function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null); setOverColId(null);
    const { active, over } = event;
    if (!over) return;
    const job = (active.data.current as any)?.job as Job;
    const fromColId = (active.data.current as any)?.fromColId as string;
    const toColId = over.id as string;
    if (!job || fromColId === toColId) return;

    if (toColId === 'to_process') return;
    if (fromColId === 'to_process' && toColId === 'applied') return;

    const fromIndex = COLUMN_ORDER.indexOf(fromColId)
    const toIndex = COLUMN_ORDER.indexOf(toColId)
    const isBackward = toIndex < fromIndex

    if (isBackward) {
      setPendingMove({ job, fromCol: fromColId, toCol: toColId })
    } else {
      onStatusChange(job.id, toColId);
    }
  }

  function confirmMove() {
    if (!pendingMove) return
    onStatusChange(pendingMove.job.id, pendingMove.toCol)
    setPendingMove(null)
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'start', width: '100%', height: '100%' }}>
          {stages.map(col => (
            <DroppableColumn
              key={col.id} col={col} jobs={jobsByStatus(col.id)} stages={stages}
              stagesLabelMap={stagesLabelMap}
              onCardClick={job => router.push(`/dashboard/job/${job.id}`)}
              onAddJob={onAddJob} isDragOver={overColId === col.id}
            />
          ))}
        </div>
        <DragOverlay>{activeJob ? <GhostCard job={activeJob} /> : null}</DragOverlay>
      </DndContext>

      {pendingMove && (
        <BackwardMoveModal
          job={pendingMove.job}
          fromCol={pendingMove.fromCol}
          toCol={pendingMove.toCol}
          onConfirm={confirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </>
  );
}
