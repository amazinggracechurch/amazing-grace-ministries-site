import { NextResponse, type NextRequest } from 'next/server'

/**
 * proxy.ts (Next 16 — the middleware.ts convention is deprecated/renamed).
 *
 * Fast UX redirect ONLY. This checks for the *presence* of the __session
 * cookie without verifying it — it is NOT the security boundary. The real
 * enforcement lives in the server layouts, which call getSessionUser()
 * (full Firebase verification with revocation checks):
 *   - app/account/(protected)/layout.tsx
 *   - app/admin/layout.tsx
 *
 * Keep this file free of Node-only imports (firebase-admin, gRPC): proxy
 * runs ahead of the app runtime and may be CDN/edge-optimized.
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Belt-and-braces: the sign-in pages must stay reachable even if the
  // matcher pattern below ever drifts.
  if (pathname === '/account/signin' || pathname.startsWith('/account/signin/')) {
    return NextResponse.next()
  }

  if (!request.cookies.has('__session')) {
    const url = request.nextUrl.clone()
    url.pathname = '/account/signin'
    url.search = `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // /account and everything under it EXCEPT the sign-in pages.
    '/account/((?!signin).*)',
    '/admin/:path*',
  ],
}
