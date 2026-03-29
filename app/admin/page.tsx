import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function checkAdminAndGetStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Vérifie que l'email est dans admin_users
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('email')
    .eq('email', user.email!)
    .single()

  if (!adminUser) {
    redirect('/dashboard')
  }

  // Stats
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count: totalUsers } = await adminClient
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  const { count: newUsersThisMonth } = await adminClient
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth)

  const { count: totalJobs } = await adminClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const { count: newJobsThisMonth } = await adminClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth)

  const { data: jobsData } = await adminClient
    .from('jobs')
    .select('user_id')

  const activeUsers = Array.from(new Set((jobsData ?? []).map((j: { user_id: string }) => j.user_id))).length
  const activationRate = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0

  const { data: recentUsers } = await adminClient
    .from('user_profiles')
    .select('user_id, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  // Récupère les emails des utilisateurs récents
  const recentUsersWithEmail = await Promise.all(
    (recentUsers ?? []).map(async (u: { user_id: string; first_name?: string; last_name?: string; created_at: string }) => {
      const { data: authUser } = await adminClient.auth.admin.getUserById(u.user_id)
      return {
        ...u,
        email: authUser?.user?.email ?? '—',
      }
    })
  )

  const { count: publishedArticles } = await adminClient
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)

  return {
    totalUsers: totalUsers ?? 0,
    newUsersThisMonth: newUsersThisMonth ?? 0,
    totalJobs: totalJobs ?? 0,
    newJobsThisMonth: newJobsThisMonth ?? 0,
    activationRate,
    recentUsers: recentUsersWithEmail,
    publishedArticles: publishedArticles ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await checkAdminAndGetStats()

  const statCards = [
    { label: 'Inscrits total', value: stats.totalUsers, sub: `+${stats.newUsersThisMonth} ce mois`, color: '#F5C400', icon: '👥' },
    { label: 'Offres créées', value: stats.totalJobs, sub: `+${stats.newJobsThisMonth} ce mois`, color: '#E8151B', icon: '💼' },
    { label: "Taux d'activation", value: `${stats.activationRate}%`, sub: 'Inscrits avec ≥1 offre', color: '#22c55e', icon: '🚀' },
    { label: 'Articles publiés', value: stats.publishedArticles, sub: 'Sur la landing page', color: '#6366f1', icon: '✍️' },
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
            {stats.recentUsers.length === 0 ? (
              <tr><td colSpan={3} className="py-6 text-center text-gray-400">Aucun inscrit pour l'instant</td></tr>
            ) : (
              stats.recentUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-gray-50 hover:bg-gray-50">
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
