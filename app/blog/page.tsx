import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Conseils pour votre recherche d\'emploi | Jean find my Job',
  description: 'Tous nos articles pour organiser vos candidatures, optimiser votre CV, réussir vos entretiens et booster votre carrière.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/blog',
  },
  openGraph: {
    title: 'Blog Jean find my Job',
    description: 'Conseils et ressources pour votre recherche d\'emploi.',
    url: 'https://jeanfindmyjob.fr/blog',
    type: 'website',
    siteName: 'Jean find my Job',
    locale: 'fr_FR',
  },
}

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  category: string
  published_at: string | null
  created_at: string
}

async function getArticles(): Promise<Article[]> {
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await adminClient
    .from('articles')
    .select('id, title, slug, excerpt, cover_image_url, cover_image_alt, category, published_at, created_at')
    .eq('published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function BlogIndexPage() {
  const articles = await getArticles()

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .blog-card { background:#fff;border:2.5px solid #111;border-radius:12px;overflow:hidden;box-shadow:4px 4px 0 #111;transition:all 0.2s;text-decoration:none;color:#111;display:flex;flex-direction:column;height:100%; }
        .blog-card:hover { transform:translate(-3px,-3px);box-shadow:7px 7px 0 #E8151B; }
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; }
          .blog-title { font-size: 2rem !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .blog-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#fff', borderBottom: '2.5px solid #111', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: 'Montserrat,sans-serif', fontSize: '0.95rem', fontWeight: 900, color: '#111' }}>
          Jean <span style={{ color: '#E8151B' }}>find my Job</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 600 }}>← Retour à l&apos;accueil</Link>
          <Link href="/auth/signup" style={{ background: '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: '3px 3px 0 #E8151B' }}>
            Commencer →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: '#F5C400', color: '#111', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '2px 2px 0 #111', marginBottom: '1.5rem' }}>
            Le Blog
          </span>
          <h1 className="blog-title" style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#111' }}>
            Conseils pour votre <span style={{ color: '#E8151B' }}>recherche d&apos;emploi</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#555', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
            Organisez vos candidatures, optimisez votre CV, réussissez vos entretiens. Tous nos articles, en un seul endroit.
          </p>
        </div>
      </div>

      {/* Articles grid */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        {articles.length === 0 ? (
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '4rem 2rem', background: '#f9fafb', border: '2px dashed #ccc', borderRadius: 12 }}>
            <p style={{ fontSize: 16, color: '#888', fontWeight: 600, margin: 0 }}>
              Aucun article publié pour le moment. Revenez bientôt !
            </p>
          </div>
        ) : (
          <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {articles.map(article => {
              const dateStr = article.published_at
                ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

              return (
                <Link key={article.id} href={`/blog/${article.slug}`} className="blog-card">
                  {article.cover_image_url ? (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', borderBottom: '2.5px solid #111' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.cover_image_url} alt={article.cover_image_alt || article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '16/9', background: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2.5px solid #111' }}>
                      <span style={{ fontSize: 56 }}>✍️</span>
                    </div>
                  )}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ background: '#F5C400', color: '#111', border: '2px solid #111', borderRadius: 16, padding: '3px 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {article.category}
                      </span>
                      <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{dateStr}</span>
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.3, color: '#111', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, fontWeight: 500, margin: '0 0 1rem', flex: 1 }}>
                        {article.excerpt.length > 130 ? article.excerpt.slice(0, 130) + '…' : article.excerpt}
                      </p>
                    )}
                    <span style={{ fontSize: 13, color: '#E8151B', fontWeight: 800, marginTop: 'auto' }}>
                      Lire l&apos;article →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA en bas */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 2rem 4rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem', background: '#111', borderRadius: 12, border: '2.5px solid #111', boxShadow: '5px 5px 0 #E8151B', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Prêt à organiser votre <span style={{ color: '#F5C400' }}>recherche d&apos;emploi</span> ?
          </h3>
          <p style={{ color: '#BBB', fontSize: 15, fontWeight: 500, lineHeight: 1.6, margin: '0 auto 1.75rem', maxWidth: 480 }}>
            Suivez vos candidatures, mesurez vos résultats, optimisez votre CV. Gratuit, sans carte bancaire.
          </p>
          <Link href="/auth/signup" style={{ display: 'inline-block', background: '#F5C400', color: '#111', border: '2.5px solid #111', borderRadius: 8, padding: '14px 32px', fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: '4px 4px 0 #E8151B', letterSpacing: '0.02em' }}>
            Créer mon compte gratuit →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2.5px solid #111', padding: '2rem', textAlign: 'center', background: '#fff' }}>
        <p style={{ fontSize: 13, color: '#888', fontWeight: 500, margin: 0 }}>
          © 2026 Jean find my Job ·{' '}
          <Link href="/" style={{ color: '#E8151B', textDecoration: 'none', fontWeight: 700 }}>Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}