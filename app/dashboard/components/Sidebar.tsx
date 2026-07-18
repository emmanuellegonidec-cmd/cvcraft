'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type View = 'kanban' | 'list' | 'contacts' | 'agenda' | 'stats' | 'actions' | 'personal_actions' | 'calendar';

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

const SUIVI_ITEMS: { id: View; label: string }[] = [
  { id: 'kanban',   label: 'Tableau de bord' },
  { id: 'list',     label: 'Candidatures'    },
  { id: 'contacts', label: 'Contacts'        },
  { id: 'agenda',   label: 'Entretiens'      },
];

const AGENDA_ITEMS: { id: View; label: string }[] = [
  { id: 'calendar',         label: 'Calendrier' },
  { id: 'actions',          label: 'Événements' },
  { id: 'personal_actions', label: 'Actions'    },
];

const OUTILS_ITEMS: { id: View; label: string }[] = [
  { id: 'stats', label: 'Statistiques' },
];

export default function Sidebar({
  view, setView, firstName, userEmail,
  jobCount, contactCount, interviewCount, onSettings,
}: SidebarProps) {
  const router = useRouter();
  const isAdmin = userEmail === 'emmanuelle.gonidec@gmail.com';

  // --- Comportement mobile : menu repliable ---
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  // Choisir une vue : sur mobile, on referme le menu ensuite
  const selectView = (v: View) => {
    setView(v);
    if (isMobile) setMenuOpen(false);
  };

  // Naviguer vers une page : idem, on referme sur mobile
  const go = (path: string) => {
    router.push(path);
    if (isMobile) setMenuOpen(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (isMobile) setMenuOpen(false);
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

  const navBtnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    padding: '9px 12px',
    border: 'none',
    borderLeft: '3px solid transparent',
    borderRadius: 0,
    background: 'transparent',
    color: '#aaa',
    fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.12s',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: '#aaa',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    padding: '16px 8px 8px',
  };

  const renderItems = (items: { id: View; label: string }[]) =>
    items.map((item) => {
      const isActive = view === item.id;
      return (
        <button
          key={item.id}
          onClick={() => selectView(item.id)}
          style={{
            ...navBtnBase,
            borderLeft: isActive ? '3px solid #E8151B' : '3px solid transparent',
            background: isActive ? '#1c1c1c' : 'transparent',
            color: isActive ? '#fff' : '#aaa',
            fontWeight: isActive ? 700 : 500,
          }}
          onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; } }}
          onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; } }}
        >
          {item.label}
        </button>
      );
    });

  // Style de l'aside : fixe et repliable sur mobile, collé à gauche sur ordinateur
  const asideStyle: React.CSSProperties = isMobile
    ? {
        width: 260, minWidth: 260,
        background: '#0f0f0f',
        display: 'flex', flexDirection: 'column',
        height: '100dvh',
        position: 'fixed', top: 0, left: 0, zIndex: 55,
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.22s ease',
        fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
        borderRight: '1px solid #1e1e1e',
        overflow: 'hidden',
      }
    : {
        width: 200, minWidth: 200,
        background: '#0f0f0f',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0,
        fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
        borderRight: '1px solid #1e1e1e',
        overflow: 'hidden',
      };

  return (
    <>
      {/* Bouton burger : visible uniquement sur mobile, quand le menu est fermé */}
      {isMobile && !menuOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          style={{
            position: 'fixed', top: 12, left: 12, zIndex: 50,
            width: 44, height: 44,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            background: '#111',
            border: '2px solid #F5C400', borderRadius: 8,
            boxShadow: '3px 3px 0 #F5C400',
            cursor: 'pointer',
          }}
        >
          <span style={{ width: 20, height: 2.5, background: '#fff', borderRadius: 2 }} />
          <span style={{ width: 20, height: 2.5, background: '#fff', borderRadius: 2 }} />
          <span style={{ width: 20, height: 2.5, background: '#fff', borderRadius: 2 }} />
        </button>
      )}

      {/* Fond sombre derrière le menu ouvert (mobile) : un clic ferme le menu */}
      {isMobile && menuOpen && (
        <div
          onClick={closeMenu}
          style={{
            position: 'fixed', inset: 0, zIndex: 54,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      <aside style={asideStyle}>

        {/* Logo (+ bouton fermer sur mobile) */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 16px 16px', borderBottom: '1px solid #1e1e1e', flexShrink: 0,
        }}>
          <div onClick={() => go('/')} style={{ cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Jean </span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#F5C400' }}>find my Job</span>
          </div>
          {isMobile && (
            <button
              onClick={closeMenu}
              aria-label="Fermer le menu"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#fff', fontSize: 22, lineHeight: 1, padding: '0 4px',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>

          {/* SUIVI */}
          <div style={{ ...sectionLabel, paddingTop: '0px' }}>Suivi</div>
          {renderItems(SUIVI_ITEMS)}

          {/* AGENDA */}
          <div style={sectionLabel}>Agenda</div>
          {renderItems(AGENDA_ITEMS)}

          {/* OUTILS */}
          <div style={sectionLabel}>Outils</div>
          {renderItems(OUTILS_ITEMS)}

          <button
            onClick={() => go('/dashboard/synthese')}
            style={{ ...navBtnBase }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
          >
            Synthèse
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => go('/dashboard/editor')}
                style={{ ...navBtnBase }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
              >
                CV Creator
              </button>
              <button
                onClick={() => go('/dashboard/cv-creator')}
                style={{ display: 'flex', alignItems: 'center', padding: '6px 10px 6px 22px', border: 'none', borderLeft: '3px solid transparent', borderRadius: 0, background: 'transparent', color: '#aaa', fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontWeight: 500, fontSize: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F5C400'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
              >
                Mes CV
              </button>
            </>
          )}

          <button
            onClick={() => go('/dashboard/help')}
            style={{ ...navBtnBase }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#161616'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
          >
            Help
          </button>

        </div>

        {/* Profil + déconnexion */}
        <div style={{ borderTop: '1px solid #1e1e1e', padding: '10px 10px 8px', flexShrink: 0 }}>
          <button
            onClick={() => go('/dashboard/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 12px',
              border: '1px solid #242424', borderRadius: 8,
              background: 'transparent', cursor: 'pointer',
              fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", transition: 'all 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5C400'; (e.currentTarget as HTMLButtonElement).style.background = '#161616'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#242424'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8151B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontWeight: 500, fontSize: 11, color: '#555' }}>Mon profil</div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 12px', marginTop: 2,
              border: 'none', borderRadius: 6,
              background: 'transparent', color: '#aaa',
              fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", fontWeight: 600, fontSize: 12,
              cursor: 'pointer', transition: 'color 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E8151B'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#aaa'}
          >
            ⎋ Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
