import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
async function checkAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.replace('Bearer ', '').trim()
  const adminClient = getAdminClient()
  const { data: { user }, error } = await adminClient.auth.getUser(token)
  if (error || !user?.email) return false
  const { data } = await adminClient
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .single()
  return !!data
}

export async function GET(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const adminClient = getAdminClient()
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Inscrits depuis auth.users (source fiable)
  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const allUsers = authData?.users ?? []
  const totalUsers = allUsers.length
  const newUsersThisMonth = allUsers.filter(u =>
    new Date(u.created_at) >= new Date(firstDayOfMonth)
  ).length

  // Offres créées
  const { count: totalJobs } = await adminClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const { count: newJobsThisMonth } = await adminClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth)

  // Taux d'activation
  const { data: jobsData } = await adminClient.from('jobs').select('user_id')
  const activeUsers = Array.from(new Set((jobsData ?? []).map((j: { user_id: string }) => j.user_id))).length
  const activationRate = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0

  // Articles publiés
  const { count: publishedArticles } = await adminClient
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)

  // Derniers inscrits
  const recentUsers = allUsers
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(u => ({
      id: u.id,
      email: u.email ?? '—',
      created_at: u.created_at,
    }))

  return NextResponse.json({
    totalUsers,
    newUsersThisMonth,
    totalJobs: totalJobs ?? 0,
    newJobsThisMonth: newJobsThisMonth ?? 0,
    activationRate,
    publishedArticles: publishedArticles ?? 0,
    recentUsers,
  })
}
