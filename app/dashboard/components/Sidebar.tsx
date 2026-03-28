'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const NAV_ITEMS = [
  { id: 'kanban', label: 'Kanban', icon: '⬛' },
  { id: 'list', label: 'Candidatures', icon: '📋' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'agenda', label: 'Agenda', icon: '📅' },
  { id: 'stats', label: 'Statistiques', icon: '📊' },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [firstName, setFirstName] = useState('');
  const [initials, setInitials] = useState('?');

  // Charger le profil pour afficher le nom/initiales
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.profile) {
          const fn = data.profile.first_name ?? '';
          const ln = data.profile.last_name ?? '';
          setFirstName(fn || data.email?.split('@')[0] || 'Moi');
          const ini = [fn?.[0], ln?.[0]].filter(Boolean).join('').toUpperCase();
          setInitials(ini || (data.email?.[0] ?? '?').toUpperCase());
        } else if (data.email) {
          setFirstName(data.email.split('@')[0]);
          setInitials(data.email[0].toUpperCase());
        }
      } catch (_) {
        // silencieux
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

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

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
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
                boxShadow: isActive ? '2px 2px 0 #F5C40033' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Avatar profil — lien vers /dashboard/profile */}
      <div style={{ borderTop: '2px solid #222', padding: '12px 8px' }}>
        <button
          onClick={() => router.push('/dashboard/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 12px',
            border: pathname === '/dashboard/profile' ? '2px solid #F5C400' : '2px solid #333',
            borderRadius: 8,
            background: pathname === '/dashboard/profile' ? '#1a1a1a' : 'transparent',
            cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif',
            transition: 'all 0.15s',
          }}
        >
          {/* Avatar cercle avec initiales */}
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
              {firstName}
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
