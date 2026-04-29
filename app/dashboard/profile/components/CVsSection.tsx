'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface CV {
  ref: string;
  source: 'creator' | 'upload';
  title: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  is_reference: boolean;
  is_favorite: boolean;
  metadata: {
    template?: string;
    cv_id?: string;
    job_id?: string;
    job_title?: string;
    job_company?: string;
    file_path?: string;
    file_size?: number;
    is_reference_folder?: boolean;
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

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 15,
  color: '#111',
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '1px solid #eee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: FONT,
};

export default function CVsSection({ token }: { token: string }) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renameTarget, setRenameTarget] = useState<CV | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CV | null>(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload CV référent
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ─── Toggle favori ───
  async function toggleFavorite(cv: CV) {
    setError('');
    try {
      const res = await fetch('/api/cvs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ref: cv.ref, is_favorite: !cv.is_favorite }),
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

  // ─── Toggle is_reference (promouvoir un CV candidature en référent ou inverse) ───
  async function toggleReference(cv: CV) {
    setError('');
    try {
      const res = await fetch('/api/cvs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ref: cv.ref, is_reference: !cv.is_reference }),
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
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('job-documents')
          .createSignedUrl(cv.metadata.file_path, 60);
        if (error) throw new Error(error.message);
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      } else if (cv.source === 'creator' && cv.metadata.cv_id) {
        window.location.href = `/dashboard/editor?cv=${cv.metadata.cv_id}`;
      }
    } catch (e: any) {
      setError(e.message || 'Impossible de télécharger');
    }
  }

  // ─── Upload CV référent ───
  function openUploadModal() {
    setUploadName('');
    setUploadFile(null);
    setError('');
    setShowUploadModal(true);
  }

  function closeUploadModal() {
    if (uploading) return;
    setShowUploadModal(false);
    setUploadName('');
    setUploadFile(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadFile(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés');
      setUploadFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (5 Mo max)');
      setUploadFile(null);
      return;
    }
    setError('');
    setUploadFile(file);
  }

  async function submitUpload() {
    if (!uploadName.trim()) {
      setError('Le nom du CV est obligatoire');
      return;
    }
    if (!uploadFile) {
      setError('Sélectionne un fichier PDF');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('display_name', uploadName.trim());

      const res = await fetch('/api/cvs/upload-reference', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur upload');
      }

      await loadCvs();
      closeUploadModal();
    } catch (e: any) {
      setError(e.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }

  // ─── Séparation des CV en 2 listes ───
  const referenceCvs = cvs.filter(cv => cv.is_reference);
  const candidacyCvs = cvs.filter(cv => !cv.is_reference);

  // ─── Rendu d'une carte CV (réutilisable) ───
  function renderCvCard(cv: CV, options: { showFavoriteStar?: boolean; showPromoteToReference?: boolean }) {
    const { showFavoriteStar, showPromoteToReference } = options;
    return (
      <div
        key={cv.ref}
        style={{
          border: `2px solid ${cv.is_favorite ? '#F5C400' : '#eee'}`,
          borderRadius: 8,
          padding: '12px 14px',
          background: cv.is_favorite ? '#FFFBE6' : '#fff',
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
          title={cv.source === 'creator' ? 'Créé avec CV Creator' : 'Uploadé'}
        >
          {cv.source === 'creator' ? '✨' : '📎'}
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#111', fontFamily: FONT }}>
              {displayTitle(cv)}
            </span>
            {cv.is_favorite && (
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
                ⭐ Favori
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
            {cv.source === 'upload' && cv.metadata.job_title && !cv.metadata.is_reference_folder && (
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
          {showFavoriteStar && (
            <button
              onClick={() => toggleFavorite(cv)}
              title={cv.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              style={{
                ...iconBtnStyle,
                background: cv.is_favorite ? '#F5C400' : '#fff',
                border: cv.is_favorite ? '1.5px solid #111' : '1.5px solid #DDD',
              }}
            >
              ⭐
            </button>
          )}
          {showPromoteToReference && (
            <button
              onClick={() => toggleReference(cv)}
              title="Promouvoir comme CV référent"
              style={iconBtnStyle}
            >
              📌
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
    );
  }

  return (
    <>
      {/* ─── SECTION HAUT : CV RÉFÉRENTS ─── */}
      <div style={{
        background: '#fff',
        border: '2px solid #111',
        borderRadius: 10,
        boxShadow: '3px 3px 0 #111',
        padding: '24px 28px',
        marginBottom: 24,
      }}>
        <div style={sectionTitleStyle}>
          <span>📌 CV référents</span>
          <button
            onClick={openUploadModal}
            style={{
              background: '#F5C400',
              border: '2px solid #111',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '2px 2px 0 #111',
              fontFamily: FONT,
              color: '#111',
            }}
          >
            + Ajouter un CV référent
          </button>
        </div>

        <div style={{
          background: '#FFFBE6',
          border: '1.5px solid #F5C400',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: '#444',
          lineHeight: 1.55,
          fontFamily: FONT,
          fontWeight: 500,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
            <div>
              Les CV référents sont tes CV de base, indépendants d'une candidature. Tu peux en avoir plusieurs (par ex. CV Marketing, CV Management) et marquer tes préférés ⭐ pour qu'ils remontent en haut dans l'extension Chrome.
            </div>
          </div>
        </div>

        {error && !showUploadModal && (
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
        ) : referenceCvs.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📌</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
              Aucun CV référent pour l'instant
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Clique sur "+ Ajouter un CV référent" pour commencer
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {referenceCvs.map(cv => renderCvCard(cv, { showFavoriteStar: true }))}
          </div>
        )}
      </div>

      {/* ─── SECTION BAS : CV DES CANDIDATURES ─── */}
      <div style={{
        background: '#fff',
        border: '2px solid #111',
        borderRadius: 10,
        boxShadow: '3px 3px 0 #111',
        padding: '24px 28px',
        marginBottom: 24,
      }}>
        <div style={sectionTitleStyle}>
          <span>📂 CV des candidatures</span>
          {candidacyCvs.length > 0 && (
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
              {candidacyCvs.length} CV{candidacyCvs.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Notice RGPD permanente */}
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
                Vos CV et lettres de motivation sont stockés de manière sécurisée (base chiffrée AES-256, hébergement en Union Européenne via Supabase) et conservés <strong>2 ans après votre dernière connexion</strong> (délibération CNIL n°2002-017 + Article 5(1)(e) RGPD).
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

        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>
            Chargement...
          </div>
        ) : candidacyCvs.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>
              Aucun CV de candidature
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Les CV uploadés depuis tes candidatures apparaîtront ici
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {candidacyCvs.map(cv => renderCvCard(cv, { showPromoteToReference: true }))}
          </div>
        )}
      </div>

      {/* ─── MODAL UPLOAD CV RÉFÉRENT ─── */}
      {showUploadModal && (
        <div
          onClick={() => !uploading && closeUploadModal()}
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
              maxWidth: 480,
              width: '100%',
              fontFamily: FONT,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: '0 0 8px' }}>
              📌 Ajouter un CV référent
            </h3>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 20px', lineHeight: 1.55 }}>
              Upload ton CV de base — il pourra être réutilisé pour analyser n'importe quelle offre depuis l'extension Chrome.
            </p>

            {/* Champ nom */}
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 800,
              color: '#111',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}>
              Nom du CV <span style={{ color: '#E8151B' }}>*</span>
            </label>
            <input
              type="text"
              value={uploadName}
              onChange={e => setUploadName(e.target.value)}
              placeholder="Ex : CV Marketing Senior 2026"
              maxLength={100}
              style={inputStyle}
              disabled={uploading}
              autoFocus
            />
            <p style={{ fontSize: 11, color: '#888', marginTop: 4, marginBottom: 18 }}>
              Donne-lui un nom clair pour le retrouver facilement
            </p>

            {/* Sélecteur fichier */}
            <label style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 800,
              color: '#111',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}>
              Fichier PDF <span style={{ color: '#E8151B' }}>*</span>
            </label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{
                border: '2px dashed #ccc',
                borderRadius: 8,
                padding: '20px 16px',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: uploadFile ? '#F0FAF0' : '#FAFAF7',
                transition: 'all 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              {uploadFile ? (
                <>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
                    {uploadFile.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                    {(uploadFile.size / 1024).toFixed(0)} Ko • Cliquer pour changer
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
                    Cliquer pour sélectionner un PDF
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                    Max 5 Mo • PDF uniquement
                  </div>
                </>
              )}
            </div>

            {error && (
              <div style={{
                background: '#FEE',
                border: '1px solid #E8151B',
                borderRadius: 6,
                padding: '8px 12px',
                marginTop: 14,
                fontSize: 13,
                color: '#E8151B',
                fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={closeUploadModal}
                disabled={uploading}
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
                onClick={submitUpload}
                disabled={uploading || !uploadName.trim() || !uploadFile}
                style={{
                  background: uploading || !uploadName.trim() || !uploadFile ? '#ddd' : '#F5C400',
                  border: '2px solid #111',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: uploading ? 'wait' : (!uploadName.trim() || !uploadFile ? 'not-allowed' : 'pointer'),
                  boxShadow: '3px 3px 0 #111',
                  fontFamily: FONT,
                }}
              >
                {uploading ? 'Upload en cours...' : 'Uploader'}
              </button>
            </div>
          </div>
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
    </>
  );
}
