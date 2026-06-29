'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '../components/Logo'
import { createClient } from '../lib/supabase/client'
import { joinHousehold } from '../lib/db'

function JoinInner() {
  const params = useSearchParams()
  const router = useRouter()
  const code = params.get('code') || ''
  const [status, setStatus] = useState('working') // working | error | done
  const [message, setMessage] = useState('Joining your roommate’s lease…')
  const [leaseName, setLeaseName] = useState('')

  useEffect(() => {
    (async () => {
      if (!code) { setStatus('error'); setMessage('This invite link is missing its code.'); return }
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(`/join?code=${code}`)}`)
        return
      }
      try {
        const res = await joinHousehold(code)
        setLeaseName(res?.name || '')
        setStatus('done')
        setMessage('You’re in! Taking you to the lease…')
        setTimeout(() => { window.location.href = '/app' }, 1200)
      } catch (e) {
        setStatus('error')
        setMessage(e?.message || 'That invite link is invalid or expired.')
      }
    })()
  }, [code, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid var(--line)', borderRadius: 20, padding: '40px 32px', boxShadow: '0 12px 40px rgba(12,27,31,.06)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 20, marginBottom: 22 }}>
          <Logo size={34} />
          <span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
        </div>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{status === 'error' ? '⚠️' : status === 'done' ? '✅' : '🏠'}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '0 0 8px' }}>
          {status === 'error' ? 'Could not join' : status === 'done' ? `Joined ${leaseName || 'the lease'}` : 'Joining a shared lease'}
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55 }}>{message}</p>
        {status === 'error' && (
          <div style={{ marginTop: 20 }}>
            <Link href="/app" className="bp" style={{ textDecoration: 'none' }}>Go to your dashboard</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinInner />
    </Suspense>
  )
}
