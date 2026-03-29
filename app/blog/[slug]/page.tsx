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

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug)
  if (!article) notFound()

  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .article-content h1 { font-size: 2rem; font-weight: 900; margin: 2rem 0 1rem; color: #111; letter-spacing: -0.02em; }
        .article-content h2 { font-size: 1.5rem; font-weight: 800; margin: 1.75rem 0 0.75rem; color: #111; }
        .article-content h3 { font-size: 1.2rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #111; }
        .article-content p { margin: 1rem 0; line-height: 1.8; font-size: 16px; color: #333; font-weight: 500; }
        .article-content strong { font-weight: 800; color: #111; }
        .article-content em { font-style: italic; }
        .article-content ul { padding-left: 1.5rem; margin: 1rem 0; list-style-type: disc; }
        .article-content ol { padding-left: 1.5rem; margin: 1rem 0; list-style-type: decimal; }
        .article-content li { margin: 0.4rem 0; line-height: 1.7; font-size: 15px; font-weight: 500; color: #333; }
        .article-content blockquote { border-left: 4px solid #F5C400; padding: 12px 20px; margin: 1.5rem 0; background: #fffbe6; font-style: italic; color: #555; border-radius: 0 8px 8px 0; }
        .article-content a { color: #E8151B; font-weight: 600; text-decoration: underline; }
        .article-content a:hover { color: #C01116; }
        .article-content img { max-width: 100%; border-radius: 8px; margin: 1.5rem 0; border: 2px solid #111; box-shadow: 4px 4px 0 #111; }
        .article-content s { text-decoration: line-through; }
        .article-content u { text-decoration: underline; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: '#fff', borderBottom: '2.5px solid #111', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: 'Montserrat,sans-serif', fontSize: '0.95rem', fontWeight: 900, color: '#111' }}>
          Jean <span style={{ color: '#E8151B' }}>find my Job</span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 600 }}>← Retour à l'accueil</Link>
          <Link href="/auth/signup" style={{ background: '#111', color: '#F5C400', border: '2px solid #111', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: '3px 3px 0 #E8151B' }}>Commencer →</Link>
        </div>
      </nav>

      {/* Image de couverture */}
      {article.cover_image_url && (
        <div style={{ width: '100%', maxHeight: 420, overflow: 'hidden', borderBottom: '2.5px solid #111' }}>
          <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', height: 420, objectFit: 'cover' }} />
        </div>
      )}

      {/* Contenu */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Catégorie + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <span style={{ background: '#F5C400', color: '#111', border: '2px solid #111', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {article.category}
          </span>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{dateStr}</span>
        </div>

        {/* Titre */}
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#111' }}>
          {article.title}
        </h1>

        {/* Extrait */}
        {article.excerpt && (
          <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: 1.7, fontWeight: 600, marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '2px solid #f0f0f0' }}>
            {article.excerpt}
          </p>
        )}

        {/* Contenu rich text */}
        {article.content && (
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

        {/* CTA bas d'article */}
        <div style={{ marginTop: '4rem', padding: '2rem', background: '#111', borderRadius: 12, border: '2px solid #111', boxShadow: '4px 4px 0 #E8151B', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#F5C400', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Prêt à passer à l'action ?</div>
          <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, marginBottom: 12 }}>Organisez votre recherche avec Jean find my Job</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>Tableau de bord, suivi de candidatures, CV IA — tout gratuit.</p>
          <Link href="/auth/signup" style={{ display: 'inline-block', background: '#F5C400', color: '#111', border: '2px solid #fff', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 900, textDecoration: 'none', boxShadow: '3px 3px 0 rgba(255,255,255,0.3)' }}>
            Commencer gratuitement →
          </Link>
        </div>
      </div>
    </div>
  )
}
