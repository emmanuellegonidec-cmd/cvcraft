import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'

async function getUsers() {
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Récupère tous les profils
  const { data: profiles } = await adminClient
    .from('user_profiles')
    .select('user_id, first_name, last_name, current_title, created_at')
    .order('created_at', { ascending: false })

  // Récupère le nombre d'offres par utilisateur
  const { data: jobCounts } = await adminClient
    .from('jobs')
    .select('user_id')

  // Récupère les emails depuis auth.users via l'API admin
  const { data: authData } = await adminClient.auth.admin.listUsers()
  const authUsers = authData?.users ?? []

  // Construit la liste complète
  const usersMap = new Map(authUsers.map((u) => [u.id, u]))

  const jobCountMap: Record<string, number> = {}
  for (const j of jobCounts ?? []) {
    jobCountMap[j.user_id] = (jobCountMap[j.user_id] ?? 0) + 1
  }

  // Fusionne profils + auth users
  const allUsers = authUsers.map((authUser) => {
    const profile = profiles?.find((p) => p.user_id === authUser.id)
    return {
      id: authUser.id,
      email: authUser.email ?? '—',
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      current_title: profile?.current_title ?? '',
      created_at: authUser.created_at,
      last_sign_in: authUser.last_sign_in_at ?? null,
      job_count: jobCountMap[authUser.id] ?? 0,
    }
  })

  return allUsers
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-black mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}
          >
            👥 Utilisateurs
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            {users.length} compte{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div
        className="bg-white rounded overflow-hidden"
        style={{ border: '2px solid #111', boxShadow: '4px 4px 0px #111' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#111', color: '#F5C400' }}>
              <th
                className="text-left px-4 py-3 font-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Utilisateur
              </th>
              <th
                className="text-left px-4 py-3 font-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Email
              </th>
              <th
                className="text-left px-4 py-3 font-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Poste actuel
              </th>
              <th
                className="text-left px-4 py-3 font-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Offres
              </th>
              <th
                className="text-left px-4 py-3 font-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Inscrit le
              </th>
              <th
                className="text-left px-4 py-3 font-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Dernière connexion
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Aucun utilisateur inscrit
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const initials = user.first_name && user.last_name
                  ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                  : user.email[0].toUpperCase()

                const fullName = user.first_name || user.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : '—'

                return (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100"
                    style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    {/* Avatar + nom */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                          style={{ backgroundColor: '#E8151B', fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {initials}
                        </div>
                        <span className="font-semibold text-gray-800">{fullName}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>

                    {/* Poste */}
                    <td className="px-4 py-3 text-gray-500">{user.current_title || '—'}</td>

                    {/* Nb offres */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded font-black text-sm"
                        style={{
                          backgroundColor: user.job_count > 0 ? '#F5C400' : '#f3f4f6',
                          color: '#111',
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                      >
                        {user.job_count}
                      </span>
                    </td>

                    {/* Date inscription */}
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>

                    {/* Dernière connexion */}
                    <td className="px-4 py-3 text-gray-400">
                      {user.last_sign_in
                        ? new Date(user.last_sign_in).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
