import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('email')
    .eq('email', user.email!)
    .single()

  if (!adminUser) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalUsers },
    { count: newUsersThisMonth },
    { count: totalJobs },
    { count: newJobsThisMonth },
    { count: usersWithJobs },
    { count: publishedArticles },
    { count: newsletterSubscribers },
    { data: recentUsers },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).in('id',
      (await supabaseAdmin.from('jobs').select('user_id')).data?.map((j: { user_id: string }) => j.user_id) ?? []
    ),
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('published', true),
    supabaseAdmin.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('id, email, first_name, last_name, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  const activationRate = totalUsers ? Math.round(((usersWithJobs ?? 0) / totalUsers) * 100) : 0

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    newUsersThisMonth: newUsersThisMonth ?? 0,
    totalJobs: totalJobs ?? 0,
    newJobsThisMonth: newJobsThisMonth ?? 0,
    activationRate,
    publishedArticles: publishedArticles ?? 0,
    newsletterSubscribers: newsletterSubscribers ?? 0,
    recentUsers: recentUsers ?? [],
  })
}