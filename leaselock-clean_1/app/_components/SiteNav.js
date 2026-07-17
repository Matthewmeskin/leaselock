'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import { createClient } from '../lib/supabase/client'

export default function SiteNav() {
  // null = unknown (render logged-out buttons until we know)
  const [authed, setAuthed] = useState(null)
  useEffect(() => {
    createClient().auth.getSession()
      .then(({ data }) => setAuthed(!!data?.session))
      .catch(() => setAuthed(false))
  }, [])

  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand"><Logo size={34} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span></Link>
        <div className="nav-links">
          <Link href="/#how" className="hide-sm">How it works</Link>
          <Link href="/guides" className="hide-sm">Guides</Link>
          <Link href="/#pricing" className="hide-sm">Pricing</Link>
          {authed ? (
            <Link href="/app" className="btn btn-mint">Open my dashboard →</Link>
          ) : (
            <>
              <Link href="/signup" className="btn btn-mint">Get started free</Link>
              <Link href="/login" className="btn btn-ghost hide-sm">Log in</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
