import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Jean find my Job',
  description: 'Conseils, ressources et guides pour optimiser votre recherche d\'emploi.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/blog',
  },
  openGraph: {
    title: 'Blog — Jean find my Job',
    description: 'Conseils, ressources et guides pour optimiser votre recherche d\'emploi.',
    url: 'https://jeanfindmyjob.fr/blog',
    siteName: 'Jean find my Job',
    locale: 'fr_FR',
    type: 'website',
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORY_COLORS: Record<string, string> = {
  'Conseils': '#111',
  'CV & Lettre': '#E8151B',
  'Entretien': '#1A6FDB',
  'Reconversion': '#6366f1',
  "Marché de l'emploi": '#1A7A4A',
  'Témoignage': '#B8900A',
  'Outils': '#555',
}

export default async function BlogPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        .blog-card-link { text-decoration:none;color:#111;display:block;background:#fff;border:2.5px solid #111;border-radius:12px;overflow:hidden;box-shadow:4px 4px 0 #111;transition:all 0.2s; }
        .blog-card-link:hover { transform:translate(-2px,-2px);box-shadow:6px 6px 0 #E8151B; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#fff', borderBottom: '2.5px solid #111', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.95rem', fontWeight: 900, color: '#111' }}>
            Jean <span style={{ color: '#E8151B' }}>find my Job</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: '#111', textDecoration: 'none', fontWeight: 700, border: '2px solid #111', borderRadius: 8, padding: '7px 14px' }}>Connexion</Link>
          <Link href="/auth/signup" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: '#F5C400', textDecoration: 'none', fontWeight: 800, border: '2px solid #111', borderRadius: 8, padding: '7px 14px', background: '#111', boxShadow: '3px 3px 0 #E8151B' }}>Commencer →</Link>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{ background: '#111', borderBottom: '2.5px solid #111', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conseils & actus</div>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '2.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Le Blog</h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: 500 }}>Nos conseils pour booster votre recherche d&apos;emploi</p>
      </div>

      {/* ARTICLES */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem' }}>
        {(!articles || articles.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888', fontWeight: 600, fontSize: 15, border: '2px dashed #ddd', borderRadius: 12 }}>
            Les articles arrivent bientôt — revenez vite ! 🚀
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {articles.map((article) => {
              const catColor = CATEGORY_COLORS[article.category] ?? '#111'
              const dateStr = article.published_at
                ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : ''
              return (
               <Link key={article.id} href={`/blog/${article.slug}`} className="blog-card-link">
                  {/* IMAGE */}
                  <div style={{ height: 240, background: article.cover_image_url ? 'transparent' : `linear-gradient(135deg,${catColor} 0%,${catColor}cc 100%)`, position: 'relative', overflow: 'hidden' }}>
                    {article.cover_image_url ? (
                      <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <span style={{ fontSize: 56 }}>✍️</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 14, left: 14 }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", background: '#F5C400', color: '#111', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', border: '2px solid #111' }}>{article.category}</span>
                    </div>
                  </div>

                  {/* CONTENU */}
                  <div style={{ padding: '1.75rem' }}>
                    <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.25rem', fontWeight: 900, marginBottom: 10, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{article.title}</h2>
                    {article.excerpt && (
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16, fontWeight: 500 }}>
                        {article.excerpt.length > 200 ? article.excerpt.slice(0, 200) + '…' : article.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: '#888', fontWeight: 600 }}>{dateStr}</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 800, color: '#E8151B' }}>Lire l&apos;article →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      {/* CTA */}
      <section style={{ background: '#111', borderTop: '2.5px solid #111', padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.8rem', color: '#fff', marginBottom: '1rem', fontWeight: 900 }}>Prêt à organiser votre recherche ?</h2>
        <Link href="/auth/signup" style={{ fontFamily: "'Montserrat', sans-serif", display: 'inline-block', background: '#F5C400', color: '#111', border: '2.5px solid #111', borderRadius: 8, padding: '13px 32px', fontSize: 14, fontWeight: 800, textDecoration: 'none', boxShadow: '4px 4px 0 #E8151B' }}>
          Commencer gratuitement →
        </Link>
      </section>

      {/* FOOTER MINIMAL */}
      <footer style={{ background: '#fff', borderTop: '2.5px solid #111', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: '#888', fontWeight: 500 }}>© 2026 Jean find my Job · <Link href="/" style={{ color: '#E8151B', textDecoration: 'none', fontWeight: 700 }}>Retour à l&apos;accueil</Link></p>
      </footer>
    </div>
  )
}