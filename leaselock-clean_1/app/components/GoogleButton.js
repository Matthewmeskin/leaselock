'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { track } from '../lib/analytics'

// "Continue with Google" — Supabase OAuth. Google must be enabled in the
// Supabase dashboard (Authentication → Providers) with a Google Cloud OAuth
// client whose redirect URI is <project>.supabase.co/auth/v1/callback.
export default function GoogleButton({ redirect = '/app' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function go() {
    setBusy(true)
    setError('')
    track('login_google_click')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })
    if (error) {
      setBusy(false)
      setError(
        /provider is not enabled/i.test(error.message)
          ? 'Google sign-in isn’t enabled yet — use email and password for now.'
          : error.message
      )
    }
    // On success the browser navigates away to Google.
  }

  return (
    <div>
      <button
        type="button" onClick={go} disabled={busy}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--line-strong)',
          background: '#fff', color: 'var(--ink)', fontWeight: 600, fontSize: 15,
          cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'var(--font-body)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>
      {error && (
        <div style={{ marginTop: 10, background: '#fdecea', color: '#b3261e', border: '1px solid #f5c6c2', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  )
}

export function OrDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  )
}
