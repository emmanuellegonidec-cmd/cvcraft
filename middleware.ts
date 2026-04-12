import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_BOTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebot', 'ia_archiver', 'ahrefsbot', 'semrushbot',
]

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  if (ALLOWED_BOTS.some((bot) => userAgent.includes(bot))) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/newsletter') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap')

  if (isPublic) return NextResponse.next()

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const hasSession = request.cookies.getAll().some(
      c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )
    if (!hasSession) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}