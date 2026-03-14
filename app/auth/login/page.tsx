'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Link href="/" style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', marginBottom: '2.5rem' }}>
        CVcraft
      </Link>

      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Connexion</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: '1.75rem' }}>Bienvenue ! Connectez-vous à votre espace.</p>

        {error && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F09595', borderRadius: 8, padding: '10px 14px', color: '#791F1F', fontSize: 14, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" required />
          </div>
          <div>
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 6, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Connexion...' : 'Se connecter →'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
          Pas encore de compte ?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Créer un compte gratuit
          </Link>
        </div>
      </div>
    </div>
  );
}
