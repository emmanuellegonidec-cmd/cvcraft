import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AdminNav from '@/components/admin/AdminNav'

type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Vérifie que l'utilisateur est connecté
  // Pattern identique à lib/supabase/server.ts
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 2. Vérifie que l'email est dans admin_users
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('email')
    .eq('email', user.email!)
    .single()

  if (!adminUser) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminNav />
      <main className="flex-1 p-8 ml-64">
        {children}
      </main>
    </div>
  )
}
