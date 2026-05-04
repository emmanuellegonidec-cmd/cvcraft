'use client'

import { useState } from 'react'

const FONT = "'Montserrat', sans-serif"
          

interface Job {
  company: string
  company_description: string | null
  company_website: string | null
  company_size: string | null
  department: string | null
}

interface Props {
  job: Job
  expanded: boolean
  onToggle: () => void
}

export default function JobCompanySection({ job, expanded, onToggle }: Props) {
  const [companyDescExpanded, setCompanyDescExpanded] = useState(false)
  const sectionLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: '#555',
    display: 'block',
    fontFamily: FONT,
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT,
          padding: 0,
          marginBottom: expanded ? 16 : 0,
          color: '#555',
        }}
      >
        <span style={sectionLabel}>À propos de {job.company}</span>
        <span style={{
          fontSize: 12,
          color: '#bbb',
          display: 'inline-block',
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform .2s',
        }}>▼</span>
      </button>

      {expanded && (
        <>
          {job.company_description ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ position: 'relative', maxHeight: companyDescExpanded ? 'none' : 100, overflow: 'hidden' }}>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, margin: 0, fontFamily: FONT, whiteSpace: 'pre-wrap' }}>
                  {job.company_description}
                </p>
                {!companyDescExpanded && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, #fff)' }} />}
              </div>
              <span onClick={() => setCompanyDescExpanded(v => !v)} style={{ fontSize: 13, fontWeight: 700, color: '#111', textDecoration: 'underline', cursor: 'pointer', marginTop: 8, display: 'inline-block', fontFamily: FONT }}>
                {companyDescExpanded ? 'Réduire ↑' : 'Lire la suite →'}
              </span>
            </div>
          
          ) : (
            <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', marginBottom: 14, fontFamily: FONT }}>
              Aucune description — cliquez sur ✏️ Modifier pour en ajouter une.
            </p>
          )}
          {(job.company_size || job.company_website || job.department) && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {job.company_size && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#bbb', marginBottom: 3 }}>Taille</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{job.company_size}</div>
                </div>
              )}
              {job.department && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#bbb', marginBottom: 3 }}>Département</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{job.department}</div>
                </div>
              )}
              {job.company_website && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#bbb', marginBottom: 3 }}>Site web</div>
                  <a
                    href={job.company_website.startsWith('http') ? job.company_website : `https://${job.company_website}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 700, color: '#0A66C2', textDecoration: 'none' }}
                  >
                    {job.company_website} ↗
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
