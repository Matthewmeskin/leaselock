'use client'
import { useState } from 'react'
import Link from 'next/link'
import SiteNav from '../../_components/SiteNav'

const STATES = [
  ['California', 21], ['New York', 14], ['Texas', 30], ['Florida', 30], ['Illinois', 45],
  ['Washington', 21], ['Massachusetts', 30], ['Georgia', 30], ['Arizona', 14], ['Colorado', 30],
  ['Oregon', 31], ['Pennsylvania', 30], ['Michigan', 30], ['Ohio', 30], ['North Carolina', 30],
  ['Virginia', 45], ['New Jersey', 30], ['Nevada', 30], ['Other / not sure', 30],
]

export default function Calc() {
  const [state, setState] = useState('California')
  const [moveOut, setMoveOut] = useState('')
  const [result, setResult] = useState(null)

  function run() {
    if (!moveOut) { alert('Pick your move-out date.'); return }
    const days = STATES.find(s => s[0] === state)[1]
    const out = new Date(moveOut + 'T00:00:00')
    const deadline = new Date(out); deadline.setDate(deadline.getDate() + days)
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const left = Math.round((deadline - now) / 86400000)
    setResult({ days, deadline, left })
  }

  return (
    <>
      <SiteNav />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 680 }}>
          <span className="tag">Free tool</span>
          <h1 style={{ fontSize: 'clamp(30px,5vw,44px)', margin: '12px 0 10px' }}>Deposit return deadline calculator</h1>
          <p style={{ fontSize: 18, color: 'var(--ink-soft)', marginBottom: 32 }}>Find out the legal deadline your landlord has to return your security deposit after you move out.</p>

          <div className="c">
            <span className="lab">Your state</span>
            <select className="sel" style={{ marginBottom: 16 }} value={state} onChange={e => setState(e.target.value)}>
              {STATES.map(([n]) => <option key={n}>{n}</option>)}
            </select>
            <span className="lab">Move-out date</span>
            <input className="inp" type="date" style={{ marginBottom: 18 }} value={moveOut} onChange={e => setMoveOut(e.target.value)} />
            <button className="bp" onClick={run}>Calculate deadline</button>

            {result && (
              <div style={{ marginTop: 22, background: 'var(--brand-deep)', borderRadius: 16, padding: 26, color: '#fff' }}>
                <div style={{ fontSize: 13, color: '#a9d8ca', fontWeight: 600 }}>Your landlord must return the deposit by</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, margin: '6px 0 4px' }}>
                  {result.deadline.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 14, color: '#cfeee4' }}>
                  That is {result.days} days after move-out. {result.left >= 0 ? `${result.left} days from today.` : `The deadline has passed by ${Math.abs(result.left)} days, you may be owed your full deposit plus penalties.`}
                </div>
              </div>
            )}
          </div>

          <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>These are common state deadlines for general guidance, not legal advice. Exact rules and exceptions vary, so confirm with your local tenant resources.</p>

          <div className="cta-band" style={{ marginTop: 40 }}>
            <h2>Deadline passed?</h2>
            <p>LeaseLock drafts the deposit demand letter for you.</p>
            <Link href="/app" className="btn btn-mint btn-lg">Open LeaseLock →</Link>
          </div>
        </div>
      </section>
    </>
  )
}
