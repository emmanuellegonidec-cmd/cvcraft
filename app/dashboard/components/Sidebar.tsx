'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type View = 'kanban' | 'list' | 'contacts' | 'agenda' | 'stats';

interface SidebarProps {
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  firstName: string;
  userEmail: string;
  jobCount: number;
  contactCount: number;
  interviewCount: number;
  onSettings: () => void;
}

const RECHERCHE_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: 'kanban',    label: 'Tableau de bord', icon: '⬛' },
  { id: 'list',      label: 'Candidatures',    icon: '📋' },
  { id: 'contacts',  label: 'Contacts',        icon: '👥' },
  { id: 'agenda',    label: 'Entretiens',      icon: '📅' },
  { id: 'stats',     label: 'Statistiques',    icon: '📊' },
];

export default function Sidebar({
  view,
  setView,
  firstName,
  userEmail,
  jobCount,
  contactCount,
  interviewCount,
  onSettings,
}: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Initiales pour l'avatar
  const initials = (() => {
    if (firstName) {
      const parts = firstName.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return userEmail?.[0]?.toUpperCase() ?? '?';
  })();

  const displayName = firstName || userEmail?.split('@')[0] || 'Moi';

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: '#111',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      fontFamily: 'Montserrat, sans-serif',
      borderRight: '3px solid #222',
    }}>

      {/* ── Logo ── */}
      <div
        onClick={() => router.push('/')}
        style={{ padding: '18px 16px 14px', borderBottom: '1px solid #222', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        {/* Icône rouge style original */}
        <div style={{ width: 28, height: 28, background: '#E8151B', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🎯</span>
        </div>
        <div>
          <span style={{ fontWeight: 900, fontSize: 14, color: '#fff' }}>Jean </span>
          <span style={{ fontWeight: 900, fontSize: 14, color: '#F5C400' }}>Find My Job</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #222', display: 'flex', gap: 0 }}>
        <StatBadge label="offres"      value={jobCount} />
        <StatBadge label="contacts"    value={contactCount} />
        <StatBadge label="entretiens"  value={interviewCount} />
      </div>

      {/* ── Nav principale ── */}
      <div style={{ flex: 1, padding: '16px 10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>

        <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 8px' }}>
          Recherche
        </div>

        {RECHERCHE_ITEMS.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                border: 'none',
                borderRadius: 7,
                background: isActive ? '#E8151B' : 'transparent',
                color: isActive ? '#fff' : '#aaa',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: isActive ? 800 : 500,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'; } }}
            >
              <span style={{ fontSize: 14, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {/* Badge count */}
              {item.id === 'kanban' && jobCount > 0 && (
                <span style={{ background: isActive ? '#fff' : '#E8151B', color: isActive ? '#E8151B' : '#fff', borderRadius: 10, fontSize: 10, fontWeight: 900, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {jobCount}
                </span>
              )}
              {item.id === 'contacts' && contactCount > 0 && (
                <span style={{ background: isActive ? '#fff' : '#333', color: isActive ? '#E8151B' : '#aaa', borderRadius: 10, fontSize: 10, fontWeight: 900, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {contactCount}
                </span>
              )}
              {item.id === 'agenda' && interviewCount > 0 && (
                <span style={{ background: isActive ? '#fff' : '#333', color: isActive ? '#E8151B' : '#aaa', borderRadius: 10, fontSize: 10, fontWeight: 900, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {interviewCount}
                </span>
              )}
            </button>
          );
        })}

        {/* ── Section OUTILS ── */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 8px' }}>
          Outils
        </div>

        <button
          onClick={() => router.push('/dashboard/editor')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            border: 'none',
            borderRadius: 7,
            background: 'transparent',
            color: '#aaa',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 500,
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'; }}
        >
          <span style={{ fontSize: 14, opacity: 0.6 }}>+</span>
          <span>CV Creator</span>
        </button>

      </div>

      {/* ── Avatar profil + déconnexion ── */}
      <div style={{ borderTop: '1px solid #222', padding: '10px 10px 8px' }}>
        <button
          onClick={() => router.push('/dashboard/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '9px 12px',
            border: '1px solid #2a2a2a',
            borderRadius: 8,
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.background = '#1a1a1a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontWeight: 500, fontSize: 10, color: '#666' }}>Mon profil</div>
          </div>
        </button>

        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', marginTop: 2, border: 'none', borderRadius: 6, background: 'transparent', color: '#555', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E8151B')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
        >
          ⎋ Déconnexion
        </button>
      </div>
    </aside>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: 9, color: '#555', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}
