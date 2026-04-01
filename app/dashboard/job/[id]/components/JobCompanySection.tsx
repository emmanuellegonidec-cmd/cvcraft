'use client'

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
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: '#bbb', marginBottom: 14,
    display: 'block', fontFamily: FONT,
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, border: '1.5px solid #EBEBEB' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, padding: 0, marginBottom: expanded ? 14 : 0 }}
      >
        <span style={sectionLabel}>🏢 À propos de {job.company}</span>
        <span style={{ fontSize: 12, color: '#aaa', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', marginBottom: 14 }}>▼</span>
      </button>

      {expanded && (
        <>
          {job.company_description ? (
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 500, margin: '0 0 14px', fontFamily: FONT }}>
              {job.company_description}
            </p>
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
