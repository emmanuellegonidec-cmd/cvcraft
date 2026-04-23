'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { pdf } from '@react-pdf/renderer';
import { CVPdf } from '@/lib/pdf-generator';

const FONT = "'Montserrat', sans-serif";

const TEMPLATE_LABELS: Record<string, string> = {
  classic: 'Classique', modern: 'Moderne', minimal: 'Minimaliste',
  elegant: 'Élégant', creative: 'Créatif', executive: 'Executive',
};

interface CVItem {
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
    [key: string]: any;
  };
}

type BusyAction = 'preview' | 'download' | 'delete' | null;

export default function CVCreatorPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CVItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [confirmRef, setConfirmRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth/login'); return; }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) (window as any).__jfmj_token = session.access_token;

        const res = await fetch('/api/cvs', {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const rawText = await res.text();
        let json: any = null;
        if (rawText) { try { json = JSON.parse(rawText); } catch { json = null; } }

        // On n'affiche ici que les CV créés via le CV Creator (source === 'creator').
        // Les CV uploadés depuis les offres sont consultables dans /dashboard/profile.
        const all: CVItem[] = (json?.cvs || []);
        const creatorOnly = all.filter(c => c.source === 'creator');
        setCvs(creatorOnly);
      } catch (e: any) {
        console.error('Erreur chargement Mes CV:', e);
        setErrorMsg(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Récupère le CV complet (form_data, template, etc.) via /api/cvs?id=xxx
  async function fetchFullCV(cvId: string) {
    const token = (window as any).__jfmj_token || '';
    const res = await fetch(`/api/cvs?id=${encodeURIComponent(cvId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const rawText = await res.text();
    let json: any = null;
    if (rawText) { try { json = JSON.parse(rawText); } catch { json = null; } }
    if (!res.ok || !json?.cv) {
      throw new Error(json?.error || `Impossible de charger le CV (${res.status})`);
    }
    return json.cv;
  }

  // Génère le PDF côté client à partir du CV complet + template + couleur + police
  async function generatePdfBlob(cv: any): Promise<Blob> {
    const fd = cv.form_data || {};
    const photo = fd.photo || '';
    const accentColor = fd.accentColor || '#E8151B';
    const font = fd.font || 'arial';
    const formData = {
      ...fd,
      experiences: fd.experiences || [],
      education: fd.education || [],
      skills: fd.skills || '',
    };
    const blob = await pdf(
      <CVPdf
        formData={formData}
        template={cv.template}
        accentColor={accentColor}
        font={font}
        photo={photo || undefined}
      />
    ).toBlob();
    return blob;
  }

  async function previewPdf(item: CVItem) {
    if (!item.metadata.cv_id) return;
    setBusyRef(item.ref);
    setBusyAction('preview');
    setErrorMsg('');
    try {
      const cv = await fetchFullCV(item.metadata.cv_id);
      const blob = await generatePdfBlob(cv);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // On revoke après 1 min : le temps que le nouvel onglet ait chargé le PDF
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erreur à la génération');
    } finally {
      setBusyRef(null);
      setBusyAction(null);
    }
  }

  async function downloadPdf(item: CVItem) {
    if (!item.metadata.cv_id) return;
    setBusyRef(item.ref);
    setBusyAction('download');
    setErrorMsg('');
    try {
      const cv = await fetchFullCV(item.metadata.cv_id);
      const blob = await generatePdfBlob(cv);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(item.display_name || item.title || 'Mon_CV').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erreur au téléchargement');
    } finally {
      setBusyRef(null);
      setBusyAction(null);
    }
  }

  function editCV(item: CVItem) {
    if (!item.metadata.cv_id) return;
    router.push(`/dashboard/editor?id=${encodeURIComponent(item.metadata.cv_id)}`);
  }

  async function deleteCV(item: CVItem) {
    setBusyRef(item.ref);
    setBusyAction('delete');
    setErrorMsg('');
    try {
      const token = (window as any).__jfmj_token || '';
      const res = await fetch(`/api/cvs?ref=${encodeURIComponent(item.ref)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const rawText = await res.text();
      let json: any = null;
      if (rawText) { try { json = JSON.parse(rawText); } catch { json = null; } }
      if (!res.ok) {
        throw new Error(json?.error || `Erreur serveur (${res.status})`);
      }
      setCvs(prev => prev.filter(c => c.ref !== item.ref));
      setConfirmRef(null);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erreur de suppression');
    } finally {
      setBusyRef(null);
      setBusyAction(null);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const navBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '9px 12px',
    border: 'none', borderLeft: '3px solid transparent', borderRadius: 0,
    background: 'transparent', color: '#888', fontFamily: FONT,
    fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%',
  };

  // Style commun des boutons d'action (icônes carrées)
  const iconBtn = (kind: 'yellow' | 'white' | 'red', disabled: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, border: '2px solid #111', borderRadius: 7,
      fontSize: 14, fontWeight: 800, fontFamily: FONT,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: '2px 2px 0 #111', transition: 'all .12s',
      opacity: disabled ? 0.55 : 1,
    };
    if (kind === 'yellow') return { ...base, background: '#F5C400', color: '#111' };
    if (kind === 'red') return { ...base, background: '#fff', color: '#E8151B', borderColor: '#E8151B', boxShadow: '2px 2px 0 #E8151B' };
    return { ...base, background: '#fff', color: '#111' };
  };

  const confirmedCV = confirmRef ? cvs.find(c => c.ref === confirmRef) : null;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap');`}</style>
      <div style={{ display: 'flex', height: '100vh', fontFamily: FONT, overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 200, minWidth: 200, background: '#0f0f0f', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1e1e', flexShrink: 0 }}>
          <div onClick={() => router.push('/')} style={{ padding: '18px 16px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', fontFamily: FONT }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#F5C400', fontFamily: FONT }}>find my Job</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 8px', fontFamily: FONT }}>Recherche</div>
            {['Tableau de bord', 'Candidatures', 'Contacts', 'Entretiens', 'Événements', 'Statistiques'].map(label => (
              <button key={label} onClick={() => router.push('/dashboard')} style={navBtn}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
                {label}
              </button>
            ))}

            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 8px', fontFamily: FONT }}>Outils</div>
            <button onClick={() => router.push('/dashboard/synthese')} style={navBtn}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              Synthèse
            </button>
            <button onClick={() => router.push('/dashboard/editor')} style={navBtn}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              CV Creator
            </button>
            <button style={{ ...navBtn, borderLeft: '3px solid #E8151B', background: '#1c1c1c', color: '#fff', fontWeight: 700, paddingLeft: 20 }}>
              Mes CV
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 10px 8px', flexShrink: 0 }}>
            <button onClick={() => router.push('/dashboard/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff' }}>E</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', fontFamily: FONT }}>Mon profil</div>
            </button>
            <button onClick={() => router.push('/')}
              style={{ width: '100%', padding: '7px 12px', marginTop: 2, border: 'none', background: 'transparent', color: '#444', fontFamily: FONT, fontWeight: 600, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#444'}>
              ⎋ Déconnexion
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F7F6F3', overflow: 'hidden' }}>

          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 58, background: '#fff', borderBottom: '2px solid #111', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#111', fontFamily: FONT }}>
              Mes CV
            </div>
            <button
              onClick={() => router.push('/dashboard/editor')}
              style={{ background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 20px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '3px 3px 0 #111' }}
            >
              + Créer un nouveau CV
            </button>
          </header>

          {/* Contenu */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

            {/* Bandeau erreur global */}
            {errorMsg && (
              <div style={{ background: '#F8D7DA', border: '2px solid #E8151B', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#111', fontWeight: 700, fontSize: 13, fontFamily: FONT, boxShadow: '2px 2px 0 #E8151B' }}>
                ⚠ {errorMsg}
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: 14, fontFamily: FONT, marginTop: '4rem' }}>Chargement...</div>
            )}

            {!loading && cvs.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', fontFamily: FONT, marginBottom: 8 }}>Aucun CV sauvegardé</div>
                <div style={{ fontSize: 14, color: '#888', fontFamily: FONT, marginBottom: 24 }}>Crée ton premier CV optimisé pour les ATS</div>
                <button onClick={() => router.push('/dashboard/editor')}
                  style={{ background: '#E8151B', color: '#fff', fontSize: 14, fontWeight: 800, padding: '14px 32px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '4px 4px 0 #111' }}>
                  + Créer mon premier CV →
                </button>
              </div>
            )}

            {!loading && cvs.length > 0 && (
              <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, boxShadow: '3px 3px 0 #111', overflow: 'hidden' }}>

                {/* En-tête tableau */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px 220px', padding: '12px 24px', borderBottom: '2px solid #111', background: '#F7F6F3' }}>
                  {['Nom du CV', 'Template', 'Modifié le', 'Actions'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111', fontFamily: FONT }}>{h}</div>
                  ))}
                </div>

                {/* Lignes */}
                {cvs.map((cv, i) => {
                  const isBusy = busyRef === cv.ref;
                  const displayTitle = cv.display_name || cv.title;
                  const templateLabel = cv.metadata.template
                    ? (TEMPLATE_LABELS[cv.metadata.template] || cv.metadata.template)
                    : '—';
                  return (
                    <div
                      key={cv.ref}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px 220px', padding: '16px 24px', alignItems: 'center', borderBottom: i < cvs.length - 1 ? '1px solid #eee' : 'none', background: '#fff', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}
                    >
                      {/* Nom */}
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111', fontFamily: FONT }}>
                        {displayTitle}
                      </div>

                      {/* Template */}
                      <div>
                        {cv.metadata.template ? (
                          <span style={{ fontSize: 12, fontWeight: 700, background: '#F7F6F3', border: '2px solid #111', borderRadius: 6, padding: '4px 10px', color: '#111', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                            {templateLabel}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#aaa', fontFamily: FONT }}>—</span>
                        )}
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: 13, color: '#888', fontFamily: FONT }}>{formatDate(cv.updated_at)}</div>

                      {/* Actions : 4 boutons icônes */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Aperçu (ouvre le PDF dans un nouvel onglet) */}
                        <button
                          onClick={() => previewPdf(cv)}
                          disabled={isBusy}
                          title="Aperçu dans un nouvel onglet"
                          style={iconBtn('white', isBusy)}
                        >
                          {isBusy && busyAction === 'preview' ? '…' : '👁'}
                        </button>
                        {/* Télécharger PDF */}
                        <button
                          onClick={() => downloadPdf(cv)}
                          disabled={isBusy}
                          title="Télécharger le PDF"
                          style={iconBtn('white', isBusy)}
                        >
                          {isBusy && busyAction === 'download' ? '…' : '↓'}
                        </button>
                        {/* Éditer (retourne à l'éditeur) */}
                        <button
                          onClick={() => editCV(cv)}
                          disabled={isBusy}
                          title="Éditer le CV"
                          style={iconBtn('yellow', isBusy)}
                        >
                          ✎
                        </button>
                        {/* Supprimer (ouvre modale de confirmation) */}
                        <button
                          onClick={() => setConfirmRef(cv.ref)}
                          disabled={isBusy}
                          title="Supprimer le CV"
                          style={iconBtn('red', isBusy)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Footer */}
                <div style={{ padding: '12px 24px', borderTop: '1px solid #eee', fontSize: 11, color: '#aaa', fontFamily: FONT }}>
                  {cvs.length} CV{cvs.length > 1 ? 's' : ''} sauvegardé{cvs.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Note sur les CV uploadés */}
            {!loading && cvs.length > 0 && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#888', fontFamily: FONT, fontStyle: 'italic' }}>
                Pour retrouver tes CV uploadés depuis tes candidatures, va sur <span onClick={() => router.push('/dashboard/profile')} style={{ color: '#111', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Mon profil</span>.
              </div>
            )}
          </div>
        </div>

        {/* ── MODALE SUPPRESSION ── */}
        {confirmedCV && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '28px 32px', boxShadow: '6px 6px 0 #111', maxWidth: 420, width: '90%', fontFamily: FONT }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#111', marginBottom: 12, fontFamily: FONT }}>Supprimer ce CV ?</div>
              <div style={{ background: '#F8D7DA', border: '1px solid #E8151B', borderRadius: 6, padding: '10px 14px', fontWeight: 700, color: '#111', fontSize: 14, marginBottom: 10, fontFamily: FONT }}>
                {confirmedCV.display_name || confirmedCV.title}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 22, fontFamily: FONT }}>Cette action est irréversible.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmRef(null)}
                  style={{ flex: 1, padding: '11px', background: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
                  Annuler
                </button>
                <button onClick={() => deleteCV(confirmedCV)} disabled={busyRef === confirmedCV.ref && busyAction === 'delete'}
                  style={{ flex: 1, padding: '11px', background: '#E8151B', color: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}>
                  {busyRef === confirmedCV.ref && busyAction === 'delete' ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
