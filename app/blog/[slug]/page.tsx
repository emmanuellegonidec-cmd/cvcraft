import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
  category: string
  published_at: string | null
  created_at: string
}

type ArticlePreview = {
  id: string
  title: string
  slug: string
  cover_image_url: string | null
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
    .select('id, title, slug, cover_image_url, category')
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
        .article-content a { color: #E8151B; font-weight: 600; text-decoration: underline; }
        .article-content a:hover { color: #C01116; }
        .article-content img { max-width: 100%; border-radius: 8px; margin: 1.5rem auto; border: 2px solid #111; box-shadow: 4px 4px 0 #111; display: block; }
        .blog-card-small { background:#fff;border:2px solid #111;border-radius:10px;overflow:hidden;box-shadow:3px 3px 0 #111;transition:all 0.2s;text-decoration:none;color:#111;display:block; }
        .blog-card-small:hover { transform:translate(-2px,-2px);box-shadow:5px 5px 0 #E8151B; }
        @media(max-width:768px){
          .article-layout { grid-template-columns: 1fr !important; }
          .article-sidebar { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: '#fff', borderBottom: '2.5px solid #111', position: 'sticky', top: 0, zIndex: 100 }}>
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

      {/* Image de couverture */}
      {article.cover_image_url && (
        <div style={{ width: '100%', height: 420, overflow: 'hidden', borderBottom: '2.5px solid #111' }}>
          <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Layout principal */}
      <div className="article-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '4rem', alignItems: 'start' }}>

        {/* Article principal */}
        <article>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
            <span style={{ background: '#F5C400', color: '#111', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {article.category}
            </span>
            <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{dateStr}</span>
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#111' }}>
            {article.title}
          </h1>

          {article.excerpt && (
            <p style={{ fontSize: '1.15rem', color: '#555', lineHeight: 1.7, fontWeight: 600, marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '2px solid #f0f0f0' }}>
              {article.excerpt}
            </p>
          )}

          {article.content && (
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
          )}

          {/* CTA bas d'article */}
          <div style={{ marginTop: '4rem', padding: '2.5rem', background: '#111', borderRadius: 12, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#F5C400', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Prêt à passer à l'action ?</div>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.02em' }}>
              Organisez votre recherche avec Jean find my Job
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
              Tableau de bord, suivi de candidatures, CV IA — tout gratuit.
            </p>
            <Link href="/auth/signup" style={{ display: 'inline-block', background: '#F5C400', color: '#111', border: '2px solid #fff', borderRadius: 8, padding: '14px 32px', fontSize: 14, fontWeight: 900, textDecoration: 'none', letterSpacing: '0.02em' }}>
              Go Jean find my Job ! →
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="article-sidebar" style={{ position: 'sticky', top: 80 }}>
          {/* CTA sidebar */}
          <div style={{ background: '#111', borderRadius: 12, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
            <h3 style={{ color: '#F5C400', fontSize: '1rem', fontWeight: 900, marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
              Jean find my Job
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16, lineHeight: 1.6, fontWeight: 500 }}>
              Organisez votre recherche d'emploi avec notre tableau de bord gratuit.
            </p>
            <Link href="/auth/signup" style={{ display: 'block', background: '#F5C400', color: '#111', border: '2px solid #fff', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}>
              Commencer gratuitement →
            </Link>
          </div>

          {/* Articles liés */}
          {related.length > 0 && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, borderBottom: '2px solid #111', paddingBottom: 8 }}>
                Dans la même catégorie
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {related.map(rel => (
                  <Link key={rel.id} href={`/blog/${rel.slug}`} className="blog-card-small">
                    {rel.cover_image_url && (
                      <img src={rel.cover_image_url} alt={rel.title} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        {rel.category}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3, color: '#111' }}>
                        {rel.title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
