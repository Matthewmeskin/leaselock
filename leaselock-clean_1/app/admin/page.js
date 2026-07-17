'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import { createClient } from '../lib/supabase/client'

/* ---------- formatting helpers ---------- */
function fmtDay(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function pct(part, whole) {
  if (!whole) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

/* ---------- stat tile ---------- */
function Stat({ label, value, sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, margin: '6px 0 2px', color: 'var(--ink)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{sub}</div>}
    </div>
  )
}

/* ---------- signups bar chart (single series) ---------- */
function SignupsChart({ days }) {
  const [tip, setTip] = useState(null) // {x, y, label}
  const W = 720, H = 180, PAD_L = 28, PAD_B = 22, PAD_T = 8
  const max = Math.max(1, ...days.map(d => d.count))
  const innerW = W - PAD_L - 6
  const innerH = H - PAD_B - PAD_T
  const step = innerW / days.length
  const barW = Math.max(4, step - 2) // 2px gap between bars

  return (
    <div style={{ position: 'relative', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 480, display: 'block' }} role="img" aria-label="New signups per day, last 30 days">
        {/* recessive grid: max + midpoint */}
        {[max, Math.ceil(max / 2)].filter((v, i, a) => a.indexOf(v) === i).map(v => {
          const y = PAD_T + innerH - (v / max) * innerH
          return (
            <g key={v}>
              <line x1={PAD_L} x2={W - 6} y1={y} y2={y} stroke="var(--line)" strokeWidth="1" />
              <text x={PAD_L - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="var(--ink-soft)">{v}</text>
            </g>
          )
        })}
        <line x1={PAD_L} x2={W - 6} y1={PAD_T + innerH} y2={PAD_T + innerH} stroke="var(--line-strong)" strokeWidth="1" />
        {days.map((d, i) => {
          const h = Math.max(d.count > 0 ? 3 : 0, (d.count / max) * innerH)
          const x = PAD_L + i * step + 1
          const y = PAD_T + innerH - h
          return (
            <g key={d.day}>
              {/* wide invisible hit target */}
              <rect
                x={PAD_L + i * step} y={PAD_T} width={step} height={innerH + PAD_B} fill="transparent"
                onMouseEnter={() => setTip({ i, label: `${fmtDay(d.day)} · ${d.count} signup${d.count === 1 ? '' : 's'}` })}
                onMouseLeave={() => setTip(null)}
              />
              {d.count > 0 && (
                <path
                  d={`M ${x} ${y + 4} Q ${x} ${y} ${x + 4} ${y} L ${x + barW - 4} ${y} Q ${x + barW} ${y} ${x + barW} ${y + 4} L ${x + barW} ${PAD_T + innerH} L ${x} ${PAD_T + innerH} Z`}
                  fill="var(--brand)"
                  opacity={tip && tip.i !== i ? 0.55 : 1}
                  pointerEvents="none"
                />
              )}
              {i % 7 === 0 && (
                <text x={PAD_L + i * step + step / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--ink-soft)">
                  {fmtDay(d.day)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {tip && (
        <div style={{
          position: 'absolute', top: 0, left: `${((tip.i + 0.5) / days.length) * 100}%`, transform: 'translateX(-50%)',
          background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 10px',
          borderRadius: 8, whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {tip.label}
        </div>
      )}
    </div>
  )
}

/* ---------- feature usage horizontal bars ---------- */
const FEATURE_LABELS = {
  lease_reviews: 'AI lease reviews',
  calendar_events: 'Calendar events',
  maintenance_issues: 'Maintenance issues',
  rent_payments: 'Rent payments logged',
  roommate_agreements: 'Roommate agreements generated',
}

function FeatureBars({ features }) {
  const rows = Object.entries(FEATURE_LABELS).map(([key, label]) => ({ key, label, value: features[key] ?? 0 }))
  const max = Math.max(1, ...rows.map(r => r.value))
  return (
    <div>
      {rows.map(r => (
        <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 44px', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{r.label}</div>
          <div style={{ height: 14, background: 'var(--bg)', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', background: 'var(--brand)', borderRadius: 7, minWidth: r.value > 0 ? 8 : 0 }} />
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>{r.value}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------- card ---------- */
function Card({ title, sub, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px', marginBottom: 18 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 0' }}>{sub}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  )
}

export default function AdminPage() {
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading') // loading | ok | denied | error
  const [errMsg, setErrMsg] = useState('')

  async function load() {
    setState('loading')
    const supabase = createClient()
    const { data: metrics, error } = await supabase.rpc('admin_metrics')
    if (error) {
      if (/not authorized|jwt|not_authorized|permission/i.test(error.message || '')) setState('denied')
      else { setErrMsg(error.message); setState('error') }
      return
    }
    setData(metrics)
    setState('ok')
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="brand"><Logo size={34} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, background: 'var(--ink)', color: '#fff', borderRadius: 8, padding: '4px 10px' }}>ADMIN</span>
            {state === 'ok' && (
              <button onClick={load} className="btn btn-ghost" style={{ fontSize: 13.5 }}>Refresh</button>
            )}
          </div>
        </div>
      </nav>

      <div className="wrap" style={{ maxWidth: 980, padding: '28px 20px 60px' }}>
        {state === 'loading' && (
          <p style={{ color: 'var(--ink-soft)', padding: '60px 0', textAlign: 'center' }}>Loading metrics…</p>
        )}

        {state === 'denied' && (
          <div style={{ maxWidth: 460, margin: '80px auto', textAlign: 'center', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 34 }}>🔒</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '10px 0 8px' }}>Admins only</h1>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              This dashboard is restricted to admin accounts. Log in with an admin email to view usage metrics.
            </p>
            <Link href="/login?redirect=/admin" className="btn btn-mint" style={{ marginTop: 16, display: 'inline-block' }}>Log in</Link>
          </div>
        )}

        {state === 'error' && (
          <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
            <p style={{ color: '#b3261e', fontSize: 14.5 }}>Could not load metrics: {errMsg}</p>
            <button onClick={load} className="btn btn-ghost" style={{ marginTop: 12 }}>Try again</button>
          </div>
        )}

        {state === 'ok' && data && (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '4px 0 4px' }}>Usage metrics</h1>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 20px' }}>
              Live from the production database · generated {new Date(data.generated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 18 }}>
              <Stat label="Total users" value={data.totals.users} sub={`+${data.totals.new_users_30d} in 30 days`} />
              <Stat label="New this week" value={data.totals.new_users_7d} />
              <Stat label="Active (7 days)" value={data.totals.active_7d} sub={`${data.totals.active_30d} in 30 days`} />
              <Stat label="Onboarding done" value={data.totals.quiz_completed} sub={`${pct(data.totals.quiz_completed, data.totals.users)} of users`} />
              <Stat label="Households" value={data.totals.households} sub={`${data.totals.shared_households} shared`} />
            </div>

            <Card title="Signups — last 30 days" sub="New accounts created per day">
              <SignupsChart days={data.signups_by_day} />
            </Card>

            <Card title="Feature usage" sub="Total records created across all users">
              <FeatureBars features={data.features} />
            </Card>

            <Card title="Users" sub={`${data.users.length} most recent (max 100)`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--ink-soft)', fontSize: 12 }}>
                      {['Name', 'Email', 'Joined', 'Last active', 'Onboarded', 'Shared lease'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u, i) => (
                      <tr key={i}>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)', fontWeight: 600, whiteSpace: 'nowrap' }}>{u.name}</td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)' }}>{u.email}</td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{fmtDate(u.last_sign_in_at)}</td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)' }}>{u.quiz_done ? '✅' : '—'}</td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)' }}>{u.shared_lease ? '👥' : '—'}</td>
                      </tr>
                    ))}
                    {data.users.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>No users yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
