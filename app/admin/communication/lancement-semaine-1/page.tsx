'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CAPTION_1 = `Salut. On est Jean find my Job.

On vient tuer votre tableur Excel de candidatures. Faites vos adieux, soyez brefs.

Vous savez, celui avec 14 onglets, 3 couleurs incohérentes, et une colonne "À relancer" que vous n'ouvrez jamais. Oui, celui-là.

Jean find my Job, c'est le tableau de bord qu'on aurait voulu avoir pendant nos propres recherches. Vos candidatures rangées, relancées, scorées. Vous, vous vous occupez du reste.

À la place, on vous propose un tableau de bord visuel où vos candidatures vivent, bougent, et vous rappellent gentiment qu'il faut relancer Marie chez LVMH avant qu'elle ne vous oublie.

C'est gratuit. C'est français. C'est dispo maintenant.

→ jeanfindmyjob.fr

PS : on accepte les dons de vieux tableurs pour notre musée.

#JeanFindMyJob #SansLeChaos #RechercheDemploi #CVAvecJean`

const CAPTION_2 = `⚖️ Aujourd'hui, on juge votre tableur Excel de candidatures.

Trois chefs d'accusation. Trois faits avérés. Un verdict sans appel.

Swipez, c'est de la justice express.

(Le tableur n'a pas voulu se présenter pour sa défense. Il était en train de planter.)

#JeanFindMyJob #SansLeChaos #RechercheDemploi #OrganiseTaRecherche #KanbanCarrière`

const CAPTION_3 = `Visuel principal : "RIP EXCEL — 2007–aujourd'hui"

Sticker swipe-up / lien :
"Adieu à votre meilleur ennemi → jeanfindmyjob.fr"

Sticker question (interactif) :
"Combien d'onglets dans le vôtre ?"
[champ ouvert]`

const CAPTION_4 = `Sondage du dimanche. Soyez honnêtes, on ne juge pas. (Si.)

A · Une œuvre d'art codée en couleur 🎨
B · Honnêtement, c'est du bazar 😅
C · J'en ai pas, et c'est encore pire 🫠

Réponse en commentaire — on lit tout, on rigole avec vous, et on vous dit comment Jean range tout ça à votre place.

#JeanFindMyJob #SansLeChaos #RechercheDemploi`

export default function LancementSemaine1Page() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  const visual1 = useRef<HTMLDivElement>(null)
  const visual2 = useRef<HTMLDivElement>(null)
  const visual2Slides = useRef<(HTMLDivElement | null)[]>([])
  const visual3 = useRef<HTMLDivElement>(null)
  const visual4 = useRef<HTMLDivElement>(null)

  const downloadFromNode = async (
    node: HTMLElement | null,
    filename: string,
    targetWidth: number,
    targetHeight: number,
  ) => {
    if (!node) return
    const { toPng } = await import('html-to-image')
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
    const rect = node.getBoundingClientRect()
    const pixelRatio = Math.max(targetWidth / rect.width, targetHeight / rect.height)
    const dataUrl = await toPng(node, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: '#FAFAFA',
    })
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  const copyCaption = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied((c) => (c === idx ? null : c)), 2000)
  }

  const downloadPost1 = async () => {
    setBusy('1')
    try {
      await downloadFromNode(visual1.current, 'jean-post-1-arrivee.png', 1080, 1080)
    } finally {
      setBusy(null)
    }
  }

  const downloadPost2 = async () => {
    setBusy('2')
    try {
      for (let i = 0; i < visual2Slides.current.length; i++) {
        const slide = visual2Slides.current[i]
        if (!slide) continue
        await downloadFromNode(slide, `jean-post-2-slide-${i + 1}.png`, 1080, 1080)
      }
    } finally {
      setBusy(null)
    }
  }

  const downloadPost3 = async () => {
    setBusy('3')
    try {
      await downloadFromNode(visual3.current, 'jean-post-3-story.png', 1080, 1920)
    } finally {
      setBusy(null)
    }
  }

  const downloadPost4 = async () => {
    setBusy('4')
    try {
      await downloadFromNode(visual4.current, 'jean-post-4-sondage.png', 1080, 1080)
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth/login')
        return
      }
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', session.user.email!)
        .single()
      if (!adminUser) {
        router.replace('/dashboard')
        return
      }
      setAuthorized(true)
      setLoading(false)
    }
    init()
  }, [router])

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 font-semibold text-sm">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="-m-8">
      <style jsx>{`
        .head { background: #111; color: #fff; padding: 48px 32px; border-bottom: 3px solid #E8151B; }
        .head .eyb { display: inline-block; background: #F5C400; color: #111; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 18px; }
        .head h1 { font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 900; letter-spacing: -.03em; line-height: 1.05; margin: 0 0 14px; }
        .head h1 em { color: #F5C400; font-style: italic; }
        .head p { font-size: 15px; color: rgba(255,255,255,.75); max-width: 760px; margin: 0; font-weight: 500; line-height: 1.7; }
        .head .meta { display: flex; gap: 24px; margin-top: 24px; font-size: 11px; color: rgba(255,255,255,.6); font-weight: 700; text-transform: uppercase; letter-spacing: .08em; flex-wrap: wrap; }

        .wrap { max-width: 1320px; margin: 0 auto; padding: 48px 32px 80px; }

        .post { background: #fff; border: 2.5px solid #111; border-radius: 14px; box-shadow: 6px 6px 0 #111; margin-bottom: 36px; overflow: hidden; }
        .post-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 2px solid #111; background: #FEF9E0; flex-wrap: wrap; gap: 12px; }
        .ph-left { display: flex; align-items: center; gap: 14px; }
        .ph-num { width: 42px; height: 42px; border-radius: 50%; background: #E8151B; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; border: 2.5px solid #111; }
        .ph-meta-title { font-size: 16px; font-weight: 900; letter-spacing: -.01em; }
        .ph-meta-sub { font-size: 11px; color: #555; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }
        .ph-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .pl-tag { background: #fff; border: 2px solid #111; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; box-shadow: 2px 2px 0 #111; }

        .post-body { display: grid; grid-template-columns: 1fr 1.1fr; gap: 0; }
        .post-visual { background: #FAFAFA; padding: 30px; display: flex; align-items: center; justify-content: center; border-right: 2px solid #111; min-width: 0; overflow: hidden; }
        .post-text { padding: 30px; min-width: 0; }
        .post-text h3 { font-size: 11px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 10px; }
        .caption { background: #FAFAFA; border: 2px solid #111; border-radius: 10px; padding: 18px; font-size: 14px; line-height: 1.7; font-weight: 500; white-space: pre-wrap; box-shadow: 2px 2px 0 #111; }
        .caption :global(em) { color: #E8151B; font-style: italic; font-weight: 600; }
        .caption :global(b), .caption :global(strong) { font-weight: 800; color: #111; }
        .hashtags { margin-top: 14px; font-size: 12px; color: #0A66C2; font-weight: 600; line-height: 1.7; }
        .why { margin-top: 18px; background: #111; color: #fff; padding: 14px 16px; border-radius: 10px; font-size: 12px; line-height: 1.6; }
        .why :global(b) { color: #F5C400; text-transform: uppercase; letter-spacing: .06em; font-size: 10px; display: block; margin-bottom: 6px; font-weight: 800; }
        .why :global(em) { color: #F5C400; font-style: italic; }

        /* Square post */
        .sq { aspect-ratio: 1/1; width: 100%; max-width: 380px; border: 2.5px solid #111; border-radius: 10px; overflow: hidden; box-shadow: 5px 5px 0 #111; display: flex; }

        /* Post 1 visual */
        .sq-1 { background: #FAFAFA; padding: 7%; flex-direction: column; justify-content: space-between; }
        .sq-1 .eyb-pill { display: inline-block; background: #FEF9E0; border: 2px solid #111; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; box-shadow: 2px 2px 0 #111; align-self: flex-start; white-space: nowrap; line-height: 1.2; }
        .sq-1 h2 { font-size: 30px; font-weight: 900; letter-spacing: -.025em; line-height: 1.05; margin: 0; }
        .sq-1 h2 em { color: #E8151B; font-style: italic; }
        .sq-1 .strike { text-decoration: line-through; text-decoration-color: #E8151B; text-decoration-thickness: 3px; }
        .sq-1 .foot { display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; font-weight: 800; }
        .sq-1 .logo { color: #111; }
        .sq-1 .logo b { color: #E8151B; }

        /* Post 2 carousel */
        .car { display: flex; gap: 14px; width: 100%; max-width: 100%; overflow-x: auto; padding: 6px 6px 14px; scroll-snap-type: x mandatory; min-width: 0; }
        .slide { width: 320px; height: 320px; flex: none; border: 2.5px solid #111; border-radius: 10px; overflow: hidden; box-shadow: 4px 4px 0 #111; padding: 32px; display: flex; flex-direction: column; font-size: 28px; position: relative; scroll-snap-align: start; }
        .sl-cover { background: #111; color: #fff; justify-content: center; align-items: center; text-align: center; }
        .sl-cover .stamp { position: absolute; top: 18px; right: 18px; background: #E8151B; color: #fff; padding: 6px 14px; border: 2px solid #111; font-size: 14px; font-weight: 900; transform: rotate(8deg); text-transform: uppercase; letter-spacing: .04em; }
        .sl-cover .ti { font-size: 44px; font-weight: 900; letter-spacing: -.02em; line-height: 1.05; color: #fff; }
        .sl-cover .ti em { color: #F5C400; font-style: italic; }
        .sl-cover .swp { position: absolute; bottom: 22px; font-size: 14px; color: #F5C400; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
        .sl-body { background: #FAFAFA; justify-content: space-between; }
        .sl-body .n { font-size: 64px; font-weight: 900; color: #F5C400; -webkit-text-stroke: 2.5px #111; line-height: 1; }
        .sl-body .ti { font-size: 32px; font-weight: 900; letter-spacing: -.01em; line-height: 1.15; margin: 14px 0 10px; }
        .sl-body .ti em { color: #E8151B; font-style: italic; }
        .sl-body .bd { font-size: 19px; color: #555; font-weight: 600; line-height: 1.4; }
        .sl-end { background: #E8151B; color: #fff; justify-content: center; text-align: center; }
        .sl-end .ti { font-size: 36px; font-weight: 900; letter-spacing: -.02em; line-height: 1.1; margin-bottom: 18px; }
        .sl-end .cta { background: #F5C400; color: #111; padding: 10px 18px; border: 2px solid #111; border-radius: 8px; font-size: 16px; font-weight: 800; display: inline-block; align-self: center; line-height: 1.2; }

        /* Post 3 story burst */
        .story { aspect-ratio: 1080/1920; width: 100%; max-width: 240px; border: 2.5px solid #111; border-radius: 14px; overflow: hidden; box-shadow: 5px 5px 0 #111; background: #F5C400; background-image: radial-gradient(#111 1.5px, transparent 1.5px); background-size: 14px 14px; padding: 8%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; }
        .story .star { position: absolute; font-size: 26px; -webkit-text-stroke: 2px #111; color: #1A6FDB; }
        .story .s1 { top: 14px; left: 14px; }
        .story .s2 { bottom: 14px; right: 14px; color: #fff; }
        .story .burst { background: #E8151B; color: #fff; padding: 14px 18px; border: 3px solid #111; font-size: 22px; font-weight: 900; letter-spacing: -.02em; transform: rotate(-3deg); box-shadow: 5px 5px 0 #111; text-shadow: 2px 2px 0 #111; line-height: 1.05; margin-bottom: 14px; }
        .story .sub { background: #fff; border: 2px solid #111; padding: 6px 12px; font-size: 9px; font-weight: 800; transform: rotate(2deg); box-shadow: 3px 3px 0 #111; white-space: nowrap; line-height: 1.2; text-transform: uppercase; }

        /* Post 4 quiz */
        .sq-4 { background: #fff; padding: 7%; flex-direction: column; justify-content: space-between; }
        .sq-4 .tag { display: inline-block; background: #FDEAEA; border: 2px solid #E8151B; color: #E8151B; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; box-shadow: 2px 2px 0 #E8151B; align-self: flex-start; white-space: nowrap; line-height: 1.2; }
        .sq-4 h2 { font-size: 24px; font-weight: 900; letter-spacing: -.02em; line-height: 1.1; margin: 14px 0 0; }
        .sq-4 h2 em { color: #E8151B; font-style: italic; }
        .sq-4 .opts { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
        .sq-4 .opt { background: #FAFAFA; border: 2px solid #111; border-radius: 8px; padding: 8px 12px; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; box-shadow: 2px 2px 0 #111; }
        .sq-4 .opt .pct { font-size: 12px; font-weight: 900; color: #E8151B; }
        .sq-4 .quiz-foot { font-size: 9px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: .06em; align-self: flex-end; }

        .recap { background: #111; color: #fff; border-radius: 14px; padding: 36px; box-shadow: 6px 6px 0 #E8151B; margin-top: 24px; }
        .recap-eyb { font-size: 11px; font-weight: 800; color: #F5C400; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 14px; }
        .recap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
        .recap-num { font-size: 32px; font-weight: 900; color: #F5C400; line-height: 1; }
        .recap-label { font-size: 13px; font-weight: 700; margin-top: 6px; color: #fff; }
        .recap-sub { font-size: 11px; color: rgba(255,255,255,.6); margin-top: 4px; font-weight: 500; }

        .rules { background: #FEF9E0; border: 2.5px solid #111; border-radius: 14px; padding: 28px; box-shadow: 4px 4px 0 #111; margin-top: 24px; }
        .rules-eyb { font-size: 11px; font-weight: 800; color: #B8900A; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 10px; }
        .rules ul { margin: 0; padding-left: 22px; font-size: 14px; line-height: 1.9; font-weight: 500; }
        .rules ul :global(b) { font-weight: 800; }

        .actions { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; border: 2px solid #111; line-height: 1; }
        .btn:disabled { opacity: .5; cursor: not-allowed; }
        .btn-yellow { background: #F5C400; color: #111; box-shadow: 3px 3px 0 #111; }
        .btn-yellow:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #111; }
        .btn-dark { background: #111; color: #fff; box-shadow: 3px 3px 0 #E8151B; }
        .btn-dark:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #E8151B; }
        .btn-ok { background: #1A7A4A; color: #fff; box-shadow: 3px 3px 0 #111; }

        @media (max-width: 900px) {
          .post-body { grid-template-columns: 1fr; }
          .post-visual { border-right: none; border-bottom: 2px solid #111; }
          .slide { width: 280px; height: 280px; }
          .recap-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="head">
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <span className="eyb">Plan de Lancement · Semaine 1</span>
          <h1>4 posts pour <em>débarquer en chambrant</em></h1>
          <p>Direction &quot;coup de gueule&quot; mais ton léger : Jean râle contre votre tableur Excel, mais avec un clin d&apos;œil. Énergie Burger King vs McDo, pas manifeste révolutionnaire.</p>
          <div className="meta">
            <span>📅 Mar · Jeu · Ven · Dim</span>
            <span>📱 LinkedIn + IG + Story</span>
            <span>⏱️ Préparation : 2h</span>
          </div>
        </div>
      </header>

      <div className="wrap">
        {/* POST 1 */}
        <article className="post">
          <header className="post-header">
            <div className="ph-left">
              <div className="ph-num">1</div>
              <div>
                <div className="ph-meta-title">Mardi · 8h30 — Le post d&apos;arrivée</div>
                <div className="ph-meta-sub">Format · Post carré + caption longue</div>
              </div>
            </div>
            <div className="ph-tags">
              <span className="pl-tag">LinkedIn</span>
              <span className="pl-tag">Instagram</span>
              <span className="pl-tag">Facebook</span>
            </div>
          </header>
          <div className="post-body">
            <div className="post-visual">
              <div className="sq sq-1" ref={visual1}>
                <span className="eyb-pill">⚡ Bonjour</span>
                <h2>
                  On vient tuer votre tableur <em>Excel de candidatures.</em><br />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#555', letterSpacing: '-.01em', display: 'inline-block', marginTop: 10 }}>
                    Faites vos adieux, soyez brefs.
                  </span>
                </h2>
                <div className="foot">
                  <span className="logo">Jean <b>find my Job</b></span>
                  <span style={{ color: '#888' }}>@jeanfindmyjob</span>
                </div>
              </div>
            </div>
            <div className="post-text">
              <h3>📝 Caption</h3>
              <div className="caption">
                <b>Salut. On est Jean find my Job.</b>
                {'\n\n'}
                On vient tuer votre tableur Excel de candidatures. <em>Faites vos adieux, soyez brefs.</em>
                {'\n\n'}
                Vous savez, celui avec 14 onglets, 3 couleurs incohérentes, et une colonne &quot;À relancer&quot; que vous n&apos;ouvrez jamais. Oui, celui-là.
                {'\n\n'}
                <b>Jean find my Job</b>, c&apos;est le tableau de bord qu&apos;on aurait voulu avoir pendant nos propres recherches. <em>Vos candidatures rangées, relancées, scorées. Vous, vous vous occupez du reste.</em>
                {'\n\n'}
                À la place, on vous propose un tableau de bord visuel où vos candidatures vivent, bougent, et vous rappellent gentiment qu&apos;il faut relancer Marie chez LVMH avant qu&apos;elle ne vous oublie.
                {'\n\n'}
                C&apos;est gratuit. C&apos;est français. C&apos;est dispo maintenant.
                {'\n\n'}
                → jeanfindmyjob.fr
                {'\n\n'}
                PS : on accepte les dons de vieux tableurs pour notre musée.
              </div>
              <div className="hashtags">#JeanFindMyJob #SansLeChaos #RechercheDemploi #CVAvecJean</div>
              <div className="actions">
                <button className={`btn ${copied === 1 ? 'btn-ok' : 'btn-yellow'}`} onClick={() => copyCaption(CAPTION_1, 1)}>
                  {copied === 1 ? '✓ Copié' : '📋 Copier la caption'}
                </button>
                <button className="btn btn-dark" onClick={downloadPost1} disabled={busy === '1'}>
                  {busy === '1' ? '⏳ Génération…' : '🖼️ Télécharger le visuel (1080×1080)'}
                </button>
              </div>
              <div className="why">
                <b>🎯 Pourquoi ça marche</b>
                L&apos;humour désamorce le pitch. &quot;Tuer votre tableur avec amour&quot; + le PS musée = on retient. Le post n&apos;est pas vendeur, il est <em>vivant</em>. Reprenez la même structure pour LinkedIn (vouvoiement) et IG (tutoiement).
              </div>
            </div>
          </div>
        </article>

        {/* POST 2 */}
        <article className="post">
          <header className="post-header">
            <div className="ph-left">
              <div className="ph-num">2</div>
              <div>
                <div className="ph-meta-title">Jeudi · 18h — Le procès du tableur</div>
                <div className="ph-meta-sub">Format · Carrousel 5 slides</div>
              </div>
            </div>
            <div className="ph-tags">
              <span className="pl-tag">Instagram</span>
              <span className="pl-tag">LinkedIn</span>
            </div>
          </header>
          <div className="post-body">
            <div className="post-visual">
              <div className="car" ref={visual2}>
                <div className="slide sl-cover" style={{ background: '#111', color: '#fff' }} ref={(el) => { visual2Slides.current[0] = el }}>
                  <div className="stamp">Procès</div>
                  <div className="ti">Le procès<br />de votre <em>tableur.</em></div>
                  <div className="swp">Swipe →</div>
                </div>
                <div className="slide sl-body" style={{ background: '#FAFAFA' }} ref={(el) => { visual2Slides.current[1] = el }}>
                  <div className="n">01</div>
                  <div>
                    <div className="ti">Il vous <em>ment.</em></div>
                    <div className="bd">&quot;Relance faite ✓&quot; — date : il y a 23 jours.</div>
                  </div>
                </div>
                <div className="slide sl-body" style={{ background: '#FAFAFA' }} ref={(el) => { visual2Slides.current[2] = el }}>
                  <div className="n">02</div>
                  <div>
                    <div className="ti">Il vous <em>épuise.</em></div>
                    <div className="bd">14 onglets. Personne n&apos;a 14 onglets de joie.</div>
                  </div>
                </div>
                <div className="slide sl-body" style={{ background: '#FAFAFA' }} ref={(el) => { visual2Slides.current[3] = el }}>
                  <div className="n">03</div>
                  <div>
                    <div className="ti">Il vous <em>ghoste.</em></div>
                    <div className="bd">Aucun rappel, aucune notif. Il s&apos;en fiche.</div>
                  </div>
                </div>
                <div className="slide sl-end" style={{ background: '#E8151B', color: '#fff' }} ref={(el) => { visual2Slides.current[4] = el }}>
                  <div className="ti">Verdict :<br />remplacé.</div>
                  <div className="cta">Découvrir Jean →</div>
                </div>
              </div>
            </div>
            <div className="post-text">
              <h3>📝 Caption</h3>
              <div className="caption">
                ⚖️ <b>Aujourd&apos;hui, on juge votre tableur Excel de candidatures.</b>
                {'\n\n'}
                Trois chefs d&apos;accusation. <em>Trois faits avérés.</em> Un verdict sans appel.
                {'\n\n'}
                Swipez, c&apos;est de la justice express.
                {'\n\n'}
                (Le tableur n&apos;a pas voulu se présenter pour sa défense. Il était en train de planter.)
              </div>
              <div className="hashtags">#JeanFindMyJob #SansLeChaos #RechercheDemploi #OrganiseTaRecherche #KanbanCarrière</div>
              <div className="actions">
                <button className={`btn ${copied === 2 ? 'btn-ok' : 'btn-yellow'}`} onClick={() => copyCaption(CAPTION_2, 2)}>
                  {copied === 2 ? '✓ Copié' : '📋 Copier la caption'}
                </button>
                <button className="btn btn-dark" onClick={downloadPost2} disabled={busy === '2'}>
                  {busy === '2' ? '⏳ Génération…' : '🖼️ Télécharger les 5 slides (1080×1080)'}
                </button>
              </div>
              <div className="why">
                <b>🎯 Pourquoi ça marche</b>
                Le format &quot;procès&quot; est un cliché instantanément lisible. Il transforme un post produit en un mini-spectacle. La parenthèse finale (&quot;il était en train de planter&quot;) est ce qui fait sourire et partager.
              </div>
            </div>
          </div>
        </article>

        {/* POST 3 */}
        <article className="post">
          <header className="post-header">
            <div className="ph-left">
              <div className="ph-num">3</div>
              <div>
                <div className="ph-meta-title">Vendredi · 12h — Le coup d&apos;éclat</div>
                <div className="ph-meta-sub">Format · Story IG (24h)</div>
              </div>
            </div>
            <div className="ph-tags">
              <span className="pl-tag">Instagram Story</span>
            </div>
          </header>
          <div className="post-body">
            <div className="post-visual">
              <div className="story" ref={visual3}>
                <div className="star s1">★</div>
                <div className="burst">RIP<br />EXCEL</div>
                <div className="sub">2007 – aujourd&apos;hui</div>
                <div className="star s2">★</div>
              </div>
            </div>
            <div className="post-text">
              <h3>📝 Texte sur la story</h3>
              <div className="caption">
                <b>Visuel principal :</b> &quot;RIP EXCEL — 2007–aujourd&apos;hui&quot;
                {'\n\n'}
                <b>Sticker swipe-up / lien :</b>
                {'\n'}
                &quot;Adieu à votre meilleur ennemi → jeanfindmyjob.fr&quot;
                {'\n\n'}
                <b>Sticker question (interactif) :</b>
                {'\n'}
                &quot;Combien d&apos;onglets dans le vôtre ?&quot;
                {'\n'}
                [champ ouvert]
              </div>
              <div className="actions">
                <button className={`btn ${copied === 3 ? 'btn-ok' : 'btn-yellow'}`} onClick={() => copyCaption(CAPTION_3, 3)}>
                  {copied === 3 ? '✓ Copié' : '📋 Copier le texte'}
                </button>
                <button className="btn btn-dark" onClick={downloadPost3} disabled={busy === '3'}>
                  {busy === '3' ? '⏳ Génération…' : '🖼️ Télécharger la story (1080×1920)'}
                </button>
              </div>
              <div className="why">
                <b>🎯 Pourquoi ça marche</b>
                Une story doit être <em>instantanée</em>. &quot;RIP EXCEL&quot; se lit en 0,3s, fait sourire, et le sticker question récolte de la matière première pour vos prochains posts (&quot;on a reçu 47 réponses, le record c&apos;est 23 onglets&quot;). Recyclable à l&apos;infini.
              </div>
            </div>
          </div>
        </article>

        {/* POST 4 */}
        <article className="post">
          <header className="post-header">
            <div className="ph-left">
              <div className="ph-num">4</div>
              <div>
                <div className="ph-meta-title">Dimanche · 19h — Le sondage</div>
                <div className="ph-meta-sub">Format · Post carré interactif</div>
              </div>
            </div>
            <div className="ph-tags">
              <span className="pl-tag">Instagram</span>
              <span className="pl-tag">LinkedIn (sondage natif)</span>
            </div>
          </header>
          <div className="post-body">
            <div className="post-visual">
              <div className="sq sq-4" ref={visual4}>
                <span className="tag">📊 Sondage du dimanche</span>
                <h2>Votre tableur de candidatures, <em>il ressemble à quoi ?</em></h2>
                <div className="opts">
                  <div className="opt"><span>A · Une œuvre d&apos;art</span><span className="pct">8 %</span></div>
                  <div className="opt"><span>B · Honnêtement, du bazar</span><span className="pct">61 %</span></div>
                  <div className="opt"><span>C · J&apos;en ai pas, c&apos;est pire</span><span className="pct">31 %</span></div>
                </div>
                <div className="quiz-foot">@jeanfindmyjob</div>
              </div>
            </div>
            <div className="post-text">
              <h3>📝 Caption</h3>
              <div className="caption">
                <b>Sondage du dimanche.</b> Soyez honnêtes, on ne juge pas. (Si.)
                {'\n\n'}
                A · Une œuvre d&apos;art codée en couleur 🎨
                {'\n'}
                B · Honnêtement, c&apos;est du bazar 😅
                {'\n'}
                C · J&apos;en ai pas, et c&apos;est encore pire 🫠
                {'\n\n'}
                <em>Réponse en commentaire</em> — on lit tout, on rigole avec vous, et on vous dit comment Jean range tout ça à votre place.
              </div>
              <div className="hashtags">#JeanFindMyJob #SansLeChaos #RechercheDemploi</div>
              <div className="actions">
                <button className={`btn ${copied === 4 ? 'btn-ok' : 'btn-yellow'}`} onClick={() => copyCaption(CAPTION_4, 4)}>
                  {copied === 4 ? '✓ Copié' : '📋 Copier la caption'}
                </button>
                <button className="btn btn-dark" onClick={downloadPost4} disabled={busy === '4'}>
                  {busy === '4' ? '⏳ Génération…' : '🖼️ Télécharger le visuel (1080×1080)'}
                </button>
              </div>
              <div className="why">
                <b>🎯 Pourquoi ça marche</b>
                Un sondage = de l&apos;engagement <strong>garanti</strong> (l&apos;algo adore). Le ton &quot;on ne juge pas. (Si.)&quot; donne la permission de répondre B sans honte. Sur LinkedIn, utilisez le sondage natif (4 options max). Sur IG, le sticker sondage en story OU les commentaires.
              </div>
            </div>
          </div>
        </article>

        {/* BOTTOM RECAP */}
        <div className="recap">
          <div className="recap-eyb">📈 Ce que cette semaine doit produire</div>
          <div className="recap-grid">
            <div>
              <div className="recap-num">100+</div>
              <div className="recap-label">interactions cumulées</div>
              <div className="recap-sub">likes + commentaires + partages</div>
            </div>
            <div>
              <div className="recap-num">50+</div>
              <div className="recap-label">visites sur le site</div>
              <div className="recap-sub">via le lien en bio + post 1</div>
            </div>
            <div>
              <div className="recap-num">1</div>
              <div className="recap-label">conversation engagée</div>
              <div className="recap-sub">DM, mail ou commentaire long — c&apos;est l&apos;objectif vrai</div>
            </div>
          </div>
        </div>

        <div className="rules">
          <div className="rules-eyb">⚠️ Les 3 règles à ne pas casser</div>
          <ul>
            <li><b>Répondez à chaque commentaire dans les 2h.</b> Les 10 premiers décident de la portée.</li>
            <li><b>Postez aussi depuis votre compte perso LinkedIn</b> (en partageant le post de la page). Une page seule démarre lentement.</li>
            <li><b>Ne supprimez jamais un post qui ne marche pas.</b> Apprenez de lui et faites mieux la fois d&apos;après.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
