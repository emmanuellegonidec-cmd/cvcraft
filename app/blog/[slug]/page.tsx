import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient as createSupabasePublic } from '@supabase/supabase-js'

const supabasePublic = createSupabasePublic(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { data: article } = await supabasePublic
    .from('articles')
    .select('title, excerpt, cover_image_url')
    .eq('slug', params.slug)
    .single()

  if (!article) {
    return {
      title: 'Article — Jean Find My Job',
      description: 'Conseils et ressources pour votre recherche d\'emploi.',
    }
  }

  return {
    title: `${article.title} — Jean Find My Job`,
    description: article.excerpt || 'Conseils et ressources pour votre recherche d\'emploi.',
    alternates: {
      canonical: `https://jeanfindmyjob.fr/blog/${params.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      url: `https://jeanfindmyjob.fr/blog/${params.slug}`,
      images: article.cover_image_url ? [{ url: article.cover_image_url }] : [],
      type: 'article',
    },
  }
}
type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  category: string
  published_at: string | null
  created_at: string
}

type ArticlePreview = {
  id: string
  title: string
  slug: string
  cover_image_url: string | null
  cover_image_alt: string | null
  category: string
}

async function getArticle(slug: string): Promise<Article | null> {
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await adminClient
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data ?? null
}

async function getRelatedArticles(currentSlug: string, category: string): Promise<ArticlePreview[]> {
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await adminClient
    .from('articles')
    .select('id, title, slug, cover_image_url, cover_image_alt, category')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(3)
  return data ?? []
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug)
  if (!article) notFound()

  const related = await getRelatedArticles(params.slug, article.category)

  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .article-content h1 { font-size: 2rem; font-weight: 900; margin: 2rem 0 1rem; color: #111; letter-spacing: -0.02em; line-height: 1.2; }
        .article-content h2 { font-size: 1.5rem; font-weight: 800; margin: 2rem 0 0.75rem; color: #111; padding-bottom: 8px; border-bottom: 2px solid #F5C400; }
        .article-content h3 { font-size: 1.2rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #111; }
        .article-content p { margin: 1rem 0; line-height: 1.85; font-size: 16px; color: #333; font-weight: 500; }
        .article-content strong { font-weight: 800; color: #111; }
        .article-content em { font-style: italic; }
        .article-content u { text-decoration: underline; }
        .article-content s { text-decoration: line-through; }
        .article-content ul { padding-left: 1.5rem; margin: 1rem 0; list-style-type: disc; }
        .article-content ol { padding-left: 1.5rem; margin: 1rem 0; list-style-type: decimal; }
        .article-content li { margin: 0.5rem 0; line-height: 1.7; font-size: 15px; font-weight: 500; color: #333; }
        .article-content blockquote { border-left: 4px solid #F5C400; padding: 16px 20px; margin: 1.5rem 0; background: #fffbe6; font-style: italic; color: #555; border-radius: 0 8px 8px 0; font-size: 17px; }
        .article-content a { color: #1A6FDB; font-weight: 600; text-decoration: underline; }
        .article-content a:hover { color: #1557a0; }
        .article-content img { max-width: 100%; border-radius: 8px; margin: 1.5rem auto; border: 2px solid #111; box-shadow: 4px 4px 0 #111; display: block; }
        .blog-card-related { background:#fff;border:2px solid #111;border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 #111;transition:all 0.2s;text-decoration:none;color:#111;display:block; }
        .blog-card-related:hover { transform:translate(-2px,-2px);box-shadow:5px 5px 0 #E8151B; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#fff', borderBottom: '2.5px solid #111', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: 'Montserrat,sans-serif', fontSize: '0.95rem', fontWeight: 900, color: '#111' }}>
          Jean <span style={{ color: '#E8151B' }}>find my Job</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 600 }}>← Retour à l'accueil</Link>
          <Link href="/auth/signup" style={{ background: '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: '3px 3px 0 #E8151B' }}>
            Commencer →
          </Link>
        </div>
      </nav>

      {/* Image de couverture — ratio 16/9 */}
      {article.cover_image_url && (
 <div style={{ width: '100%', maxHeight: 450, overflow: 'hidden', borderBottom: '2.5px solid #111' }}>
  <img
    src={article.cover_image_url}
    alt={article.cover_image_alt || article.title}
    style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }}
  />
</div>
      )}

      {/* Contenu — largeur 1400px comme la home, texte centré 860px */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4rem 2rem' }}>
        <article style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Catégorie + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
            <span style={{ background: '#F5C400', color: '#111', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '2px 2px 0 #111' }}>
              {article.category}
            </span>
            <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{dateStr}</span>
          </div>

          {/* Titre */}
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#111' }}>
            {article.title}
          </h1>

          {/* Extrait */}
          {article.excerpt && (
            <p style={{ fontSize: '1.15rem', color: '#555', lineHeight: 1.7, fontWeight: 600, marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '2px solid #f0f0f0' }}>
              {article.excerpt}
            </p>
          )}

          {/* Contenu rich text */}
          {article.content && (
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
          )}

          {/* CTA fin d'article — simple, centré, charte neo-brutalist */}
          <div style={{
            marginTop: '4rem',
            padding: '3rem 2rem',
            background: '#F5C400',
            borderRadius: 12,
            border: '2.5px solid #111',
            boxShadow: '5px 5px 0 #111',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#111',
              fontSize: '1.6rem',
              fontWeight: 900,
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Prêt à organiser votre recherche d'emploi ?
            </h3>
            <p style={{
              color: '#111',
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.6,
              margin: '0 auto 1.75rem',
              maxWidth: 480
            }}>
              Suivez vos candidatures, mesurez vos résultats, optimisez votre CV. Gratuit, sans carte bancaire.
            </p>
            <Link
              href="/auth/signup"
              style={{
                display: 'inline-block',
                background: '#111',
                color: '#F5C400',
                border: '2.5px solid #111',
                borderRadius: 8,
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 900,
                textDecoration: 'none',
                boxShadow: '4px 4px 0 #E8151B',
                letterSpacing: '0.02em'
              }}
            >
              Créer mon compte gratuit →
            </Link>
          </div>
        </article>

        {/* Articles liés */}
        {related.length > 0 && (
          <div style={{ maxWidth: 860, margin: '4rem auto 0' }}>
            <h4 style={{ fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, borderBottom: '2px solid #111', paddingBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
              Dans la même catégorie
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(related.length, 3)}, 1fr)`, gap: '1.5rem' }}>
              {related.map(rel => (
                <Link key={rel.id} href={`/blog/${rel.slug}`} className="blog-card-related">
                  {rel.cover_image_url ? (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img src={rel.cover_image_url} alt={rel.cover_image_alt || rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '16/9', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 32 }}>✍️</span>
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      {rel.category}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: '#111' }}>
                      {rel.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2.5px solid #111', padding: '2rem', textAlign: 'center', background: '#fff', marginTop: '4rem' }}>
        <p style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
          © 2026 Jean find my Job ·{' '}
          <Link href="/" style={{ color: '#E8151B', textDecoration: 'none', fontWeight: 700 }}>Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  )
}
