'use client'

import {
  DndContext, DragEndEvent, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

interface CustomStep { id: string; label: string; position: number }

interface StepWithPos { id: string; label: string; sortPos: number }

interface Props {
  jobId: string
  userId: string | null
  currentStepId: string
  customSteps: CustomStep[]
  allSteps: { id: string; label: string; num: number }[]
  allStepsMerged: StepWithPos[]
  currentStepIndex: number
  onStepClick: (stepId: string) => void
  onCustomStepsChange: (steps: CustomStep[]) => void
  onHideBaseStep: (stepId: string) => void
  stepDates: Record<string, string>
  onStepDatesChange: (dates: Record<string, string>) => void
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

function DraggableStep({ step, isActive, isDone, isCustom, onStepClick, date }: {
  step: { id: string; label: string; num: number }
  isActive: boolean; isDone: boolean; isCustom: boolean
  onStepClick: (id: string) => void
  date?: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: step.id, disabled: !isCustom, data: { stepId: step.id },
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
          fontSize: 13, fontWeight: 900, zIndex: 1, flexShrink: 0,
          cursor: isCustom ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          background: isActive ? '#111' : isDone ? '#F5C400' : '#fff',
          border: `2.5px solid ${isActive ? '#111' : isDone ? '#F5C400' : '#DEDEDE'}`,
          color: isActive ? '#F5C400' : isDone ? '#111' : '#ccc',
          boxShadow: isActive ? '0 0 0 4px rgba(245,196,0,.18)' : 'none',
          fontFamily: FONT, touchAction: 'none',
        }}>
        {isDone && !isActive ? '✓' : step.num}
      </div>
      <p onClick={() => onStepClick(step.id)} style={{
        fontSize: 10, fontWeight: 700, textAlign: 'center',
        marginTop: 6, lineHeight: 1.3,
        color: isActive ? '#111' : isDone ? '#777' : '#ccc',
        fontFamily: FONT, cursor: 'pointer', maxWidth: 70,
        marginBottom: date ? 4 : 0,
      }}>{step.label}</p>

      {/* Pill date */}
      {date && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '2px 8px', borderRadius: 20,
          background: isActive ? '#F5C400' : '#111',
          color: isActive ? '#111' : '#fff',
          border: `1.5px solid #111`,
          whiteSpace: 'nowrap',
          fontFamily: FONT,
        }}>
          {formatDate(date)}
        </span>
      )}
      {!date && <div style={{ height: 20 }} />}
    </div>
  )
}

function DropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{
      width: isOver ? 28 : 12, height: 34, borderRadius: 6,
      background: isOver ? '#F5C400' : 'transparent',
      border: isOver ? '2px dashed #111' : '2px dashed transparent',
      flexShrink: 0, transition: 'all .15s', alignSelf: 'center', marginBottom: 20,
    }} />
  )
}

export default function JobStepProgress({
  jobId, userId, currentStepId, customSteps, allSteps, allStepsMerged,
  currentStepIndex, onStepClick, onCustomStepsChange, onHideBaseStep,
  stepDates, onStepDatesChange,
}: Props) {
  const [showPanel, setShowPanel] = useState(false)
  const [newStepName, setNewStepName] = useState('')
  const [newStepPos, setNewStepPos] = useState(0)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [overDropZone, setOverDropZone] = useState<string | null>(null)
  const [stepToDelete, setStepToDelete] = useState<{ id: string; label: string; isBase: boolean } | null>(null)
  const [view, setView] = useState<'add' | 'remove'>('add')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  // Quand on clique sur une étape : on enregistre la date du jour si pas encore de date
  const handleStepClick = (stepId: string) => {
    if (!stepDates[stepId]) {
      const today = new Date().toISOString().split('T')[0]
      const newDates = { ...stepDates, [stepId]: today }
      onStepDatesChange(newDates)
    }
    onStepClick(stepId)
  }

  // ─── Ajouter une étape ──
  const handleAddCustomStep = async () => {
    if (!newStepName.trim() || !userId) return
    const supabase = createClient()

    const prevSortPos = allStepsMerged[newStepPos]?.sortPos ?? 0
    const nextSortPos = allStepsMerged[newStepPos + 1]?.sortPos ?? (prevSortPos + 2000)
    const position = Math.round((prevSortPos + nextSortPos) / 2)

    const { data } = await supabase
      .from('pipeline_stages')
      .insert({ user_id: userId, job_id: jobId, label: newStepName.trim(), color: '#F5C400', position })
      .select().single()
    if (data) onCustomStepsChange([...customSteps, { id: data.id, label: data.label, position: data.position }])
    setNewStepName('')
    setNewStepPos(0)
    setShowPanel(false)
  }

  const handleDeleteCustomStep = async (stepId: string) => {
    const supabase = createClient()
    await supabase.from('pipeline_stages').delete().eq('id', stepId)
    onCustomStepsChange(customSteps.filter(s => s.id !== stepId))
    setStepToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!stepToDelete) return
    if (stepToDelete.isBase) {
      onHideBaseStep(stepToDelete.id)
      setStepToDelete(null)
    } else {
      await handleDeleteCustomStep(stepToDelete.id)
    }
  }

  async function handleStepDragEnd(event: DragEndEvent) {
    setActiveStepId(null); setOverDropZone(null)
    const { active, over } = event; if (!over) return
    const draggedId = active.id as string; const dropZoneId = over.id as string
    const draggedStep = customSteps.find(s => s.id === draggedId); if (!draggedStep) return
    const match = dropZoneId.match(/^after-(.+)$/); if (!match) return
    const targetStepId = match[1]
    const sorted = [...customSteps].sort((a, b) => a.position - b.position)
    const withoutDragged = sorted.filter(s => s.id !== draggedId)
    const targetIdx = withoutDragged.findIndex(s => s.id === targetStepId)
    const insertIdx = targetIdx + 1
    const reordered = [...withoutDragged.slice(0, insertIdx), draggedStep, ...withoutDragged.slice(insertIdx)]
    const updated = reordered.map((s, i) => ({ ...s, position: (i + 1) * 1000 }))
    onCustomStepsChange(updated)
    const supabase = createClient()
    await Promise.all(updated.map(s => supabase.from('pipeline_stages').update({ position: s.position }).eq('id', s.id)))
  }

  const activeStep = activeStepId ? allSteps.find(s => s.id === activeStepId) : null

  const inp: React.CSSProperties = {
    width: '100%', border: '1.5px solid #eee', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, fontFamily: FONT,
    outline: 'none', background: '#fff', color: '#111',
    boxSizing: 'border-box', fontWeight: 500,
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#666', fontFamily: FONT }}>
            Parcours de candidature
          </span>
          <button
            onClick={() => { setShowPanel(v => !v); setView('add') }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: showPanel ? '#111' : '#fff',
              border: '2px solid #111',
              boxShadow: showPanel ? 'none' : '3px 3px 0 #111',
              color: showPanel ? '#F5C400' : '#111',
              fontSize: 12, fontWeight: 800,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
              transition: 'all 0.15s',
            }}>
            <span style={{
              width: 16, height: 16, background: '#F5C400', borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#111', lineHeight: 1,
              border: '1.5px solid #111',
            }}>{showPanel ? '×' : '+'}</span>
            Ajouter ou supprimer une étape
          </button>
        </div>

        {/* Timeline */}
        <DndContext
          sensors={sensors}
          onDragStart={e => setActiveStepId(e.active.id as string)}
          onDragOver={e => setOverDropZone(e.over?.id as string ?? null)}
          onDragEnd={handleStepDragEnd}>
          <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
            {allSteps.map((step, idx) => {
              const isDone = idx < currentStepIndex
              const isActive = step.id === currentStepId
              const isCustom = !!customSteps.find(cs => cs.id === step.id)
              const date = stepDates[step.id]
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 72 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                    {idx < allSteps.length - 1 && (
                      <div style={{ position: 'absolute', top: 17, left: 'calc(50% + 17px)', right: 'calc(-50% + 17px)', height: 2.5, background: isDone ? '#F5C400' : '#EBEBEB', zIndex: 0 }} />
                    )}
                    <DraggableStep
                      step={step}
                      isActive={isActive}
                      isDone={isDone}
                      isCustom={isCustom}
                      onStepClick={handleStepClick}
                      date={(isActive || isDone) ? date : undefined}
                    />
                  </div>
                  {isCustom && idx < allSteps.length - 1 && (
                    <DropZone id={`after-${step.id}`} isOver={overDropZone === `after-${step.id}`} />
                  )}
                </div>
              )
            })}
          </div>
          <DragOverlay>
            {activeStep ? (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F5C400', border: '2.5px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#111', boxShadow: '3px 3px 0 #E8151B', cursor: 'grabbing', fontFamily: FONT }}>{activeStep.num}</div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Panneau inline */}
        {showPanel && (
          <div style={{ marginTop: 20, borderTop: '1.5px solid #F0F0F0', paddingTop: 20 }}>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {(['add', 'remove'] as const).map(tab => (
                <button key={tab} onClick={() => setView(tab)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 800, fontFamily: FONT,
                  border: view === tab ? '2px solid #111' : '1.5px solid #E5E5E5',
                  background: view === tab ? '#111' : '#F9F9F7',
                  color: view === tab ? '#F5C400' : '#888',
                  transition: 'all 0.15s',
                }}>
                  {tab === 'add' ? '＋ Ajouter une étape' : '🗑 Supprimer une étape'}
                </button>
              ))}
            </div>

            {/* Vue : Ajouter */}
            {view === 'add' && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#666', marginBottom: 6, display: 'block', fontFamily: FONT }}>
                  Nom de l&apos;étape
                </label>
                <input
                  style={{ ...inp, marginBottom: 14 }}
                  placeholder="Ex : Test technique, Entretien DRH..."
                  value={newStepName}
                  onChange={e => setNewStepName(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = '#F5C400' }}
                  onBlur={e => { e.target.style.borderColor = '#eee' }}
                  autoFocus
                />
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#666', marginBottom: 8, display: 'block', fontFamily: FONT }}>
                  Où l&apos;insérer ?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {allStepsMerged.slice(0, -1).map((step, idx) => {
                    const nextStep = allStepsMerged[idx + 1]
                    const isSelected = newStepPos === idx
                    return (
                      <button key={idx} onClick={() => setNewStepPos(idx)} style={{
                        background: isSelected ? '#111' : '#F9F9F7',
                        color: isSelected ? '#F5C400' : '#555',
                        border: `1.5px solid ${isSelected ? '#111' : '#E5E5E5'}`,
                        borderRadius: 8, padding: '9px 13px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, fontFamily: FONT,
                        textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span>Après <strong style={{ color: isSelected ? '#F5C400' : '#111' }}>{step.label}</strong></span>
                        <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6 }}>→ avant {nextStep.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setShowPanel(false)} style={{ background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 8, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                  <button onClick={handleAddCustomStep} disabled={!newStepName.trim()} style={{ background: newStepName.trim() ? '#111' : '#eee', color: newStepName.trim() ? '#F5C400' : '#aaa', fontSize: 13, fontWeight: 800, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: newStepName.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
                    Ajouter l&apos;étape →
                  </button>
                </div>
              </div>
            )}

            {/* Vue : Supprimer */}
            {view === 'remove' && (
              <div>
                <p style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 14, fontFamily: FONT }}>
                  Cliquez sur &ldquo;Retirer&rdquo; pour enlever une étape de ce parcours.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {allSteps.map(step => {
                    const isCustom = !!customSteps.find(cs => cs.id === step.id)
                    const isCurrent = step.id === currentStepId
                    return (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 9, border: `1.5px solid ${isCurrent ? '#F5C400' : '#EBEBEB'}`, background: isCurrent ? '#FFFDE7' : '#FAFAFA' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: isCurrent ? '#F5C400' : isCustom ? '#111' : '#E0E0E0', color: isCurrent ? '#111' : isCustom ? '#F5C400' : '#888', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: FONT }}>{step.num}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111', fontFamily: FONT }}>{step.label}</span>
                          {isCustom && <span style={{ fontSize: 10, fontWeight: 700, color: '#888', background: '#F0F0F0', padding: '2px 7px', borderRadius: 20, fontFamily: FONT }}>perso.</span>}
                          {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, color: '#B8900A', background: '#FFF8E1', padding: '2px 7px', borderRadius: 20, fontFamily: FONT }}>en cours</span>}
                        </div>
                        <button
                          onClick={() => !isCurrent && setStepToDelete({ id: step.id, label: step.label, isBase: !isCustom })}
                          disabled={isCurrent}
                          style={{ background: isCurrent ? '#F5F5F5' : '#FEF2F2', color: isCurrent ? '#ccc' : '#E8151B', border: `1.5px solid ${isCurrent ? '#E5E5E5' : '#FECACA'}`, borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 800, cursor: isCurrent ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                          {isCurrent ? 'Étape active' : 'Retirer'}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: 11, color: '#bbb', fontWeight: 600, marginTop: 12, fontFamily: FONT }}>
                  L&apos;étape active ne peut pas être retirée. Changez d&apos;étape d&apos;abord.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modale confirmation */}
      {stepToDelete && (
        <div style={{ background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 400, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', margin: '0 20px' }}>
            <div style={{ fontSize: 26, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 8, textAlign: 'center', fontFamily: FONT }}>Retirer cette étape ?</h3>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 10, textAlign: 'center', fontFamily: FONT }}>&ldquo;{stepToDelete.label}&rdquo;</p>
            {stepToDelete.isBase
              ? <p style={{ fontSize: 12, color: '#888', marginBottom: 18, textAlign: 'center', fontFamily: FONT, lineHeight: 1.6 }}>Cette étape sera masquée de <strong>cette candidature uniquement</strong>.</p>
              : <p style={{ fontSize: 12, color: '#E8151B', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>Cette étape personnalisée sera supprimée définitivement.</p>
            }
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStepToDelete(null)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={handleConfirmDelete} style={{ flex: 1, background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>Retirer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
