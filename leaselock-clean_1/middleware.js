import { NextResponse } from 'next/server'
import { updateSession } from './app/lib/supabase/middleware'

export async function middleware(request) {
  try {
    return await updateSession(request)
  } catch (error) {
    // Never let an auth/session failure take down the whole site.
    console.error('Middleware error, passing request through:', error)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - common image/asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
