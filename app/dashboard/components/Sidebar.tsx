'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { View } from './types';

const LogoSVG = () => (
  <svg viewBox="0 0 60 52" width="28" height="24" xmlns="http://www.w3.org/2000/svg">
    <polygon points="30,1 37,10 46,3 43,13 54,9 49,19 58,20 51,27 57,35 47,32 51,41 41,37 43,47 34,40 30,47 26,40 17,47 19,37 9,41 13,32 3,35 9,27 2,20 11,19 6,9 17,13 14,3 23,10" fill="#111" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
    <polygon points="30,4 36,12 44,6 41,15 51,11 47,20 55,22 49,28 54,35 45,33 49,41 40,37 42,46 33,40 30,46 27,40 18,46 20,37 11,41 15,33 6,35 11,28 5,22 13,20 9,11 19,15 16,6 24,12" fill="#E8151B"/>
    <text x="30" y="25" textAnchor="middle" fontFamily="Impact,sans-serif" fontSize="13" fontWeight="900" fill="#F5C400" stroke="#111" strokeWidth="0.8" paintOrder="stroke">Jean</text>
    <rect x="9" y="28" width="42" height="11" rx="2" fill="#111"/>
    <text x="30" y="37" textAnchor="middle" fontFamily="Impact,sans-serif" fontSize="6" fontWeight="900" fill="#fff">find my job</text>
  </svg>
);

type Props = {
  view: View;
  setView: (v: View) => void;
  firstName: string;
  userEmail: string;
  jobCount: number;
  contactCount: number;
  interviewCount: number;
  onSettings: () => void;
};

export default function Sidebar({ view, setView, firstName, userEmail, jobCount, contactCount, interviewCount, onSettings }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const s = createClient();
    await s.auth.signOut();
    router.push('/');
  }

  const initials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

  const navItems: [View, string, string, number | null][] = [
    ['kanban', '📊', 'Tableau de bord', jobCount],
    ['list', '📋', 'Candidatures', null],
    ['contacts', '👥', 'Contacts', contactCount],
    ['agenda', '📅', 'Entretiens', interviewCount],
    ['stats', '📈', 'Statistiques', null],
  ];

  return (
    <aside style={{ width: 210, background: '#111', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '0.875rem 1rem', borderBottom: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <LogoSVG />
        <Link href="/" style={{ fontFamily: 'Montserrat,sans-serif', fontSize: '0.8rem', fontWeight: 900, color: '#fff', textDecoration: 'none' }}>
          Jean <span style={{ color: '#E8151B' }}>Find My Job</span>
        </Link>
      </div>

      <div style={{ padding: '0.5rem 0.5rem 0.2rem', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recherche</div>

      {navItems.map(([v, icon, label, badge]) => (
        <button key={v} className={'nav-btn' + (view === v ? ' active' : '')} onClick={() => setView(v)}>
          <span style={{ fontSize: 13 }}>{icon}</span>
          <span style={{ flex: 1 }}>{label}</span>
          {badge !== null && badge > 0 && (
            <span style={{ background: '#E8151B', color: '#F5C400', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 800 }}>{badge}</span>
          )}
        </button>
      ))}

      <div style={{ padding: '0.5rem 0.5rem 0.2rem', marginTop: '0.5rem', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Outils</div>
      <button className="nav-btn" onClick={() => router.push('/dashboard/editor')}>
        <span style={{ fontSize: 13 }}>✦</span> CV Creator
      </button>

      <div style={{ marginTop: 'auto', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
        <button className="nav-btn" onClick={onSettings} style={{ margin: '4px 6px' }}>
          <span style={{ fontSize: 13 }}>⚙️</span> Paramètres
        </button>
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={handleLogout}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8151B', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#F5C400' }}>
              {firstName ? firstName.charAt(0).toUpperCase() : initials(userEmail.split('@')[0])}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{firstName || userEmail.split('@')[0]}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Déconnexion</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
