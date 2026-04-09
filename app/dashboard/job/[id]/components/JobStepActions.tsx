'use client'

import { useState, useEffect } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

const ICON_CHOICES = ['⭐','📄','✉️','🎯','🔍','📅','🔔','📋','🏢','💬','⚖️','✅','❌','📊','🔧','👤','🧠','💡','🚀','🤝','📞','📝','🗓️','💼','🎤','📌']

const STEP_ACTIONS: Record<string, { desc: string; actions: { icon: string; title: string; sub: string; type: 'included' | 'action' | 'new' }[] }> = {
  to_apply: {
    desc: "Vous avez repéré cette offre. Vérifiez votre compatibilité et préparez vos documents avant de postuler.",
    actions: [
      { icon: '🎯', title: 'Vérifier le score ATS', sub: 'Compatibilité CV / offre', type: 'action' },
      { icon: '📄', title: 'Préparer mon CV', sub: 'Adapté à ce poste', type: 'action' },
      { icon: '✉️', title: 'Rédiger ma LM', sub: 'Personnalisée pour cette offre', type: 'action' },
      { icon: '🔍', title: "Rechercher l'entreprise", sub: 'Actualités, culture, équipe', type: 'action' },
      { icon: '📅', title: 'Fixer une deadline', sub: 'Date limite de candidature', type: 'action' },
    ],
  },
  applied: {
    desc: "Votre dossier est envoyé. Gardez une trace et programmez une relance.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Envoyé à cette étape', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Envoyée à cette étape', type: 'included' },
      { icon: '🔔', title: 'Programmer une relance', sub: 'Dans 7 à 10 jours', type: 'action' },
      { icon: '📋', title: 'Confirmer la réception', sub: 'Email de confirmation reçu ?', type: 'action' },
    ],
  },
  phone_interview: {
    desc: "Préparez un pitch de 2 minutes et vos questions. CV et LM sont déjà transmis.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '🎯', title: 'Préparer mon pitch', sub: '2 min chrono', type: 'action' },
      { icon: '⏰', title: 'Mes questions', sub: 'À poser au recruteur', type: 'action' },
      { icon: '📅', title: 'Ajouter un rappel', sub: "Date & heure de l'appel", type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  hr_interview: {
    desc: "L'entretien RH explore votre personnalité et vos motivations. Préparez des exemples avec la méthode STAR.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '⭐', title: 'Méthode STAR', sub: 'Préparer mes exemples', type: 'new' },
      { icon: '🧠', title: 'Questions RH types', sub: 'Points forts, faiblesse...', type: 'new' },
      { icon: '🏢', title: "Connaître l'entreprise", sub: 'Valeurs, actualités, équipe', type: 'action' },
      { icon: '⏰', title: 'Mes questions RH', sub: 'Culture, équipe, mobilité', type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  manager_interview: {
    desc: "L'entretien manager est plus technique. Montrez votre expertise métier et votre compréhension des enjeux.",
    actions: [
      { icon: '📄', title: 'CV', sub: 'Inclus — étape Postulé', type: 'included' },
      { icon: '✉️', title: 'LM', sub: 'Incluse — étape Postulé', type: 'included' },
      { icon: '📊', title: 'Portfolio / cas pratique', sub: 'Exemples chiffrés', type: 'new' },
      { icon: '🔧', title: 'Analyse du poste', sub: 'Enjeux, priorités, KPIs', type: 'new' },
      { icon: '👤', title: 'Références professionnelles', sub: 'Prévenir ses contacts', type: 'new' },
      { icon: '⏰', title: 'Mes questions manager', sub: 'Équipe, objectifs, style', type: 'action' },
      { icon: '🔔', title: 'Note de remerciement', sub: 'Email post-entretien', type: 'new' },
    ],
  },
  offer: {
    desc: "Félicitations ! Prenez le temps d'analyser l'offre avant de répondre. Négociez si nécessaire.",
    actions: [
      { icon: '📋', title: 'Analyser le contrat', sub: 'Salaire, avantages, conditions', type: 'new' },
      { icon: '⚖️', title: 'Comparer les offres', sub: 'Si vous avez plusieurs pistes', type: 'new' },
      { icon: '💬', title: 'Négocier le salaire', sub: 'Conseils & arguments', type: 'new' },
      { icon: '📅', title: 'Date de prise de poste', sub: 'Préavis, disponibilité', type: 'action' },
      { icon: '✅', title: "Accepter l'offre", sub: 'Confirmer par écrit', type: 'action' },
      { icon: '❌', title: 'Refuser poliment', sub: 'Garder le contact', type: 'action' },
    ],
  },
}

const DATE_ACTION_TITLES = ['Fixer une deadline', 'Ajouter un rappel', 'Date de prise de poste']

interface StepActionRow {
  id: string; title: string; icon: string; sub: string; position: number
  is_custom: boolean; type: 'included' | 'action' | 'new'; is_done: boolean
  deadline_date?: string | null
}

function DraggableActionCard({ action, dragId, onDelete, onToggleDone, onDeadlineSave }: {
  action: StepActionRow
  dragId: string
  onDelete: (id: string, title: string) => void
  onToggleDone: (id: string, value: boolean) => void
  onDeadlineSave: (id: string, date: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId })
  const [localDate, setLocalDate] = useState(action.deadline_date || '')
  const isDateCard = DATE_ACTION_TITLES.includes(action.title)

  const borderColor = action.is_done ? '#A5D6A7' : action.type === 'included' ? '#C8E6C9' : action.type === 'new' ? '#FFCDD2' : '#EBEBEB'
  const bgColor = action.is_done ? '#F1F8E9' : action.type === 'included' ? '#F1F8E9' : '#fff'

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setLocalDate(val)
    if (val) onDeadlineSave(action.id, val)
  }

  function formatDisplayDate(dateStr: string) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    const months = ['jan.','fév.','mar.','avr.','mai','juin','juil.','aoû.','sep.','oct.','nov.','déc.']
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
  }

  function getDeadlineStatus(dateStr: string): 'urgent' | 'warning' | 'ok' | null {
    if (!dateStr) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const deadline = new Date(dateStr); deadline.setHours(0, 0, 0, 0)
    const diffDays = Math.round((deadline.getTime() - today.getTime()) / 86400000)
    if (diffDays < 0) return 'urgent'
    if (diffDays <= 3) return 'warning'
    return 'ok'
  }

  const deadlineStatus = isDateCard ? getDeadlineStatus(localDate) : null

  return (
    <div ref={setNodeRef} style={{
      background: bgColor, border: `1.5px solid ${isDragging ? '#F5C400' : borderColor}`,
      borderRadius: 10, padding: '10px 12px 12px',
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.5 : 1,
      transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
      zIndex: isDragging ? 50 : 1, position: 'relative',
      touchAction: 'none', userSelect: 'none',
      width: '100%', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', height: '100%',
    }} {...listeners} {...attributes}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{action.icon}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#bbb', cursor: 'grab', lineHeight: 1 }}>⠿</span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(action.id, action.title) }}
            style={{ background: '#f0f0f0', border: '1px solid #ddd', color: '#999', fontSize: 14, fontWeight: 900, cursor: 'pointer', padding: '0px 5px', lineHeight: '18px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#E8151B'; b.style.borderColor = '#E8151B'; b.style.color = '#fff' }}
            onMouseOut={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#f0f0f0'; b.style.borderColor = '#ddd'; b.style.color = '#999' }}
          >×</button>
        </div>
      </div>

      <span style={{
        fontSize: 12, fontWeight: 800,
        color: action.is_done ? '#2E7D32' : action.type === 'included' ? '#2E7D32' : '#111',
        display: 'block', fontFamily: FONT,
        textDecoration: action.is_done ? 'line-through' : 'none',
        marginBottom: 3, lineHeight: 1.3,
      }}>
        {action.title}
        {action.type === 'included' && !action.is_done && <span style={{ background: '#2E7D32', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 20, marginLeft: 4 }}>✓</span>}
        {action.type === 'new' && !action.is_done && <span style={{ background: '#E8151B', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 20, marginLeft: 4 }}>Nouveau</span>}
      </span>

      <span style={{ fontSize: 11, color: '#888', display: 'block', fontFamily: FONT, marginBottom: isDateCard ? 8 : 10, flex: isDateCard ? 'none' : 1 }}>{action.sub}</span>

      {isDateCard && (
        <div onPointerDown={e => e.stopPropagation()} style={{ marginBottom: 8 }}>
          <input type="date" value={localDate} onChange={handleDateChange} onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              border: `1.5px solid ${deadlineStatus === 'urgent' ? '#E8151B' : deadlineStatus === 'warning' ? '#F5C400' : '#E0E0E0'}`,
              borderRadius: 6, padding: '4px 7px', fontSize: 11, fontFamily: FONT, fontWeight: 700,
              color: deadlineStatus === 'urgent' ? '#E8151B' : '#111',
              background: deadlineStatus === 'urgent' ? '#FFF0F0' : deadlineStatus === 'warning' ? '#FFFDE7' : '#FAFAFA',
              outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
            }} />
          {localDate && deadlineStatus === 'urgent' && <span style={{ fontSize: 9, fontWeight: 800, color: '#E8151B', display: 'block', marginTop: 2, fontFamily: FONT }}>⚠️ Deadline dépassée</span>}
          {localDate && deadlineStatus === 'warning' && <span style={{ fontSize: 9, fontWeight: 800, color: '#B8900A', display: 'block', marginTop: 2, fontFamily: FONT }}>⏰ Dans moins de 3 jours !</span>}
          {localDate && deadlineStatus === 'ok' && <span style={{ fontSize: 9, fontWeight: 600, color: '#888', display: 'block', marginTop: 2, fontFamily: FONT }}>📅 {formatDisplayDate(localDate)}</span>}
        </div>
      )}

      <div onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onToggleDone(action.id, !action.is_done) }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginTop: 'auto' }}>
        <div style={{
          width: 16, height: 16, borderRadius: 4,
          border: `2px solid ${action.is_done ? '#2E7D32' : '#ccc'}`,
          background: action.is_done ? '#2E7D32' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s',
        }}>
          {action.is_done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: action.is_done ? '#2E7D32' : '#aaa', fontFamily: FONT }}>
          {action.is_done ? 'Fait ✓' : 'À faire'}
        </span>
      </div>
    </div>
  )
}

function ActionDropZone({ id, isOver }: { id: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} style={{ height: isOver ? 44 : 6, borderRadius: 8, background: isOver ? '#FFFDE7' : 'transparent', border: isOver ? '2px dashed #F5C400' : '2px dashed transparent', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
}

interface Props {
  jobId: string
  userId: string | null
  currentStepId: string
  currentStepLabel: string
  currentStepIndex: number
}

export default function JobStepActions({ jobId, userId, currentStepId, currentStepLabel, currentStepIndex }: Props) {
  const [stepActions, setStepActions] = useState<StepActionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [cvSent, setCvSent] = useState<boolean>(false)
  const [lmSent, setLmSent] = useState<boolean>(false)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [overActionZone, setOverActionZone] = useState<string | null>(null)

  // Panneau unifié
  const [showPanel, setShowPanel] = useState(false)
  const [panelView, setPanelView] = useState<'add' | 'remove'>('add')

  // Formulaire ajout
  const [newActionTitle, setNewActionTitle] = useState('')
  const [newActionSub, setNewActionSub] = useState('')
  const [newActionIcon, setNewActionIcon] = useState('⭐')
  const [newActionPosition, setNewActionPosition] = useState<number>(-1)

  // Suppression
  const [actionToDelete, setActionToDelete] = useState<{ id: string; title: string } | null>(null)

  const stepData = STEP_ACTIONS[currentStepId] || STEP_ACTIONS['hr_interview']

  const sortedStepActions = [...stepActions]
    .sort((a, b) => a.position - b.position)
    .filter(a => {
      if (a.title === 'CV' && a.type === 'included') return cvSent
      if ((a.title === 'LM' || a.title === 'Lettre de motivation') && a.type === 'included') return lmSent
      return true
    })

  useEffect(() => {
    if (!currentStepId || !userId) return
    loadJobDocStatus()
    loadStepActions()
    setShowPanel(false)
  }, [currentStepId, userId])

  async function loadJobDocStatus() {
    const supabase = createClient()
    const { data } = await supabase.from('jobs').select('cv_sent, cover_letter_sent, cv_url, cover_letter_url').eq('id', jobId).single()
    if (data) {
      setCvSent(!!(data.cv_sent || data.cv_url))
      setLmSent(!!(data.cover_letter_sent || data.cover_letter_url))
    }
  }

  async function loadStepActions() {
    setLoading(true)
    const supabase = createClient()
    const { data: existing } = await supabase.from('job_step_actions').select('*').eq('job_id', jobId).eq('step_id', currentStepId).order('position')
    if (existing && existing.length > 0) {
      setStepActions(existing.map((r: any) => ({
        id: r.id, title: r.title, icon: r.icon, sub: r.sub,
        position: r.position, is_custom: r.is_custom,
        type: r.is_custom ? 'action' : (r.type ?? 'action'),
        is_done: r.is_done ?? false, deadline_date: r.deadline_date || null,
      })))
    } else {
      const baseData = STEP_ACTIONS[currentStepId] || STEP_ACTIONS['hr_interview']
      const rows = baseData.actions.map((a, i) => ({
        user_id: userId, job_id: jobId, step_id: currentStepId,
        title: a.title, icon: a.icon, sub: a.sub,
        position: (i + 1) * 1000, is_custom: false, type: a.type, is_done: false,
      }))
      const { data: inserted } = await supabase.from('job_step_actions').insert(rows).select()
      if (inserted) setStepActions(inserted.map((r: any) => ({
        id: r.id, title: r.title, icon: r.icon, sub: r.sub,
        position: r.position, is_custom: r.is_custom,
        type: r.type ?? 'action', is_done: r.is_done ?? false, deadline_date: r.deadline_date || null,
      })))
    }
    setLoading(false)
  }

  const handleToggleDone = async (id: string, value: boolean) => {
    setStepActions(prev => prev.map(a => a.id === id ? { ...a, is_done: value } : a))
    const supabase = createClient()
    await supabase.from('job_step_actions').update({ is_done: value }).eq('id', id)
  }

  const handleDeadlineSave = async (id: string, date: string) => {
    setStepActions(prev => prev.map(a => a.id === id ? { ...a, deadline_date: date } : a))
    const supabase = createClient()
    await supabase.from('job_step_actions').update({ deadline_date: date }).eq('id', id)
  }

  const handleAddAction = async () => {
    if (!newActionTitle.trim() || !userId) return
    const supabase = createClient()
    const sorted = [...stepActions].sort((a, b) => a.position - b.position)
    let insertPosition: number
    if (newActionPosition === -1 || newActionPosition >= sorted.length) {
      insertPosition = sorted.length > 0 ? Math.max(...sorted.map(a => a.position)) + 1000 : 1000
    } else {
      const afterCard = sorted[newActionPosition]
      const nextCard = sorted[newActionPosition + 1]
      insertPosition = nextCard ? Math.round((afterCard.position + nextCard.position) / 2) : afterCard.position + 1000
    }
    const { data } = await supabase.from('job_step_actions').insert({
      user_id: userId, job_id: jobId, step_id: currentStepId,
      title: newActionTitle.trim(), icon: newActionIcon, sub: newActionSub.trim(),
      position: insertPosition, is_custom: true, type: 'action', is_done: false,
    }).select().single()
    if (data) setStepActions(prev => [...prev, {
      id: data.id, title: data.title, icon: data.icon, sub: data.sub,
      position: data.position, is_custom: true, type: 'action', is_done: false, deadline_date: null,
    }])
    setNewActionTitle(''); setNewActionSub(''); setNewActionIcon('⭐'); setNewActionPosition(-1)
    setShowPanel(false)
  }

  const handleDeleteAction = async (id: string) => {
    const supabase = createClient()
    await supabase.from('job_step_actions').delete().eq('id', id)
    setStepActions(prev => prev.filter(a => a.id !== id))
    setActionToDelete(null)
  }

  const confirmDeleteAction = async () => {
    if (!actionToDelete) return
    await handleDeleteAction(actionToDelete.id)
  }

  const actionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  async function handleActionDragEnd(event: DragEndEvent) {
    setActiveActionId(null); setOverActionZone(null)
    const { active, over } = event; if (!over) return
    const draggedId = active.id as string; const dropZoneId = over.id as string
    const match = dropZoneId.match(/^action-(before|after)-(.+)$/); if (!match) return
    const [, pos, targetId] = match; if (draggedId === targetId) return
    const sorted = [...stepActions].sort((a, b) => a.position - b.position)
    const dragged = sorted.find(a => a.id === draggedId); if (!dragged) return
    const withoutDragged = sorted.filter(a => a.id !== draggedId)
    const targetIdx = withoutDragged.findIndex(a => a.id === targetId); if (targetIdx === -1) return
    const insertIdx = pos === 'after' ? targetIdx + 1 : targetIdx
    const reordered = [...withoutDragged.slice(0, insertIdx), dragged, ...withoutDragged.slice(insertIdx)]
    const updated = reordered.map((a, i) => ({ ...a, position: (i + 1) * 1000 }))
    setStepActions(updated)
    const supabase = createClient()
    await Promise.all(updated.map(a => supabase.from('job_step_actions').update({ position: a.position }).eq('id', a.id)))
  }

  const activeAction = activeActionId ? stepActions.find(a => a.id === activeActionId) : null
  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box', fontWeight: 500 }
  const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#bbb', marginBottom: 14, display: 'block', fontFamily: FONT }

  return (
    <>
      <div style={{ background: '#FFFDE7', borderRadius: 12, padding: '18px 22px', marginBottom: 14, border: '1.5px solid #F5C400' }}>

        {/* ── En-tête : badge étape + bouton unifié à droite ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ background: '#111', color: '#F5C400', fontSize: 10, fontWeight: 800, padding: '3px 11px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT }}>
              Étape {currentStepIndex + 1} — En cours
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111', fontFamily: FONT }}>{currentStepLabel}</span>
          </div>

          {/* Bouton standard */}
          <button
            onClick={() => { setShowPanel(v => !v); setPanelView('add') }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
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
              fontSize: 13, fontWeight: 900, color: '#111', lineHeight: 1, border: '1.5px solid #111',
            }}>{showPanel ? '×' : '+'}</span>
            Ajouter ou supprimer une action
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#555', marginBottom: 14, lineHeight: 1.6, fontFamily: FONT }}>{stepData.desc}</p>

        {/* ── Cartes actions ── */}
        {loading ? (
          <p style={{ fontSize: 12, color: '#bbb', fontWeight: 600, fontFamily: FONT }}>Chargement des actions…</p>
        ) : (
          <DndContext sensors={actionSensors}
            onDragStart={e => setActiveActionId(e.active.id as string)}
            onDragOver={e => setOverActionZone(e.over?.id as string ?? null)}
            onDragEnd={handleActionDragEnd}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }}>
              {sortedStepActions.map((action) => (
                <div key={action.id} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <ActionDropZone id={`action-before-${action.id}`} isOver={overActionZone === `action-before-${action.id}`} />
                  <div style={{ width: 170, display: 'flex' }}>
                    <DraggableActionCard
                      action={action}
                      dragId={action.id}
                      onDelete={(id, title) => setActionToDelete({ id, title })}
                      onToggleDone={handleToggleDone}
                      onDeadlineSave={handleDeadlineSave}
                    />
                  </div>
                </div>
              ))}
              <ActionDropZone id={`action-after-${sortedStepActions[sortedStepActions.length - 1]?.id ?? 'end'}`} isOver={overActionZone === `action-after-${sortedStepActions[sortedStepActions.length - 1]?.id ?? 'end'}`} />
            </div>
            <DragOverlay>
              {activeAction ? (
                <div style={{ background: '#fff', border: '1.5px solid #F5C400', borderRadius: 10, padding: '12px 14px', boxShadow: '3px 3px 0 #111', cursor: 'grabbing', width: 148 }}>
                  <span style={{ fontSize: 15, display: 'block', marginBottom: 5 }}>{activeAction.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#111', display: 'block', fontFamily: FONT }}>{activeAction.title}</span>
                  <span style={{ fontSize: 11, color: '#888', display: 'block', fontFamily: FONT }}>{activeAction.sub}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* ── Panneau unifié inline ── */}
        {showPanel && (
          <div style={{ marginTop: 16, borderTop: '1.5px solid #F5C400', paddingTop: 16 }}>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['add', 'remove'] as const).map(tab => (
                <button key={tab} onClick={() => setPanelView(tab)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 800, fontFamily: FONT,
                  border: panelView === tab ? '2px solid #111' : '1.5px solid #E5E5E5',
                  background: panelView === tab ? '#111' : '#FFFDE7',
                  color: panelView === tab ? '#F5C400' : '#888',
                  transition: 'all 0.15s',
                }}>
                  {tab === 'add' ? '＋ Ajouter une action' : '🗑 Supprimer une action'}
                </button>
              ))}
            </div>

            {/* Vue : Ajouter */}
            {panelView === 'add' && (
              <div style={{ background: '#fff', border: '1.5px solid #F5C400', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ ...sectionLabel, marginBottom: 6 }}>Icône</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ICON_CHOICES.map(ic => (
                      <button key={ic} onClick={() => setNewActionIcon(ic)} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${newActionIcon === ic ? '#111' : '#eee'}`, background: newActionIcon === ic ? '#FFFDE7' : '#F9F9F7', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ ...sectionLabel, marginBottom: 5 }}>Titre *</label>
                    <input style={inp} placeholder="Ex : Préparer mes questions" value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} autoFocus />
                  </div>
                  <div>
                    <label style={{ ...sectionLabel, marginBottom: 5 }}>Sous-titre</label>
                    <input style={inp} placeholder="Courte description" value={newActionSub} onChange={e => setNewActionSub(e.target.value)} onFocus={e => { e.target.style.borderColor = '#F5C400' }} onBlur={e => { e.target.style.borderColor = '#eee' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ ...sectionLabel, marginBottom: 6 }}>Position</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sortedStepActions.map((a, idx) => {
                      const isSelected = newActionPosition === idx
                      return (
                        <button key={a.id} onClick={() => setNewActionPosition(idx)} style={{ background: isSelected ? '#111' : '#F9F9F7', color: isSelected ? '#F5C400' : '#555', border: `1.5px solid ${isSelected ? '#111' : '#E5E5E5'}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>{a.icon}</span>
                          Après <strong style={{ color: isSelected ? '#F5C400' : '#111' }}>{a.title}</strong>
                        </button>
                      )
                    })}
                    <button onClick={() => setNewActionPosition(-1)} style={{ background: newActionPosition === -1 ? '#111' : '#F9F9F7', color: newActionPosition === -1 ? '#F5C400' : '#555', border: `1.5px solid ${newActionPosition === -1 ? '#111' : '#E5E5E5'}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: 'left' }}>En dernier</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowPanel(false)} style={{ background: '#F9F9F7', color: '#555', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
                  <button onClick={handleAddAction} disabled={!newActionTitle.trim()} style={{ background: newActionTitle.trim() ? '#111' : '#eee', color: newActionTitle.trim() ? '#F5C400' : '#aaa', fontSize: 12, fontWeight: 800, padding: '7px 16px', borderRadius: 8, border: 'none', cursor: newActionTitle.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
                    Ajouter l&apos;action →
                  </button>
                </div>
              </div>
            )}

            {/* Vue : Supprimer */}
            {panelView === 'remove' && (
              <div>
                <p style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 12, fontFamily: FONT }}>
                  Cliquez sur &ldquo;Retirer&rdquo; pour supprimer une action de cette étape.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sortedStepActions.map(action => (
                    <div key={action.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #EBEBEB', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{action.icon}</span>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111', display: 'block', fontFamily: FONT }}>{action.title}</span>
                          <span style={{ fontSize: 11, color: '#888', fontFamily: FONT }}>{action.sub}</span>
                        </div>
                        {action.is_done && <span style={{ fontSize: 10, fontWeight: 700, color: '#2E7D32', background: '#E8F5E9', padding: '2px 7px', borderRadius: 20, fontFamily: FONT }}>fait ✓</span>}
                      </div>
                      <button
                        onClick={() => setActionToDelete({ id: action.id, title: action.title })}
                        style={{ background: '#FEF2F2', color: '#E8151B', border: '1.5px solid #FECACA', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modale confirmation suppression ── */}
      {actionToDelete && (
        <div style={{ background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 400, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', margin: '0 20px' }}>
            <div style={{ fontSize: 26, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 8, textAlign: 'center', fontFamily: FONT }}>Supprimer cette action ?</h3>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>&ldquo;{actionToDelete.title}&rdquo;</p>
            <p style={{ fontSize: 12, color: '#E8151B', marginBottom: 18, textAlign: 'center', fontFamily: FONT }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setActionToDelete(null)} style={{ flex: 1, background: '#F9F9F7', color: '#555', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, border: '1.5px solid #ddd', cursor: 'pointer', fontFamily: FONT }}>Annuler</button>
              <button onClick={confirmDeleteAction} style={{ flex: 1, background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 9, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
