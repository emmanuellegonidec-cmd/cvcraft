'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = { width: '100%', border: '2px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 500, outline: 'none', color: '#111', background: '#fff', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    setLoading(false);
    if (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      return;
    }
    setSuccess(true);
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 2.5rem', background: '#fff', borderBottom: '2.5px solid #111' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logojeanfindmyjob.webp" alt="Jean Find My Job" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 900, color: '#111' }}>
            Jean <span style={{ color: '#E8151B' }}>Find My Job</span>
          </span>
        </Link>
        <div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
          <Link href="/auth/login" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'none' }}>← Retour à la connexion</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '2.5rem 2rem', width: '100%', maxWidth: 420, boxShadow: '4px 4px 0 #111' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img src="/logojeanfindmyjob.webp" alt="Jean Find My Job" style={{ height: 90, width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem', letterSpacing: '-0.02em', color: '#111' }}>
            {success ? 'Email envoyé !' : 'Mot de passe oublié ?'}
          </h1>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', fontWeight: 500, marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {success
              ? 'Vérifie ta boîte de réception pour le lien de réinitialisation.'
              : 'Pas de panique. Entre ton email et on t\'envoie un lien pour en créer un nouveau.'}
          </p>

          {success ? (
            <>
              <div style={{ background: '#FFF9E0', border: '2px solid #F5C400', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#111', fontWeight: 500, marginBottom: 16, lineHeight: 1.6 }}>
                Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
                <br /><br />
                <span style={{ fontSize: 12, color: '#555' }}>
                  Pense à vérifier tes spams si tu ne le trouves pas.
                </span>
              </div>
              <Link
                href="/auth/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#111',
                  color: '#F5C400',
                  border: '2px solid #111',
                  borderRadius: 8,
                  padding: 13,
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '3px 3px 0 #E8151B',
                  letterSpacing: '0.02em',
                }}
              >
                Retour à la connexion →
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#FDEAEA', border: '2px solid #E8151B', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C01116', fontWeight: 600, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" required />
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#555' : '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: 13, fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #E8151B', letterSpacing: '0.02em' }}>
                {loading ? 'Envoi en cours...' : 'Envoyer le lien →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: '#888', fontWeight: 500 }}>
                Tu te souviens de ton mot de passe ?{' '}
                <Link href="/auth/login" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
