'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import ViewLMModal, { downloadLMAsPDF } from './ViewLMModal'

const FONT = "'Montserrat', sans-serif"

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
interface LinkedLM {
  id: string
  title: string
  content: string
  created_at: string
  form_data: {
    jobId?: string
    tone?: string
    length?: number
    lang?: string
    generatedAt?: string
  }
}

interface Props {
  jobId: string
  userId: string | null
  jobTitle?: string
  jobCompany?: string
}

// ────────────────────────────────────────────────────────────────
// Composant
// ────────────────────────────────────────────────────────────────
export default function LinkedLMsSection({ jobId, userId, jobTitle, jobCompany }: Props) {
  const [lms, setLms] = useState<LinkedLM[]>([])
  const [loading, setLoading] = useState(false)
  const [viewLm, setViewLm] = useState<LinkedLM | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)

  const loadLms = useCallback(async () => {
    if (!userId || !jobId) return
    setLoading(true)
    try {
      const supabase = createClient()
      // On charge les LM générées récentes de l'utilisateur (limite 100 pour la sécurité)
      // et on filtre côté JS sur form_data.jobId — même approche que JobStepActions.loadLmStatus()
      const { data } = await supabase
        .from('lms')
        .select('id, title, content, created_at, form_data')
        .eq('user_id', userId)
        .eq('template', 'generated')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) {
        const filtered = data.filter((row: any) => row?.form_data?.jobId === jobId)
        setLms(filtered)
      }
    } catch (e) {
      console.error('[LinkedLMsSection] loadLms error:', e)
    } finally {
      setLoading(false)
    }
  }, [userId, jobId])

  useEffect(() => {
    loadLms()
  }, [loadLms])

  // Écoute l'événement custom dispatché par GenerateLMModal après génération
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Si l'événement concerne ce job (ou pas de detail), on recharge
      if (!detail || detail.jobId === jobId) {
        loadLms()
      }
    }
    window.addEventListener('jfmj-lm-generated', handler as EventListener)
    return () => window.removeEventListener('jfmj-lm-generated', handler as EventListener)
  }, [jobId, loadLms])

  // Recharge à chaque retour sur l'onglet (au cas où une LM aurait été supprimée ailleurs)
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible') loadLms()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [loadLms])

  async function handleDelete(lmId: string) {
    try {
      // On passe par l'API /api/lms qui fait le delete + nettoyage des
      // références orphelines dans user_profiles (default_lm_ref, lm_display_names).
      // Le ref attendu par l'API pour une LM générée est "creator:{lmId}".
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        alert('Session expirée. Reconnecte-toi.')
        return
      }
      const ref = encodeURIComponent(`creator:${lmId}`)
      const res = await fetch(`/api/lms?ref=${ref}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        let msg = 'Erreur lors de la suppression.'
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
        } catch { /* noop */ }
        alert(msg + ' Réessaye.')
        console.error('[LinkedLMsSection] delete error: status', res.status)
        return
      }
      setLms(prev => prev.filter(lm => lm.id !== lmId))
      setDeleteConfirmId(null)
    } catch (e) {
      console.error('[LinkedLMsSection] delete exception:', e)
      alert('Erreur réseau lors de la suppression.')
    }
  }

  async function handleCopy(lm: LinkedLM) {
    try {
      await navigator.clipboard.writeText(lm.content)
      setCopiedId(lm.id)
      setTimeout(() => setCopiedId(prev => (prev === lm.id ? null : prev)), 2000)
    } catch (e) {
      console.error('clipboard error:', e)
    }
  }

  async function handlePdf(lm: LinkedLM) {
    setPdfLoadingId(lm.id)
    try {
      const fileName = `LM-${jobCompany || 'sans-entreprise'}-${jobTitle || 'sans-titre'}`
      await downloadLMAsPDF(lm.content, fileName)
    } catch (e) {
      console.error('PDF error:', e)
      alert("Erreur lors de la génération du PDF. Réessaye.")
    } finally {
      setPdfLoadingId(null)
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
      })
    } catch {
      return ''
    }
  }

  // Si on est en chargement initial OU s'il n'y a aucune LM, on n'affiche rien
  // (cohérent avec ta demande "si rien généré, le bloc n'apparaît pas")
  if (loading && lms.length === 0) return null
  if (!loading && lms.length === 0) return null

  return (
    <>
      <div style={{
        marginTop: 14,
        paddingTop: 14,
        borderTop: '1px dashed #E5E5E5',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: '#555',
            fontFamily: FONT,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ fontSize: 13 }}>✨</span> LM générées par Jean
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#888',
            background: '#F5F5F0',
            padding: '2px 8px',
            borderRadius: 20,
            fontFamily: FONT,
          }}>{lms.length}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lms.map(lm => {
            const isPdfLoading = pdfLoadingId === lm.id
            const isCopied = copiedId === lm.id
            const generatedAt = lm.form_data?.generatedAt || lm.created_at
            const params = [
              lm.form_data?.tone,
              lm.form_data?.length ? `${lm.form_data.length} mots` : null,
              lm.form_data?.lang,
            ].filter(Boolean).join(' · ')

            return (
              <div key={lm.id} style={{
                background: '#FAFAFA',
                border: '1.5px solid #EBEBEB',
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#111',
                      margin: '0 0 2px 0',
                      fontFamily: FONT,
                    }}>
                      Générée le {formatDate(generatedAt)}
                    </p>
                    {params && (
                      <p style={{
                        fontSize: 11,
                        color: '#888',
                        margin: 0,
                        fontFamily: FONT,
                        fontWeight: 500,
                      }}>{params}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setViewLm(lm)}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1.5px solid #111',
                      background: '#fff',
                      color: '#111',
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >👁️ Voir</button>

                  <button
                    onClick={() => handleCopy(lm)}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1.5px solid #EBEBEB',
                      background: isCopied ? '#2E7D32' : '#fff',
                      color: isCopied ? '#fff' : '#555',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      transition: 'all 0.15s',
                    }}
                  >{isCopied ? '✓ Copié' : '📋 Copier'}</button>

                  <button
                    onClick={() => handlePdf(lm)}
                    disabled={isPdfLoading}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1.5px solid #EBEBEB',
                      background: '#fff',
                      color: '#555',
                      cursor: isPdfLoading ? 'wait' : 'pointer',
                      fontFamily: FONT,
                      opacity: isPdfLoading ? 0.7 : 1,
                    }}
                  >{isPdfLoading ? '⏳ PDF…' : '⬇️ PDF'}</button>

                  <button
                    onClick={() => setDeleteConfirmId(lm.id)}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1.5px solid #FECACA',
                      background: 'transparent',
                      color: '#E8151B',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      marginLeft: 'auto',
                    }}
                  >🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modale de visualisation */}
      {viewLm && (
        <ViewLMModal
          isOpen={true}
          onClose={() => setViewLm(null)}
          lmTitle={viewLm.title || `LM - ${jobTitle || ''} — ${jobCompany || ''}`}
          lmContent={viewLm.content}
          metadata={{
            tone: viewLm.form_data?.tone,
            length: viewLm.form_data?.length,
            lang: viewLm.form_data?.lang,
            generatedAt: viewLm.form_data?.generatedAt || viewLm.created_at,
          }}
        />
      )}

      {/* Modale confirmation suppression */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: 20,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 26,
            width: '100%',
            maxWidth: 400,
            border: '2px solid #111',
            boxShadow: '4px 4px 0 #E8151B',
            fontFamily: FONT,
          }}>
            <div style={{ fontSize: 26, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
            <h3 style={{
              fontSize: 16, fontWeight: 900, color: '#111',
              marginBottom: 8, textAlign: 'center', margin: '0 0 8px',
            }}>
              Supprimer cette LM ?
            </h3>
            <p style={{
              fontSize: 12, color: '#E8151B',
              marginBottom: 18, textAlign: 'center', margin: '0 0 18px',
            }}>
              Cette action est définitive et supprimera la LM aussi de ta bibliothèque générale.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1,
                  background: '#F9F9F7',
                  color: '#555',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '10px 0',
                  borderRadius: 9,
                  border: '1.5px solid #ddd',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >Annuler</button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  flex: 1,
                  background: '#E8151B',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 800,
                  padding: '10px 0',
                  borderRadius: 9,
                  border: '2px solid #E8151B',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  boxShadow: '2px 2px 0 #111',
                }}
              >Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
