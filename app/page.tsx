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
        .btn-black:active { transform:translate(1px,1px);box-shadow:2px 2px 0 #E8151B; }

        .btn-red { display:inline-flex;align-items:center;gap:8px;background:#E8151B;color:#fff;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #111;letter-spacing:0.02em; }
        .btn-red:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 #111; }

        .btn-outline { display:inline-flex;align-items:center;gap:8px;background:#fff;color:#111;border:2.5px solid #111;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s;text-decoration:none;box-shadow:4px 4px 0 #E0E0E0; }
        .btn-outline:hover { background:#F4F4F4;transform:translate(-1px,-1px); }

        .feat-card { background:#fff;border:2px solid #111;border-radius:12px;padding:1.5rem;transition:all 0.2s;box-shadow:3px 3px 0 #111; }
        .feat-card:hover { transform:translate(-2px,-2px);box-shadow:5px 5px 0 #E8151B; }

        .testi-card { background:#fff;border:2px solid #111;border-radius:12px;padding:1.5rem;box-shadow:3px 3px 0 #111; }
        .step-card { background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.15);border-radius:12px;padding:1.75rem; }

        .pill { display:inline-flex;align-items:center;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700; }
        .pill-red { background:#FDEAEA;color:#E8151B;border:1.5px solid #E8151B; }
        .pill-yellow { background:#FEF9E0;color:#B8900A;border:1.5px solid #F5C400; }
        .pill-blue { background:#EBF2FD;color:#1A6FDB;border:1.5px solid #1A6FDB; }
        .pill-gray { background:#F4F4F4;color:#6B6B6B;border:1.5px solid #E0E0E0; }
        .pill-green { background:#E8F5EE;color:#1A7A4A;border:1.5px solid #1A7A4A; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        .fade1{animation:fadeUp 0.6s ease 0.1s both}
        .fade2{animation:fadeUp 0.6s ease 0.2s both}
        .fade3{animation:fadeUp 0.6s ease 0.3s both}
        .fade4{animation:fadeUp 0.6s ease 0.4s both}

        @media(max-width:768px){
          .nav-desktop{display:none!important}
          .hero-grid,.feat-grid,.steps-grid,.testi-grid{grid-template-columns:1fr!important}
          .feats-grid{grid-template-columns:1fr 1fr!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 2.5rem',background:'#fff',borderBottom:'2.5px solid #111',position:'sticky',top:0,zIndex:100 }}>
        <Link href="/" style={{ textDecoration:'none',display:'flex',alignItems:'center',gap:10 }}>
          <img src="/logo.png" alt="Jean Find My Job" style={{ height:40,width:'auto' }} />
          <span style={{ fontFamily:'Montserrat,sans-serif',fontSize:'1rem',fontWeight:900,color:'#111',letterSpacing:'-0.01em' }}>Jean <span style={{ color:'#E8151B' }}>Find My Job</span></span>
        </Link>
        <div className="nav-desktop" style={{ display:'flex',gap:'2rem',alignItems:'center' }}>
          {[['#dashboard','Tableau de bord'],['#cv','CV Creator'],['#fonctionnalites','Fonctionnalités']].map(([h,l]) => (
            <a key={h} href={h} style={{ fontSize:13,color:'#111',textDecoration:'none',fontWeight:700,letterSpacing:'0.02em',textTransform:'uppercase' }}>{l}</a>
          ))}
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <Link href="/auth/login" className="btn-outline" style={{ padding:'9px 20px',fontSize:13 }}>Connexion</Link>
          <Link href="/auth/signup" className="btn-black" style={{ padding:'9px 20px',fontSize:13 }}>Commencer →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:'#fff',borderBottom:'2.5px solid #111',overflow:'hidden' }}>
        <div className="hero-grid" style={{ maxWidth:1100,margin:'0 auto',padding:'5rem 2rem 4rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center' }}>
          <div>
            <div className="fade1" style={{ display:'inline-flex',alignItems:'center',gap:6,background:'#FEF9E0',border:'2px solid #111',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1.5rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>
              ⚡ Propulsé par Claude AI
            </div>
            <h1 className="fade2" style={{ fontSize:'clamp(2.4rem,4vw,3.8rem)',lineHeight:1.1,marginBottom:'1.25rem',fontWeight:900,letterSpacing:'-0.02em' }}>
              Trouvez votre job,<br />
              <span style={{ color:'#E8151B',fontStyle:'italic' }}>sans vous perdre</span><br />
              dans le chaos
            </h1>
            <p className="fade3" style={{ fontSize:'1.05rem',color:'#555',marginBottom:'2rem',lineHeight:1.75,maxWidth:460,fontWeight:500 }}>
              Jean Find My Job centralise votre recherche d&apos;emploi — tableau de bord, CV personnalisé par IA, suivi des candidatures. Tout au même endroit, enfin.
            </p>
            <div className="fade4" style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'center' }}>
              <Link href="/auth/signup" className="btn-black" style={{ fontSize:15,padding:'14px 32px' }}>Commencer gratuitement →</Link>
              <a href="#dashboard" className="btn-outline" style={{ fontSize:15,padding:'14px 32px' }}>Voir le tableau de bord</a>
            </div>
            <div style={{ marginTop:'1.5rem',fontSize:13,color:'#888',display:'flex',alignItems:'center',gap:8,fontWeight:600 }}>
              <span style={{ color:'#E8151B' }}>★★★★★</span>
              Rejoint par <span style={{ color:'#E8151B',margin:'0 3px' }}>+2 000</span> candidats cette année
            </div>
          </div>

          {/* Kanban mockup */}
          <div id="dashboard" style={{ background:'#fff',borderRadius:12,border:'2.5px solid #111',boxShadow:'6px 6px 0 #111',overflow:'hidden' }}>
            <div style={{ background:'#111',padding:'10px 16px',display:'flex',gap:8 }}>
              {['#E8151B','#F5C400','#27c93f'].map(c => <div key={c} style={{ width:10,height:10,borderRadius:'50%',background:c,border:'1.5px solid rgba(255,255,255,0.3)' }} />)}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'150px 1fr' }}>
              <div style={{ background:'#F4F4F4',borderRight:'2px solid #E0E0E0',padding:'14px 10px' }}>
                <div style={{ fontSize:10,fontWeight:800,color:'#888',marginBottom:10,letterSpacing:'0.08em',textTransform:'uppercase' }}>Jean FMJ</div>
                {[['📊','Tableau',true],['📄','Mon CV',false],['📋','Candidatures',false],['👥','Contacts',false]].map(([ic,lb,ac]) => (
                  <div key={lb as string} style={{ display:'flex',alignItems:'center',gap:7,padding:'7px 8px',borderRadius:6,fontSize:11,marginBottom:3,fontWeight:700,background:ac?'#FDEAEA':'transparent',color:ac?'#E8151B':'#888',border:ac?'1.5px solid #E8151B':'1.5px solid transparent' }}>
                    <span>{ic as string}</span>{lb as string}
                  </div>
                ))}
              </div>
              <div style={{ padding:14 }}>
                <div style={{ fontSize:12,fontWeight:800,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.04em' }}>Mes candidatures</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6 }}>
                  {[
                    { col:'À postuler',cards:[{t:'Chef projet',s:'Decathlon',p:'pill-gray',l:'Paris'}] },
                    { col:'Postulé',cards:[{t:'Chargée comm',s:'LVMH',p:'pill-blue',l:'Envoyé'}] },
                    { col:'Entretien',cards:[{t:'DRH Adj.',s:'BNP',p:'pill-yellow',l:'Lundi'}] },
                    { col:'Offre !',cards:[{t:'Resp. Mktg',s:'Sanofi',p:'pill-green',l:'✓ Offre'}] },
                  ].map(({ col, cards }) => (
                    <div key={col}>
                      <div style={{ fontSize:9,fontWeight:800,color:'#888',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>{col}</div>
                      {cards.map(c => (
                        <div key={c.t} style={{ background:'#fff',border:'1.5px solid #E0E0E0',borderRadius:6,padding:7,marginBottom:5,boxShadow:'2px 2px 0 #E0E0E0' }}>
                          <div style={{ fontSize:10,fontWeight:700 }}>{c.t}</div>
                          <div style={{ fontSize:9,color:'#888' }}>{c.s}</div>
                          <span className={`pill ${c.p}`} style={{ marginTop:4,display:'inline-flex',fontSize:9,padding:'1px 6px' }}>{c.l}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS — fond noir au lieu de rouge */}
      <div style={{ background:'#111',borderBottom:'2.5px solid #111',padding:'2rem 3rem',display:'flex',justifyContent:'center',gap:'6rem',flexWrap:'wrap' }}>
        {[['2 000+','Candidats actifs'],['3x',"Plus d'entretiens"],['30s','Pour un CV'],['4.9★','Note moyenne']].map(([n,l]) => (
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:'2.2rem',fontWeight:900,color:'#F5C400',letterSpacing:'-0.02em',fontFamily:'Montserrat,sans-serif' }}>{n}</div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.7)',marginTop:2,fontWeight:600 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* FEATURE 1 */}
      <div style={{ height:'2.5px',background:'#111' }} />
      <section className="feat-grid" style={{ maxWidth:1100,margin:'0 auto',padding:'5rem 2rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center' }}>
        <div>
          <div style={{ fontSize:'5rem',fontWeight:900,color:'#F5C400',lineHeight:1,marginBottom:'-1rem',WebkitTextStroke:'2px #111',fontFamily:'Montserrat,sans-serif' }}>01</div>
          <div style={{ display:'inline-block',background:'#FEF9E0',border:'2px solid #111',borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:800,color:'#111',margin:'0 0 1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>📋 Tableau de bord</div>
          <h3 style={{ fontSize:'1.9rem',lineHeight:1.2,marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Votre recherche,<br />enfin organisée</h3>
          <p style={{ fontSize:15,color:'#555',lineHeight:1.75,marginBottom:'1.5rem',fontWeight:500 }}>Fini les tableurs Excel. Jean Find My Job centralise toutes vos candidatures dans un tableau Kanban visuel. Glissez, déposez, suivez en temps réel.</p>
          <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:10 }}>
            {['Vue Kanban de "à postuler" à "offre reçue"','Fiches détaillées : description, contacts, notes','Rappels automatiques pour les relances','Statistiques de votre recherche en temps réel'].map(item => (
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
            <div style={{ fontSize:10,fontWeight:800,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em' }}>Activité récente</div>
            {[['📨','BNP Paribas','entretien confirmé lundi'],['⭐','Sanofi','offre reçue !'],['📋','Decathlon','relance à envoyer']].map(([ic,co,msg]) => (
              <div key={co as string} style={{ display:'flex',alignItems:'center',gap:8,padding:7,background:'#F4F4F4',borderRadius:6,marginBottom:5,border:'1.5px solid #E0E0E0' }}>
                <span style={{ fontSize:12 }}>{ic as string}</span>
                <div style={{ fontSize:10,fontWeight:600 }}><b>{co as string}</b> — {msg as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height:'2.5px',background:'#111',maxWidth:1100,margin:'0 auto' }} />

      {/* FEATURE 2 */}
      <section id="cv" className="feat-grid" style={{ maxWidth:1100,margin:'0 auto',padding:'5rem 2rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center' }}>
        <div style={{ background:'#fff',borderRadius:12,border:'2.5px solid #111',boxShadow:'6px 6px 0 #111',overflow:'hidden' }}>
          <div style={{ padding:'12px 16px',borderBottom:'2px solid #111',background:'#F5C400',fontSize:12,fontWeight:800,color:'#111',textTransform:'uppercase',letterSpacing:'0.04em' }}>CV Creator — Aperçu</div>
          <div style={{ padding:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <div style={{ fontSize:10,fontWeight:800,color:'#888',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8 }}>Vos infos</div>
              {['Prénom & Nom','Poste visé','Expériences','Compétences'].map(f => (
                <div key={f} style={{ background:'#F4F4F4',border:'1.5px solid #E0E0E0',borderRadius:5,padding:'6px 8px',fontSize:10,color:'#888',marginBottom:5,fontWeight:600 }}>{f}</div>
              ))}
              <div style={{ marginTop:10,background:'#111',color:'#F5C400',borderRadius:6,padding:7,textAlign:'center',fontSize:10,fontWeight:800,boxShadow:'2px 2px 0 #E8151B' }}>Générer avec Claude →</div>
            </div>
            <div style={{ fontSize:10 }}>
              <div style={{ fontSize:14,fontWeight:900,marginBottom:2,letterSpacing:'-0.01em' }}>Emmanuelle G.</div>
              <div style={{ fontSize:11,color:'#E8151B',marginBottom:8,fontWeight:700 }}>Responsable Marketing</div>
              {['Expériences','Formation','Compétences'].map(s => (
                <div key={s}>
                  <div style={{ fontSize:9,fontWeight:800,textTransform:'uppercase',color:'#888',borderBottom:'2px solid #111',paddingBottom:3,margin:'8px 0 5px',letterSpacing:'0.06em' }}>{s}</div>
                  <div style={{ height:7,background:'#F4F4F4',borderRadius:3,marginBottom:4,width:'90%',border:'1px solid #E0E0E0' }} />
                  <div style={{ height:7,background:'#F4F4F4',borderRadius:3,marginBottom:4,width:'70%',border:'1px solid #E0E0E0' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize:'5rem',fontWeight:900,color:'#F5C400',lineHeight:1,marginBottom:'-1rem',WebkitTextStroke:'2px #111',fontFamily:'Montserrat,sans-serif' }}>02</div>
          <div style={{ display:'inline-block',background:'#FDEAEA',border:'2px solid #111',borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:800,color:'#111',margin:'0 0 1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>✦ CV Creator IA</div>
          <h3 style={{ fontSize:'1.9rem',lineHeight:1.2,marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Un CV percutant<br />en 30 secondes</h3>
          <p style={{ fontSize:15,color:'#555',lineHeight:1.75,marginBottom:'1.5rem',fontWeight:500 }}>Importez votre profil LinkedIn, choisissez un template et laissez Claude AI rédiger votre CV avec des formulations professionnelles, optimisé pour chaque poste.</p>
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

      {/* HOW IT WORKS — fond noir, pas rouge */}
      <section style={{ background:'#111',borderTop:'2.5px solid #111',borderBottom:'2.5px solid #111',padding:'5rem 2rem' }}>
        <div style={{ maxWidth:900,margin:'0 auto',textAlign:'center' }}>
          <div style={{ display:'inline-block',background:'#F5C400',border:'2px solid rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',textTransform:'uppercase',letterSpacing:'0.05em' }}>Simple comme bonjour</div>
          <h2 style={{ fontSize:'2.5rem',color:'#fff',marginBottom:'0.75rem',fontWeight:900,letterSpacing:'-0.02em' }}>Comment ça marche ?</h2>
          <p style={{ color:'rgba(255,255,255,0.6)',marginBottom:'3rem',fontWeight:500 }}>Trois étapes pour décrocher plus d&apos;entretiens</p>
          <div className="steps-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'2rem',textAlign:'left' }}>
            {[
              { icon:'👤',num:'01',title:'Créez votre profil',desc:'Inscrivez-vous gratuitement et importez votre profil LinkedIn en PDF. Jean Find My Job extrait automatiquement toutes vos informations.' },
              { icon:'📋',num:'02',title:'Organisez vos candidatures',desc:"Ajoutez vos offres et suivez leur avancement dans votre tableau de bord Kanban. Notes, contacts, entretiens — tout au même endroit." },
              { icon:'✨',num:'03',title:'Générez votre CV par IA',desc:'Pour chaque candidature, laissez Claude AI créer un CV percutant et optimisé pour le poste. Exportez en PDF et postulez.' },
            ].map(s => (
              <div key={s.num} className="step-card">
                <div style={{ width:44,height:44,borderRadius:10,background:'#E8151B',border:'2px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:'1rem' }}>{s.icon}</div>
                <div style={{ fontSize:11,fontWeight:800,color:'#F5C400',letterSpacing:'0.08em',marginBottom:6,textTransform:'uppercase' }}>ÉTAPE {s.num}</div>
                <h4 style={{ color:'#fff',fontSize:'1rem',fontWeight:800,marginBottom:8,letterSpacing:'-0.01em' }}>{s.title}</h4>
                <p style={{ color:'rgba(255,255,255,0.6)',fontSize:13,lineHeight:1.65,fontWeight:500 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID — fond légèrement gris, pas rouge */}
      <section id="fonctionnalites" style={{ padding:'5rem 2rem',background:'#FAFAFA',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:'3rem' }}>
            <div style={{ display:'inline-block',background:'#F5C400',border:'2px solid #111',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1rem',boxShadow:'2px 2px 0 #111',textTransform:'uppercase',letterSpacing:'0.05em' }}>Tout inclus</div>
            <h2 style={{ fontSize:'2.2rem',fontWeight:900,letterSpacing:'-0.02em' }}>Tout ce qu&apos;il vous faut</h2>
            <p style={{ color:'#888',marginTop:'0.5rem',fontWeight:500 }}>Une plateforme complète pour votre recherche d&apos;emploi</p>
          </div>
          <div className="feats-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem' }}>
            {[
              { icon:'📊',title:'Tableau de bord Kanban',desc:"Visualisez toutes vos candidatures d'un coup d'œil. Glissez-déposez pour mettre à jour le statut." },
              { icon:'🤖',title:'CV Creator IA',desc:'Claude AI rédige votre CV avec des formulations percutantes, adapté à chaque poste.' },
              { icon:'🔗',title:'Import LinkedIn',desc:'Exportez votre profil LinkedIn en PDF et Jean Find My Job remplit automatiquement toutes vos informations.' },
              { icon:'👥',title:'Suivi des contacts',desc:'Gardez une trace de tous les recruteurs et managers. Ne perdez plus aucune relation clé.' },
              { icon:'📅',title:'Gestion des entretiens',desc:'Planifiez et préparez vos entretiens. Stockez les questions, réponses et retours.' },
              { icon:'📈',title:'Statistiques',desc:"Taux de réponse, délais moyens, canaux efficaces. Optimisez votre stratégie avec les données." },
              { icon:'💾',title:'Sauvegarde cloud',desc:"Tous vos CVs et données sauvegardés en sécurité, accessibles depuis n'importe quel appareil." },
              { icon:'📥',title:'Export PDF',desc:'Téléchargez votre CV en PDF professionnel prêt à envoyer, en un seul clic.' },
              { icon:'🌍',title:'Multilingue',desc:'Générez vos CVs en français, anglais, espagnol ou allemand selon le marché visé.' },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ fontSize:24,marginBottom:12 }}>{f.icon}</div>
                <h4 style={{ fontSize:15,fontWeight:800,marginBottom:6,letterSpacing:'-0.01em' }}>{f.title}</h4>
                <p style={{ fontSize:13,color:'#555',lineHeight:1.6,fontWeight:500 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding:'5rem 2rem',background:'#fff',borderBottom:'2.5px solid #111' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
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

      {/* CTA — fond noir avec accent rouge, plus équilibré */}
      <section style={{ background:'#111',borderBottom:'2.5px solid #111',padding:'6rem 2rem',textAlign:'center' }}>
        <div style={{ display:'inline-block',background:'#F5C400',border:'2px solid rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:800,color:'#111',marginBottom:'1.5rem',textTransform:'uppercase',letterSpacing:'0.05em' }}>C&apos;est gratuit !</div>
        <h2 style={{ fontSize:'2.8rem',color:'#fff',marginBottom:'1rem',fontWeight:900,letterSpacing:'-0.02em' }}>Prête à trouver votre prochain poste ?</h2>
        <p style={{ color:'rgba(255,255,255,0.7)',fontSize:'1.05rem',marginBottom:'2.5rem',fontWeight:500 }}>Rejoignez 2 000+ candidats qui ont décroché plus d&apos;entretiens avec Jean Find My Job.</p>
        <Link href="/auth/signup" className="btn-red" style={{ fontSize:16,padding:'16px 44px',borderRadius:12 }}>
          Commencer gratuitement — sans carte bancaire
        </Link>
        <p style={{ marginTop:'1.25rem',fontSize:13,color:'rgba(255,255,255,0.4)',fontWeight:600 }}>Résultat en moins de 30 secondes · Données sécurisées</p>
      </section>

      {/* FOOTER */}
      <footer className="footer-grid" style={{ background:'#111',borderTop:'1px solid rgba(255,255,255,0.1)',padding:'3rem',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'3rem' }}>
        <div>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:'0.75rem' }}>
            <div style={{ background:'#E8151B',border:'2px solid rgba(255,255,255,0.2)',borderRadius:8,padding:'4px 12px' }}>
              <span style={{ fontFamily:'Montserrat,sans-serif',fontSize:'1rem',fontWeight:900,color:'#F5C400' }}>Jean</span>
            </div>
            <span style={{ fontSize:'0.8rem',fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em' }}>Find My Job</span>
          </div>
          <p style={{ fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.7,fontWeight:500 }}>La plateforme de recherche d&apos;emploi propulsée par Claude AI. Tableau de bord, CV Creator, suivi des candidatures.</p>
        </div>
        {[
          { title:'Produit',links:['Tableau de bord','CV Creator','Suivi contacts','Entretiens','Statistiques'] },
          { title:'Ressources',links:['Guide de démarrage','Blog','Templates CV','Conseils entretien'] },
          { title:'Entreprise',links:['À propos','Tarifs','Contact','Confidentialité','CGU'] },
        ].map(col => (
          <div key={col.title}>
            <h5 style={{ fontSize:11,fontWeight:800,color:'#F5C400',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'1rem' }}>{col.title}</h5>
            {col.links.map(link => (
              <a key={link} href="#" style={{ display:'block',fontSize:13,color:'rgba(255,255,255,0.45)',textDecoration:'none',marginBottom:8,fontWeight:500 }}>{link}</a>
            ))}
          </div>
        ))}
      </footer>
      <div style={{ background:'#111',padding:'1.25rem 3rem',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between' }}>
        <p style={{ fontSize:12,color:'rgba(255,255,255,0.25)',fontWeight:500 }}>© 2026 Jean Find My Job · Propulsé par Claude AI</p>
        <p style={{ fontSize:12,color:'rgba(255,255,255,0.25)',fontWeight:500 }}>Fait avec ♥ pour les candidats</p>
      </div>
    </div>
  );
}
