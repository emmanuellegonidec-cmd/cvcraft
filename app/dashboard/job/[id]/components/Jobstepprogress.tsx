'use client'

import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

const BASE_STEPS = [
  { id: 'to_apply',          label: 'Envie de postuler',      num: 1 },
  { id: 'applied',           label: 'Postulé',                num: 2 },
  { id: 'phone_interview',   label: 'Entretien téléphonique', num: 3 },
  { id: 'hr_interview',      label: 'Entretien RH',           num: 4 },
  { id: 'manager_interview', label: 'Entretien manager',      num: 5 },
  { id: 'offer',             label: 'Offre reçue',            num: 6 },
]

interface CustomStep { id: string; label: string; position: number }

interface Props {
  jobId: string
  userId: string | null
  currentStepId: string
  customSteps: CustomStep[]
  allSteps: { id: string; label: string; num: number }[]
  currentStepIndex: number
  onStepClick: (stepId: string) => void
  onCustomStepsChange: (steps: CustomStep[]) => void
}

function DraggableStep({ step, isActive, isDone, isCustom, onStepClick, onDeleteRequest }: {
  step: { id: string; label: string; num: number }
  isActive: boolean; isDone: boolean; isCustom: boolean
  currentStepId: string
  onStepClick: (id: string) => void
  onDeleteRequest: (id: string, label: string) => void
  allStepsLength: number
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: step.id, disabled: !isCustom, data: { stepId: step.id },
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 72, position: 'relative', opacity: isDragging ? 0.4 : 1, transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined, zIndex: isDragging ? 50 : 1 }}>
      <div
        ref={isCustom ? setNodeRef : undefined}
        {...(isCustom ? { ...listeners, ...attributes } : {})}
        onClick={() => onStepClick(step.id)}
        style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, position: 'relative', zIndex: 1, flexShrink: 0, cursor: isCustom ? (isDragging ? 'grabbing' : 'grab') : 'pointer', background: isActive ? '#111' : isDone ? '#F5C400' : '#fff', border: `2.5px solid ${isActive ? '#111' : isDone ? '#F5C400' : '#DEDEDE'}`, color: isActive ? '#F5C400' : isDone ? '#111' : '#ccc', boxShadow: isActive ? '0 0 0 4px rgba(245,196,0,.18)' : 'none', fontFamily: FONT, touchAction: 'none' }}>
        {step.num}
      </div>
      <p onClick={() => onStepClick(step.id)} style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginTop: 6, lineHeight: 1.3, color: isActive ? '#111' : isDone ? '#777' : '#ccc', fontFamily: FONT, cursor: 'pointer', maxWidth: 70 }}>{step.label}</p>
      {isCustom && (
        <button onClick={e => { e.stopPropagation(); onDeleteRequest(step.id, step.label) }}
          style={{ position: 'absolute', top: -5, right: 'calc(50% - 27px)', width: 15, height: 15, borderRadius: '50%', background: '#E8151B', border: 'none', color: '#fff', fontSize: 9, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, lineHeight: 1 }}>×</button>
      )}
    </div>
  )
}

function DropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} style={{ width: isOver ? 28 : 12, height: 34, borderRadius: 6, background: isOver ? '#F5C400' : 'transparent', border: isOver ? '2px dashed #111' : '2px dashed transparent', flexShrink: 0, transition: 'all .15s', alignSelf: 'center', marginBottom: 20 }} />
}

export default function JobStepProgress({ jobId, userId, currentStepId, customSteps, allSteps, currentStepIndex, onStepClick, onCustomStepsChange }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [newStepName, setNewStepName] = useState('')
  const [newStepPos, setNewStepPos] = useState(5)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [overDropZone, setOverDropZone] = useState<string | null>(null)
  const [stepToDelete, setStepToDelete] = useState<{ id: string; label: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const handleAddCustomStep = async () => {
    if (!newStepName.trim() || !userId) return
    const supabase = createClient()
    const position = (newStepPos + 1) * 1000 + (Date.now() % 100)
    const { data } = await supabase.from('pipeline_stages').insert({ user_id: userId, job_id: jobId, label: newStepName.trim(), color: '#F5C400', position }).select().single()
    if (data) onCustomStepsChange([...customSteps, { id: data.id, label: data.label, position: data.position }])
    setNewStepName(''); setNewStepPos(allSteps.length - 2); setShowModal(false)
  }

  const handleDeleteCustomStep = async (stepId: string) => {
    const supabase = createClient()
    await supabase.from('pipeline_stages').delete().eq('id', stepId)
    onCustomStepsChange(customSteps.filter(s => s.id !== stepId))
    setStepToDelete(null)
  }

  async function handleStepDragEnd(event: DragEndEvent) {
    setActiveStepId(null); setOverDropZone(null)
    const { active, over } = event; if (!over) return
    const draggedId = active.id as string; const dropZoneId = over.id as string
    const draggedStep = customSteps.find(s => s.id === draggedId); if (!draggedStep) return
    const match = dropZoneId.match(/^(after|before)-(.+)$/); if (!match) return
    const [, position, targetStepId] = match
    const sorted = [...customSteps].sort((a, b) => a.position - b.position)
    const withoutDragged = sorted.filter(s => s.id !== draggedId)
    const targetIdx = withoutDragged.findIndex(s => s.id === targetStepId)
    const insertIdx = position === 'after' ? targetIdx + 1 : targetIdx
    const reordered = [...withoutDragged.slice(0, insertIdx), draggedStep, ...withoutDragged.slice(insertIdx)]
    const updated = reordered.map((s, i) => ({ ...s, position: (i + 1) * 1000 }))
    onCustomStepsChange(updated)
    const supabase = createClient()
    await Promise.all(updated.map(s => supabase.from('pipeline_stages').update({ position: s.position }).eq('id', s.id)))
  }

  const activeStep = activeStepId ? allSteps.find(s => s.id === activeStepId) : null

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500 }
  const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 14, display: 'block', fontFamily: FONT }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }}>
        <span style={sectionLabel}>Parcours de candidature</span>
        <p style={{ fontSize: 12, color: '#bbb', fontWeight: 600, marginBottom: 14, fontFamily: FONT }}>💡 Cliquez sur une étape pour avancer — glissez les étapes personnalisées pour les réordonner</p>

        <DndContext sensors={sensors}
          onDragStart={e => setActiveStepId(e.active.id as string)}
          onDragOver={e => setOverDropZone(e.over?.id as string ?? null)}
          onDragEnd={handleStepDragEnd}>
          <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
            {allSteps.map((step, idx) => {
              const isDone = idx < currentStepIndex
              const isActive = step.id === currentStepId
              const isCustom = !!customSteps.find(cs => cs.id === step.id)
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 72 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                    {idx < allSteps.length - 1 && <div style={{ position: 'absolute', top: 17, left: 'calc(50% + 17px)', right: 'calc(-50% + 17px)', height: 2.5, background: isDone ? '#F5C400' : '#EBEBEB', zIndex: 0 }} />}
                    <DraggableStep step={step} isActive={isActive} isDone={isDone} isCustom={isCustom} currentStepId={currentStepId} onStepClick={onStepClick} onDeleteRequest={(id, label) => setStepToDelete({ id, label })} allStepsLength={allSteps.length} />
                  </div>
                  {isCustom && idx < allSteps.length - 1 && <DropZone id={`after-${step.id}`} isOver={overDropZone === `after-${step.id}`} />}
                </div>
              )
            })}
          </div>
          <DragOverlay>
            {activeStep ? <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F5C400', border: '2.5px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#111', boxShadow: '3px 3px 0 #E8151B', cursor: 'grabbing', fontFamily: FONT }}>{activeStep.num}</div> : null}
          </DragOverlay>
        </DndContext>

        <button onClick={() => setShowModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F9F9F7', border: '1.5px dashed #ddd', color: '#999', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', marginTop: 14, fontFamily: FONT }}
          onMouseOver={e => { const el = e.currentTarget; el.style.borderColor = '#F5C400'; el.style.color = '#111'; el.style.background = '#FFFDE7' }}
          onMouseOut={e => { const el = e.currentTarget; el.style.borderColor = '#ddd'; el.style.color = '#999'; el.style.background = '#F9F9F7' }}>
          <span style={{ width: 15, height: 15, background: '#ddd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>+</span>
          Ajouter une étape personnalisée
        </button>
      </div>

      {/* Modale ajout étape */}
      {showModal && (
        <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '32px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 440, border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 5, fontFamily: FONT }}>Ajouter une étape personnalisée</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5, fontFamily: FONT }}>Donnez un nom à cette étape et choisissez où l&apos;insérer.</p>
            <label style={{ ...sectionLabel, marginBottom: 5 }}>Nom de l&apos;étape</label>
            <input style={inp} placeholder="Ex : Test technique, Entretien DRH..." value={newStepName} onChange={e => setNewStepName(e.target.value)} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} />
            <label style={{ ...sectionLabel, marginTop: 14, marginBottom: 8 }}>Où l&apos;insérer ?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {allSteps.slice(0, -1).map((step, idx) => {
                const nextStep = allSteps[idx + 1]; const pos = idx + 1; const isSelected = newStepPos === pos
                return (
                  <button key={pos} onClick={() => setNewStepPos(pos)} style={{ background: isSelected ? '#111' : '#F9F9F7', color: isSelected ? '#F5C400' : '#555', border: `1.5px solid ${isSelected ? '#111' : '#E5E5E5'}`, borderRadius: 8, padding: '9px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Après <strong style={{ color: isSelected ? '#F5C400' : '#111' }}>{step.label}</strong></span>
                    <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6 }}>→ avant {nextStep.label}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button onClick={() => setShowModal(false)} style={{ background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={handleAddCustomStep} style={{ background: '#111', color: '#F5C400', fontSize: 13, fontWeight: 800, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT }}>Ajouter l&apos;étape</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression étape */}
      {stepToDelete && (
        <div style={{ background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 400, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', margin: '0 20px' }}>
            <div style={{ fontSize: 26, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 8, textAlign: 'center', fontFamily: FONT }}>Supprimer cette étape ?</h3>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>&ldquo;{stepToDelete.label}&rdquo;</p>
            <p style={{ fontSize: 12, color: '#E8151B', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStepToDelete(null)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={() => handleDeleteCustomStep(stepToDelete.id)} style={{ flex: 1, background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
