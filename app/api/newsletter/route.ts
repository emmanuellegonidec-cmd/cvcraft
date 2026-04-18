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
        <div style="margin:0;padding:32px 16px;background:#f3f3f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:2px solid #111;border-radius:20px;padding:36px 28px;">
            <div style="text-align:center;margin-bottom:24px;">
              <img
                src="https://jeanfindmyjob.fr/logo.png"
                alt="Jean find my Job"
                style="max-width:200px;height:auto;"
              />
            </div>
            <h2 style="margin:0 0 18px 0;font-size:28px;line-height:1.2;color:#111;text-align:center;font-weight:900;letter-spacing:-0.3px;">
              Bienvenue dans la communauté ! 🎉
            </h2>
            <p style="margin:0 0 16px 0;font-size:16px;color:#222;">
              Bonjour,
            </p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#222;">
              Merci pour votre inscription à la newsletter de <strong>Jean find my Job</strong>. Vous allez recevoir nos meilleurs conseils pour booster votre recherche d'emploi.
            </p>
            <p style="margin:0 0 24px 0;font-size:16px;color:#222;">
              Au programme : conseils pratiques, tendances du marché, stratégies d'entretien et bien plus encore.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a
                href="https://jeanfindmyjob.fr"
                style="display:inline-block;padding:16px 28px;background:#000;color:#fff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:800;border:2px solid #ff2a2a;"
              >
                Découvrir Jean find my Job →
              </a>
            </div>
            <p style="margin:0;font-size:15px;color:#222;">
              À très vite 👇<br />
              <strong>L'équipe Jean find my Job</strong>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ message: 'Inscription réussie !' }, { status: 200 })

  } catch (error) {
    console.error('Erreur newsletter:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
