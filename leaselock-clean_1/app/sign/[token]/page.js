'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '../../components/Logo'
import { createClient } from '../../lib/supabase/client'

export default function SignReportPage() {
  const { token } = useParams()
  const [report, setReport] = useState(null)
  const [state, setState] = useState('loading') // loading | notfound | ready
  const [name, setName] = useState('')
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('get_shared_report', { p_token: token }).then(({ data, error }) => {
      if (error || !data) { setState('notfound'); return }
      setReport(data)
      setState('ready')
    })
  }, [token])

  async function sign(e) {
    e.preventDefault()
    if (name.trim().length < 2) { setError('Please enter your full name.'); return }
    setSigning(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.rpc('sign_shared_report', { p_token: token, p_name: name.trim() })
    setSigning(false)
    if (error) { setError(error.message.replace(/^.*?:\s*/, '')); return }
    setReport(r => ({ ...r, landlord_name: data.landlord_name, landlord_signed_at: data.landlord_signed_at }))
  }

  const signed = !!report?.landlord_signed_at

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="brand"><Logo size={34} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span></Link>
        </div>
      </nav>

      <div className="wrap" style={{ maxWidth: 720, padding: '32px 20px 80px' }}>
        {state === 'loading' && <p style={{ color: 'var(--ink-soft)', padding: '60px 0', textAlign: 'center' }}>Loading report…</p>}

        {state === 'notfound' && (
          <div style={{ maxWidth: 440, margin: '80px auto', textAlign: 'center', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 34 }}>🔎</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '10px 0 8px' }}>Report not found</h1>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              This signing link is invalid or was removed. Ask your tenant to send a fresh link.
            </p>
          </div>
        )}

        {state === 'ready' && report && (
          <>
            <div style={{ textAlign: 'center', margin: '10px 0 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', letterSpacing: '.06em' }}>MOVE-IN CONDITION REPORT</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '6px 0 4px' }}>{report.unit_address || 'Rental unit'}</h1>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                Documented by {report.tenant_name || 'the tenant'} · locked {new Date(report.locked_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {Array.isArray(report.rooms) && report.rooms.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 22px', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: '0 0 10px' }}>Room-by-room summary</h2>
                {report.rooms.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '7px 0', borderBottom: i < report.rooms.length - 1 ? '1px solid var(--line)' : 'none', fontSize: 14 }}>
                    <span>{r.emoji || '📍'}</span>
                    <b style={{ minWidth: 120 }}>{r.name}</b>
                    <span style={{ color: r.status?.startsWith('Good') ? 'var(--brand)' : '#c07c0c' }}>{r.status}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--ink-soft)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{r.photos || 0} photo{r.photos === 1 ? '' : 's'}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 22px', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: '0 0 10px' }}>Condition report</h2>
              <div style={{ fontSize: 14.5, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{report.report_text}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: 0 }}>Landlord acknowledgement</h2>
              {signed ? (
                <div style={{ marginTop: 12, background: 'var(--mint-soft)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: '14px 16px', fontSize: 15 }}>
                  ✍️ Signed by <b>{report.landlord_name}</b> on {new Date(report.landlord_signed_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}.
                </div>
              ) : (
                <form onSubmit={sign}>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '8px 0 14px', lineHeight: 1.55 }}>
                    By signing, you acknowledge the unit's condition as documented in this report at move-in.
                    This record is timestamped and cannot be edited after signing.
                  </p>
                  <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }} htmlFor="name">Full name</label>
                  <input
                    id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Pat Property Manager"
                    style={{ width: '100%', maxWidth: 380, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--line-strong)', fontSize: 15 }}
                  />
                  <div>
                    <button
                      type="submit" disabled={signing}
                      style={{ marginTop: 14, padding: '13px 26px', borderRadius: 999, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: signing ? 'default' : 'pointer', opacity: signing ? 0.6 : 1 }}
                    >
                      {signing ? 'Signing…' : 'Sign & acknowledge'}
                    </button>
                  </div>
                  {error && (
                    <div style={{ marginTop: 12, background: '#fdecea', color: '#b3261e', border: '1px solid #f5c6c2', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, maxWidth: 420 }}>
                      {error}
                    </div>
                  )}
                </form>
              )}
            </div>

            <p style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 18 }}>
              Powered by RenterReady · This is a condition record, not legal advice.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
