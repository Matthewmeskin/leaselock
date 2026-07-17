import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Routes that require an authenticated user.
const PROTECTED_PREFIXES = ['/app', '/report']

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request })

  // Supabase email links fall back to the site root when the redirect URL
  // isn't allowlisted — forward them to the auth callback so a first login
  // lands in the dashboard instead of on the marketing page.
  if (
    request.nextUrl.pathname === '/' &&
    (request.nextUrl.searchParams.has('code') || request.nextUrl.searchParams.has('token_hash'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    if (!url.searchParams.has('redirect')) url.searchParams.set('redirect', '/app')
    return NextResponse.redirect(url)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Without Supabase credentials we can't check auth. Treat every visitor
  // as signed out: public pages load normally, protected ones go to /login.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY); skipping auth check.'
    )
    const { pathname } = request.nextUrl
    const isProtected = PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    )
    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // If a signed-in user hits the login/signup pages, send them to the app.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
