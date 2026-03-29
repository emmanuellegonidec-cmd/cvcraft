import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'

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
}

export default async function BlogSection() {
  const articles = await getPublishedArticles()

  // Si aucun article publié, affiche les cartes statiques par défaut
  if (articles.length === 0) {
    return (
      <section style={{ padding: '5rem 2rem', background: '#FAFAFA', borderBottom: '2.5px solid #111' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', boxShadow: '2px 2px 0 #111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conseils & actus</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Jean a quelque chose à vous dire</h2>
            <p style={{ color: '#888', marginTop: '0.5rem', fontWeight: 500 }}>Nos conseils pour booster votre recherche d&apos;emploi</p>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888', fontWeight: 600, fontSize: 15 }}>
            Les articles arrivent bientôt — revenez vite ! 🚀
          </div>
        </div>
      </section>
    )
  }

  return (
    <section style={{ padding: '5rem 2rem', background: '#FAFAFA', borderBottom: '2.5px solid #111' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-block', background: '#F5C400', border: '2px solid #111', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 800, color: '#111', marginBottom: '1rem', boxShadow: '2px 2px 0 #111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conseils & actus</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Jean a quelque chose à vous dire</h2>
          <p style={{ color: '#888', marginTop: '0.5rem', fontWeight: 500 }}>Nos conseils pour booster votre recherche d&apos;emploi</p>
        </div>

        <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(articles.length, 3)}, 1fr)`, gap: '1.5rem' }}>
          {articles.map((article) => {
            const catColor = CATEGORY_COLORS[article.category] ?? '#111'
            const dateStr = article.published_at
              ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : ''

            return (
              <Link key={article.id} href={`/blog/${article.slug}`} className="blog-card" style={{ textDecoration: 'none', color: '#111', display: 'block', background: '#fff', border: '2px solid #111', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 #111', transition: 'all 0.2s' }}>
                {/* Image ou couleur de fond */}
                <div style={{ height: 180, background: article.cover_image_url ? 'transparent' : `linear-gradient(135deg, ${catColor} 0%, ${catColor}cc 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {article.cover_image_url ? (
                    <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48 }}>✍️</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: 600 }}>{article.category}</div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{ background: '#F5C400', color: '#111', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 12, fontWeight: 500 }}>
                      {article.excerpt.length > 100 ? article.excerpt.slice(0, 100) + '…' : article.excerpt}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{dateStr}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#E8151B' }}>Lire →</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
