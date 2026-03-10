import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUPERADMIN_EMAIL } from '@/lib/constants'
const PROTECTED_ROUTES = ['/dashboard', '/company', '/earnings-calendar']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Redirect authenticated users away from /login
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // /pending — only for authenticated users; redirect to login if not
  if (pathname === '/pending') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }

  // /admin — only for superadmin
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (session.user.email !== SUPERADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // Protect routes — redirect to /login if not authenticated
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For protected routes — check if user is approved
  if (isProtected && session) {
    // Use service role to check profile — we read from Supabase directly
    // We can't use service role in middleware, so we use the user's client
    // and query via a workaround: fetch the profile API
    // Instead, we check via a direct Supabase query with the middleware client
    const { data: profile } = await supabase
      .from('profiles')
      .select('approved, role')
      .eq('id', session.user.id)
      .maybeSingle()

    // If no profile yet (trigger delay) or not approved, redirect to /pending
    // Superadmin always passes through
    if (session.user.email === SUPERADMIN_EMAIL) {
      return res
    }

    if (!profile || !profile.approved) {
      return NextResponse.redirect(new URL('/pending', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/company/:path*',
    '/earnings-calendar/:path*',
    '/login',
    '/pending',
    '/admin/:path*',
  ],
}
