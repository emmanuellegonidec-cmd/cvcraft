import Link from 'next/link';
import NewsletterForm from './NewsletterForm';
import FaqSection from './FaqSection';
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  category: string
  published_at: string | null
  created_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'Conseils': '#111',
  'CV & Lettre': '#E8151B',
  'Entretien': '#1A6FDB',
  'Reconversion': '#6366f1',
  "Marché de l'emploi": '#1A7A4A',
  'Témoignage': '#B8900A',
  'Outils': '#555',
}

async function getPublishedArticles(): Promise<Article[]> {
  try {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await adminClient
      .from('articles')
      .select('id, title, slug, excerpt, cover_image_url, category, published_at, created_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3)
    return data ?? []
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const articles = await getPublishedArticles()

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#FFFFFF', color: '#111111', lineHeight: '1.6' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; font-family: 'Montserrat', sans-serif; }

        .btn-black { display:inline-flex;align-items:center;gap:8px;background:#111;color:#F5C400;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #E8151B;letter-spacing:0.02em; }
        .btn-black:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 #E8151B; }
        .btn-blue { display:inline-flex;align-items:center;gap:8px;background:#1B4F72;color:#fff;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #111;letter-spacing:0.02em; }
        .btn-blue:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 #111; }
        .btn-outline { display:inline-flex;align-items:center;gap:8px;background:#fff;color:#111;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #E0E0E0; }
        .btn-outline:hover { background:#F4F4F4;transform:translate(-1px,-1px); }
        .feat-card { background:#fff;border:2px solid #111;border-radius:12px;padding:1.5rem;transition:all 0.2s;box-shadow:3px 3px 0 #111; }
        .feat-card:hover { transform:translate(-2px,-2px);box-shadow:5px 5px 0 #E8151B; }
        .testi-card { background:#fff;border:2px solid #111;border-radius:12px;padding:1.5rem;box-shadow:3px 3px 0 #111; }
        .blog-card { background:#fff;border:2px solid #111;border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 #111;transition:all 0.2s;text-decoration:none;color:#111;display:block; }
        .blog-card:hover { transform:translate(-2px,-2px);box-shadow:5px 5px 0 #E8151B; }
        .social-link { display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:2px solid #E0E0E0;background:#fff;color:#555;transition:all 0.15s;text-decoration:none;font-size:16px; }
        .social-link:hover { border-color:#E8151B;color:#E8151B;transform:translate(-1px,-1px); }
        .footer-link { display:block;font-size:13px;color:#555;text-decoration:none;margin-bottom:8px;font-weight:500;transition:color 0.15s;font-family:'Montserrat',sans-serif; }
        .footer-link:hover { color:#E8151B; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        .fade1{animation:fadeUp 0.6s ease 0.1s both}
        .fade2{animation:fadeUp 0.6s ease 0.2s both}
        .fade3{animation:fadeUp 0.6s ease 0.3s both}
        .fade4{animation:fadeUp 0.6s ease 0.4s both}

        .steps-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;align-items:stretch; }
        .step-card-normal {
          background:rgba(255,255,255,0.06);
          border:2px solid rgba(255,255,255,0.15);
          border-radius:12px;
          padding:1.75rem 1.5rem;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
        }
        .step-card-ia {
          background:rgba(232,21,27,0.12);
          border:2px solid rgba(232,21,27,0.35);
          border-radius:12px;
          padding:1.75rem 1.5rem;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
        }
        .step-num-badge {
          width:52px;
          height:52px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:1.25rem;
          font-weight:900;
          margin:0 auto 0.75rem;
          flex-shrink:0;
          font-family:'Montserrat',sans-serif;
        }
        .step-num-normal { background:#F5C400; color:#111; }
        .step-num-ia { background:#E8151B; color:#fff; }

        @media(max-width:900px){
          .steps-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media(max-width:768px){
          .nav-desktop{display:none!important}
          .nav-btns{display:none!important}
          .hero-grid,.feat-grid,.testi-grid,.blog-grid{grid-template-columns:1fr!important}
          .feats-grid{grid-template-columns:1fr 1fr!important}
          .footer-grid{grid-template-columns:1fr!important}
          .hero-logo-img{max-width:260px!important;margin:0 auto!important;}
          .hero-title span{white-space:normal!important;}
          .hero-title{font-size:2.2rem!important;}
          .hero-grid{padding:2rem 1.25rem!important;gap:1.5rem!important;}
          .hero-logo-wrap{order:-1;}
          .steps-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media(max-width:480px){
          .nav-btns{display:none!important}
          .hero-title{font-size:1.9rem!important;}
          .steps-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 1.5rem',background:'#fff',borderBottom:'2.5px solid #111',position:'sticky',top:0,zIndex:100,flexWrap:'wrap',gap:8 }}>
        <Link href="/" style={{ textDecoration:'none',display:'flex',alignItems:'center' }}>
          <span style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'0.95rem',fontWeight:900,color:'#111',letterSpacing:'-0.01em' }}>
            Jean <span style={{ color:'#E8151B' }}>find my Job</span>
          </span>
        </Link>
        <div className="nav-desktop" style={{ display:'flex',gap:'2rem',alignItems:'center' }}>
          {[['#cv','CV Creator'],['#fonctionnalites','Fonctionnalités'],['#comment','Comment ça marche'],['#faq','FAQ']].map(([h,l]) => (
            <a key={h} href={h} style={{ fontFamily:"'Montserrat', sans-serif",fontSize:13,color:'#111',textDecoration:'none',fontWeight:700,letterSpacing:'0.02em',textTransform:'uppercase' }}>{l}</a>
          ))}
        </div>
        <div className="nav-btns" style={{ display:'flex',gap:8,alignItems:'center' }}>
          <Link href="/auth/login" className="btn-outline" style={{ padding:'8px 16px',fontSize:12 }}>Connexion</Link>
          <Link href="/auth/signup" className="btn-black" style={{ padding:'8px 16px',fontSize:12 }}>Commencer →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:'#fff',borderBottom:'2.5px solid #111',overflow:'hidden' }}>
        <div className="hero-grid" style={{ maxWidth:1400,margin:'0 auto',padding:'3.5rem 2rem',display:'grid',gridTemplateColumns:'40fr 60fr',gap:'3rem',alignItems:'center' }}>
          <div>
            <div className="fade1" style={{ display:'inline-flex',alignItems:'center',gap:6,background:'#FEF9E0',border:'2px solid #111',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1.5rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em',fontFamily:"'Montserrat', sans-serif" }}>
              ⚡ Propulsé par Claude AI
            </div>
            <h1 className="fade2 hero-title" style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'3rem',lineHeight:1.05,marginBottom:'1.25rem',fontWeight:900,letterSpacing:'-0.03em' }}>
              <span style={{ display:'block',whiteSpace:'nowrap' }}>Trouvez votre job,</span>
              <span style={{ display:'block',whiteSpace:'nowrap',color:'#E8151B',fontStyle:'italic' }}>sans vous perdre</span>
              <span style={{ display:'block',whiteSpace:'nowrap' }}>dans le chaos</span>
            </h1>
            <p className="fade3" style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'1.05rem',color:'#555',marginBottom:'2rem',lineHeight:1.75,maxWidth:460,fontWeight:500 }}>
              Jean find my Job centralise votre recherche d&apos;emploi — tableau de bord, suivi de candidatures, CV personnalisé par IA. Tout au même endroit, enfin.
            </p>
            <div className="fade4" style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'center' }}>
              <Link href="/auth/signup" className="btn-black" style={{ fontSize:15,padding:'14px 32px' }}>Commencer gratuitement →</Link>
            </div>
            <div style={{ marginTop:'1.5rem',fontSize:13,color:'#888',display:'flex',alignItems:'center',gap:8,fontWeight:600,fontFamily:"'Montserrat', sans-serif" }}>
              <span style={{ color:'#E8151B' }}>★★★★★</span>
              Déjà utilisé par des candidats en recherche active
            </div>
          </div>
          <div className="hero-logo-wrap" style={{ display:'flex',alignItems:'center',justifyContent:'center' }}>
            <img src="/logo.png" alt="Jean find my Job" className="hero-logo-img" style={{ width:'100%',maxWidth:680,height:'auto',objectFit:'contain' }} />
          </div>
        </div>
      </section>

      {/* BANDEAU NOIR */}
      <div style={{ background:'#111',borderBottom:'2.5px solid #111',padding:'2rem 3rem' }}>
        <div style={{ maxWidth:1400,margin:'0 auto' }}>
          <p style={{ textAlign:'center',fontStyle:'italic',fontWeight:700,color:'#F5C400',fontSize:'1.05rem',marginBottom:'2rem',paddingBottom:'1.5rem',borderBottom:'1px solid rgba(255,255,255,0.15)',fontFamily:"'Montserrat', sans-serif" }}>
            &ldquo;Un outil, toutes vos candidatures. C&apos;est aussi simple que ça.&rdquo;
          </p>
          <div style={{ display:'flex',justifyContent:'center',gap:'6rem',flexWrap:'wrap' }}>
            {[
              ['Gratuit','candidatures illimitées','version Bêta'],
              ['1 parcours','par candidature','entièrement personnalisable'],
              ['30s','pour un CV','généré par IA'],
              ['4,9★','Satisfaction','utilisateurs'],
            ].map(([n,l,s]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'2.2rem',fontWeight:900,color:'#F5C400',letterSpacing:'-0.02em' }}>{n}</div>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:13,color:'rgba(255,255,255,0.7)',marginTop:2,fontWeight:600 }}>{l}</div>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURE 1 */}
      <div style={{ height:'2.5px',background:'#111' }} />
      <section className="feat-grid" style={{ maxWidth:1400,margin:'0 auto',padding:'5rem 2rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'5rem',fontWeight:900,color:'#F5C400',lineHeight:1,marginBottom:'-1rem',WebkitTextStroke:'2px #111' }}>01</div>
          <div style={{ fontFamily:"'Montserrat', sans-serif",display:'inline-block',background:'#FEF9E0',border:'2px solid #111',borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:800,color:'#111',margin:'0 0 1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>📋 Tableau de bord</div>
          <h3 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'1.9rem',lineHeight:1.2,marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Votre recherche,<br />enfin organisée</h3>
          <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:15,color:'#555',lineHeight:1.75,marginBottom:'1.5rem',fontWeight:500 }}>Fini les tableurs Excel. Jean find my Job centralise toutes vos candidatures dans un tableau de bord visuel avec un parcours de candidature détaillé pour chaque offre.</p>
          <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:10 }}>
            {[
              'Vue globale : 5 grandes étapes claires',
              'Parcours de candidature par offre : entretien tél, RH, manager…',
              'Étapes personnalisables selon votre process',
              'Statistiques de votre recherche en temps réel',
            ].map(item => (
              <li key={item} style={{ display:'flex',gap:10,fontSize:14,fontWeight:600,fontFamily:"'Montserrat', sans-serif" }}>
                <span style={{ color:'#E8151B',fontWeight:900,flexShrink:0,fontSize:16 }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <Link href="/auth/signup" className="btn-black" style={{ marginTop:'1.5rem',display:'inline-flex' }}>Organiser ma recherche →</Link>
        </div>
        <div style={{ background:'#fff',borderRadius:12,border:'2.5px solid #111',boxShadow:'6px 6px 0 #111',overflow:'hidden' }}>
          <div style={{ fontFamily:"'Montserrat', sans-serif",padding:'12px 16px',borderBottom:'2px solid #111',background:'#F5C400',fontSize:12,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.04em' }}>Tableau de bord — Semaine 12</div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }}>
              <div style={{ background:'#FDEAEA',borderRadius:8,padding:10,border:'2px solid #E8151B' }}>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:10,color:'#E8151B',fontWeight:800,marginBottom:2,textTransform:'uppercase' }}>Candidatures</div>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:20,fontWeight:900,color:'#E8151B' }}>12</div>
              </div>
              <div style={{ background:'#FEF9E0',borderRadius:8,padding:10,border:'2px solid #F5C400' }}>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:10,color:'#B8900A',fontWeight:800,marginBottom:2,textTransform:'uppercase' }}>Entretiens</div>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:20,fontWeight:900,color:'#B8900A' }}>3</div>
              </div>
            </div>
            {[['📨','BNP Paribas','Entretien RH — parcours à jour'],['⭐','Sanofi','Offre reçue !'],['📋','Decathlon','Entretien manager demain']].map(([ic,co,msg]) => (
              <div key={co as string} style={{ display:'flex',alignItems:'center',gap:8,padding:7,background:'#F4F4F4',borderRadius:6,marginBottom:5,border:'1.5px solid #E0E0E0' }}>
                <span style={{ fontSize:12 }}>{ic as string}</span>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:10,fontWeight:600 }}><b>{co as string}</b> — {msg as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height:'2.5px',background:'#111',maxWidth:1400,margin:'0 auto' }} />

      {/* FEATURE 2 */}
      <section id="cv" className="feat-grid" style={{ maxWidth:1400,margin:'0 auto',padding:'5rem 2rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center' }}>
        <div style={{ background:'#fff',borderRadius:12,border:'2.5px solid #111',boxShadow:'6px 6px 0 #111',overflow:'hidden' }}>
          <div style={{ fontFamily:"'Montserrat', sans-serif",padding:'12px 16px',borderBottom:'2px solid #111',background:'#F5C400',fontSize:12,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.04em' }}>CV Creator — Aperçu</div>
          <div style={{ padding:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              {['Prénom & Nom','Poste visé','Expériences','Compétences'].map(f => (
                <div key={f} style={{ fontFamily:"'Montserrat', sans-serif",background:'#F4F4F4',border:'1.5px solid #E0E0E0',borderRadius:5,padding:'6px 8px',fontSize:10,color:'#888',marginBottom:5,fontWeight:600 }}>{f}</div>
              ))}
              <div style={{ fontFamily:"'Montserrat', sans-serif",marginTop:10,background:'#111',color:'#F5C400',borderRadius:6,padding:7,textAlign:'center',fontSize:10,fontWeight:800,boxShadow:'2px 2px 0 #E8151B' }}>Générer avec Claude →</div>
            </div>
            <div>
              <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:14,fontWeight:900,marginBottom:2 }}>Joséphine B.</div>
              <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:11,color:'#E8151B',marginBottom:8,fontWeight:700 }}>Responsable Marketing</div>
              {['Expériences','Formation','Compétences'].map(s => (
                <div key={s}>
                  <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:9,fontWeight:800,textTransform:'uppercase',color:'#888',borderBottom:'2px solid #111',paddingBottom:3,margin:'8px 0 5px' }}>{s}</div>
                  <div style={{ height:7,background:'#F4F4F4',borderRadius:3,marginBottom:4,width:'90%' }} />
                  <div style={{ height:7,background:'#F4F4F4',borderRadius:3,marginBottom:4,width:'70%' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'5rem',fontWeight:900,color:'#F5C400',lineHeight:1,marginBottom:'-1rem',WebkitTextStroke:'2px #111' }}>02</div>
          <div style={{ fontFamily:"'Montserrat', sans-serif",display:'inline-block',background:'#FDEAEA',border:'2px solid #111',borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:800,color:'#111',margin:'0 0 1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>✦ CV Creator IA</div>
          <h3 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'1.9rem',lineHeight:1.2,marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Un CV percutant<br />en 30 secondes</h3>
          <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:15,color:'#555',lineHeight:1.75,marginBottom:'1.5rem',fontWeight:500 }}>Importez votre profil LinkedIn, choisissez un template et laissez Claude AI rédiger votre CV optimisé pour chaque poste.</p>
          <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:10 }}>
            {['Import automatique depuis LinkedIn PDF','3 templates visuels professionnels','Optimisation par poste visé','Export PDF en un clic'].map(item => (
              <li key={item} style={{ display:'flex',gap:10,fontSize:14,fontWeight:600,fontFamily:"'Montserrat', sans-serif" }}>
                <span style={{ color:'#E8151B',fontWeight:900,flexShrink:0,fontSize:16 }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <Link href="/auth/signup" className="btn-blue" style={{ marginTop:'1.5rem',display:'inline-flex' }}>Créer mon CV →</Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment" style={{ background:'#111',borderTop:'2.5px solid #111',borderBottom:'2.5px solid #111',padding:'5rem 2rem' }}>
        <div style={{ maxWidth:1400,margin:'0 auto',textAlign:'center' }}>
          <div style={{ fontFamily:"'Montserrat', sans-serif",display:'inline-block',background:'#F5C400',border:'2px solid rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',textTransform:'uppercase',letterSpacing:'0.05em' }}>Simple comme bonjour</div>
          <h2 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'2.5rem',color:'#fff',marginBottom:'0.75rem',fontWeight:900,letterSpacing:'-0.02em' }}>Comment ça marche ?</h2>
          <p style={{ fontFamily:"'Montserrat', sans-serif",color:'rgba(255,255,255,0.6)',marginBottom:'3.5rem',fontWeight:500 }}>Quatre étapes pour candidater avec méthode</p>

          <div className="steps-grid">
            {[
              { num:'1', title:'Vous créez votre profil', desc:"Un compte sécurisé et c'est parti. Jean prépare la base. Prêt à postuler sans repartir de zéro à chaque fois.", ia:false },
              { num:'2', title:'Vous ajoutez vos candidatures', desc:"Importez une offre ou ajoutez-la manuellement. Chaque candidature a son propre parcours de suivi entièrement personnalisable.", ia:false },
              { num:'3', title:'Vous suivez sans vous perdre', desc:"Toutes vos candidatures au même endroit. Vous savez où vous en êtes, à chaque instant, sans réfléchir.", ia:false },
              { num:'4', title:"L'IA vous aide à mieux candidater", desc:"Jean vous donne un coup de main quand vous en avez besoin — améliorer votre CV, comprendre une offre, préparer vos entretiens.", ia:true },
            ].map(s => (
              <div key={s.num} className={s.ia ? 'step-card-ia' : 'step-card-normal'}>
                <div className={`step-num-badge ${s.ia ? 'step-num-ia' : 'step-num-normal'}`}>
                  {s.num}
                </div>
                <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:10,fontWeight:800,color:'#F5C400',letterSpacing:'0.1em',marginBottom:8,textTransform:'uppercase' }}>Étape {s.num}</div>
                <h4 style={{ fontFamily:"'Montserrat', sans-serif",color:'#fff',fontSize:'0.95rem',fontWeight:800,marginBottom:10,lineHeight:1.35 }}>{s.title}</h4>
                <p style={{ fontFamily:"'Montserrat', sans-serif",color:'rgba(255,255,255,0.6)',fontSize:13,lineHeight:1.7,fontWeight:500 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="fonctionnalites" style={{ padding:'5rem 2rem',background:'#FAFAFA',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1400,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <div style={{ fontFamily:"'Montserrat', sans-serif",display:'inline-block',background:'#F5C400',border:'2px solid #111',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>Tout inclus</div>
            <h2 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'2.2rem',fontWeight:900,letterSpacing:'-0.02em' }}>Tout ce qu&apos;il vous faut</h2>
            <p style={{ fontFamily:"'Montserrat', sans-serif",color:'#888',marginTop:'0.5rem',fontWeight:500 }}>Une plateforme complète pour votre recherche d&apos;emploi</p>
          </div>
          <div className="feats-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem' }}>
            {[
              { icon:'📊',title:'Tableau de bord',desc:"5 grandes étapes pour visualiser toutes vos candidatures d'un coup d'œil." },
              { icon:'🗂️',title:'Votre parcours par candidature',desc:'Un parcours de candidature entièrement personnalisable pour chaque offre : étapes, entretiens, documents, contacts, notes. Tout au même endroit.' },
              { icon:'🤖',title:'CV Creator IA',desc:'Claude AI rédige votre CV avec des formulations percutantes, adapté à chaque poste.' },
              { icon:'📊',title:'Score ATS',desc:"Jean analyse votre CV et vous donne un score de compatibilité avec l'offre pour maximiser vos chances de passer les filtres automatiques." },
              { icon:'🔗',title:'Import LinkedIn',desc:'Exportez votre profil LinkedIn en PDF et Jean find my Job remplit automatiquement toutes vos informations.' },
              { icon:'👥',title:'Suivi des contacts',desc:'Gardez une trace de tous les recruteurs et managers. Ne perdez plus aucune relation clé.' },
              { icon:'📅',title:'Gestion des entretiens',desc:'Planifiez et préparez vos entretiens. Stockez les questions, réponses et retours.' },
              { icon:'📈',title:'Statistiques',desc:"Taux de réponse, délais moyens, canaux efficaces. Optimisez votre stratégie avec les données." },
              { icon:'📥',title:'Export PDF',desc:'Téléchargez votre CV en PDF professionnel prêt à envoyer, en un seul clic.' },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ fontSize:24,marginBottom:12 }}>{f.icon}</div>
                <h4 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:15,fontWeight:800,marginBottom:6 }}>{f.title}</h4>
                <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:13,color:'#555',lineHeight:1.6,fontWeight:500 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding:'5rem 2rem',background:'#fff',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1400,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <h2 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'2.2rem',fontWeight:900,letterSpacing:'-0.02em' }}>Ils ont trouvé leur job avec Jean find my Job</h2>
          </div>
          <div className="testi-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem' }}>
            {[
              { initials:'SL',name:'Sophie L.',role:'Comm → Offre reçue chez LVMH',text:"Le tableau de bord a changé ma façon de chercher. Tout est au même endroit. J'ai eu 3 entretiens en 2 semaines.",color:'#FDEAEA',textColor:'#E8151B' },
              { initials:'MK',name:'Marc K.',role:'Dev backend → Startup Series B',text:"L'IA qui génère le CV est bluffante. En 30 secondes j'avais un CV bien mieux rédigé que ce que j'aurais fait moi-même.",color:'#FEF9E0',textColor:'#B8900A' },
              { initials:'AC',name:'Amandine C.',role:'Reconversion → Talent Acquisition',text:"Jean find my Job m'a aidée à valoriser mes compétences transférables. Résultat : CDI en 6 semaines.",color:'#EBF2FD',textColor:'#1A6FDB' },
            ].map(t => (
              <div key={t.name} className="testi-card">
                <div style={{ color:'#E8151B',fontSize:14,marginBottom:12,fontWeight:900 }}>★★★★★</div>
                <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:14,lineHeight:1.7,fontStyle:'italic',marginBottom:16,fontWeight:500,color:'#333' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ fontFamily:"'Montserrat', sans-serif",width:38,height:38,borderRadius:'50%',background:t.color,border:`2px solid ${t.textColor}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:t.textColor,flexShrink:0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:13,fontWeight:800 }}>{t.name}</div>
                    <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:12,color:'#888',fontWeight:500 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — composant client séparé */}
      <FaqSection />

      {/* BLOG — dynamique depuis Supabase */}
      <section style={{ padding:'5rem 2rem',background:'#FAFAFA',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1400,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <div style={{ fontFamily:"'Montserrat', sans-serif",display:'inline-block',background:'#F5C400',border:'2px solid #111',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>Conseils & actus</div>
            <h2 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'2.2rem',fontWeight:900,letterSpacing:'-0.02em' }}>Jean a quelque chose à partager avec vous</h2>
            <p style={{ fontFamily:"'Montserrat', sans-serif",color:'#888',marginTop:'0.5rem',fontWeight:500 }}>Nos conseils pour booster votre recherche d&apos;emploi</p>
          </div>

          {articles.length === 0 ? (
            <div style={{ fontFamily:"'Montserrat', sans-serif",textAlign:'center',padding:'3rem',color:'#888',fontWeight:600,fontSize:15,border:'2px dashed #ddd',borderRadius:12 }}>
              Les articles arrivent bientôt — revenez vite ! 🚀
            </div>
          ) : (
            <div className="blog-grid" style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min(articles.length,3)},1fr)`,gap:'1.5rem' }}>
              {articles.map((article) => {
                const catColor = CATEGORY_COLORS[article.category] ?? '#111'
                const dateStr = article.published_at
                  ? new Date(article.published_at).toLocaleDateString('fr-FR',{ day:'numeric',month:'long',year:'numeric' })
                  : ''
                return (
                  <Link key={article.id} href={`/blog/${article.slug}`} className="blog-card">
                    <div style={{ height:180,background:article.cover_image_url?'transparent':`linear-gradient(135deg,${catColor} 0%,${catColor}cc 100%)`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden' }}>
                      {article.cover_image_url ? (
                        <img src={article.cover_image_url} alt={article.title} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      ) : (
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:48 }}>✍️</div>
                          <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:8,fontWeight:600 }}>{article.category}</div>
                        </div>
                      )}
                      <div style={{ position:'absolute',top:12,left:12 }}>
                        <span style={{ fontFamily:"'Montserrat', sans-serif",background:'#F5C400',color:'#111',borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.05em' }}>{article.category}</span>
                      </div>
                    </div>
                    <div style={{ padding:'1.25rem' }}>
                      <h3 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:16,fontWeight:800,marginBottom:8,letterSpacing:'-0.01em',lineHeight:1.3 }}>{article.title}</h3>
                      {article.excerpt && (
                        <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:13,color:'#555',lineHeight:1.65,marginBottom:12,fontWeight:500 }}>
                          {article.excerpt.length > 160 ? article.excerpt.slice(0,160)+'…' : article.excerpt}
                        </p>
                      )}
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                        <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:11,color:'#888',fontWeight:600 }}>{dateStr}</div>
                        <div style={{ fontFamily:"'Montserrat', sans-serif",fontSize:12,fontWeight:800,color:'#E8151B' }}>Lire →</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:'#111',borderBottom:'2.5px solid #111',padding:'6rem 2rem',textAlign:'center' }}>
        <div style={{ fontFamily:"'Montserrat', sans-serif",display:'inline-block',background:'#F5C400',border:'2px solid rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1.5rem',textTransform:'uppercase',letterSpacing:'0.05em' }}>C&apos;est gratuit !</div>
        <h2 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'2.8rem',color:'#fff',marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Prêt à trouver votre prochain poste ?</h2>
        <p style={{ fontFamily:"'Montserrat', sans-serif",color:'rgba(255,255,255,0.7)',fontSize:'1.05rem',marginBottom:'2.5rem',fontWeight:500 }}>Rejoignez les candidats qui organisent mieux leur recherche avec Jean find my Job.</p>
        <Link href="/auth/signup" className="btn-blue" style={{ fontSize:16,padding:'16px 44px',borderRadius:12 }}>
          Commencer gratuitement — sans carte bancaire
        </Link>
        <p style={{ fontFamily:"'Montserrat', sans-serif",marginTop:'1.25rem',fontSize:13,color:'rgba(255,255,255,0.4)',fontWeight:600 }}>Résultat en moins de 30 secondes · Données sécurisées</p>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#fff',borderTop:'2.5px solid #111',padding:'3.5rem 3rem 2rem' }}>
        <div className="footer-grid" style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'3rem',maxWidth:1400,margin:'0 auto' }}>
          <div>
            <div style={{ marginBottom:'1rem' }}>
              <span style={{ fontFamily:"'Montserrat', sans-serif",fontSize:'1rem',fontWeight:900,color:'#111' }}>
                Jean <span style={{ color:'#E8151B' }}>find my Job</span>
              </span>
            </div>
            <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:13,color:'#555',lineHeight:1.7,fontWeight:500,marginBottom:'1.25rem',maxWidth:260 }}>
              La plateforme de recherche d&apos;emploi propulsée par Claude AI. Tableau de bord, parcours de candidature, CV Creator.
            </p>
            <div style={{ display:'flex',gap:8,marginBottom:'1rem' }}>
              <a href="https://www.linkedin.com/company/jean-find-my-job/" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn" style={{ background:'#0077B5',borderColor:'#0077B5',color:'#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://x.com/Jeanfindmyjob" target="_blank" rel="noopener noreferrer" className="social-link" title="X (Twitter)" style={{ background:'#111',borderColor:'#111',color:'#fff' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.instagram.com/jeanfindmyjob/" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram" style={{ background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',borderColor:'#dc2743',color:'#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.youtube.com/channel/UCDgezWysIr83yW5dUlkKbSg" target="_blank" rel="noopener noreferrer" className="social-link" title="YouTube" style={{ background:'#FF0000',borderColor:'#FF0000',color:'#fff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
            <NewsletterForm />
          </div>
          <div>
            <h5 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:11,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'1rem',borderBottom:'2px solid #111',paddingBottom:8 }}>Produit</h5>
            {[['Tableau de bord','#fonctionnalites'],['Votre parcours par candidature','#fonctionnalites'],['CV Creator','#cv'],['Suivi contacts','#fonctionnalites'],['Statistiques','#fonctionnalites']].map(([label,href]) => (
              <a key={label} href={href} className="footer-link">{label}</a>
            ))}
          </div>
          <div>
            <h5 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:11,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'1rem',borderBottom:'2px solid #111',paddingBottom:8 }}>Ressources</h5>
            {[['Guide de démarrage','#'],['Blog','#'],['FAQ','#faq'],['Conseils entretien','#'],['Chaîne YouTube','https://www.youtube.com/channel/UCDgezWysIr83yW5dUlkKbSg']].map(([label,href]) => (
              <a key={label} href={href} className="footer-link" target={href.startsWith('http')?'_blank':undefined} rel={href.startsWith('http')?'noopener noreferrer':undefined}>{label}</a>
            ))}
          </div>
          <div>
            <h5 style={{ fontFamily:"'Montserrat', sans-serif",fontSize:11,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'1rem',borderBottom:'2px solid #111',paddingBottom:8 }}>Entreprise</h5>
            {[['À propos','#'],['Tarifs','#'],['Contact','mailto:hello@jeanfindmyjob.fr'],['Confidentialité','#'],['CGU','#']].map(([label,href]) => (
              <a key={label} href={href} className="footer-link">{label}</a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth:1400,margin:'2rem auto 0',paddingTop:'1.5rem',borderTop:'1.5px solid #E0E0E0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8 }}>
          <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:12,color:'#888',fontWeight:500 }}>© 2026 Jean find my Job · Propulsé par Claude AI</p>
          <p style={{ fontFamily:"'Montserrat', sans-serif",fontSize:12,color:'#888',fontWeight:500 }}>Fait avec ♥ pour les candidats</p>
        </div>
      </footer>
    </div>
  );
}
