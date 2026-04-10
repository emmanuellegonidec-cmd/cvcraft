'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

type View = 'kanban' | 'list' | 'contacts' | 'agenda' | 'stats' | 'actions';

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

const RECHERCHE_ITEMS: { id: View; label: string }[] = [
  { id: 'kanban',   label: 'Tableau de bord' },
  { id: 'list',     label: 'Candidatures'    },
  { id: 'contacts', label: 'Contacts'        },
  { id: 'agenda',   label: 'Entretiens'      },
  { id: 'actions',  label: 'Actions'         },
  { id: 'stats',    label: 'Statistiques'    },
];

export default function Sidebar({
  view, setView, firstName, userEmail,
  jobCount, contactCount, interviewCount, onSettings,
}: SidebarProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(data.session?.user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID)
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

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
      width: 200, minWidth: 200,
      background: '#0f0f0f',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      fontFamily: 'Montserrat, sans-serif',
      borderRight: '1px solid #1e1e1e',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div
        onClick={() => router.push('/')}
        style={{
          padding: '18px 16px 16px',
          borderBottom: '1px solid #1e1e1e',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{ lineHeight: 1.2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Jean </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#F5C400' }}>find my Job</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 10px 8px',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px 8px' }}>
          Recherche
        </div>

        {RECHERCHE_ITEMS.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '9px 12px',
                border: 'none',
                borderLeft: isActive ? '3px solid #E8151B' : '3px solid transparent',
                borderRadius: 0,
                background: isActive ? '#1c1c1c' : 'transparent',
                color: isActive ? '#fff' : '#888',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) { e.currentTarget.style.background = '#161616'; e.currentTarget.style.color = '#ccc'; }
              }}
              onMouseLeave={(e) => {
                if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }
              }}
            >
              {item.label}
            </button>
          );
        })}

        {isAdmin && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 8px 8px' }}>
              Outils
            </div>
            <button
              onClick={() => router.push('/dashboard/editor')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px',
                border: 'none', borderLeft: '3px solid transparent', borderRadius: 0,
                background: 'transparent', color: '#888',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#161616'; e.currentTarget.style.color = '#ccc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
            >
              <span style={{ color: '#555' }}>+</span> CV Creator
            </button>
          </>
        )}

        <button
          onClick={() => router.push('/dashboard/help')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', background: 'none', border: 'none',
            padding: '8px 16px', cursor: 'pointer', textAlign: 'left',
            color: '#ccc', fontFamily: "'Montserrat', sans-serif",
            fontSize: 13, fontWeight: 600,
            marginTop: isAdmin ? 0 : 16,
          }}
        >
          ❓ Help
        </button>
      </div>

      {/* ── Profil + déconnexion ── */}
      <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 10px 8px', flexShrink: 0 }}>
        <button
          onClick={() => router.push('/dashboard/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 12px',
            border: '1px solid #242424', borderRadius: 8,
            background: 'transparent', cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif', transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.background = '#161616'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#242424'; e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#E8151B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 13, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontWeight: 500, fontSize: 11, color: '#555' }}>Mon profil</div>
          </div>
        </button>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 12px', marginTop: 2,
            border: 'none', borderRadius: 6,
            background: 'transparent', color: '#444',
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E8151B')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}
        >
          ⎋ Déconnexion
        </button>
      </div>
    </aside>
  );
}