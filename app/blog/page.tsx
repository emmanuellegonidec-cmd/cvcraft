import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Jean Find My Job',
  description: 'Conseils, ressources et guides pour optimiser votre recherche d\'emploi.',
  alternates: {
    canonical: 'https://jeanfindmyjob.fr/blog',
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function BlogPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Montserrat' }}>
        Le Blog
      </h1>
      <p className="text-gray-600 mb-10">Conseils et ressources pour votre recherche d&apos;emploi</p>

      <div className="grid gap-8">
        {(articles || []).map((article) => (
          <Link key={article.id} href={`/blog/${article.slug}`}>
            <article className="border-2 border-black rounded-lg overflow-hidden hover:shadow-[4px_4px_0px_#111] transition-all">
              {article.cover_image_url && (
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full object-cover"
                  style={{ maxHeight: '220px' }}
                />
              )}
              <div className="p-6">
                {article.category && (
                  <span className="text-xs font-bold uppercase tracking-wider bg-yellow-400 px-2 py-1 rounded mb-3 inline-block">
                    {article.category}
                  </span>
                )}
                <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                {article.excerpt && (
                  <p className="text-gray-600 text-sm">{article.excerpt}</p>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  )
}