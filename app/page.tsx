import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#FFFFFF', color: '#111111', lineHeight: '1.6' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; }

        .btn-black { display:inline-flex;align-items:center;gap:8px;background:#111;color:#F5C400;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #E8151B;letter-spacing:0.02em; }
        .btn-black:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 #E8151B; }
        .btn-red { display:inline-flex;align-items:center;gap:8px;background:#E8151B;color:#fff;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #111;letter-spacing:0.02em; }
        .btn-red:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 #111; }
        .btn-outline { display:inline-flex;align-items:center;gap:8px;background:#fff;color:#111;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #E0E0E0; }
        .btn-outline:hover { background:#F4F4F4;transform:translate(-1px,-1px); }
        .feat-card { background:#fff;border:2px solid #111;border-radius:12px;padding:1.5rem;transition:all 0.2s;box-shadow:3px 3px 0 #111; }
        .feat-card:hover { transform:translate(-2px,-2px);box-shadow:5px 5px 0 #E8151B; }
        .testi-card { background:#fff;border:2px solid #111;border-radius:12px;padding:1.5rem;box-shadow:3px 3px 0 #111; }
        .step-card { background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.15);border-radius:12px;padding:1.75rem; }
        .blog-card { background:#fff;border:2px solid #111;border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 #111;transition:all 0.2s;text-decoration:none;color:#111;display:block; }
        .blog-card:hover { transform:translate(-2px,-2px);box-shadow:5px 5px 0 #E8151B; }
        .social-link { display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:2px solid #E0E0E0;background:#fff;color:#555;transition:all 0.15s;text-decoration:none;font-size:16px; }
        .social-link:hover { border-color:#E8151B;color:#E8151B;transform:translate(-1px,-1px); }
        .footer-link { display:block;font-size:13px;color:#555;text-decoration:none;margin-bottom:8px;font-weight:500;transition:color 0.15s; }
        .footer-link:hover { color:#E8151B; }
        .pill { display:inline-flex;align-items:center;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        .fade1{animation:fadeUp 0.6s ease 0.1s both}
        .fade2{animation:fadeUp 0.6s ease 0.2s both}
        .fade3{animation:fadeUp 0.6s ease 0.3s both}
        .fade4{animation:fadeUp 0.6s ease 0.4s both}
        @media(max-width:768px){
          .nav-desktop{display:none!important}
          .nav-btns{display:none!important}
          .hero-grid,.feat-grid,.steps-grid,.testi-grid,.blog-grid{grid-template-columns:1fr!important}
          .feats-grid{grid-template-columns:1fr 1fr!important}
          .footer-grid{grid-template-columns:1fr!important}
          .hero-logo-img{max-width:300px!important;margin:0 auto!important;}
        }
        @media(max-width:480px){
          .nav-btns{display:none!important}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 1.5rem',background:'#fff',borderBottom:'2.5px solid #111',position:'sticky',top:0,zIndex:100,flexWrap:'wrap',gap:8 }}>
        <Link href="/" style={{ textDecoration:'none',display:'flex',alignItems:'center',gap:8 }}>
          <img src="/logo.png" alt="Jean Find My Job" style={{ height:40,width:'auto',objectFit:'contain' }} />
          <span style={{ fontFamily:'Montserrat,sans-serif',fontSize:'0.95rem',fontWeight:900,color:'#111',letterSpacing:'-0.01em' }}>
            Jean <span style={{ color:'#E8151B' }}>Find My Job</span>
          </span>
        </Link>
        <div className="nav-desktop" style={{ display:'flex',gap:'2rem',alignItems:'center' }}>
          {[['#fonctionnalites','Fonctionnalités'],['#cv','CV Creator'],['#comment','Comment ça marche']].map(([h,l]) => (
            <a key={h} href={h} style={{ fontSize:13,color:'#111',textDecoration:'none',fontWeight:700,letterSpacing:'0.02em',textTransform:'uppercase' }}>{l}</a>
          ))}
        </div>
        <div className="nav-btns" style={{ display:'flex',gap:8,alignItems:'center' }}>
          <Link href="/auth/login" className="btn-outline" style={{ padding:'8px 16px',fontSize:12 }}>Connexion</Link>
          <Link href="/auth/signup" className="btn-black" style={{ padding:'8px 16px',fontSize:12 }}>Commencer →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:'#fff',borderBottom:'2.5px solid #111',overflow:'hidden' }}>
        <div className="hero-grid" style={{ maxWidth:1400,margin:'0 auto',padding:'3.5rem 2rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3rem',alignItems:'center' }}>
          <div>
            <div className="fade1" style={{ display:'inline-flex',alignItems:'center',gap:6,background:'#FEF9E0',border:'2px solid #111',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1.5rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>
              ⚡ Propulsé par Claude AI
            </div>
            <h1 className="fade2" style={{ fontSize:'clamp(3rem,5vw,5.5rem)',lineHeight:1.0,marginBottom:'1.25rem',fontWeight:900,letterSpacing:'-0.03em' }}>
              Trouvez votre job,<br />
              <span style={{ color:'#E8151B',fontStyle:'italic' }}>sans vous perdre</span><br />
              dans le chaos
            </h1>
            <p className="fade3" style={{ fontSize:'1.05rem',color:'#555',marginBottom:'2rem',lineHeight:1.75,maxWidth:460,fontWeight:500 }}>
              Jean Find My Job centralise votre recherche d&apos;emploi — tableau de bord Kanban, pipeline de suivi par offre, CV personnalisé par IA. Tout au même endroit, enfin.
            </p>
            <div className="fade4" style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'center' }}>
              <Link href="/auth/signup" className="btn-black" style={{ fontSize:15,padding:'14px 32px' }}>Commencer gratuitement →</Link>
            </div>
            <div style={{ marginTop:'1.5rem',fontSize:13,color:'#888',display:'flex',alignItems:'center',gap:8,fontWeight:600 }}>
              <span style={{ color:'#E8151B' }}>★★★★★</span>
              Déjà utilisé par des candidats en recherche active
            </div>
          </div>

          {/* HERO DROITE — Logo grand format */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'0' }}>
            <img src="/logo.png" alt="Jean Find My Job" className="hero-logo-img" style={{ width:'100%',maxWidth:500,height:'auto',objectFit:'contain' }} />
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ background:'#111',borderBottom:'2.5px solid #111',padding:'2rem 3rem',display:'flex',justifyContent:'center',gap:'6rem',flexWrap:'wrap' }}>
        {[['100%','Gratuit','pour commencer'],['1 pipeline','par offre','suivi détaillé'],['30s','pour un CV','généré par IA'],['Kanban +','Liste','deux vues au choix']].map(([n,l,s]) => (
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:'2.2rem',fontWeight:900,color:'#F5C400',letterSpacing:'-0.02em',fontFamily:'Montserrat,sans-serif' }}>{n}</div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.7)',marginTop:2,fontWeight:600 }}>{l}</div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:500 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* FEATURE 1 */}
      <div style={{ height:'2.5px',background:'#111' }} />
      <section className="feat-grid" style={{ maxWidth:1400,margin:'0 auto',padding:'5rem 2rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center' }}>
        <div>
          <div style={{ fontSize:'5rem',fontWeight:900,color:'#F5C400',lineHeight:1,marginBottom:'-1rem',WebkitTextStroke:'2px #111',fontFamily:'Montserrat,sans-serif' }}>01</div>
          <div style={{ display:'inline-block',background:'#FEF9E0',border:'2px solid #111',borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:800,color:'#111',margin:'0 0 1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>📋 Tableau de bord</div>
          <h3 style={{ fontSize:'1.9rem',lineHeight:1.2,marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Votre recherche,<br />enfin organisée</h3>
          <p style={{ fontSize:15,color:'#555',lineHeight:1.75,marginBottom:'1.5rem',fontWeight:500 }}>Fini les tableurs Excel. Jean Find My Job centralise toutes vos candidatures dans un tableau Kanban visuel avec un pipeline détaillé pour chaque offre.</p>
          <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:10 }}>
            {[
              'Vue Kanban globale : 5 grandes étapes claires',
              'Pipeline détaillé par offre : entretien tél, RH, manager…',
              'Étapes personnalisables selon votre process',
              'Statistiques de votre recherche en temps réel',
            ].map(item => (
              <li key={item} style={{ display:'flex',gap:10,fontSize:14,fontWeight:600 }}>
                <span style={{ color:'#E8151B',fontWeight:900,flexShrink:0,fontSize:16 }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <Link href="/auth/signup" className="btn-black" style={{ marginTop:'1.5rem',display:'inline-flex' }}>Organiser ma recherche →</Link>
        </div>
        <div style={{ background:'#fff',borderRadius:12,border:'2.5px solid #111',boxShadow:'6px 6px 0 #111',overflow:'hidden' }}>
          <div style={{ padding:'12px 16px',borderBottom:'2px solid #111',background:'#F5C400',fontSize:12,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.04em' }}>Tableau de bord — Semaine 12</div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }}>
              <div style={{ background:'#FDEAEA',borderRadius:8,padding:10,border:'2px solid #E8151B' }}>
                <div style={{ fontSize:10,color:'#E8151B',fontWeight:800,marginBottom:2,textTransform:'uppercase' }}>Candidatures</div>
                <div style={{ fontSize:20,fontWeight:900,color:'#E8151B' }}>12</div>
              </div>
              <div style={{ background:'#FEF9E0',borderRadius:8,padding:10,border:'2px solid #F5C400' }}>
                <div style={{ fontSize:10,color:'#B8900A',fontWeight:800,marginBottom:2,textTransform:'uppercase' }}>Entretiens</div>
                <div style={{ fontSize:20,fontWeight:900,color:'#B8900A' }}>3</div>
              </div>
            </div>
            {[['📨','BNP Paribas','Entretien RH — pipeline à jour'],['⭐','Sanofi','Offre reçue !'],['📋','Decathlon','Entretien manager demain']].map(([ic,co,msg]) => (
              <div key={co as string} style={{ display:'flex',alignItems:'center',gap:8,padding:7,background:'#F4F4F4',borderRadius:6,marginBottom:5,border:'1.5px solid #E0E0E0' }}>
                <span style={{ fontSize:12 }}>{ic as string}</span>
                <div style={{ fontSize:10,fontWeight:600 }}><b>{co as string}</b> — {msg as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height:'2.5px',background:'#111',maxWidth:1400,margin:'0 auto' }} />

      {/* FEATURE 2 */}
      <section id="cv" className="feat-grid" style={{ maxWidth:1400,margin:'0 auto',padding:'5rem 2rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center' }}>
        <div style={{ background:'#fff',borderRadius:12,border:'2.5px solid #111',boxShadow:'6px 6px 0 #111',overflow:'hidden' }}>
          <div style={{ padding:'12px 16px',borderBottom:'2px solid #111',background:'#F5C400',fontSize:12,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.04em' }}>CV Creator — Aperçu</div>
          <div style={{ padding:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              {['Prénom & Nom','Poste visé','Expériences','Compétences'].map(f => (
                <div key={f} style={{ background:'#F4F4F4',border:'1.5px solid #E0E0E0',borderRadius:5,padding:'6px 8px',fontSize:10,color:'#888',marginBottom:5,fontWeight:600 }}>{f}</div>
              ))}
              <div style={{ marginTop:10,background:'#111',color:'#F5C400',borderRadius:6,padding:7,textAlign:'center',fontSize:10,fontWeight:800,boxShadow:'2px 2px 0 #E8151B' }}>Générer avec Claude →</div>
            </div>
            <div style={{ fontSize:10 }}>
              <div style={{ fontSize:14,fontWeight:900,marginBottom:2 }}>Joséphine B.</div>
              <div style={{ fontSize:11,color:'#E8151B',marginBottom:8,fontWeight:700 }}>Responsable Marketing</div>
              {['Expériences','Formation','Compétences'].map(s => (
                <div key={s}>
                  <div style={{ fontSize:9,fontWeight:800,textTransform:'uppercase',color:'#888',borderBottom:'2px solid #111',paddingBottom:3,margin:'8px 0 5px' }}>{s}</div>
                  <div style={{ height:7,background:'#F4F4F4',borderRadius:3,marginBottom:4,width:'90%' }} />
                  <div style={{ height:7,background:'#F4F4F4',borderRadius:3,marginBottom:4,width:'70%' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize:'5rem',fontWeight:900,color:'#F5C400',lineHeight:1,marginBottom:'-1rem',WebkitTextStroke:'2px #111',fontFamily:'Montserrat,sans-serif' }}>02</div>
          <div style={{ display:'inline-block',background:'#FDEAEA',border:'2px solid #111',borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:800,color:'#111',margin:'0 0 1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>✦ CV Creator IA</div>
          <h3 style={{ fontSize:'1.9rem',lineHeight:1.2,marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Un CV percutant<br />en 30 secondes</h3>
          <p style={{ fontSize:15,color:'#555',lineHeight:1.75,marginBottom:'1.5rem',fontWeight:500 }}>Importez votre profil LinkedIn, choisissez un template et laissez Claude AI rédiger votre CV optimisé pour chaque poste.</p>
          <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:10 }}>
            {['Import automatique depuis LinkedIn PDF','3 templates visuels professionnels','Optimisation par poste visé','Export PDF en un clic'].map(item => (
              <li key={item} style={{ display:'flex',gap:10,fontSize:14,fontWeight:600 }}>
                <span style={{ color:'#E8151B',fontWeight:900,flexShrink:0,fontSize:16 }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <Link href="/auth/signup" className="btn-red" style={{ marginTop:'1.5rem',display:'inline-flex' }}>Créer mon CV →</Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment" style={{ background:'#111',borderTop:'2.5px solid #111',borderBottom:'2.5px solid #111',padding:'5rem 2rem' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',textAlign:'center' }}>
          <div style={{ display:'inline-block',background:'#F5C400',border:'2px solid rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',textTransform:'uppercase',letterSpacing:'0.05em' }}>Simple comme bonjour</div>
          <h2 style={{ fontSize:'2.5rem',color:'#fff',marginBottom:'0.75rem',fontWeight:900,letterSpacing:'-0.02em' }}>Comment ça marche ?</h2>
          <p style={{ color:'rgba(255,255,255,0.6)',marginBottom:'3rem',fontWeight:500 }}>Trois étapes pour décrocher plus d&apos;entretiens</p>
          <div className="steps-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'2rem',textAlign:'left' }}>
            {[
              { icon:'👤',num:'01',title:'Créez votre profil',desc:'Inscrivez-vous gratuitement et importez votre profil LinkedIn en PDF. Jean Find My Job extrait automatiquement toutes vos informations.' },
              { icon:'📋',num:'02',title:'Suivez chaque candidature',desc:"Ajoutez vos offres et ouvrez le dossier de chaque candidature. Kanban global pour la vue d'ensemble, pipeline détaillé par offre pour ne rater aucune étape." },
              { icon:'✨',num:'03',title:'Générez votre CV par IA',desc:'Pour chaque candidature, laissez Claude AI créer un CV percutant et optimisé pour le poste. Exportez en PDF et postulez.' },
            ].map(s => (
              <div key={s.num} className="step-card">
                <div style={{ width:44,height:44,borderRadius:10,background:'#E8151B',border:'2px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:'1rem' }}>{s.icon}</div>
                <div style={{ fontSize:11,fontWeight:800,color:'#F5C400',letterSpacing:'0.08em',marginBottom:6,textTransform:'uppercase' }}>ÉTAPE {s.num}</div>
                <h4 style={{ color:'#fff',fontSize:'1rem',fontWeight:800,marginBottom:8 }}>{s.title}</h4>
                <p style={{ color:'rgba(255,255,255,0.6)',fontSize:13,lineHeight:1.65,fontWeight:500 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="fonctionnalites" style={{ padding:'5rem 2rem',background:'#FAFAFA',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1400,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <div style={{ display:'inline-block',background:'#F5C400',border:'2px solid #111',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>Tout inclus</div>
            <h2 style={{ fontSize:'2.2rem',fontWeight:900,letterSpacing:'-0.02em' }}>Tout ce qu&apos;il vous faut</h2>
            <p style={{ color:'#888',marginTop:'0.5rem',fontWeight:500 }}>Une plateforme complète pour votre recherche d&apos;emploi</p>
          </div>
          <div className="feats-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem' }}>
            {[
              { icon:'📊',title:'Tableau de bord Kanban',desc:"5 grandes colonnes pour visualiser toutes vos candidatures d'un coup d'œil." },
              { icon:'🗂️',title:'Pipeline par candidature',desc:'Un dossier détaillé pour chaque offre : entretien tél, RH, manager… et vos étapes personnalisées.' },
              { icon:'🤖',title:'CV Creator IA',desc:'Claude AI rédige votre CV avec des formulations percutantes, adapté à chaque poste.' },
              { icon:'🔗',title:'Import LinkedIn',desc:'Exportez votre profil LinkedIn en PDF et Jean Find My Job remplit automatiquement toutes vos informations.' },
              { icon:'👥',title:'Suivi des contacts',desc:'Gardez une trace de tous les recruteurs et managers. Ne perdez plus aucune relation clé.' },
              { icon:'📅',title:'Gestion des entretiens',desc:'Planifiez et préparez vos entretiens. Stockez les questions, réponses et retours.' },
              { icon:'📈',title:'Statistiques',desc:"Taux de réponse, délais moyens, canaux efficaces. Optimisez votre stratégie avec les données." },
              { icon:'💾',title:'Sauvegarde cloud',desc:"Tous vos CVs et données sauvegardés en sécurité, accessibles depuis n'importe quel appareil." },
              { icon:'📥',title:'Export PDF',desc:'Téléchargez votre CV en PDF professionnel prêt à envoyer, en un seul clic.' },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ fontSize:24,marginBottom:12 }}>{f.icon}</div>
                <h4 style={{ fontSize:15,fontWeight:800,marginBottom:6 }}>{f.title}</h4>
                <p style={{ fontSize:13,color:'#555',lineHeight:1.6,fontWeight:500 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding:'5rem 2rem',background:'#fff',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1400,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <h2 style={{ fontSize:'2.2rem',fontWeight:900,letterSpacing:'-0.02em' }}>Ils ont trouvé leur job avec Jean Find My Job</h2>
          </div>
          <div className="testi-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem' }}>
            {[
              { initials:'SL',name:'Sophie L.',role:'Comm → Offre reçue chez LVMH',text:"Le tableau de bord a changé ma façon de chercher. Tout est au même endroit. J'ai eu 3 entretiens en 2 semaines.",color:'#FDEAEA',textColor:'#E8151B' },
              { initials:'MK',name:'Marc K.',role:'Dev backend → Startup Series B',text:"L'IA qui génère le CV est bluffante. En 30 secondes j'avais un CV bien mieux rédigé que ce que j'aurais fait moi-même.",color:'#FEF9E0',textColor:'#B8900A' },
              { initials:'AC',name:'Amandine C.',role:'Reconversion → Talent Acquisition',text:"Jean Find My Job m'a aidée à valoriser mes compétences transférables. Résultat : CDI en 6 semaines.",color:'#EBF2FD',textColor:'#1A6FDB' },
            ].map(t => (
              <div key={t.name} className="testi-card">
                <div style={{ color:'#E8151B',fontSize:14,marginBottom:12,fontWeight:900 }}>★★★★★</div>
                <p style={{ fontSize:14,lineHeight:1.7,fontStyle:'italic',marginBottom:16,fontWeight:500,color:'#333' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:38,height:38,borderRadius:'50%',background:t.color,border:`2px solid ${t.textColor}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:t.textColor,flexShrink:0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:800 }}>{t.name}</div>
                    <div style={{ fontSize:12,color:'#888',fontWeight:500 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section style={{ padding:'5rem 2rem',background:'#FAFAFA',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1400,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <div style={{ display:'inline-block',background:'#F5C400',border:'2px solid #111',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>Conseils & actus</div>
            <h2 style={{ fontSize:'2.2rem',fontWeight:900,letterSpacing:'-0.02em' }}>Jean a quelque chose à vous dire</h2>
            <p style={{ color:'#888',marginTop:'0.5rem',fontWeight:500 }}>Nos conseils pour booster votre recherche d&apos;emploi</p>
          </div>
          <div className="blog-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem' }}>
            <a href="#" className="blog-card">
              <div style={{ height:180,background:'linear-gradient(135deg,#111 0%,#333 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:12,left:12 }}>
                  <span style={{ background:'#F5C400',color:'#111',borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.05em' }}>Recrutement</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:48 }}>🤖</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:8,fontWeight:600 }}>ATS · Intelligence artificielle</div>
                </div>
              </div>
              <div style={{ padding:'1.25rem' }}>
                <h3 style={{ fontSize:16,fontWeight:800,marginBottom:8,letterSpacing:'-0.01em',lineHeight:1.3 }}>C&apos;est quoi un ATS ?</h3>
                <p style={{ fontSize:13,color:'#555',lineHeight:1.65,marginBottom:12,fontWeight:500 }}>Ces logiciels qui filtrent votre CV avant même qu&apos;un humain le lise. Comment les contourner et mettre toutes les chances de votre côté.</p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div style={{ fontSize:11,color:'#888',fontWeight:600 }}>5 min de lecture</div>
                  <div style={{ fontSize:12,fontWeight:800,color:'#E8151B' }}>Lire → </div>
                </div>
              </div>
            </a>

            <a href="#" className="blog-card">
              <div style={{ height:180,background:'linear-gradient(135deg,#E8151B 0%,#C01116 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:12,left:12 }}>
                  <span style={{ background:'#F5C400',color:'#111',borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.05em' }}>Carrière</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:48 }}>💪</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:8,fontWeight:600 }}>Senior · Reconversion</div>
                </div>
              </div>
              <div style={{ padding:'1.25rem' }}>
                <h3 style={{ fontSize:16,fontWeight:800,marginBottom:8,letterSpacing:'-0.01em',lineHeight:1.3 }}>Trouver un job après 45 ans, c&apos;est possible !</h3>
                <p style={{ fontSize:13,color:'#555',lineHeight:1.65,marginBottom:12,fontWeight:500 }}>Stratégies concrètes pour valoriser votre expérience, contourner les biais et décrocher des entretiens après 45 ans.</p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div style={{ fontSize:11,color:'#888',fontWeight:600 }}>7 min de lecture</div>
                  <div style={{ fontSize:12,fontWeight:800,color:'#E8151B' }}>Lire → </div>
                </div>
              </div>
            </a>

            <a href="#" className="blog-card">
              <div style={{ height:180,background:'linear-gradient(135deg,#1A4A8A 0%,#1A6FDB 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:12,left:12 }}>
                  <span style={{ background:'#F5C400',color:'#111',borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.05em' }}>Chiffres</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:48 }}>📊</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:8,fontWeight:600 }}>Données · Marché de l&apos;emploi</div>
                </div>
              </div>
              <div style={{ padding:'1.25rem' }}>
                <h3 style={{ fontSize:16,fontWeight:800,marginBottom:8,letterSpacing:'-0.01em',lineHeight:1.3 }}>Les vrais chiffres du recrutement 45 ans et +</h3>
                <p style={{ fontSize:13,color:'#555',lineHeight:1.65,marginBottom:12,fontWeight:500 }}>Taux de réponse, délais moyens, canaux efficaces… Les données réelles pour calibrer votre recherche d&apos;emploi.</p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div style={{ fontSize:11,color:'#888',fontWeight:600 }}>4 min de lecture</div>
                  <div style={{ fontSize:12,fontWeight:800,color:'#E8151B' }}>Lire → </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:'#111',borderBottom:'2.5px solid #111',padding:'6rem 2rem',textAlign:'center' }}>
        <div style={{ display:'inline-block',background:'#F5C400',border:'2px solid rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1.5rem',textTransform:'uppercase',letterSpacing:'0.05em' }}>C&apos;est gratuit !</div>
        <h2 style={{ fontSize:'2.8rem',color:'#fff',marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Prêt à trouver votre prochain poste ?</h2>
        <p style={{ color:'rgba(255,255,255,0.7)',fontSize:'1.05rem',marginBottom:'2.5rem',fontWeight:500 }}>Rejoignez les candidats qui organisent mieux leur recherche avec Jean Find My Job.</p>
        <Link href="/auth/signup" className="btn-red" style={{ fontSize:16,padding:'16px 44px',borderRadius:12 }}>
          Commencer gratuitement — sans carte bancaire
        </Link>
        <p style={{ marginTop:'1.25rem',fontSize:13,color:'rgba(255,255,255,0.4)',fontWeight:600 }}>Résultat en moins de 30 secondes · Données sécurisées</p>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#fff',borderTop:'2.5px solid #111',padding:'3.5rem 3rem 2rem' }}>
        <div className="footer-grid" style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'3rem',maxWidth:1400,margin:'0 auto' }}>

          <div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:'1rem' }}>
              <img src="/logo.png" alt="Jean Find My Job" style={{ height:52,width:'auto',objectFit:'contain' }} />
              <span style={{ fontFamily:'Montserrat,sans-serif',fontSize:'1rem',fontWeight:900,color:'#111' }}>
                Jean <span style={{ color:'#E8151B' }}>Find My Job</span>
              </span>
            </div>
            <p style={{ fontSize:13,color:'#555',lineHeight:1.7,fontWeight:500,marginBottom:'1.25rem',maxWidth:260 }}>
              La plateforme de recherche d&apos;emploi propulsée par Claude AI. Tableau de bord Kanban, pipeline par offre, CV Creator.
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
            <div style={{ background:'#F4F4F4',border:'2px solid #E0E0E0',borderRadius:10,padding:'1rem',marginTop:'0.5rem' }}>
              <div style={{ fontSize:12,fontWeight:800,color:'#111',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em' }}>📬 Newsletter</div>
              <div style={{ fontSize:12,color:'#888',fontWeight:500,marginBottom:8 }}>Conseils emploi chaque semaine</div>
              <div style={{ display:'flex',gap:6 }}>
                <input placeholder="votre@email.com" style={{ flex:1,border:'2px solid #E0E0E0',borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:'Montserrat,sans-serif',outline:'none' }} />
                <button style={{ background:'#111',color:'#F5C400',border:'2px solid #111',borderRadius:6,padding:'7px 12px',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'Montserrat,sans-serif',whiteSpace:'nowrap' }}>OK →</button>
              </div>
            </div>
          </div>

          <div>
            <h5 style={{ fontSize:11,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'1rem',borderBottom:'2px solid #111',paddingBottom:8 }}>Produit</h5>
            {[['Tableau de bord','#fonctionnalites'],['Pipeline par offre','#fonctionnalites'],['CV Creator','#cv'],['Suivi contacts','#fonctionnalites'],['Statistiques','#fonctionnalites']].map(([label,href]) => (
              <a key={label} href={href} className="footer-link">{label}</a>
            ))}
          </div>

          <div>
            <h5 style={{ fontSize:11,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'1rem',borderBottom:'2px solid #111',paddingBottom:8 }}>Ressources</h5>
            {[['Guide de démarrage','#'],['Blog','#'],['Templates CV','#'],['Conseils entretien','#'],['Chaîne YouTube','https://www.youtube.com/channel/UCDgezWysIr83yW5dUlkKbSg']].map(([label,href]) => (
              <a key={label} href={href} className="footer-link" target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{label}</a>
            ))}
          </div>

          <div>
            <h5 style={{ fontSize:11,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'1rem',borderBottom:'2px solid #111',paddingBottom:8 }}>Entreprise</h5>
            {[['À propos','#'],['Tarifs','#'],['Contact','mailto:contact@jeanfindmyjob.fr'],['Confidentialité','#'],['CGU','#']].map(([label,href]) => (
              <a key={label} href={href} className="footer-link">{label}</a>
            ))}
          </div>

        </div>

        <div style={{ maxWidth:1400,margin:'2rem auto 0',paddingTop:'1.5rem',borderTop:'1.5px solid #E0E0E0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8 }}>
          <p style={{ fontSize:12,color:'#888',fontWeight:500 }}>© 2026 Jean Find My Job · Propulsé par Claude AI</p>
          <p style={{ fontSize:12,color:'#888',fontWeight:500 }}>Fait avec ♥ pour les candidats</p>
        </div>
      </footer>
    </div>
  );
}
