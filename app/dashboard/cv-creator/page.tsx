'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const FONT = 'Montserrat, sans-serif';

interface CV {
  id: string;
  title: string;
  template: string;
  updated_at: string;
  form_data?: any;
}

const TEMPLATE_LABELS: Record<string, string> = {
  classic: 'Classique',
  modern: 'Moderne',
  minimal: 'Minimaliste',
  elegant: 'Élégant',
  creative: 'Créatif',
  executive: 'Executive',
};

const TEMPLATE_ICONS: Record<string, string> = {
  classic: '◼',
  modern: '◫',
  minimal: '◻',
  elegant: '✦',
  creative: '▌',
  executive: '≡',
};

export default function CVCreatorPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        (window as any).__jfmj_token = session.access_token;
      }

      const res = await fetch('/api/cvs', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      const json = await res.json();
      setCvs(json.cvs || []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function deleteCV(id: string) {
    setDeletingId(id);
    const token = (window as any).__jfmj_token || '';
    await fetch(`/api/cvs?id=${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setCvs(cvs.filter(c => c.id !== id));
    setDeletingId(null);
    setConfirmId(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  const navBtnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '8px 10px',
    border: 'none', borderLeft: '3px solid transparent',
    borderRadius: 0, background: 'transparent', color: '#888',
    fontFamily: FONT, fontWeight: 500, fontSize: 13,
    cursor: 'pointer', textAlign: 'left', width: '100%',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: FONT }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 180, background: '#0f0f0f', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1e1e', flexShrink: 0 }}>
        <div onClick={() => router.push('/')} style={{ padding: '16px 14px', borderBottom: '1px solid #1e1e1e', cursor: 'pointer' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: FONT }}>Jean </span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#F5C400', fontFamily: FONT }}>find my Job</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {['Tableau de bord', 'Candidatures', 'Contacts', 'Entretiens', 'Événements', 'Statistiques'].map(label => (
            <button key={label} onClick={() => router.push('/dashboard')} style={navBtnBase}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
              {label}
            </button>
          ))}
          <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '14px 8px 6px', fontFamily: FONT }}>Outils</div>
          <button onClick={() => router.push('/dashboard/synthese')} style={navBtnBase}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}>
            Synthèse
          </button>
          <button style={{ ...navBtnBase, borderLeft: '3px solid #E8151B', background: '#1c1c1c', color: '#fff', fontWeight: 700 }}>
            CV Creator
          </button>
        </div>
        <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 8px' }}>
          <button onClick={() => router.push('/dashboard/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: '1px solid #242424', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>E</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Mon profil</div>
          </button>
          <button onClick={() => router.push('/')}
            style={{ width: '100%', padding: '6px 10px', marginTop: 2, border: 'none', background: 'transparent', color: '#444', fontFamily: FONT, fontWeight: 600, fontSize: 11, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#444'}>
            ⎋ Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F7F6F3', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 54, background: '#fff', borderBottom: '2px solid #111', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#111', fontFamily: FONT }}>
            CV Creator
          </div>
          <button
            onClick={() => router.push('/dashboard/editor')}
            style={{ background: '#E8151B', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 20px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '3px 3px 0 #111' }}
          >
            + Créer un nouveau CV
          </button>
        </header>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

          {loading && (
            <div style={{ textAlign: 'center', color: '#888', fontSize: 14, fontFamily: FONT, marginTop: '4rem' }}>
              Chargement...
            </div>
          )}

          {!loading && cvs.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '5rem' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111', fontFamily: FONT, marginBottom: 8 }}>
                Tu n'as pas encore de CV
              </div>
              <div style={{ fontSize: 13, color: '#888', fontFamily: FONT, marginBottom: 24 }}>
                Crée ton premier CV optimisé pour les ATS
              </div>
              <button
                onClick={() => router.push('/dashboard/editor')}
                style={{ background: '#E8151B', color: '#fff', fontSize: 14, fontWeight: 800, padding: '12px 28px', border: '2px solid #111', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, boxShadow: '4px 4px 0 #111' }}
              >
                + Créer mon premier CV →
              </button>
            </div>
          )}

          {!loading && cvs.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: '#888', fontFamily: FONT, marginBottom: 20 }}>
                {cvs.length} CV{cvs.length > 1 ? 's' : ''} sauvegardé{cvs.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {cvs.map(cv => (
                  <div key={cv.id} style={{ background: '#fff', border: '2px solid #111', borderRadius: 10, boxShadow: '3px 3px 0 #111', overflow: 'hidden' }}>

                    {/* Aperçu template */}
                    <div style={{ background: '#F7F6F3', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #111', fontSize: 40 }}>
                      {TEMPLATE_ICONS[cv.template] || '◼'}
                    </div>

                    {/* Infos */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontFamily: FONT, marginBottom: 4 }}>
                        {cv.title}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#F7F6F3', border: '1px solid #ddd', borderRadius: 4, padding: '2px 7px', color: '#555', fontFamily: FONT }}>
                          {TEMPLATE_LABELS[cv.template] || cv.template}
                        </span>
                        {cv.form_data?.accentColor && (
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: cv.form_data.accentColor, border: '1px solid #111' }} />
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', fontFamily: FONT, marginBottom: 14 }}>
                        Modifié le {formatDate(cv.updated_at)}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => router.push(`/dashboard/editor?id=${cv.id}`)}
                          style={{ flex: 1, padding: '8px 12px', background: '#F5C400', color: '#111', border: '2px solid #111', borderRadius: 7, fontSize: 12, fontWeight: 800, fontFamily: FONT, cursor: 'pointer', boxShadow: '2px 2px 0 #111' }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => setConfirmId(cv.id)}
                          style={{ padding: '8px 12px', background: '#fff', color: '#E8151B', border: '2px solid #E8151B', borderRadius: 7, fontSize: 12, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALE CONFIRMATION SUPPRESSION ── */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '28px 32px', boxShadow: '6px 6px 0 #111', maxWidth: 380, width: '90%', fontFamily: FONT }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 10 }}>Supprimer ce CV ?</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
              <div style={{ background: '#F8D7DA', border: '1px solid #E8151B', borderRadius: 6, padding: '8px 12px', fontWeight: 700, color: '#111' }}>
                {cvs.find(c => c.id === confirmId)?.title}
              </div>
              <div style={{ marginTop: 10 }}>Cette action est irréversible.</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmId(null)}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}
              >
                Annuler
              </button>
              <button
                onClick={() => deleteCV(confirmId)}
                disabled={deletingId === confirmId}
                style={{ flex: 1, padding: '10px', background: '#E8151B', color: '#fff', border: '2px solid #111', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, boxShadow: '2px 2px 0 #111' }}
              >
                {deletingId === confirmId ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}