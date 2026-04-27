'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const FONT = "'Montserrat', sans-serif"

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
type Tone = 'chaleureux' | 'sobre' | 'percutant'
type Length = 250 | 300 | 400
type Lang = 'FR' | 'EN'
type ViewState = 'form' | 'loading' | 'result' | 'error'

interface CvOption {
  ref: string
  source: 'creator' | 'upload'
  display_name: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  jobCompany: string
  /**
   * Callback appelé après génération réussie + sauvegarde.
   * Permet au parent de rafraîchir la liste si besoin.
   */
  onGenerated?: (lm: { lm_id: string; title: string; content: string }) => void
}

// ────────────────────────────────────────────────────────────────
// Composant
// ────────────────────────────────────────────────────────────────
export default function GenerateLMModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  jobCompany,
  onGenerated,
}: Props) {
  // Form state
  const [tone, setTone] = useState<Tone>('sobre')
  const [length, setLength] = useState<Length>(300)
  const [lang, setLang] = useState<Lang>('FR')

  // CV state
  const [cvOptions, setCvOptions] = useState<CvOption[]>([])
  const [defaultCvRef, setDefaultCvRef] = useState<string | null>(null)
  const [selectedCvRef, setSelectedCvRef] = useState<string>('') // '' = auto/pas de CV
  const [cvLoading, setCvLoading] = useState(false)

  // Process state
  const [view, setView] = useState<ViewState>('form')
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [generatedLmId, setGeneratedLmId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // ────────────────────────────────────────────────────────────────
  // Charger les CV disponibles à l'ouverture
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    // Reset à chaque ouverture
    setView('form')
    setGeneratedContent('')
    setGeneratedLmId(null)
    setErrorMsg('')
    setCopied(false)
    loadCvs()
  }, [isOpen])

  async function loadCvs() {
    setCvLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setCvLoading(false)
        return
      }

      // 1) Charger la liste des CV
      const cvRes = await fetch('/api/cvs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (cvRes.ok) {
        const cvData = await cvRes.json()
        const items: CvOption[] = (cvData?.items || []).map((it: any) => ({
          ref: it.ref,
          source: it.source,
          display_name: it.display_name || it.title || 'Sans titre',
        }))
        setCvOptions(items)
      }

      // 2) Charger le profil pour avoir le default_cv_ref
      const profRes = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (profRes.ok) {
        const profData = await profRes.json()
        const ref = profData?.profile?.default_cv_ref || null
        setDefaultCvRef(ref)
        // Pré-sélection : si défaut, on le met. Sinon : ''
        setSelectedCvRef(ref || '')
      }
    } catch (e) {
      // En cas d'erreur, on continue sans CV (l'API gère le fallback)
      console.error('[GenerateLMModal] loadCvs error:', e)
    } finally {
      setCvLoading(false)
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Génération
  // ────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    setView('loading')
    setErrorMsg('')

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setErrorMsg('Session expirée. Reconnecte-toi.')
        setView('error')
        return
      }

      const body: any = { jobId, tone, length, lang }
      // cvRef explicite uniquement si l'user a choisi quelque chose de différent du défaut
      // (sinon l'API utilisera le default_cv_ref du profil)
      if (selectedCvRef === 'none') {
        // Cas spécial : l'utilisateur a explicitement choisi "pas de CV"
        // On envoie cvRef vide pour que l'API ne fallback PAS sur le default
        body.cvRef = ''
      } else if (selectedCvRef && selectedCvRef !== defaultCvRef) {
        body.cvRef = selectedCvRef
      }
      // sinon : pas de cvRef dans le body → l'API utilisera default_cv_ref

      const res = await fetch('/api/generate-lm', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const rawText = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(rawText)
      } catch {
        setErrorMsg(`Erreur serveur (${res.status})`)
        setView('error')
        return
      }

      if (!res.ok) {
        setErrorMsg(data?.error || `Erreur serveur (${res.status})`)
        setView('error')
        return
      }

      if (!data?.content) {
        setErrorMsg('La génération a retourné un résultat vide.')
        setView('error')
        return
      }

      setGeneratedContent(data.content)
      setGeneratedLmId(data.lm_id)
      setView('result')
      if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent('jfmj-lm-generated', { detail: { jobId } }))
       }
      onGenerated?.({
        lm_id: data.lm_id,
        title: data.title,
        content: data.content,
      })
    } catch (e: any) {
      console.error('[GenerateLMModal] generate error:', e)
      setErrorMsg(e?.message || 'Erreur réseau pendant la génération.')
      setView('error')
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // Fallback : selectionner le textarea (peu probable que ça arrive)
      console.error('clipboard error:', e)
    }
  }

  function handleRegenerate() {
    handleGenerate()
  }

  function handleClose() {
    onClose()
  }

  if (!isOpen) return null

  // ────────────────────────────────────────────────────────────────
  // Styles partagés
  // ────────────────────────────────────────────────────────────────
  const overlay: React.CSSProperties = {
    background: 'rgba(0,0,0,0.6)',
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  }

  const modalBase: React.CSSProperties = {
    background: '#fff',
    borderRadius: 14,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '2px solid #111',
    boxShadow: '4px 4px 0 #111',
    fontFamily: FONT,
    display: 'flex',
    flexDirection: 'column',
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    color: '#888',
    marginBottom: 8,
    display: 'block',
  }

  const optionBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '9px 10px',
    border: active ? '2px solid #111' : '1.5px solid #E5E5E5',
    background: active ? '#111' : '#fff',
    color: active ? '#F5C400' : '#555',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: FONT,
    transition: 'all 0.15s',
  })

  // Détermine si on a au moins un CV pour afficher la section "CV de référence"
  const hasCvOptions = cvOptions.length > 0
  const defaultCvDisplay = defaultCvRef
    ? cvOptions.find(c => c.ref === defaultCvRef)?.display_name || null
    : null

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────
  return (
    <div style={overlay} onClick={handleClose}>
      <div style={modalBase} onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div style={{
          padding: '20px 24px 14px',
          borderBottom: '1.5px solid #F0F0F0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>✉️</span>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#111', margin: 0, fontFamily: FONT }}>
                Rédiger une lettre de motivation
              </h2>
            </div>
            {jobTitle && (
              <p style={{ fontSize: 12, color: '#888', margin: 0, fontFamily: FONT }}>
                {jobTitle}{jobCompany ? ` · ${jobCompany}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            style={{
              background: '#f0f0f0',
              border: '1.5px solid #ddd',
              color: '#555',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
              padding: '2px 9px',
              lineHeight: '20px',
              borderRadius: 6,
              flexShrink: 0,
              fontFamily: FONT,
            }}
          >×</button>
        </div>

        {/* ── BODY : FORM ── */}
        {view === 'form' && (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Ton */}
            <div>
              <label style={sectionLabel}>Ton de la lettre</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['chaleureux', 'sobre', 'percutant'] as Tone[]).map(t => (
                  <button key={t} onClick={() => setTone(t)} style={optionBtn(tone === t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#999', marginTop: 6, fontFamily: FONT, lineHeight: 1.5 }}>
                {tone === 'chaleureux' && 'Humain et accessible, première personne assumée.'}
                {tone === 'sobre' && 'Professionnel et factuel, distance respectueuse.'}
                {tone === 'percutant' && 'Direct et dense, orienté résultats, phrases courtes.'}
              </p>
            </div>

            {/* Longueur */}
            <div>
              <label style={sectionLabel}>Longueur cible</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([250, 300, 400] as Length[]).map(l => (
                  <button key={l} onClick={() => setLength(l)} style={optionBtn(length === l)}>
                    {l} mots
                  </button>
                ))}
              </div>
            </div>

            {/* Langue */}
            <div>
              <label style={sectionLabel}>Langue</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['FR', 'EN'] as Lang[]).map(la => (
                  <button key={la} onClick={() => setLang(la)} style={optionBtn(lang === la)}>
                    {la === 'FR' ? '🇫🇷 Français' : '🇬🇧 Anglais'}
                  </button>
                ))}
              </div>
            </div>

            {/* CV de référence */}
            <div>
              <label style={sectionLabel}>CV de référence (facultatif mais recommandé)</label>
              {cvLoading ? (
                <p style={{ fontSize: 12, color: '#bbb', fontFamily: FONT }}>Chargement…</p>
              ) : !hasCvOptions ? (
                <div style={{
                  background: '#FFFDE7',
                  border: '1.5px solid #F5C400',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#777',
                  fontFamily: FONT,
                  lineHeight: 1.5,
                }}>
                  Tu n'as pas encore de CV en bibliothèque. La LM sera générée à partir de ton profil uniquement (résumé, compétences, poste actuel). Pour une qualité maximale, ajoute un CV depuis une fiche offre ou via le CV Creator.
                </div>
              ) : (
                <>
                  {defaultCvDisplay && (
                    <div style={{
                      background: '#F1F8E9',
                      border: '1.5px solid #C8E6C9',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 11,
                      color: '#2E7D32',
                      fontFamily: FONT,
                      marginBottom: 8,
                      fontWeight: 700,
                    }}>
                      ⭐ CV par défaut sélectionné automatiquement
                    </div>
                  )}
                  <select
                    value={selectedCvRef}
                    onChange={e => setSelectedCvRef(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1.5px solid #E5E5E5',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: FONT,
                      fontWeight: 600,
                      color: '#111',
                      background: '#fff',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {cvOptions.map(cv => (
                      <option key={cv.ref} value={cv.ref}>
                        {cv.source === 'creator' ? '✨ ' : '📎 '}
                        {cv.display_name}
                        {cv.ref === defaultCvRef ? ' (par défaut)' : ''}
                      </option>
                    ))}
                    <option value="none">— Pas de CV (profil seul) —</option>
                  </select>
                </>
              )}
            </div>

            {/* Bouton Générer */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                onClick={handleClose}
                style={{
                  background: '#F9F9F7',
                  color: '#555',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1.5px solid #ddd',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >Annuler</button>
              <button
                onClick={handleGenerate}
                style={{
                  background: '#F5C400',
                  color: '#111',
                  fontSize: 13,
                  fontWeight: 900,
                  padding: '10px 22px',
                  borderRadius: 8,
                  border: '2px solid #111',
                  boxShadow: '3px 3px 0 #111',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >Générer la LM →</button>
            </div>
          </div>
        )}

        {/* ── BODY : LOADING ── */}
        {view === 'loading' && (
          <div style={{
            padding: '50px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '4px solid #F5C400',
              borderTopColor: '#111',
              animation: 'lm-spin 0.9s linear infinite',
            }} />
            <p style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: 0, fontFamily: FONT, textAlign: 'center' }}>
              Jean rédige ta lettre de motivation…
            </p>
            <p style={{ fontSize: 12, color: '#888', margin: 0, fontFamily: FONT, textAlign: 'center', maxWidth: 380, lineHeight: 1.5 }}>
              Analyse de l'offre, identification des besoins, sélection des preuves chiffrées dans ton parcours, rédaction. Cela prend généralement 15 à 30 secondes.
            </p>
            <style>{`@keyframes lm-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── BODY : RESULT ── */}
        {view === 'result' && (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: '#F1F8E9',
              border: '1.5px solid #C8E6C9',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: '#2E7D32',
              fontFamily: FONT,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>✓</span>
              LM générée et sauvegardée dans ta bibliothèque (Mon profil → Mes lettres de motivation)
            </div>

            <textarea
              value={generatedContent}
              onChange={e => setGeneratedContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: 320,
                padding: '14px 16px',
                border: '1.5px solid #E5E5E5',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: FONT,
                lineHeight: 1.7,
                color: '#222',
                background: '#FAFAFA',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#F5C400' }}
              onBlur={e => { e.target.style.borderColor = '#E5E5E5' }}
            />

            <p style={{ fontSize: 11, color: '#999', margin: 0, fontFamily: FONT, lineHeight: 1.5 }}>
              💡 Tu peux modifier le texte directement ici, mais les changements ne sont pas sauvegardés automatiquement. Copie le texte final pour l'utiliser ailleurs.
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={handleRegenerate}
                style={{
                  background: '#fff',
                  color: '#111',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1.5px solid #111',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >🔄 Régénérer</button>
              <button
                onClick={handleClose}
                style={{
                  background: '#F9F9F7',
                  color: '#555',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1.5px solid #ddd',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >Fermer</button>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? '#2E7D32' : '#F5C400',
                  color: copied ? '#fff' : '#111',
                  fontSize: 12,
                  fontWeight: 900,
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '2px solid #111',
                  boxShadow: copied ? '2px 2px 0 #111' : '3px 3px 0 #111',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'all 0.15s',
                }}
              >{copied ? '✓ Copié !' : '📋 Copier le texte'}</button>
            </div>
          </div>
        )}

        {/* ── BODY : ERROR ── */}
        {view === 'error' && (
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#E8151B', margin: 0, fontFamily: FONT, textAlign: 'center' }}>
              Une erreur est survenue
            </p>
            <p style={{ fontSize: 12, color: '#666', margin: 0, fontFamily: FONT, textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>
              {errorMsg || 'Erreur inconnue. Réessaie dans quelques secondes.'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setView('form')}
                style={{
                  background: '#fff',
                  color: '#111',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1.5px solid #111',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >← Retour au formulaire</button>
              <button
                onClick={handleClose}
                style={{
                  background: '#F9F9F7',
                  color: '#555',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1.5px solid #ddd',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
