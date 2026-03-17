'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
  }

  const Logo = () => (
    <svg viewBox="0 0 140 120" width="90" height="77" xmlns="http://www.w3.org/2000/svg">
      <polygon points="70,2 85,24 108,6 100,30 126,22 114,44 136,46 120,62 134,80 112,75 122,96 98,86 102,108 80,92 70,110 60,92 38,108 42,86 18,96 28,75 6,80 20,62 4,46 26,44 14,22 40,30 32,6 55,24" fill="#111"/>
      <polygon points="70,10 83,28 102,14 96,35 118,28 108,47 126,50 112,64 124,80 105,76 114,94 93,85 96,105 76,91 70,106 64,91 44,105 47,85 26,94 35,76 16,80 28,64 14,50 32,47 22,28 44,35 38,14 57,28" fill="#E8151B"/>
      <text x="70" y="58" textAnchor="middle" fontFamily="Impact,Arial Black,sans-serif" fontSize="32" fontWeight="900" fill="#F5C400" stroke="#111" strokeWidth="2" paintOrder="stroke">Jean</text>
      <rect x="22" y="66" width="96" height="24" rx="3" fill="#111"/>
      <text x="70" y="83" textAnchor="middle" fontFamily="Impact,Arial Black,sans-serif" fontSize="14" fontWeight="900" fill="#fff">find my job</text>
    </svg>
  );

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .auth-input { width: 100%; border: 2px solid #E0E0E0; border-radius: 8px; padding: 11px 14px; font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; outline: none; color: #111; background: #fff; transition: border-color 0.15s; }
        .auth-input:focus { border-color: #E8151B; box-shadow: 0 0 0 3px rgba(232,21,27,0.08); }
        .auth-label { display: block; font-size: 11px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.875rem 2rem', background: '#fff', borderBottom: '2px solid #111' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ background: '#E8151B', border: '2px solid #111', borderRadius: 7, padding: '3px 10px', boxShadow: '2px 2px 0 #111' }}>
            <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.95rem', fontWeight: 900, color: '#F5C400' }}>Jean</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Find My Job</span>
        </Link>
      </nav>

      {/* FORM */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: 12, padding: '2.5rem 2rem', width: '100%', maxWidth: 440, boxShadow: '4px 4px 0 #111' }}>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}><Logo /></div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem', letterSpacing: '-0.02em', color: '#111' }}>Créer un compte</h1>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', fontWeight: 500, marginBottom: '1.75rem' }}>Gratuit · Sans carte bancaire</p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#E8F5EE', border: '2px solid #1A7A4A', borderRadius: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A7A4A', marginBottom: 8 }}>Vérifiez vos emails !</div>
              <div style={{ fontSize: 13, color: '#555' }}>Un lien de confirmation a été envoyé à <b>{email}</b>. Cliquez dessus pour activer votre compte.</div>
              <Link href="/auth/login" style={{ display: 'inline-block', marginTop: '1rem', background: '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: '2px 2px 0 #E8151B' }}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div style={{ background: '#FDEAEA', border: '2px solid #E8151B', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C01116', fontWeight: 600, marginBottom: 16 }}>{error}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="auth-label">Prénom</label>
                  <input className="auth-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Emmanuelle" required />
                </div>
                <div>
                  <label className="auth-label">Nom</label>
                  <input className="auth-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Gonidec" required />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="auth-label">Email</label>
                <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" required />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="auth-label">Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input className="auth-input" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 4 }}>
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="auth-label">Confirmer le mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input className="auth-input" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez votre mot de passe" required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 4 }}>
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#555' : '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: 13, fontFamily: 'Montserrat,sans-serif', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '3px 3px 0 #E8151B', letterSpacing: '0.02em' }}>
                {loading ? 'Création en cours...' : 'Créer mon compte →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: '#888', fontWeight: 500 }}>
                Déjà un compte ?{' '}
                <Link href="/auth/login" style={{ color: '#E8151B', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
