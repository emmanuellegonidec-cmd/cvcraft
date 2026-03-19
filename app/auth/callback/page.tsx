'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      )

      if (error) {
        console.error(error)
        router.replace('/auth/login')
        return
      }

      router.replace('/dashboard')
    }

    handleAuthCallback()
  }, [router])

  return <p>Connexion en cours...</p>
}