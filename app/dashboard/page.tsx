'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CV } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';

export default function DashboardPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserEmail(user.email || '');

const res = await fetch('/api/cvs');

if (!res.ok) {
  setCvs([]);
  setLoading(false);
  return;
}

const json = await res.json();

setCvs(json.cvs || []);
setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce CV ?')) return;
    await fetch(`/api/cvs?id=${id}`, { method: 'DELETE' });
    setCvs(cvs.filter(c => c.id !== id));
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', background: 'white', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}>
          CVcraft
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{userEmail}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>
            Déconnexion
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', marginBottom: 4 }}>Mes CVs</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{cvs.length} CV{cvs.length > 1 ? 's' : ''} sauvegardé{cvs.length > 1 ? 's' : ''}</p>
          </div>
          <Link href="/dashboard/editor" className="btn-primary">
            + Nouveau CV
          </Link>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>Chargement...</div>
        )}

        {!loading && cvs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>✦</div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Votre premier CV vous attend</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: 15 }}>
              Importez votre LinkedIn ou remplissez le formulaire — votre CV sera prêt en 30 secondes.
            </p>
            <Link href="/dashboard/editor" className="btn-accent">
              Créer mon premier CV →
            </Link>
          </div>
        )}

        {!loading && cvs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {/* New CV card */}
            <Link href="/dashboard/editor" style={{ textDecoration: 'none' }}>
              <div style={{
                border: '2px dashed var(--border)', borderRadius: 16, padding: '2rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                minHeight: 180, color: 'var(--muted)',
              }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ fontSize: 28, color: 'var(--accent)' }}>+</div>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>Nouveau CV</span>
              </div>
            </Link>

            {cvs.map(cv => {
              const tpl = TEMPLATES.find(t => t.id === cv.template) || TEMPLATES[0];
              return (
                <div key={cv.id} className="card" style={{ position: 'relative', transition: 'box-shadow 0.15s' }}>
                  {/* Template badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--accent-light)', borderRadius: 6,
                    padding: '3px 10px', fontSize: 12, color: 'var(--accent)',
                    marginBottom: 12,
                  }}>
                    {tpl.preview} {tpl.name}
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>
                    {cv.title || 'CV sans titre'}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                    Modifié le {formatDate(cv.updated_at)}
                  </p>

                  {/* Preview snippet */}
                  {cv.content && (
                    <p style={{
                      fontSize: 12, color: 'var(--muted)', lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      marginBottom: 16,
                    }}>
                      {cv.content.substring(0, 150)}...
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/dashboard/editor?id=${cv.id}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: 13 }}>
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(cv.id)}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: 13, color: '#cc4444', borderColor: '#f5c6c6' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
