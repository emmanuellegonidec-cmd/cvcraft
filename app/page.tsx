import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#faf8f3', color: '#0f0e0c', lineHeight: '1.6' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        :root {
          --ink: #0f0e0c; --cream: #faf8f3; --warm: #f2ede2;
          --accent: #1a56db; --accent-light: #ebf0fd;
          --green: #0e7c4a; --green-light: #e6f5ee;
          --muted: #7a7670; --border: #e8e2d6;
          --shadow: 0 4px 32px rgba(15,14,12,0.08);
        }
        .serif { font-family: 'Playfair Display', serif; }
        .btn { display: inline-flex; align-items: center; gap: 8px; border-radius: 8px; padding: 9px 20px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; text-decoration: none; border: none; }
        .btn-ghost { background: transparent; color: var(--ink); border: 1px solid var(--border); }
        .btn-ghost:hover { background: var(--warm); }
        .btn-primary { background: var(--ink); color: white; }
        .btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-accent { background: var(--accent); color: white; }
        .btn-accent:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-lg { padding: 14px 32px; font-size: 15px; border-radius: 10px; }
        .pill { display: inline-block; border-radius: 10px; padding: 2px 7px; font-size: 9px; font-weight: 600; margin-top: 4px; }
        .pill-blue { background: #ebf0fd; color: #1a56db; }
        .pill-green { background: #e6f5ee; color: #0e7c4a; }
        .pill-amber { background: #faeeda; color: #854f0b; }
        .pill-gray { background: #f2ede2; color: #7a7670; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade1 { animation: fadeUp 0.6s ease 0.1s both; }
        .fade2 { animation: fadeUp 0.6s ease 0.2s both; }
        .fade3 { animation: fadeUp 0.6s ease 0.3s both; }
        .fade4 { animation: fadeUp 0.6s ease 0.4s both; }
        .feat-card { background: #faf8f3; border: 1px solid #e8e2d6; border-radius: 14px; padding: 1.5rem; transition: all 0.2s; }
        .feat-card:hover { background: white; box-shadow: 0 4px 32px rgba(15,14,12,0.08); transform: translateY(-2px); }
        .testi-card { background: white; border: 1px solid #e8e2d6; border-radius: 14px; padding: 1.5rem; }
        .step-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 1.75rem; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .hero-grid, .feat-grid, .steps-grid, .testi-grid, .footer-grid { grid-template-columns: 1fr !important; }
          .feats-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-row { gap: 2rem !important; padding: 2rem 1.5rem !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 3rem', background: 'rgba(250,248,243,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e8e2d6', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: '#0f0e0c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db' }} />Jean
        </Link>
        <div className="nav-desktop" style={{ display: 'flex', gap: '2rem' }}>
          {['#dashboard|Tableau de bord', '#cv|CV Creator', '#fonctionnalites|Fonctionnalités'].map(item => {
            const [href, label] = item.split('|');
            return <a key={href} href={href} style={{ fontSize: 14, color: '#7a7670', textDecoration: 'none', fontWeight: 500 }}>{label}</a>;
          })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login" className="btn btn-ghost">Connexion</Link>
          <Link href="/auth/signup" className="btn btn-primary">Commencer gratuitement</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ overflow: 'hidden' }}>
        <div className="hero-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem 4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div className="fade1" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e6f5ee', border: '1px solid #9fd8b8', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#0e7c4a', marginBottom: '1.5rem' }}>
              ✦ Propulsé par Claude AI
            </div>
            <h1 className="fade2 serif" style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 1.15, marginBottom: '1.25rem' }}>
              Trouvez votre job,<br />
              <em style={{ fontStyle: 'italic', color: '#1a56db' }}>sans vous perdre</em><br />
              dans le chaos
            </h1>
            <p className="fade3" style={{ fontSize: '1.05rem', color: '#7a7670', marginBottom: '2rem', lineHeight: 1.75, maxWidth: 460 }}>
              Jean centralise votre recherche d&apos;emploi — tableau de bord, CV personnalisé par IA, suivi des candidatures. Tout au même endroit, enfin.
            </p>
            <div className="fade4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/auth/signup" className="btn btn-primary btn-lg">Commencer gratuitement →</Link>
              <a href="#dashboard" className="btn btn-ghost btn-lg">Voir le tableau de bord</a>
            </div>
            <div style={{ marginTop: '1.5rem', fontSize: 13, color: '#7a7670', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#0e7c4a', fontWeight: 600 }}>★★★★★</span>
              Rejoint par <span style={{ color: '#0e7c4a', fontWeight: 600, margin: '0 3px' }}>+2 000</span> candidats cette année
            </div>
          </div>

          {/* Kanban mockup */}
          <div id="dashboard" style={{ background: 'white', borderRadius: 16, border: '1px solid #e8e2d6', boxShadow: '0 4px 32px rgba(15,14,12,0.08)', overflow: 'hidden' }}>
            <div style={{ background: '#0f0e0c', padding: '10px 16px', display: 'flex', gap: 8 }}>
              {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
              <div style={{ background: '#fafaf8', borderRight: '1px solid #e8e2d6', padding: '14px 10px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7a7670', marginBottom: 10 }}>JEAN</div>
                {[['📊','Tableau de bord',true],['📄','Mon CV',false],['📋','Candidatures',false],['👥','Contacts',false],['📅','Entretiens',false]].map(([ic,lb,ac]) => (
                  <div key={lb as string} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', borderRadius: 6, fontSize: 11, marginBottom: 3, fontWeight: 500, background: ac ? '#ebf0fd' : 'transparent', color: ac ? '#1a56db' : '#7a7670' }}>
                    <span>{ic as string}</span>{lb as string}
                  </div>
                ))}
                <div style={{ height: 1, background: '#e8e2d6', margin: '10px 0' }} />
                <div style={{ fontSize: 10, color: '#7a7670', padding: '4px 8px' }}>12 offres suivies</div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Mes candidatures</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { col: 'À postuler', cards: [{t:'Chef projet',s:'Decathlon',p:'pill-gray',l:'Paris'},{t:'Mktg Mgr',s:"L'Oréal",p:'pill-gray',l:'Hybrid'}] },
                    { col: 'Postulé', cards: [{t:'Comm',s:'LVMH',p:'pill-blue',l:'CV envoyé'}] },
                    { col: 'Entretien', cards: [{t:'DRH Adj.',s:'BNP',p:'pill-amber',l:'Lundi 14h'}] },
                    { col: 'Offre', cards: [{t:'Resp. Mktg',s:'Sanofi',p:'pill-green',l:'✓ Offre !'}] },
                  ].map(({ col, cards }) => (
                    <div key={col}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#7a7670', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{col}</div>
                      {cards.map(c => (
                        <div key={c.t} style={{ background: 'white', border: '1px solid #e8e2d6', borderRadius: 6, padding: 7, marginBottom: 5 }}>
                          <div style={{ fontSize: 10, fontWeight: 600 }}>{c.t}</div>
                          <div style={{ fontSize: 9, color: '#7a7670' }}>{c.s}</div>
                          <span className={`pill ${c.p}`}>{c.l}</span>
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

      {/* STATS */}
      <div className="stats-row" style={{ background: '#0f0e0c', padding: '2rem 3rem', display: 'flex', justifyContent: 'center', gap: '6rem', flexWrap: 'wrap' }}>
        {[['2 000+','Candidats actifs'],['3x',"Plus d'entretiens"],['30s','Pour un CV'],['4.9★','Note moyenne']].map(([n,l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'white' }}>{n}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* FEATURE 1 */}
      <div style={{ height: 1, background: '#e8e2d6', maxWidth: 1100, margin: '0 auto' }} />
      <section className="feat-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
        <div>
          <div className="serif" style={{ fontSize: '5rem', fontWeight: 700, color: '#e8e2d6', lineHeight: 1, marginBottom: '-1rem' }}>01</div>
          <div style={{ display: 'inline-block', background: '#f2ede2', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#7a7670', margin: '0 0 1rem' }}>📋 Tableau de bord</div>
          <h3 className="serif" style={{ fontSize: '1.9rem', lineHeight: 1.25, marginBottom: '1rem' }}>Votre recherche,<br />enfin organisée</h3>
          <p style={{ fontSize: 15, color: '#7a7670', lineHeight: 1.75, marginBottom: '1.5rem' }}>Fini les tableurs Excel. Jean centralise toutes vos candidatures dans un tableau Kanban visuel. Glissez, déposez, suivez en temps réel.</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Vue Kanban de "à postuler" à "offre reçue"','Fiches détaillées : description, contacts, notes','Rappels automatiques pour les relances','Statistiques de votre recherche en temps réel'].map(item => (
              <li key={item} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                <span style={{ color: '#0e7c4a', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <Link href="/auth/signup" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Organiser ma recherche →</Link>
        </div>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8e2d6', boxShadow: '0 4px 32px rgba(15,14,12,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e2d6', background: '#f2ede2', fontSize: 12, fontWeight: 600, color: '#7a7670' }}>Tableau de bord — Semaine 12</div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: '#ebf0fd', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, color: '#1a56db', fontWeight: 600, marginBottom: 2 }}>Candidatures</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a56db' }}>12</div>
              </div>
              <div style={{ background: '#e6f5ee', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, color: '#0e7c4a', fontWeight: 600, marginBottom: 2 }}>Entretiens</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0e7c4a' }}>3</div>
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8 }}>Activité récente</div>
            {[['📨','BNP Paribas','entretien confirmé lundi'],['⭐','Sanofi','offre reçue !'],['📋','Decathlon','relance à envoyer']].map(([ic,co,msg]) => (
              <div key={co as string} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 7, background: '#f2ede2', borderRadius: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 12 }}>{ic as string}</span>
                <div style={{ fontSize: 10 }}><b>{co as string}</b> — {msg as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: '#e8e2d6', maxWidth: 1100, margin: '0 auto' }} />

      {/* FEATURE 2 */}
      <section id="cv" className="feat-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8e2d6', boxShadow: '0 4px 32px rgba(15,14,12,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e2d6', background: '#f2ede2', fontSize: 12, fontWeight: 600, color: '#7a7670' }}>CV Creator — Aperçu</div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7a7670', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Vos infos</div>
              {['Prénom & Nom','Poste visé','Expériences','Compétences'].map(f => (
                <div key={f} style={{ background: '#f2ede2', borderRadius: 5, padding: '6px 8px', fontSize: 10, color: '#7a7670', marginBottom: 5 }}>{f}</div>
              ))}
              <div style={{ marginTop: 10, background: '#0f0e0c', color: 'white', borderRadius: 6, padding: 7, textAlign: 'center', fontSize: 10, fontWeight: 600 }}>Générer avec Claude →</div>
            </div>
            <div style={{ fontSize: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Emmanuelle G.</div>
              <div style={{ fontSize: 11, color: '#1a56db', marginBottom: 8 }}>Responsable Marketing</div>
              {['Expériences','Formation','Compétences'].map(s => (
                <div key={s}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#7a7670', borderBottom: '1px solid #e8e2d6', paddingBottom: 3, margin: '8px 0 5px' }}>{s}</div>
                  <div style={{ height: 7, background: '#f2ede2', borderRadius: 3, marginBottom: 4, width: '90%' }} />
                  <div style={{ height: 7, background: '#f2ede2', borderRadius: 3, marginBottom: 4, width: '70%' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="serif" style={{ fontSize: '5rem', fontWeight: 700, color: '#e8e2d6', lineHeight: 1, marginBottom: '-1rem' }}>02</div>
          <div style={{ display: 'inline-block', background: '#f2ede2', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#7a7670', margin: '0 0 1rem' }}>✦ CV Creator IA</div>
          <h3 className="serif" style={{ fontSize: '1.9rem', lineHeight: 1.25, marginBottom: '1rem' }}>Un CV percutant<br />en 30 secondes</h3>
          <p style={{ fontSize: 15, color: '#7a7670', lineHeight: 1.75, marginBottom: '1.5rem' }}>Importez votre profil LinkedIn, choisissez un template et laissez Claude AI rédiger votre CV avec des formulations professionnelles, optimisé pour chaque poste.</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Import automatique depuis LinkedIn PDF','3 templates visuels professionnels','Optimisation par poste visé','Export PDF en un clic'].map(item => (
              <li key={item} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                <span style={{ color: '#0e7c4a', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <Link href="/auth/signup" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Créer mon CV →</Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#0f0e0c', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="serif" style={{ fontSize: '2.5rem', color: 'white', marginBottom: '0.75rem' }}>Comment ça marche ?</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '3rem' }}>Trois étapes pour décrocher plus d&apos;entretiens</p>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'left' }}>
            {[
              { icon: '👤', num: 'ÉTAPE 01', title: 'Créez votre profil', desc: 'Inscrivez-vous gratuitement et importez votre profil LinkedIn en PDF. Jean extrait automatiquement toutes vos informations.' },
              { icon: '📋', num: 'ÉTAPE 02', title: 'Organisez vos candidatures', desc: "Ajoutez vos offres et suivez leur avancement dans votre tableau de bord Kanban. Notes, contacts, entretiens — tout au même endroit." },
              { icon: '✨', num: 'ÉTAPE 03', title: 'Générez votre CV par IA', desc: 'Pour chaque candidature, laissez Claude AI créer un CV percutant et optimisé pour le poste. Exportez en PDF et postulez.' },
            ].map(s => (
              <div key={s.num} className="step-card">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: '1rem' }}>{s.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 6 }}>{s.num}</div>
                <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{s.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="fonctionnalites" style={{ padding: '5rem 2rem', background: 'white', borderTop: '1px solid #e8e2d6', borderBottom: '1px solid #e8e2d6' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 className="serif" style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '0.5rem' }}>Tout ce qu&apos;il vous faut</h2>
          <p style={{ textAlign: 'center', color: '#7a7670', marginBottom: '3rem' }}>Une plateforme complète pour votre recherche d&apos;emploi</p>
          <div className="feats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { icon: '📊', title: 'Tableau de bord Kanban', desc: "Visualisez toutes vos candidatures d'un coup d'œil. Glissez-déposez pour mettre à jour le statut." },
              { icon: '🤖', title: 'CV Creator IA', desc: 'Claude AI rédige votre CV avec des formulations percutantes, adapté à chaque poste.' },
              { icon: '🔗', title: 'Import LinkedIn', desc: 'Exportez votre profil LinkedIn en PDF et Jean remplit automatiquement toutes vos informations.' },
              { icon: '👥', title: 'Suivi des contacts', desc: 'Gardez une trace de tous les recruteurs et managers. Ne perdez plus aucune relation clé.' },
              { icon: '📅', title: 'Gestion des entretiens', desc: 'Planifiez et préparez vos entretiens. Stockez les questions, réponses et retours reçus.' },
              { icon: '📈', title: 'Statistiques', desc: "Taux de réponse, délais moyens, canaux efficaces. Optimisez votre stratégie avec les données." },
              { icon: '💾', title: 'Sauvegarde cloud', desc: "Tous vos CVs et données sauvegardés en sécurité, accessibles depuis n'importe quel appareil." },
              { icon: '📥', title: 'Export PDF', desc: 'Téléchargez votre CV en PDF professionnel prêt à envoyer, en un seul clic.' },
              { icon: '🌍', title: 'Multilingue', desc: 'Générez vos CVs en français, anglais, espagnol ou allemand selon le marché visé.' },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: '#7a7670', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 className="serif" style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '3rem' }}>Ils ont trouvé leur job avec Jean</h2>
        <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { initials: 'SL', name: 'Sophie L.', role: 'Comm → Offre reçue chez LVMH', text: "Le tableau de bord a changé ma façon de chercher. Tout est au même endroit. J'ai eu 3 entretiens en 2 semaines." },
            { initials: 'MK', name: 'Marc K.', role: 'Dev backend → Startup Series B', text: "L'IA qui génère le CV est bluffante. En 30 secondes j'avais un CV bien mieux rédigé que ce que j'aurais fait moi-même." },
            { initials: 'AC', name: 'Amandine C.', role: 'Reconversion → Talent Acquisition', text: "Jean m'a aidée à valoriser mes compétences transférables. Résultat : CDI en 6 semaines." },
          ].map(t => (
            <div key={t.name} className="testi-card">
              <div style={{ color: '#f59e0b', fontSize: 14, marginBottom: 12 }}>★★★★★</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ebf0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1a56db', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#7a7670' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #0f0e0c 0%, #1a2a4a 100%)', padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 className="serif" style={{ fontSize: '2.8rem', color: 'white', marginBottom: '1rem' }}>Prête à trouver votre prochain poste ?</h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>Rejoignez 2 000+ candidats qui ont décroché plus d&apos;entretiens avec Jean.</p>
        <Link href="/auth/signup" className="btn btn-accent" style={{ fontSize: 16, padding: '16px 44px', borderRadius: 12 }}>
          Commencer gratuitement — sans carte bancaire
        </Link>
        <p style={{ marginTop: '1.25rem', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Résultat en moins de 30 secondes · Données sécurisées</p>
      </section>

      {/* FOOTER */}
      <footer className="footer-grid" style={{ background: '#0f0e0c', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '3rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem' }}>
        <div>
          <div className="serif" style={{ fontSize: '1.3rem', color: 'white', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db' }} /> Jean
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>La plateforme de recherche d&apos;emploi propulsée par Claude AI. Tableau de bord, CV Creator, suivi des candidatures.</p>
        </div>
        {[
          { title: 'Produit', links: ['Tableau de bord','CV Creator','Suivi contacts','Entretiens','Statistiques'] },
          { title: 'Ressources', links: ['Guide de démarrage','Blog','Templates CV','Conseils entretien'] },
          { title: 'Entreprise', links: ['À propos','Tarifs','Contact','Confidentialité','CGU'] },
        ].map(col => (
          <div key={col.title}>
            <h5 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>{col.title}</h5>
            {col.links.map(link => (
              <a key={link} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: 8 }}>{link}</a>
            ))}
          </div>
        ))}
      </footer>
      <div style={{ background: '#0f0e0c', padding: '1.25rem 3rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 Jean — Find My Job · Propulsé par Claude AI</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Fait avec ♥ pour les candidats</p>
      </div>
    </div>
  );
}
