import { NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'

// Completes email flows (signup confirmation, password reset): exchanges the
// `code` — or verifies the `token_hash` — for a session, then redirects.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const redirect = searchParams.get('redirect') || '/app'

  const supabase = createClient()
  let authError = null

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    authError = error
  } else {
    authError = new Error('Missing auth code')
  }

  if (!authError) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${redirect}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${redirect}`)
    } else {
      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Something went wrong with the link — send them back to login.
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
