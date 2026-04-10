'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError('Email ou mot de passe incorrect.'); return; }
    // Redirige vers le paramètre ?next= ou /dashboard par défaut
    const next = searchParams.get('next') ?? '/dashboard';
    router.push(next);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background: '#FDEAEA', border: '2px solid #E8151B', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C01116', fontWeight: 600, marginBottom: 16 }}>{error}</div>}

      <div style={{ marginBottom: 14 }}>
        <label className="auth-label">Email</label>
        <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" required />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <label className="auth-label" style={{ marginBottom: 0 }}>Mot de passe</label>
          <span style={{ fontSize: 12, color: '#E8151B', fontWeight: 700, cursor: 'pointer' }}>Mot de passe oublié ?</span>
        </div>
        <div style={{ position: 'relative' }}>
          <input className="auth-input" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" required style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 4 }}>
            {showPwd ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#555' : '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: 13, fontFamily: 'Montserrat,sans-serif', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #E8151B', letterSpacing: '0.02em' }}>
        {loading ? 'Connexion...' : 'Se connecter →'}
      </button>

      <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: '#888', fontWeight: 500 }}>
        Pas encore de compte ?{' '}
        <Link href="/auth/signup" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'none' }}>Créer un compte gratuit</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .auth-input { width: 100%; border: 2px solid #E0E0E0; border-radius: 8px; padding: 11px 14px; font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; outline: none; color: #111; background: #fff; transition: border-color 0.15s; }
        .auth-input:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(17,17,17,0.06); }
        .auth-label { display: block; font-size: 11px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
      `}</style>

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 2.5rem', background: '#fff', borderBottom: '2.5px solid #111' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logojeanfindmyjob.webp" alt="Jean Find My Job" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '1rem', fontWeight: 900, color: '#111', letterSpacing: '-0.01em' }}>
            Jean <span style={{ color: '#E8151B' }}>Find My Job</span>
          </span>
        </Link>
        <div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
          Pas encore de compte ?{' '}
          <Link href="/auth/signup" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'none' }}>Créer un compte gratuit</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '2.5rem 2rem', width: '100%', maxWidth: 420, boxShadow: '4px 4px 0 #111' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img src="/logojeanfindmyjob.webp" alt="Jean Find My Job" style={{ height: 90, width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem', letterSpacing: '-0.02em', color: '#111' }}>Connexion</h1>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', fontWeight: 500, marginBottom: '1.75rem' }}>Bienvenue ! Connectez-vous à votre espace.</p>
          <Suspense fallback={<div style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>Chargement...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
