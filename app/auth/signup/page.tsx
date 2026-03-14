'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return; }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: '1rem' }}>📬</div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Vérifiez vos emails</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            Un lien de confirmation a été envoyé à <strong>{email}</strong>.<br />
            Cliquez dessus pour activer votre compte et accéder à votre espace.
          </p>
          <Link href="/auth/login" className="btn-secondary" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Link href="/" style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', marginBottom: '2.5rem' }}>
        CVcraft
      </Link>

      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Créer un compte</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: '1.75rem' }}>Gratuit · Sans carte bancaire</p>

        {error && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F09595', borderRadius: 8, padding: '10px 14px', color: '#791F1F', fontSize: 14, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" required />
          </div>
          <div>
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6 caractères minimum" required />
          </div>
          <div>
            <label>Confirmer le mot de passe</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-accent" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 6, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Création...' : 'Créer mon compte →'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
          Déjà un compte ?{' '}
          <Link href="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
