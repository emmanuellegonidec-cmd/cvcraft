import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false

  const adminClient = getAdminClient()
  const { data } = await adminClient
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .single()

  return !!data
}

export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { subject, body } = await req.json()
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Objet et message obligatoires' }, { status: 400 })
  }

  const adminClient = getAdminClient()

  // Récupère tous les emails inscrits à la newsletter
  const { data: subscribers, error } = await adminClient
    .from('newsletter_subscribers')
    .select('email')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const emails = (subscribers ?? []).map((s: { email: string }) => s.email)
  const recipientsCount = emails.length

  // Log l'envoi dans email_broadcasts
  await adminClient.from('email_broadcasts').insert({
    subject: subject.trim(),
    body: body.trim(),
    recipients_count: recipientsCount,
    status: 'sent',
    sent_at: new Date().toISOString(),
  })

  // TODO : intégration Resend ou autre service email
  // Pour l'instant on logue et on retourne le succès
  // Exemple avec Resend :
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await Promise.all(emails.map(email =>
  //   resend.emails.send({
  //     from: 'contact@jeanfindmyjob.fr',
  //     to: email,
  //     subject: subject.trim(),
  //     text: body.trim(),
  //   })
  // ))

  console.log(`[BROADCAST] Email "${subject}" préparé pour ${recipientsCount} inscrits`)
  console.log('Destinataires :', emails)

  return NextResponse.json({
    success: true,
    recipients_count: recipientsCount,
    message: `Email enregistré pour ${recipientsCount} inscrits.`,
  })
}
