'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

interface CV {
  ref: string;
  source: 'creator' | 'upload';
  title: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  metadata: {
    template?: string;
    cv_id?: string;
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

export default function CVsSection({ token }: { token: string }) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renameTarget, setRenameTarget] = useState<CV | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CV | null>(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCvs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cvs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors du chargement');
      }
      const data = await res.json();
      setCvs(data.cvs || []);
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadCvs();
  }, [token, loadCvs]);

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

  function displayTitle(cv: CV) {
    return cv.display_name || cv.title || 'Sans titre';
  }

  async function setAsDefault(cv: CV) {
    setError('');
    try {
      const res = await fetch('/api/cvs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ref: cv.ref, is_default: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur');
      }
      await loadCvs();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function openRename(cv: CV) {
    setRenameTarget(cv);
    setNewName(cv.display_name || cv.title);
    setError('');
  }

  async function submitRename() {
    if (!renameTarget) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/cvs', {
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
      await loadCvs();
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
        `/api/cvs?ref=${encodeURIComponent(deleteTarget.ref)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur');
      }
      await loadCvs();
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function downloadCv(cv: CV) {
    setError('');
    try {
      if (cv.source === 'upload' && cv.metadata.file_path) {
        // Générer un signed URL pour télécharger depuis le storage
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('job-documents')
          .createSignedUrl(cv.metadata.file_path, 60);
        if (error) throw new Error(error.message);
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      } else if (cv.source === 'creator' && cv.metadata.cv_id) {
        // CV Creator : redirection vers l'éditeur
        window.location.href = `/dashboard/editor?cv=${cv.metadata.cv_id}`;
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
        <span>📄 Mes CV</span>
        {cvs.length > 0 && (
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
            {cvs.length} CV{cvs.length > 1 ? 's' : ''}
          </span>
        )}
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
      ) : cvs.length === 0 ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>
            Aucun CV pour le moment
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Uploadez un CV depuis la fiche détail d'une offre, ou créez-en un avec le CV Creator
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cvs.map(cv => (
            <div
              key={cv.ref}
              style={{
                border: `2px solid ${cv.is_default ? '#F5C400' : '#eee'}`,
                borderRadius: 8,
                padding: '12px 14px',
                background: cv.is_default ? '#FFFBE6' : '#fff',
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
                  background: cv.source === 'creator' ? '#1B4F72' : '#666',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={cv.source === 'creator' ? 'Créé avec CV Creator' : 'Uploadé depuis une offre'}
              >
                {cv.source === 'creator' ? '✨' : '📎'}
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#111', fontFamily: FONT }}>
                    {displayTitle(cv)}
                  </span>
                  {cv.is_default && (
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
                    {cv.source === 'creator' ? '✨ Créé' : '📎 Uploadé'} le {formatDate(cv.created_at)}
                  </span>
                  {cv.source === 'upload' && cv.metadata.job_title && (
                    <span>
                      🔗 {cv.metadata.job_title}
                      {cv.metadata.job_company ? ` — ${cv.metadata.job_company}` : ''}
                    </span>
                  )}
                  {cv.source === 'creator' && cv.metadata.template && (
                    <span>🎨 Template : {cv.metadata.template}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!cv.is_default && (
                  <button
                    onClick={() => setAsDefault(cv)}
                    title="Définir comme CV par défaut"
                    style={iconBtnStyle}
                  >
                    ⭐
                  </button>
                )}
                <button
                  onClick={() => downloadCv(cv)}
                  title={cv.source === 'upload' ? 'Télécharger le PDF' : "Ouvrir dans l'éditeur"}
                  style={iconBtnStyle}
                >
                  {cv.source === 'upload' ? '⬇️' : '✏️'}
                </button>
                <button
                  onClick={() => openRename(cv)}
                  title="Renommer"
                  style={iconBtnStyle}
                >
                  🏷️
                </button>
                <button
                  onClick={() => setDeleteTarget(cv)}
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
              🏷️ Renommer le CV
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
              placeholder="Ex : CV Directrice Marketing"
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
                Supprimer ce CV ?
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
