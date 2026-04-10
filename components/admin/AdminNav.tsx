'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/users', label: '👥 Utilisateurs' },
  { href: '/admin/articles', label: '✍️ Articles' },
  { href: "/admin/bugs", label: "🐛 Bugs", emoji: "🐛" },
  { href: '/admin/communication', label: '📣 Communication' },
]

export default function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed top-0 left-0 h-full w-64 flex flex-col"
      style={{
        backgroundColor: '#111',
        borderRight: '3px solid #F5C400',
      }}
    >
      {/* Logo */}
      <div
        className="p-6"
        style={{ borderBottom: '2px solid #F5C400' }}
      >
        <div
          className="text-xl font-black"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#F5C400' }}
        >
          JEAN
        </div>
        <div
          className="text-xs font-bold tracking-widest mt-1"
          style={{ color: '#fff', opacity: 0.6 }}
        >
          MODE ADMIN
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-4 py-3 rounded font-bold text-sm transition-all"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              backgroundColor: isActive(item.href, item.exact) ? '#F5C400' : 'transparent',
              color: isActive(item.href, item.exact) ? '#111' : '#fff',
              borderLeft: isActive(item.href, item.exact) ? '4px solid #E8151B' : '4px solid transparent',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '2px solid #333' }}>
        <Link
          href="/dashboard"
          className="flex items-center px-4 py-3 rounded font-bold text-sm transition-all"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            color: '#aaa',
            backgroundColor: 'transparent',
          }}
        >
          ← Retour à l'app
        </Link>
      </div>
    </nav>
  )
}
