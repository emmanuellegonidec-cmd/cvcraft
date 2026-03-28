'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  to_apply:    { bg: '#F5F5F0', color: '#888' },
  applied:     { bg: '#E8F0FE', color: '#1A6FDB' },
  in_progress: { bg: '#FFF8E1', color: '#B8900A' },
  offer:       { bg: '#E8F5E9', color: '#1A7A4A' },
  archived:    { bg: '#F5F5F5', color: '#aaa' },
}

const STATUS_LABELS: Record<string, string> = {
  to_apply: 'Envie de postuler', applied: 'Postulé',
  in_progress: 'En cours', offer: 'Offre reçue', archived: 'Archivé',
}

const SUB_STATUS_LABELS: Record<string, string> = {
  to_apply: 'Envie de postuler', applied: 'Postulé',
  phone_interview: 'Entretien tél.', hr_interview: 'Entretien RH',
  manager_interview: 'Entretien manager', offer: 'Offre reçue',
}

interface SidebarJob {
  id: string
  title: string
  company: string
  location: string
  status: string
  sub_status: string
  applied_at: string | null
  created_at: string
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function JobSidebar({
  currentJobId,
  onSelect,
}: {
  currentJobId: string
  onSelect: (id: string) => void
}) {
  const [jobs, setJobs] = useState<SidebarJob[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('jobs')
      .select('id, title, company, location, status, sub_status, applied_at, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setJobs(data) })
  }, [])

  return (
    <div style={{
      width: 280, flexShrink: 0, position: 'sticky', top: 0,
      height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      background: '#fff', borderRight: '1.5px solid #EBEBEB',
      display: 'flex', flexDirection: 'column', fontFamily: FONT,
    }}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '1.5px solid #EBEBEB', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111', letterSpacing: '-0.2px' }}>
            Mes candidatures
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', background: '#F5F5F0', padding: '2px 8px', borderRadius: 20 }}>
            {jobs.length}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {jobs.map(job => {
          const isActive = job.id === currentJobId
          const statusColor = STATUS_COLORS[job.status] ?? STATUS_COLORS['to_apply']
          const stepLabel = job.sub_status
            ? (SUB_STATUS_LABELS[job.sub_status] ?? STATUS_LABELS[job.status])
            : STATUS_LABELS[job.status]
          const dateRef = job.applied_at || job.created_at

          return (
            <div
              key={job.id}
              onClick={() => onSelect(job.id)}
              style={{
                padding: '12px 16px', borderBottom: '1px solid #F5F5F0',
                cursor: 'pointer', background: isActive ? '#111' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseOver={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F9F9F7' }}
              onMouseOut={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 4,
                color: isActive ? '#fff' : '#111',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{job.title}</div>

              <div style={{ fontSize: 12, color: isActive ? '#aaa' : '#666', marginBottom: 7, fontWeight: 500 }}>
                {job.company}{job.location ? ` · ${job.location}` : ''}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: isActive ? '#222' : statusColor.bg,
                  color: isActive ? '#F5C400' : statusColor.color,
                }}>{stepLabel}</span>
                <span style={{ fontSize: 10, color: isActive ? '#666' : '#bbb', fontWeight: 600, flexShrink: 0 }}>
                  {formatDateShort(dateRef)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
