'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Calcule la force du mot de passe (0 à 4)
function calcStrength(pwd: string): number {
  if (pwd.length < 6) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABELS = ['Faible', 'Moyen', 'Correct', 'Bon', 'Excellent'];
const STRENGTH_COLORS = ['#E8151B', '#E8151B', '#F5C400', '#1A7A4A', '#1A7A4A'];

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const inputStyle: React.CSSProperties = { width: '100%', border: '2px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 500, outline: 'none', color: '#111', background: '#fff', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 };

  // Vérifie qu'on a bien une session valide (token depuis l'email)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      } else {
        setError('Lien invalide ou expiré. Demande un nouveau lien de réinitialisation.');
        setSessionReady(false);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      window.location.replace('/dashboard');
    }, 2000);
  }

  const strength = calcStrength(password);
  const showStrength = password.length > 0;

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 2.5rem', background: '#fff', borderBottom: '2.5px solid #111' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logojeanfindmyjob.webp" alt="Jean Find My Job" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 900, color: '#111' }}>
            Jean <span style={{ color: '#E8151B' }}>Find My Job</span>
          </span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '2.5rem 2rem', width: '100%', maxWidth: 420, boxShadow: '4px 4px 0 #111' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img src="/logojeanfindmyjob.webp" alt="Jean Find My Job" style={{ height: 90, width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem', letterSpacing: '-0.02em', color: '#111' }}>
            {success ? 'Mot de passe modifié !' : 'Nouveau mot de passe'}
          </h1>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', fontWeight: 500, marginBottom: '1.75rem', lineHeight: 1.5 }}>
            {success
              ? 'Redirection vers ton espace...'
              : 'Choisis un nouveau mot de passe pour ton compte.'}
          </p>

          {success ? (
            <div style={{ background: '#E6F4EA', border: '2px solid #1A7A4A', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#1A5A35', fontWeight: 600, textAlign: 'center' }}>
              ✓ Ton nouveau mot de passe est enregistré.
            </div>
          ) : !sessionReady && error ? (
            <>
              <div style={{ background: '#FDEAEA', border: '2px solid #E8151B', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#C01116', fontWeight: 600, marginBottom: 16 }}>
                {error}
              </div>
              <Link
                href="/auth/reset-password"
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
                Demander un nouveau lien →
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#FDEAEA', border: '2px solid #E8151B', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C01116', fontWeight: 600, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: 44 }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Au moins 6 caractères" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 4 }}>
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>

                {showStrength && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: i < strength ? STRENGTH_COLORS[strength] : '#E0E0E0',
                            transition: 'background 0.2s',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: STRENGTH_COLORS[strength], fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {STRENGTH_LABELS[strength]}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Confirmer le mot de passe</label>
                <input style={inputStyle} type={showPwd ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Retape ton mot de passe" required />
                {confirm.length > 0 && password !== confirm && (
                  <div style={{ fontSize: 11, color: '#E8151B', fontWeight: 700, marginTop: 4 }}>
                    Les mots de passe ne correspondent pas
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading || !sessionReady} style={{ width: '100%', background: (loading || !sessionReady) ? '#555' : '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: 13, fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 800, cursor: (loading || !sessionReady) ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #E8151B', letterSpacing: '0.02em' }}>
                {loading ? 'Enregistrement...' : 'Modifier mon mot de passe →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
