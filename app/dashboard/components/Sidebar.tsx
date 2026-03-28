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

const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: 'kanban', label: 'Kanban', icon: '⬛' },
  { id: 'list', label: 'Candidatures', icon: '📋' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'agenda', label: 'Agenda', icon: '📅' },
  { id: 'stats', label: 'Statistiques', icon: '📊' },
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

  // Initiales depuis firstName + userEmail
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
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: '#111',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '3px solid #F5C400',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      {/* Logo */}
      <div
        style={{ padding: '20px 16px 16px', borderBottom: '2px solid #222', cursor: 'pointer' }}
        onClick={() => router.push('/')}
      >
        <div style={{ fontWeight: 900, fontSize: 20, color: '#F5C400', letterSpacing: -0.5, lineHeight: 1 }}>
          JEAN
        </div>
        <div style={{ fontWeight: 700, fontSize: 10, color: '#fff', letterSpacing: 1.5, marginTop: 2 }}>
          FIND MY JOB
        </div>
      </div>

      {/* Stats rapides */}
      <div style={{ padding: '10px 16px', borderBottom: '2px solid #222', display: 'flex', gap: 8 }}>
        <StatBadge label="offres" value={jobCount} />
        <StatBadge label="contacts" value={contactCount} />
        <StatBadge label="entretiens" value={interviewCount} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                border: isActive ? '2px solid #F5C400' : '2px solid transparent',
                borderRadius: 8,
                background: isActive ? '#F5C400' : 'transparent',
                color: isActive ? '#111' : '#ccc',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: isActive ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                boxShadow: isActive ? '2px 2px 0 #F5C40033' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}

        {/* Paramètres */}
        <button
          onClick={onSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            border: '2px solid transparent',
            borderRadius: 8,
            background: 'transparent',
            color: '#666',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            marginTop: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        >
          <span style={{ fontSize: 15 }}>⚙️</span>
          Paramètres
        </button>
      </nav>

      {/* Avatar profil + déconnexion */}
      <div style={{ borderTop: '2px solid #222', padding: '12px 8px' }}>
        {/* Lien vers /dashboard/profile */}
        <button
          onClick={() => router.push('/dashboard/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 12px',
            border: '2px solid #333',
            borderRadius: 8,
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#F5C400')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333')}
        >
          {/* Cercle initiales */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F5C400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 13,
              color: '#111',
              border: '2px solid #555',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontWeight: 500, fontSize: 11, color: '#888' }}>Mon profil</div>
          </div>
        </button>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 12px',
            marginTop: 4,
            border: '2px solid transparent',
            borderRadius: 8,
            background: 'transparent',
            color: '#666',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E8151B')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        >
          <span>⎋</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ─── Sous-composant badge stat ────────────────────────────────────────────────
function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontWeight: 900, fontSize: 16, color: '#F5C400', lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 500, fontSize: 9, color: '#666', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}
