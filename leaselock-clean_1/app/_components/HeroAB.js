'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { track, getVariant } from '../lib/analytics'

// A/B test: deposit-protection framing vs lease-comprehension framing.
const COPY = {
  deposit: {
    h1: <>Move in ready. <span className="hl-dark">Move out clean.</span></>,
    sub: 'Set up your renter protection in five minutes. AI lease review, guided move-in inspection, roommate agreements, and the tools that keep your deposit safe from day one.',
  },
  comprehension: {
    h1: <>Never sign a lease <span className="hl-dark">you don&apos;t understand.</span></>,
    sub: 'AI reads your lease in plain English, flags the clauses that cost you money, and hands you the questions to ask — plus guided move-in documentation and every tool renters need.',
  },
}

export default function HeroAB() {
  const [variant, setVariant] = useState(null)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    setVariant(getVariant())
    track('landing_view')
  }, [])

  const c = COPY[variant] || COPY.deposit

  function captureEmail(e) {
    e.preventDefault()
    if (!/.+@.+\..+/.test(email)) return
    track('email_capture', { email: email.trim().toLowerCase() })
    setSent(true)
  }

  return (
    <>
      <h1>{c.h1}</h1>
      <p className="hero-sub hero-sub-dark">{c.sub}</p>
      <div className="hero-cta">
        <Link href="/app" className="btn btn-mint btn-lg" onClick={() => track('cta_click', { cta: 'hero_primary' })}>
          Set up your protection →
        </Link>
        <a href="#how" className="btn btn-ghost-dark btn-lg" onClick={() => track('cta_click', { cta: 'hero_how' })}>
          See how it works
        </a>
      </div>
      <div style={{ marginTop: 18, maxWidth: 430 }}>
        {sent ? (
          <div style={{ background: 'rgba(45,212,167,.14)', border: '1px solid rgba(45,212,167,.45)', borderRadius: 12, padding: '11px 16px', fontSize: 14, color: '#d6f6ec' }}>
            ✓ You&apos;re on the list — we&apos;ll be in touch.
          </div>
        ) : (
          <form onSubmit={captureEmail} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@school.edu"
              aria-label="Email address"
              style={{ flex: 1, padding: '11px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 14, outline: 'none' }}
            />
            <button type="submit" className="btn btn-ghost-dark" style={{ whiteSpace: 'nowrap' }}>Get early access</button>
          </form>
        )}
      </div>
    </>
  )
}
