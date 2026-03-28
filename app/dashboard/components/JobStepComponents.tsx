'use client'

import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

const FONT = "'Montserrat', sans-serif"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepActionRow {
  id: string
  title: string
  icon: string
  sub: string
  position: number
  is_custom: boolean
  type: 'included' | 'action' | 'new'
}

// ─── DraggableStep ────────────────────────────────────────────────────────────

export function DraggableStep({
  step, isActive, isDone, isCustom, onStepClick, onDeleteRequest,
}: {
  step: { id: string; label: string; num: number }
  isActive: boolean
  isDone: boolean
  isCustom: boolean
  currentStepId: string
  onStepClick: (id: string) => void
  onDeleteRequest: (id: string, label: string) => void
  allStepsLength: number
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: step.id,
    disabled: !isCustom,
    data: { stepId: step.id },
  })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: 1, minWidth: 72, position: 'relative',
      opacity: isDragging ? 0.4 : 1,
      transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
      zIndex: isDragging ? 50 : 1,
    }}>
      <div
        ref={isCustom ? setNodeRef : undefined}
        {...(isCustom ? { ...listeners, ...attributes } : {})}
        onClick={() => onStepClick(step.id)}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, position: 'relative', zIndex: 1, flexShrink: 0,
          cursor: isCustom ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          background: isActive ? '#111' : isDone ? '#F5C400' : '#fff',
          border: `2.5px solid ${isActive ? '#111' : isDone ? '#F5C400' : '#DEDEDE'}`,
          color: isActive ? '#F5C400' : isDone ? '#111' : '#ccc',
          boxShadow: isActive ? '0 0 0 4px rgba(245,196,0,.18)' : 'none',
          fontFamily: FONT, touchAction: 'none',
        }}
      >
        {step.num}
      </div>

      <p
        onClick={() => onStepClick(step.id)}
        style={{
          fontSize: 10, fontWeight: 700, textAlign: 'center',
          marginTop: 6, lineHeight: 1.3,
          color: isActive ? '#111' : isDone ? '#777' : '#ccc',
          fontFamily: FONT, cursor: 'pointer', maxWidth: 70,
        }}
      >
        {step.label}
      </p>

      {isCustom && (
        <button
          onClick={e => { e.stopPropagation(); onDeleteRequest(step.id, step.label) }}
          style={{
            position: 'absolute', top: -5, right: 'calc(50% - 27px)',
            width: 15, height: 15, borderRadius: '50%',
            background: '#E8151B', border: 'none', color: '#fff',
            fontSize: 9, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2, lineHeight: 1,
          }}
        >×</button>
      )}
    </div>
  )
}

// ─── DropZone (entre étapes) ──────────────────────────────────────────────────

export function DropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        width: isOver ? 28 : 12, height: 34, borderRadius: 6,
        background: isOver ? '#F5C400' : 'transparent',
        border: isOver ? '2px dashed #111' : '2px dashed transparent',
        flexShrink: 0, transition: 'all .15s', alignSelf: 'center', marginBottom: 20,
      }}
    />
  )
}

// ─── DraggableActionCard ──────────────────────────────────────────────────────

export function DraggableActionCard({
  action, dragId, onDelete,
}: {
  action: StepActionRow
  dragId: string
  onDelete: (id: string, title: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId })

  const borderColor = action.type === 'included' ? '#C8E6C9' : action.type === 'new' ? '#FFCDD2' : '#EBEBEB'
  const bgColor = action.type === 'included' ? '#F1F8E9' : '#fff'

  return (
    <div
      ref={setNodeRef}
      style={{
        background: bgColor,
        border: `1.5px solid ${isDragging ? '#F5C400' : borderColor}`,
        borderRadius: 10, padding: '12px 14px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
        zIndex: isDragging ? 50 : 1,
        position: 'relative', touchAction: 'none', userSelect: 'none',
      }}
      {...listeners}
      {...attributes}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontSize: 15, display: 'block', marginBottom: 5 }}>{action.icon}</span>
        <div style={{ display: 'flex', gap: 4, marginTop: -2 }}>
          <span style={{ fontSize: 9, color: '#ccc', cursor: 'grab', lineHeight: 1, paddingTop: 2 }}>⠿</span>
          {action.is_custom && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(action.id, action.title) }}
              style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >×</button>
          )}
        </div>
      </div>

      <span style={{ fontSize: 12, fontWeight: 800, color: action.type === 'included' ? '#2E7D32' : '#111', display: 'block', fontFamily: FONT }}>
        {action.title}
        {action.type === 'included' && (
          <span style={{ background: '#2E7D32', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 20, marginLeft: 4 }}>✓</span>
        )}
        {action.type === 'new' && (
          <span style={{ background: '#E8151B', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 20, marginLeft: 4 }}>Nouveau</span>
        )}
      </span>
      <span style={{ fontSize: 11, color: '#888', marginTop: 3, display: 'block', fontFamily: FONT }}>{action.sub}</span>
    </div>
  )
}

// ─── ActionDropZone ───────────────────────────────────────────────────────────

export function ActionDropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        height: isOver ? 44 : 6, borderRadius: 8,
        background: isOver ? '#FFFDE7' : 'transparent',
        border: isOver ? '2px dashed #F5C400' : '2px dashed transparent',
        transition: 'all .15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gridColumn: isOver ? '1 / -1' : undefined,
      }}
    />
  )
}
