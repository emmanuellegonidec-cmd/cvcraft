import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifie si déjà inscrit
    const { data: existing } = await adminClient
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Déjà inscrit !' }, { status: 200 })
    }

    // Inscrit en base
    const { error: dbError } = await adminClient
      .from('newsletter_subscribers')
      .insert({ email })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Email de confirmation via Resend
    await resend.emails.send({
      from: 'Jean find my Job <hello@jeanfindmyjob.fr>',
      to: email,
      subject: '🎉 Bienvenue dans la communauté Jean find my Job !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:2px solid #111;border-radius:12px;overflow:hidden;box-shadow:4px 4px 0 #111;max-width:600px;">
                  
                  <!-- Header avec logo -->
                  <tr>
                    <td style="background:#111;padding:28px 32px;text-align:center;">
                      <img 
                        src="https://jeanfindmyjob.fr/logo.png" 
                        alt="Jean find my Job" 
                        width="120"
                        style="height:auto;display:block;margin:0 auto;"
                      />
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 32px;">
                      <h1 style="font-size:24px;font-weight:900;color:#111;margin:0 0 16px;letter-spacing:-0.02em;">
                        Bienvenue dans la communauté ! 🎉
                      </h1>
                      <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 16px;">
                        Merci de vous être inscrit à la newsletter de <strong>Jean find my Job</strong>. Vous recevrez nos meilleurs conseils pour booster votre recherche d'emploi.
                      </p>
                      <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 32px;">
                        Au programme : conseils pratiques, tendances du marché, stratégies d'entretien, et bien plus encore.
                      </p>

                      <!-- CTA centré -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="background:#111;border-radius:8px;box-shadow:3px 3px 0 #E8151B;">
                                  <a href="https://jeanfindmyjob.fr" style="display:inline-block;padding:14px 32px;color:#F5C400;font-weight:800;font-size:14px;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;letter-spacing:0.02em;white-space:nowrap;">
                                    Go Jean find my Job ! →
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#fafafa;border-top:2px solid #f0f0f0;padding:20px 32px;text-align:center;">
                      <p style="font-size:12px;color:#888;margin:0;">
                        © 2026 Jean find my Job · Propulsé par Claude AI<br>
                        <a href="https://jeanfindmyjob.fr" style="color:#E8151B;text-decoration:none;">jeanfindmyjob.fr</a>
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

    return NextResponse.json({ message: 'Inscription réussie !' }, { status: 200 })

  } catch (error) {
    console.error('Erreur newsletter:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
