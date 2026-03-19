'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (!code) {
        window.location.href = '/auth/login'
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Supabase callback error:', error)
        window.location.href = '/auth/login'
        return
      }

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 300)
    }

    handleAuthCallback()
  }, [])

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      Connexion en cours...
    </div>
  )
}