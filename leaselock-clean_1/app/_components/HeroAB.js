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

// The mock product card next to the hero, themed to match the variant's story.
export function HeroCardAB() {
  const [variant, setVariant] = useState(null)
  useEffect(() => { setVariant(getVariant()) }, [])

  if (variant === 'comprehension') {
    return (
      <div className="report-card">
        <div className="rc-top">
          <span className="rc-title">Lease review complete</span>
          <span className="rc-lock">✓ Scored 72/100 · caution</span>
        </div>
        <div className="rc-body">
          <div className="rc-row"><span className="rc-room">📖 Plain-English summary</span><span className="rc-note">12 pages of legalese, decoded</span></div>
          <div className="rc-row"><span className="rc-room">🚩 3 risky clauses flagged</span><span className="rc-note">auto-renewal · late fees · liability</span></div>
          <div className="rc-row"><span className="rc-room">❓ 5 questions to ask</span><span className="rc-note">ready before you sign</span></div>
          <div className="rc-acks">
            <div className="rc-ack"><span className="rc-check">✓</span><span><b>Every clause explained</b> · in plain English</span></div>
            <div className="rc-ack"><span className="rc-check">✓</span><span><b>Deposit protected</b> · from day one</span></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="report-card">
      <div className="rc-top">
        <span className="rc-title">Protection setup complete</span>
        <span className="rc-lock">✓ Ready · Jun 1, 2026 · 4:12 PM</span>
      </div>
      <div className="rc-body">
        <div className="rc-row"><span className="rc-room">📄 Lease reviewed</span><span className="rc-note">3 high-risk clauses flagged · questions ready</span></div>
        <div className="rc-row"><span className="rc-room">📸 Move-in documented</span><span className="rc-note">4 rooms · 14 photos · AI condition notes</span></div>
        <div className="rc-row"><span className="rc-room">📅 Deadlines tracked</span><span className="rc-note">Notice deadline: 60 days out</span></div>
        <div className="rc-acks">
          <div className="rc-ack"><span className="rc-check">✓</span><span><b>Deposit protected</b> · report locked and timestamped</span></div>
          <div className="rc-ack"><span className="rc-check">✓</span><span><b>Move-out ready</b> · evidence on file</span></div>
        </div>
      </div>
    </div>
  )
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
