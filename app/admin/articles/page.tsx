export const revalidate = 0

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'

async function getArticles() {
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: articles } = await adminClient
    .from('articles')
    .select('id, title, category, published, published_at, created_at, excerpt')
    .order('created_at', { ascending: false })

  return articles ?? []
}

export default async function AdminArticlesPage() {
  const articles = await getArticles()

  const published = articles.filter((a) => a.published).length
  const drafts = articles.filter((a) => !a.published).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-black mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}
          >
            ✍️ Articles
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            {published} publié{published > 1 ? 's' : ''} · {drafts} brouillon{drafts > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="px-5 py-3 font-black text-sm rounded transition-all"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            backgroundColor: '#F5C400',
            color: '#111',
            border: '2px solid #111',
            boxShadow: '3px 3px 0px #111',
          }}
        >
          + Nouvel article
        </Link>
      </div>

      {/* Liste des articles */}
      {articles.length === 0 ? (
        <div
          className="bg-white rounded p-12 text-center"
          style={{ border: '2px solid #111', boxShadow: '4px 4px 0px #111' }}
        >
          <div className="text-5xl mb-4">✍️</div>
          <p className="font-bold text-gray-500 mb-4">Aucun article pour l'instant</p>
          <Link
            href="/admin/articles/new"
            className="inline-block px-5 py-3 font-black text-sm rounded"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              backgroundColor: '#111',
              color: '#F5C400',
              border: '2px solid #111',
            }}
          >
            Créer le premier article
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded p-5 flex items-center justify-between"
              style={{ border: '2px solid #111', boxShadow: '3px 3px 0px #111' }}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Statut */}
                <span
                  className="mt-1 px-2 py-1 rounded text-xs font-black flex-shrink-0"
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundColor: article.published ? '#F5C400' : '#f3f4f6',
                    color: article.published ? '#111' : '#888',
                    border: article.published ? '1px solid #111' : '1px solid #ddd',
                  }}
                >
                  {article.published ? '✅ Publié' : '📝 Brouillon'}
                </span>

                {/* Titre + extrait */}
                <div className="min-w-0">
                  <div
                    className="font-black text-base text-gray-900 truncate"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {article.title}
                  </div>
                  {article.excerpt && (
                    <div className="text-sm text-gray-400 truncate mt-0.5">
                      {article.excerpt}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Catégorie : <span className="font-semibold">{article.category}</span>
                    {' · '}
                    Créé le {new Date(article.created_at).toLocaleDateString('fr-FR')}
                    {article.published_at && (
                      <> · Publié le {new Date(article.published_at).toLocaleDateString('fr-FR')}</>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="px-4 py-2 font-bold text-sm rounded transition-all"
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundColor: '#111',
                    color: '#F5C400',
                    border: '2px solid #111',
                  }}
                >
                  Éditer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
