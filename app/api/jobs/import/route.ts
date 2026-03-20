import { createClient } from '@/lib/supabase/server'
import { importJobFromUrl } from '@/lib/job-import-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const url = String(body?.url || '').trim()

    const supabase = await createClient()

    let userId: string | null = null
    let accessToken: string | null = null

    const authHeader = request.headers.get('authorization')

    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.replace('Bearer ', '').trim()

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken)

      if (!error && user) {
        userId = user.id
      }
    }

    if (!userId) {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        userId = session.user.id
        accessToken = session.access_token
      }
    }

    if (!userId || !accessToken) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const result = await importJobFromUrl({
      url,
      userId,
      accessToken,
    })

    if (!result.success) {
      return Response.json(result, { status: 400 })
    }

    return Response.json(result, { status: 200 })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}