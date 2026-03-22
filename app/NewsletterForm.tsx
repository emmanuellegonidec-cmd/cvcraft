'use client';
import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');

  async function handleSubmit() {
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 409) { setStatus('duplicate'); return; }
      if (!res.ok) { setStatus('error'); return; }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div style={{ background: '#F4F4F4', border: '2px solid #E0E0E0', borderRadius: 10, padding: '1rem', marginTop: '0.5rem' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#111', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📬 Newsletter</div>
      <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 8 }}>Conseils emploi chaque semaine</div>

      {status === 'success' ? (
        <div style={{ fontSize: 12, color: '#1A7A4A', fontWeight: 700, padding: '8px 0' }}>✓ Inscription confirmée !</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="votre@email.com"
              style={{ flex: 1, border: '2px solid #E0E0E0', borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: 'Montserrat,sans-serif', outline: 'none' }}
            />
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              style={{ background: '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 6, padding: '7px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', whiteSpace: 'nowrap', opacity: status === 'loading' ? 0.6 : 1 }}
            >
              {status === 'loading' ? '...' : 'OK →'}
            </button>
          </div>
          {status === 'duplicate' && <div style={{ fontSize: 11, color: '#B8900A', fontWeight: 600, marginTop: 4 }}>Vous êtes déjà inscrit !</div>}
          {status === 'error' && <div style={{ fontSize: 11, color: '#E8151B', fontWeight: 600, marginTop: 4 }}>Une erreur est survenue, réessayez.</div>}
        </>
      )}
    </div>
  );
}
