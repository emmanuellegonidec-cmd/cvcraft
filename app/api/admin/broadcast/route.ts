import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  // Récupère tous les emails inscrits
  const { data: subscribers } = await adminClient
    .from('newsletter_subscribers')
    .select('email')

  const emails = (subscribers ?? []).map((s: { email: string }) => s.email)
  const recipientsCount = emails.length

  if (recipientsCount === 0) {
    return NextResponse.json({ error: 'Aucun inscrit à contacter' }, { status: 400 })
  }

  // Envoi via Resend — par batch de 50 pour éviter les limites
  const batchSize = 50
  let sentCount = 0
  let errorCount = 0

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (email) => {
        try {
          await resend.emails.send({
            from: 'Jean Find My Job <hello@jeanfindmyjob.fr>',
            to: email,
            subject: subject.trim(),
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:2px solid #111;border-radius:12px;overflow:hidden;box-shadow:4px 4px 0 #111;">
                        <tr>
                          <td style="background:#111;padding:24px 32px;">
                            <div style="font-size:22px;font-weight:900;color:#F5C400;font-family:'Helvetica Neue',Arial,sans-serif;">
                              JEAN <span style="color:#fff;">FIND MY JOB</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:32px;">
                            <div style="font-size:15px;color:#333;line-height:1.8;white-space:pre-wrap;">${body.trim()}</div>
                            <table cellpadding="0" cellspacing="0" style="margin-top:32px;">
                              <tr>
                                <td style="background:#111;border-radius:8px;box-shadow:3px 3px 0 #E8151B;">
                                  <a href="https://jeanfindmyjob.fr" style="display:inline-block;padding:12px 24px;color:#F5C400;font-weight:800;font-size:13px;text-decoration:none;">
                                    Accéder à mon espace →
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#fafafa;border-top:2px solid #f0f0f0;padding:16px 32px;text-align:center;">
                            <p style="font-size:11px;color:#aaa;margin:0;">
                              © 2026 Jean Find My Job · <a href="https://jeanfindmyjob.fr" style="color:#E8151B;text-decoration:none;">jeanfindmyjob.fr</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          })
          sentCount++
        } catch (e) {
          console.error(`Erreur envoi à ${email}:`, e)
          errorCount++
        }
      })
    )
  }

  // Log dans email_broadcasts
  await adminClient.from('email_broadcasts').insert({
    subject: subject.trim(),
    body: body.trim(),
    recipients_count: sentCount,
    status: errorCount > 0 ? 'partial' : 'sent',
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    recipients_count: sentCount,
    error_count: errorCount,
    message: `Email envoyé à ${sentCount} inscrits${errorCount > 0 ? ` (${errorCount} erreurs)` : ''}.`,
  })
}
