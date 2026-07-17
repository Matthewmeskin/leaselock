'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '../components/Logo'
import { createClient } from '../lib/supabase/client'

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid var(--line-strong)', background: '#fff',
  fontSize: 15, color: 'var(--ink)', outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSession, setHasSession] = useState(null) // null = checking

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setHasSession(!!data?.user))
  }, [])

  async function save(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password needs at least 8 characters.'); return }
    if (password !== confirm) { setError("Passwords don't match."); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/app')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid var(--line)', borderRadius: 20, padding: '40px 32px', boxShadow: '0 12px 40px rgba(12,27,31,.06)' }}>
        <Link href="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 20, textDecoration: 'none', color: 'var(--ink)' }}>
          <Logo size={34} />
          <span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
        </Link>

        {hasSession === false ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '28px 0 8px' }}>Link expired</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
              This password reset link is invalid or has expired. Request a new one from the login page.
            </p>
            <Link href="/login" className="btn btn-mint" style={{ width: '100%', textAlign: 'center' }}>Back to login</Link>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '28px 0 8px' }}>Choose a new password</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
              Pick something strong — at least 8 characters.
            </p>
            <form onSubmit={save}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle} htmlFor="password">New password</label>
                <input
                  id="password" type="password" required autoFocus autoComplete="new-password" minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters" style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm" type="password" required autoComplete="new-password" minLength={8}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Same password again" style={inputStyle}
                />
              </div>
              <button
                type="submit" disabled={loading || hasSession === null}
                style={{
                  width: '100%', marginTop: 16, padding: '13px 16px', borderRadius: 12, border: 'none',
                  background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 15.5,
                  cursor: loading ? 'default' : 'pointer', opacity: loading || hasSession === null ? 0.6 : 1,
                }}
              >
                {loading ? 'Saving…' : 'Save new password'}
              </button>
            </form>
            {error && (
              <div style={{ marginTop: 16, background: '#fdecea', color: '#b3261e', border: '1px solid #f5c6c2', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
