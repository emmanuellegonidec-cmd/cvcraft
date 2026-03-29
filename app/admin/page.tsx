'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Stats = {
  totalUsers: number
  newUsersThisMonth: number
  totalJobs: number
  newJobsThisMonth: number
  activationRate: number
  publishedArticles: number
  recentUsers: { id: string; email: string; first_name?: string; last_name?: string; created_at: string }[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/auth/login')
        return
      }

      // Vérifie si admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', session.user.email!)
        .single()

      if (!adminUser) {
        router.replace('/dashboard')
        return
      }

      setAuthorized(true)

      // Charge les stats via l'API
      try {
        const res = await fetch('/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (e) {
        console.error('Erreur chargement stats', e)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 font-semibold text-sm">Chargement...</div>
      </div>
    )
  }

  const statCards = [
    { label: 'Inscrits total', value: stats?.totalUsers ?? 0, sub: `+${stats?.newUsersThisMonth ?? 0} ce mois`, color: '#F5C400', icon: '👥' },
    { label: 'Offres créées', value: stats?.totalJobs ?? 0, sub: `+${stats?.newJobsThisMonth ?? 0} ce mois`, color: '#E8151B', icon: '💼' },
    { label: "Taux d'activation", value: `${stats?.activationRate ?? 0}%`, sub: 'Inscrits avec ≥1 offre', color: '#22c55e', icon: '🚀' },
    { label: 'Articles publiés', value: stats?.publishedArticles ?? 0, sub: 'Sur la landing page', color: '#6366f1', icon: '✍️' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}>
        Tableau de bord
      </h1>
      <p className="text-gray-500 mb-8 text-sm font-medium">Vue d'ensemble de Jean Find My Job</p>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded" style={{ border: '2px solid #111', boxShadow: '4px 4px 0px #111' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: card.color, color: '#111' }}>↑</span>
            </div>
            <div className="text-4xl font-black mb-1" style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}>{card.value}</div>
            <div className="text-sm font-bold text-gray-700">{card.label}</div>
            <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Derniers inscrits */}
      <div className="bg-white rounded p-6" style={{ border: '2px solid #111', boxShadow: '4px 4px 0px #111' }}>
        <h2 className="text-lg font-black mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>👤 Derniers inscrits</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-2 font-bold text-gray-500">Nom</th>
              <th className="text-left py-2 font-bold text-gray-500">Email</th>
              <th className="text-left py-2 font-bold text-gray-500">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {!stats?.recentUsers?.length ? (
              <tr><td colSpan={3} className="py-6 text-center text-gray-400">Aucun inscrit pour l'instant</td></tr>
            ) : (
              stats.recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium">
                    {u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : '—'}
                  </td>
                  <td className="py-3 text-gray-600">{u.email}</td>
                  <td className="py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
