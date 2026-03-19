'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Connexion en cours...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      setMessage(`Code trouvé : ${code ? 'oui' : 'non'}`)

      if (!code) {
        setMessage('Aucun code trouvé dans l’URL')
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        setMessage(`Erreur exchangeCodeForSession : ${error.message}`)
        return
      }

      const { data } = await supabase.auth.getSession()

      if (data.session) {
        setMessage('Session créée avec succès. Redirection...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        setMessage('Pas de session après confirmation')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h2>Diagnostic callback</h2>
      <p>{message}</p>
    </div>
  )
}