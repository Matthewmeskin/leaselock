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
const primaryBtn = (loading) => ({
  width: '100%', marginTop: 16, padding: '13px 16px', borderRadius: 12, border: 'none',
  background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 15.5,
  cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
})

// Signup is step 1-2 of onboarding; step 3 (personalization quiz) lives in /app.
const STEPS = [
  { n: 1, label: 'About you' },
  { n: 2, label: 'Your account' },
  { n: 3, label: 'Personalize' },
]

function Progress({ step }) {
  return (
    <div style={{ display: 'flex', gap: 8, margin: '26px 0 6px' }}>
      {STEPS.map((s) => (
        <div key={s.n} style={{ flex: 1 }}>
          <div style={{ height: 5, borderRadius: 99, background: s.n <= step ? 'var(--brand)' : 'var(--line)' }} />
          <div style={{ fontSize: 11.5, marginTop: 6, fontWeight: 600, color: s.n <= step ? 'var(--brand)' : 'var(--ink-soft)' }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function SignupInner() {
  const params = useSearchParams()
  const router = useRouter()
  const redirect = params.get('redirect') || '/app'

  const [step, setStep] = useState(1) // 1 = name, 2 = credentials, 3 = confirm email
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  function nextFromName(e) {
    e.preventDefault()
    if (name.trim().length < 2) { setError('Please enter your name.'); return }
    setError('')
    setStep(2)
  }

  async function createAccount(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password needs at least 8 characters.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })
    if (error) {
      setError(
        /already registered/i.test(error.message)
          ? 'An account with this email already exists. Try logging in instead.'
          : error.message
      )
      setLoading(false)
      return
    }
    // "Fake" signups for an existing email return a user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError('An account with this email already exists. Try logging in instead.')
      setLoading(false)
      return
    }
    if (data.session) {
      // Email confirmation is off — straight into the app (personalization quiz).
      router.push(redirect)
      router.refresh()
      return
    }
    // Email confirmation is on — ask them to check their inbox.
    setLoading(false)
    setStep(3)
  }

  async function resendConfirmation() {
    const supabase = createClient()
    setLoading(true)
    await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    })
    setLoading(false)
    setResent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', border: '1px solid var(--line)', borderRadius: 20, padding: '40px 32px', boxShadow: '0 12px 40px rgba(12,27,31,.06)' }}>
        <Link href="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 20, textDecoration: 'none', color: 'var(--ink)' }}>
          <Logo size={34} />
          <span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
        </Link>

        <Progress step={step} />

        {step === 1 && (
          <>
            <div style={{ fontSize: 34, margin: '18px 0 4px' }}>👋</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 8px' }}>Let&apos;s get you protected</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
              Lease reviews, move-in reports, rent records — all in one place. First things first: what should we call you?
            </p>
            <form onSubmit={nextFromName}>
              <label style={labelStyle} htmlFor="name">Your name</label>
              <input
                id="name" type="text" required autoFocus autoComplete="name"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera" style={inputStyle}
              />
              <button type="submit" style={primaryBtn(false)}>Continue →</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 34, margin: '18px 0 4px' }}>🔐</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 8px' }}>Nice to meet you, {name.trim().split(' ')[0]}</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
              Create your login. Your records stay private to your account.
            </p>
            <form onSubmit={createAccount}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle} htmlFor="email">Email</label>
                <input
                  id="email" type="email" required autoFocus autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="password">Password</label>
                <input
                  id="password" type="password" required autoComplete="new-password" minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters" style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                {loading ? 'Creating your account…' : 'Create account'}
              </button>
            </form>
            <button type="button" onClick={() => { setStep(1); setError('') }}
              style={{ background: 'none', border: 'none', padding: 0, marginTop: 14, color: 'var(--ink-soft)', fontSize: 13.5, cursor: 'pointer' }}>
              ← Back
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 34, margin: '18px 0 4px' }}>📬</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 8px' }}>Confirm your email</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55, marginBottom: 20 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it and you&apos;ll land right in your dashboard,
              where a few quick questions will personalize your protection.
            </p>
            <button onClick={resendConfirmation} disabled={loading || resent} className="btn btn-ghost" style={{ width: '100%' }}>
              {resent ? 'Sent again — check your inbox' : loading ? 'Sending…' : 'Resend email'}
            </button>
          </>
        )}

        {error && (
          <div style={{ marginTop: 16, background: '#fdecea', color: '#b3261e', border: '1px solid #f5c6c2', borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
            {error}{' '}
            {/already exists/.test(error) && <Link href="/login" style={{ color: '#b3261e', fontWeight: 700 }}>Log in</Link>}
          </div>
        )}

        {step !== 3 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Log in</Link>
          </p>
        )}

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)', fontSize: 14 }}>
          <Link href="/" style={{ color: 'var(--ink-soft)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  )
}
