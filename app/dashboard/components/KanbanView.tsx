'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { useState } from 'react';
import { Job } from '@/lib/jobs';
import { Stage, formatRelative, getSubStatusLabel } from './types';
import { HeartDisplay } from './HeartComponents';

// ─── Carte draggable ───────────────────────────────────────────────────────────
function DraggableCard({
  job,
  colId,
  stages,
  onClick,
}: {
  job: Job;
  colId: string;
  stages: Stage[];
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { job, fromColId: colId },
  });

  const subLabel =
    colId === 'in_progress'
      ? getSubStatusLabel((job as any).sub_status, stages)
      : null;

  // Badge spontanée
  const isSpontaneous = (job as any).source_platform === 'spontaneous';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="jcard"
      onClick={onClick}
      style={{
        opacity: isDragging ? 0.35 : 1,
        transform: transform
          ? `translate(${transform.x}px,${transform.y}px)`
          : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      <div style={{ fontSize: 9, color: '#888', fontWeight: 600, marginBottom: 2 }}>
        {job.company}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{job.title}</div>

      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: subLabel || isSpontaneous ? 4 : 0 }}>
        {/* Badge sous-statut (En cours) */}
        {subLabel && (
          <span
            className="pill"
            style={{
              background: '#B8900A22',
              color: '#B8900A',
              border: '1px solid #B8900A',
              fontSize: 9,
            }}
          >
            {subLabel}
          </span>
        )}
        {/* Badge Spontanée */}
        {isSpontaneous && (
          <span
            className="pill"
            style={{
              background: '#FFF8E0',
              color: '#92400E',
              border: '1px solid #F5C400',
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            📨 Spontanée
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 2 }}>
        {job.location && (
          <span
            className="pill"
            style={{ background: '#F4F4F4', color: '#888', border: '1px solid #E0E0E0', fontSize: 9 }}
          >
            {job.location}
          </span>
        )}
        {(job as any).salary_text && (
          <span
            className="pill"
            style={{ background: '#E8F5EE', color: '#1A7A4A', border: '1px solid #1A7A4A', fontSize: 9 }}
          >
            💰 {(job as any).salary_text}
          </span>
        )}
      </div>
      {(job as any).favorite > 0 && <HeartDisplay value={(job as any).favorite} />}
      <div className="date-tag">📅 {formatRelative(job.created_at)}</div>
    </div>
  );
}

// ─── Colonne droppable ────────────────────────────────────────────────────────
function DroppableColumn({
  col,
  jobs,
  stages,
  onCardClick,
  onAddJob,
  isDragOver,
}: {
  col: Stage;
  jobs: Job[];
  stages: Stage[];
  onCardClick: (job: Job) => void;
  onAddJob: (stageId: string) => void;
  isDragOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isDragOver ? '#FFFDE7' : '#F4F4F4',
        border: isDragOver ? `2px solid ${col.color}` : '1.5px solid #E0E0E0',
        borderRadius: 10,
        padding: 10,
        flex: '1 1 0',
        minWidth: 0,
        transition: 'background .15s, border .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3 }}>
          {col.label}
        </div>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: col.color + '22', color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
          {jobs.length}
        </div>
      </div>

      {jobs.map(job => (
        <DraggableCard
          key={job.id}
          job={job}
          colId={col.id}
          stages={stages}
          onClick={() => onCardClick(job)}
        />
      ))}

      <div className="add-card" onClick={() => onAddJob(col.id)}>+ Ajouter</div>
    </div>
  );
}

// ─── Carte fantôme (DragOverlay) ──────────────────────────────────────────────
function GhostCard({ job }: { job: Job }) {
  return (
    <div
      className="jcard"
      style={{
        opacity: 0.9,
        transform: 'rotate(2deg)',
        boxShadow: '4px 4px 0 #E8151B',
        cursor: 'grabbing',
        pointerEvents: 'none',
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 9, color: '#888', fontWeight: 600, marginBottom: 2 }}>{job.company}</div>
      <div style={{ fontSize: 11, fontWeight: 700 }}>{job.title}</div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
type Props = {
  jobs: Job[];
  stages: Stage[];
  onJobClick: (job: Job) => void;
  onAddJob: (stageId: string) => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
};

export default function KanbanView({
  jobs,
  stages,
  onJobClick,
  onAddJob,
  onRefresh,
  onStatusChange,
}: Props) {
  const router = useRouter();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [overColId, setOverColId] = useState<string | null>(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') onRefresh();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [onRefresh]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const jobsByStatus = (s: string) => jobs.filter(j => j.status === s);

  function handleDragStart(event: DragStartEvent) {
    const job = (event.active.data.current as any)?.job as Job;
    if (job) setActiveJob(job);
  }

  function handleDragOver(event: any) {
    setOverColId(event.over?.id ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null);
    setOverColId(null);

    const { active, over } = event;
    if (!over) return;

    const job = (active.data.current as any)?.job as Job;
    const fromColId = (active.data.current as any)?.fromColId as string;
    const toColId = over.id as string;

    if (!job || fromColId === toColId) return;

    onStatusChange(job.id, toColId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'start', width: '100%', height: '100%' }}>
        {stages.map(col => (
          <DroppableColumn
            key={col.id}
            col={col}
            jobs={jobsByStatus(col.id)}
            stages={stages}
            onCardClick={job => router.push(`/dashboard/job/${job.id}`)}
            onAddJob={onAddJob}
            isDragOver={overColId === col.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <GhostCard job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
