'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '../components/Logo'
import { createClient } from '../lib/supabase/client'

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid var(--line-strong)', background: '#fff',
  fontSize: 15, color: 'var(--ink)', outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }

function LoginInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(params.get('error') === 'auth' ? 'That sign-in link is invalid or expired. Please log in again.' : '')
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'sent'
  const redirect = params.get('redirect') || '/app'

  async function signIn(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError(
        /invalid login credentials/i.test(error.message)
          ? 'Incorrect email or password. Please try again.'
          : /email not confirmed/i.test(error.message)
            ? 'Please confirm your email first — check your inbox for the confirmation link.'
            : error.message
      )
      setLoading(false)
      return
    }
    router.push(redirect)
    router.refresh()
  }

  async function sendReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/reset-password')}`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMode('sent')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid var(--line)', borderRadius: 20, padding: '40px 32px', boxShadow: '0 12px 40px rgba(12,27,31,.06)' }}>
        <Link href="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 20, textDecoration: 'none', color: 'var(--ink)' }}>
          <Logo size={34} />
          <span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
        </Link>

        {mode === 'sent' ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '28px 0 8px' }}>Check your inbox 📬</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginBottom: 28 }}>
              We sent a password reset link to <strong>{email}</strong>. Open it on this device to choose a new password.
            </p>
            <button onClick={() => setMode('login')} className="btn btn-ghost" style={{ width: '100%' }}>← Back to login</button>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '28px 0 8px' }}>
              {mode === 'forgot' ? 'Reset your password' : 'Welcome back'}
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginBottom: 28 }}>
              {mode === 'forgot'
                ? "Enter your email and we'll send you a link to choose a new password."
                : 'Log in to your dashboard, lease reviews, move-in reports, and everything that keeps your deposit safe.'}
            </p>

            <form onSubmit={mode === 'forgot' ? sendReset : signIn}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle} htmlFor="email">Email</label>
                <input
                  id="email" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle}
                />
              </div>

              {mode === 'login' && (
                <div style={{ marginBottom: 8 }}>
                  <label style={labelStyle} htmlFor="password">Password</label>
                  <input
                    id="password" type="password" required autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password" style={inputStyle}
                  />
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', marginTop: 16, padding: '13px 16px', borderRadius: 12, border: 'none',
                  background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 15.5,
                  cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'One moment…' : mode === 'forgot' ? 'Send reset link' : 'Log in'}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: 16, background: '#fdecea', color: '#b3261e', border: '1px solid #f5c6c2', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
                {error}
              </div>
            )}

            <p style={{ marginTop: 24, fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center' }}>
              {mode === 'forgot' ? (
                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  ← Back to login
                </button>
              ) : (
                <>New to RenterReady?{' '}
                  <Link href={`/signup${redirect !== '/app' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={{ color: 'var(--brand)', fontWeight: 600 }}>
                    Create your account
                  </Link>
                </>
              )}
            </p>
          </>
        )}

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)', fontSize: 14 }}>
          <Link href="/" style={{ color: 'var(--ink-soft)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
