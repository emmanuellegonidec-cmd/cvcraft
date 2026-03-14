import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2.5rem', borderBottom: '1px solid var(--border)',
        background: 'rgba(247,244,238,0.85)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600 }}>
          CVcraft
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/auth/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 14 }}>
            Connexion
          </Link>
          <Link href="/auth/signup" className="btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-light)', border: '1px solid #c4d4fb',
          borderRadius: 20, padding: '6px 16px', fontSize: 13,
          color: 'var(--accent)', fontWeight: 500, marginBottom: '2rem',
        }}>
          ✦ Propulsé par Claude AI
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1.5rem', color: 'var(--ink)' }}>
          Votre CV parfait,<br />
          <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>en quelques secondes</em>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--muted)', maxWidth: 580, margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
          Importez votre profil LinkedIn, choisissez un template et laissez l'IA générer un CV professionnel optimisé pour votre poste visé.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
            Créer mon CV gratuitement →
          </Link>
          <Link href="#comment" className="btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
            Voir comment ça marche
          </Link>
        </div>

        {/* Social proof */}
        <p style={{ marginTop: '2rem', fontSize: 13, color: 'var(--muted)' }}>
          Sans carte bancaire · Résultat en moins de 30 secondes
        </p>
      </section>

      {/* App preview mockup */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 2rem 5rem' }}>
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 20,
          padding: '2rem', boxShadow: '0 24px 80px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Vos informations</div>
              {['Prénom & Nom', 'Poste visé', 'Expériences', 'Formation', 'Compétences'].map(f => (
                <div key={f} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 13, color: 'var(--muted)' }}>{f}</div>
              ))}
              <div style={{ marginTop: 16, background: 'var(--ink)', color: 'white', borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                Générer avec Claude →
              </div>
            </div>
            <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>CV généré</div>
              {['████████████████████', '████████████', '████████████████████████', '██████████████', '████████████████████', '████████', '████████████████████████████'].map((line, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 4, padding: '5px 8px', marginBottom: 6, fontSize: 11, color: 'transparent', letterSpacing: 0 }}>
                  <span style={{ background: `rgba(45,91,227,${0.08 + i * 0.02})`, borderRadius: 3, padding: '2px 4px', display: 'block', height: 10 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="comment" style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '0.75rem' }}>Comment ça marche ?</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '3rem' }}>Trois étapes, moins de deux minutes</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { num: '01', title: 'Importez votre LinkedIn', desc: 'Exportez votre profil LinkedIn en PDF et glissez-le dans l\'outil. Claude extrait toutes vos informations automatiquement.', icon: '↓' },
            { num: '02', title: 'Choisissez un template', desc: 'Sélectionnez parmi 3 templates professionnels et indiquez le poste que vous visez pour un CV ciblé.', icon: '◈' },
            { num: '03', title: 'Téléchargez votre CV', desc: 'Claude rédige votre CV avec des formulations percutantes. Téléchargez en PDF ou copiez le texte en un clic.', icon: '↗' },
          ].map(step => (
            <div key={step.num} className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, margin: '0 auto 1rem', color: 'var(--accent)', fontWeight: 700,
              }}>{step.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 8 }}>{step.num}</div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '3rem' }}>Tout ce qu'il vous faut</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { icon: '🔗', title: 'Import LinkedIn PDF', desc: 'Vos données extraites automatiquement depuis votre profil LinkedIn exporté.' },
              { icon: '🤖', title: 'IA Claude Sonnet', desc: 'Le modèle le plus avancé d\'Anthropic pour des formulations professionnelles et percutantes.' },
              { icon: '🎨', title: '3 templates visuels', desc: 'Classique, Moderne ou Minimaliste — un style adapté à chaque secteur.' },
              { icon: '💾', title: 'Sauvegarde cloud', desc: 'Tous vos CVs sauvegardés dans votre espace personnel, accessibles partout.' },
              { icon: '📥', title: 'Export PDF', desc: 'Téléchargez votre CV en PDF prêt à envoyer, formaté professionnellement.' },
              { icon: '🌍', title: 'Multilingue', desc: 'Générez votre CV en français, anglais, espagnol ou allemand.' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Prêt à décrocher votre prochain poste ?</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Rejoignez les milliers de candidats qui ont déjà créé leur CV avec CVcraft.</p>
        <Link href="/auth/signup" className="btn-accent" style={{ fontSize: 16, padding: '16px 40px' }}>
          Créer mon CV maintenant — c'est gratuit
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600 }}>CVcraft</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Propulsé par Claude AI · © 2026 CVcraft</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/auth/login" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Connexion</Link>
          <Link href="/auth/signup" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Inscription</Link>
        </div>
      </footer>
    </div>
  );
}
