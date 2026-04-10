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

  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const allUsers = authData?.users ?? []
  const totalUsers = allUsers.length
  const newUsersThisMonth = allUsers.filter(u =>
    new Date(u.created_at) >= new Date(firstDayOfMonth)
  ).length

  const { count: totalJobs } = await adminClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const { count: newJobsThisMonth } = await adminClient
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth)

  const { data: jobUsers } = await adminClient
    .from('jobs')
    .select('user_id')
  const uniqueJobUsers = new Set((jobUsers ?? []).map((j: { user_id: string }) => j.user_id))
  const usersWithJobs = uniqueJobUsers.size

  const { count: publishedArticles } = await adminClient
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)

  const { count: newsletterSubscribers } = await adminClient
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })

  const { count: bugReports } = await adminClient
    .from('bug_reports')
    .select('*', { count: 'exact', head: true })

  const { data: recentUsers } = await adminClient
    .from('profiles')
    .select('id, email, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const activationRate = totalUsers ? Math.round((usersWithJobs / totalUsers) * 100) : 0

  return NextResponse.json({
    totalUsers,
    newUsersThisMonth,
    totalJobs: totalJobs ?? 0,
    newJobsThisMonth: newJobsThisMonth ?? 0,
    activationRate,
    publishedArticles: publishedArticles ?? 0,
    newsletterSubscribers: newsletterSubscribers ?? 0,
    bugReports: bugReports ?? 0,
    recentUsers: recentUsers ?? [],
  })
}