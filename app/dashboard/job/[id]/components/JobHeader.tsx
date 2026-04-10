'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Job {
  title: string
  company: string
  location: string
  job_type: string
  source_url: string
  salary_text: string | null
  salary_min: number | null
  salary_max: number | null
  created_at: string
}

interface Props {
  job: Job
  jobId: string
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onGenerateCV: () => void
}

export default function JobHeader({ job, onBack, onEdit, onDelete, onGenerateCV }: Props) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data.user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID)
    })
  }, [])

  const salaryDisplay = job.salary_text
    ? job.salary_text
    : job.salary_min && job.salary_max
      ? `${job.salary_min.toLocaleString('fr-FR')} € — ${job.salary_max.toLocaleString('fr-FR')} €`
      : job.salary_min ? `À partir de ${job.salary_min.toLocaleString('fr-FR')} €`
      : job.salary_max ? `Jusqu'à ${job.salary_max.toLocaleString('fr-FR')} €`
      : null

  return (
    <div style={{ background: '#111', borderRadius: 12, padding: '22px 26px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, border: '2px solid #111', boxShadow: '3px 3px 0 #E8151B', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontFamily: FONT }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#F5C400', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, fontSize: 12, padding: 0 }}>
            ← Mes candidatures
          </button>
          {' / '}<span style={{ color: '#555' }}>{job.company}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12, fontFamily: FONT }}>{job.title}</h1>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: salaryDisplay ? 14 : 0 }}>
          <span style={{ background: '#F5C400', color: '#111', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontFamily: FONT }}>{job.job_type || 'CDI'}</span>
          {job.location && <span style={{ background: '#222', color: '#bbb', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>{job.location}</span>}
          <span style={{ background: '#222', color: '#bbb', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>{formatDate(job.created_at)}</span>
        </div>
        {salaryDisplay && (
          <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: 4, fontFamily: FONT }}>Salaire</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#F5C400', fontFamily: FONT }}>{salaryDisplay}</span>
              <span style={{ background: '#1a1a1a', color: '#888', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #333', fontFamily: FONT }}>Brut / an</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {job.source_url && (
          <button onClick={() => window.open(job.source_url, '_blank')}
            style={{ background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 9, border: '2px solid #E8151B', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #fff', whiteSpace: 'nowrap' }}>
            Voir l&apos;offre ↗
          </button>
        )}
        {isAdmin && (
          <button onClick={onGenerateCV}
            style={{ background: '#F5C400', color: '#111', fontSize: 13, fontWeight: 800, padding: '10px 18px', borderRadius: 9, border: '2px solid #111', cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111', whiteSpace: 'nowrap' }}>
            Générer un CV
          </button>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-edit" onClick={onEdit}>✏️ Modifier</button>
          <button className="btn-delete" onClick={onDelete}>🗑️ Supprimer</button>
        </div>
      </div>
    </div>
  )
}