import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protected admin routes
  if (pathname.startsWith('/admin')) {
    // Check for NextAuth session token cookie
    const token = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
