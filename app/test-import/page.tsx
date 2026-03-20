'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function TestImportPage() {
  const [url, setUrl] = useState('https://www.linkedin.com/jobs/view/4377866568/')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleImport() {
    try {
      setLoading(true)
      setResult(null)

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const res = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      setResult({
        status: res.status,
        data,
      })
    } catch (error) {
      setResult({
        status: 'error',
        data: String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <h1>Test import offre</h1>

      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{
          width: '100%',
          padding: 12,
          fontSize: 16,
          marginTop: 16,
          marginBottom: 16,
        }}
      />

      <button
        onClick={handleImport}
        disabled={loading}
        style={{
          padding: '12px 16px',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        {loading ? 'Import en cours...' : 'Importer'}
      </button>

      {result && (
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f5f5f5',
            border: '1px solid #ddd',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  )
}