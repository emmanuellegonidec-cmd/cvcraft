'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface LM {
  ref: string;
  source: 'creator' | 'upload';
  title: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  metadata: {
    template?: string;
    lm_id?: string;
    job_id?: string;
    job_title?: string;
    job_company?: string;
    file_path?: string;
    file_size?: number;
  };
}

const FONT = "'Montserrat', sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #111',
  borderRadius: 6,
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  background: '#fff',
  color: '#111',
  boxSizing: 'border-box',
  outline: 'none',
};

const iconBtnStyle: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid #DDD',
  borderRadius: 6,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function LMsSection({ token }: { token: string }) {
  const [lms, setLms] = useState<LM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renameTarget, setRenameTarget] = useState<LM | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LM | null>(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadLms = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors du chargement');
      }
      const data = await res.json();
      setLms(data.lms || []);
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadLms();
  }, [token, loadLms]);

  function formatDate(d: string) {
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  function displayTitle(lm: LM) {
    return lm.display_name || lm.title || 'Sans titre';
  }

  async function setAsDefault(lm: LM) {
    setError('');
    try {
      const res = await fetch('/api/lms', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ref: lm.ref, is_default: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur');
      }
      await loadLms();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function openRename(lm: LM) {
    setRenameTarget(lm);
    setNewName(lm.display_name || lm.title);
    setError('');
  }

  async function submitRename() {
    if (!renameTarget) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/lms', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ref: renameTarget.ref,
          display_name: newName.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur');
      }
      await loadLms();
      setRenameTarget(null);
      setNewName('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(
        `/api/lms?ref=${encodeURIComponent(deleteTarget.ref)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur');
      }
      await loadLms();
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function downloadLm(lm: LM) {
    setError('');
    try {
      if (lm.source === 'upload' && lm.metadata.file_path) {
        // Générer un signed URL pour télécharger depuis le storage
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('job-documents')
          .createSignedUrl(lm.metadata.file_path, 60);
        if (error) throw new Error(error.message);
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      } else if (lm.source === 'creator' && lm.metadata.lm_id) {
        // LM générée : redirection vers l'éditeur (à venir en session 6b/7)
        // Pour l'instant on signale gentiment qu'il n'est pas encore là
        alert("L'éditeur de LM en ligne arrive bientôt 🚀");
      }
    } catch (e: any) {
      setError(e.message || 'Impossible de télécharger');
    }
  }

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #111',
      borderRadius: 10,
      boxShadow: '3px 3px 0 #111',
      padding: '24px 28px',
      marginBottom: 24,
    }}>
      <div style={{
        fontWeight: 900,
        fontSize: 15,
        color: '#111',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>✉️ Mes lettres de motivation</span>
        {lms.length > 0 && (
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
            {lms.length} LM{lms.length > 1 ? '' : ''}
          </span>
        )}
      </div>

      {/* ─── Notice RGPD permanente ─── */}
      <div style={{
        background: '#FAFAF7',
        border: '1.5px solid #E8E8E0',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 18,
        fontSize: 12,
        color: '#444',
        lineHeight: 1.65,
        fontFamily: FONT,
        fontWeight: 500,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
          <div>
            <strong style={{ color: '#111', fontWeight: 800 }}>Conservation et sécurité de vos documents</strong>
            <div style={{ marginTop: 4 }}>
              Vos lettres de motivation sont stockées de manière sécurisée (base chiffrée AES-256, hébergement en Union Européenne via Supabase) et conservées <strong>2 ans après votre dernière connexion</strong> (délibération CNIL n°2002-017 + Article 5(1)(e) RGPD).
            </div>
            <div style={{ marginTop: 6 }}>
              Vous pouvez supprimer un document à tout moment avec le bouton 🗑️ ci-dessous.{' '}
              <Link href="/confidentialite" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'underline' }}>
                En savoir plus sur la protection de vos données →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FEE',
          border: '1px solid #E8151B',
          borderRadius: 6,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 13,
          color: '#E8151B',
          fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>
          Chargement...
        </div>
      ) : lms.length === 0 ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>
            Aucune lettre de motivation pour le moment
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Uploadez une LM depuis la fiche détail d'une offre, ou générez-en une avec Jean (bientôt disponible)
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lms.map(lm => (
            <div
              key={lm.ref}
              style={{
                border: `2px solid ${lm.is_default ? '#F5C400' : '#eee'}`,
                borderRadius: 8,
                padding: '12px 14px',
                background: lm.is_default ? '#FFFBE6' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* Icône source */}
              <div
                style={{
                  fontSize: 16,
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: lm.source === 'creator' ? '#1B4F72' : '#666',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={lm.source === 'creator' ? 'Générée avec Jean' : 'Uploadée depuis une offre'}
              >
                {lm.source === 'creator' ? '✨' : '📎'}
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#111', fontFamily: FONT }}>
                    {displayTitle(lm)}
                  </span>
                  {lm.is_default && (
                    <span style={{
                      background: '#F5C400',
                      color: '#111',
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: '1px solid #111',
                    }}>
                      ⭐ Par défaut
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#888',
                  fontWeight: 600,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  fontFamily: FONT,
                }}>
                  <span>
                    {lm.source === 'creator' ? '✨ Générée' : '📎 Uploadée'} le {formatDate(lm.created_at)}
                  </span>
                  {lm.source === 'upload' && lm.metadata.job_title && (
                    <span>
                      🔗 {lm.metadata.job_title}
                      {lm.metadata.job_company ? ` — ${lm.metadata.job_company}` : ''}
                    </span>
                  )}
                  {lm.source === 'creator' && lm.metadata.template && (
                    <span>🎨 Template : {lm.metadata.template}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!lm.is_default && (
                  <button
                    onClick={() => setAsDefault(lm)}
                    title="Définir comme LM par défaut"
                    style={iconBtnStyle}
                  >
                    ⭐
                  </button>
                )}
                <button
                  onClick={() => downloadLm(lm)}
                  title={lm.source === 'upload' ? 'Télécharger le PDF' : "Ouvrir dans l'éditeur (bientôt)"}
                  style={iconBtnStyle}
                >
                  {lm.source === 'upload' ? '⬇️' : '✏️'}
                </button>
                <button
                  onClick={() => openRename(lm)}
                  title="Renommer"
                  style={iconBtnStyle}
                >
                  🏷️
                </button>
                <button
                  onClick={() => setDeleteTarget(lm)}
                  title="Supprimer"
                  style={iconBtnStyle}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal renommer */}
      {renameTarget && (
        <div
          onClick={() => !saving && setRenameTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              border: '2px solid #111',
              borderRadius: 12,
              boxShadow: '4px 4px 0 #111',
              padding: 28,
              maxWidth: 440,
              width: '100%',
              fontFamily: FONT,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: '0 0 8px' }}>
              🏷️ Renommer la LM
            </h3>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
              Nom d'origine : <strong>{renameTarget.title}</strong>
            </p>
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 800,
              color: '#111',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}>
              Nouveau nom
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex : LM Directrice Marketing"
              style={inputStyle}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setRenameTarget(null);
              }}
            />
            <p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
              💡 Laissez vide pour revenir au nom d'origine
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRenameTarget(null)}
                disabled={saving}
                style={{
                  background: '#fff',
                  border: '2px solid #111',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                Annuler
              </button>
              <button
                onClick={submitRename}
                disabled={saving}
                style={{
                  background: '#F5C400',
                  border: '2px solid #111',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: saving ? 'wait' : 'pointer',
                  boxShadow: '3px 3px 0 #111',
                  fontFamily: FONT,
                }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal supprimer */}
      {deleteTarget && (
        <div
          onClick={() => !saving && setDeleteTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              border: '2px solid #E8151B',
              borderRadius: 12,
              boxShadow: '4px 4px 0 #E8151B',
              padding: 28,
              maxWidth: 440,
              width: '100%',
              fontFamily: FONT,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#E8151B', margin: '0 0 8px' }}>
                Supprimer cette LM ?
              </h3>
              <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                <strong>{displayTitle(deleteTarget)}</strong>
              </p>
              <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0' }}>
                Cette action est <strong>irréversible</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
                style={{
                  flex: 1,
                  background: '#F9F9F7',
                  border: '1.5px solid #ddd',
                  borderRadius: 8,
                  padding: '10px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                style={{
                  flex: 1,
                  background: '#E8151B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                {saving ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}