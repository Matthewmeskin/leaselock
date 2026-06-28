'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'
import { QUIZ_STEPS } from '../lib/quiz'

/* ---------- helpers ---------- */
async function callAPI(system, user, images, pdf) {
  const res = await fetch('/api/claude', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, images, pdf }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'API error')
  return data.text
}
function load(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }
function uid() { return Math.random().toString(36).slice(2, 9) }
function daysUntil(iso) {
  const d = new Date(iso + 'T00:00:00'); const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / 86400000)
}
function downscale(file, max = 1100) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = (e) => { const img = new Image(); img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.82))
    }; img.src = e.target.result }
    r.readAsDataURL(file)
  })
}

/* ============================================================
   PERSONALIZATION QUIZ
   5 steps matching the design reference:
   1. Pets
   2. Roommates
   3. Co-signer / guarantor
   4. Early departure / sublet
   5. Furnished unit
   ============================================================ */

function Quiz({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)

  const current = QUIZ_STEPS[step]
  const pct = ((step) / QUIZ_STEPS.length) * 100

  function pick(val) {
    setSelected(val)
    // Short delay so user sees the selection before advancing
    setTimeout(() => {
      const next = { ...answers, [current.id]: val }
      setAnswers(next)
      if (step < QUIZ_STEPS.length - 1) {
        setStep(s => s + 1)
        setSelected(null)
      } else {
        save('rr_profile', next)
        onComplete(next)
      }
    }, 280)
  }

  return (
    <div className="quiz-shell">
      {/* Progress bar */}
      <div className="quiz-prog-track">
        {QUIZ_STEPS.map((_, i) => (
          <div
            key={i}
            className="quiz-prog-seg"
            style={{ background: i <= step ? 'var(--brand-accent)' : 'var(--line)' }}
          />
        ))}
      </div>

      <div className="quiz-body">
        {/* Step label */}
        <div className="quiz-step-label">SET UP YOUR PROTECTION · {current.step}</div>

        {/* Icon */}
        <div className="quiz-icon-wrap">
          <span className="quiz-icon">{current.icon}</span>
        </div>

        {/* Question */}
        <h2 className="quiz-q">{current.question}</h2>
        <p className="quiz-sub">{current.subtext}</p>

        {/* Options */}
        <div className="quiz-options">
          {current.options.map(opt => (
            <button
              key={opt.value}
              className={`quiz-opt ${selected === opt.value ? 'quiz-opt-on' : ''}`}
              onClick={() => pick(opt.value)}
            >
              <span className="quiz-opt-label">{opt.label}</span>
              <span className={`quiz-opt-radio ${selected === opt.value ? 'quiz-opt-radio-on' : ''}`}>
                {selected === opt.value && <span className="quiz-opt-check">✓</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Dashboard ---------- */
function MiniCalendar({ events, onAdd }) {
  const [view, setView] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const [sel, setSel] = useState(null)
  const y = view.getFullYear(), m = view.getMonth()
  const pad = n => String(n).padStart(2, '0')
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const fmt = d => `${y}-${pad(m + 1)}-${pad(d)}`
  const byDate = {}
  ;(events || []).forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e) })
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const selEvents = sel ? (byDate[sel] || []) : []
  return (
    <div className="c">
      <div className="cal-head">
        <h2 style={{ margin: 0 }}>Calendar</h2>
        <div className="cal-nav">
          <button onClick={() => { setView(new Date(y, m - 1, 1)); setSel(null) }} aria-label="Previous month">‹</button>
          <span className="cal-month">{view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => { setView(new Date(y, m + 1, 1)); setSel(null) }} aria-label="Next month">›</button>
        </div>
      </div>
      <div className="cal-grid cal-dow">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-dowc">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cal-cell empty" />
          const k = fmt(d)
          const evs = byDate[k] || []
          return (
            <button key={i} className={`cal-cell ${k === todayKey ? 'today' : ''} ${k === sel ? 'sel' : ''} ${evs.length ? 'has' : ''}`} onClick={() => setSel(evs.length ? k : null)}>
              <span>{d}</span>
              {evs.length > 0 && <span className="cal-dot" />}
            </button>
          )
        })}
      </div>
      {sel && selEvents.length > 0 && (
        <div className="cal-day-events">
          <div className="cal-day-label">{new Date(sel + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          {selEvents.map(e => {
            const def = EVT.find(x => x[0] === e.type) || EVT[4]
            return <div className="cal-ev" key={e.id}><span>{def[2]}</span><b>{e.title}</b></div>
          })}
        </div>
      )}
      <button className="bg2" style={{ marginTop: 14 }} onClick={onAdd}>Add a date</button>
    </div>
  )
}

function Dashboard({ go, profile }) {
  const [cal, setCal] = useState([])
  const [maint, setMaint] = useState([])
  const [rent, setRent] = useState([])
  useEffect(() => { setCal(load('ll_cal', [])); setMaint(load('ll_maint', [])); setRent(load('ll_rent', [])) }, [])
  const upcoming = [...cal].filter(e => daysUntil(e.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).slice(0, 4)
  const openIssues = maint.filter(m => m.status !== 'done').length

  // Personalized tip based on profile
  const tips = []
  if (profile?.pets === 'yes') tips.push({ icon: '🐾', text: 'You noted you have a pet. Make sure your lease clearly states any pet fees, deposits, and restrictions — these are common dispute triggers.' })
  if (profile?.roommates === 'shared') tips.push({ icon: '👥', text: 'On a shared lease, you may be jointly liable for the full rent. Check your lease for "joint and several" liability language.' })
  if (profile?.cosigner === 'yes') tips.push({ icon: '✅', text: 'Your guarantor is on the hook if you miss rent. Make sure they understand the scope of their commitment before signing.' })
  if (profile?.departure === 'maybe') tips.push({ icon: '🚪', text: "You flagged a possible early departure. Check your lease's subletting and early termination clauses — and the fees attached." })
  if (profile?.furnished === 'yes') tips.push({ icon: '🛋️', text: "Furnished units mean more to document at move-in. Use the move-in inspection to photograph every provided item's condition." })

  return (
    <>
      {tips.length > 0 && (
        <div className="c" style={{ background: 'var(--mint-soft)', border: '1px solid var(--line-strong)' }}>
          <h2>Your personalized heads-ups</h2>
          <p className="d">Based on your setup, here's what to watch for.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tips.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14.5 }}>
                <span style={{ fontSize: 18, lineHeight: 1.4 }}>{t.icon}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-tiles">
        <div className="tile"><div className="t-lab">Upcoming deadlines</div><div className="t-num brand">{cal.filter(e => daysUntil(e.date) >= 0).length}</div></div>
        <div className="tile"><div className="t-lab">Open issues</div><div className="t-num">{openIssues}</div></div>
        <div className="tile"><div className="t-lab">Rent payments logged</div><div className="t-num">{rent.length}</div></div>
        <div className="tile"><div className="t-lab">Deposit protected</div><div className="t-num brand">{(cal.length || maint.length || rent.length) ? 'Yes' : '—'}</div></div>
      </div>

      <MiniCalendar events={cal} onAdd={() => go('calendar')} />

      <div className="c">
        <h2>Next deadlines</h2>
        <p className="d">The dates that protect your deposit. Add them in the Lease calendar so you never miss notice.</p>
        {upcoming.length === 0 ? (
          <div className="empty"><div className="e-ic">📅</div>No deadlines yet. <button className="bg2" style={{ marginLeft: 8 }} onClick={() => go('calendar')}>Add one</button></div>
        ) : upcoming.map(e => {
          const d = daysUntil(e.date)
          return (
            <div className="dash-row" key={e.id}>
              <span className="rdot" style={{ background: d <= 7 ? '#c0392b' : 'var(--brand)' }} />
              <b>{e.title}</b>
              <span className="meta">{d === 0 ? 'Today' : `in ${d} day${d > 1 ? 's' : ''}`}</span>
            </div>
          )
        })}
      </div>

      <div className="c">
        <h2>Jump back in</h2>
        <p className="d">Pick up where you left off.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="bg2" onClick={() => go('lease')}>Review a lease</button>
          <button className="bg2" onClick={() => go('movein')}>Document move-in</button>
          <button className="bg2" onClick={() => go('maint')}>Log a maintenance issue</button>
          <button className="bg2" onClick={() => go('rent')}>Log rent payment</button>
        </div>
      </div>
    </>
  )
}

/* ---------- Lease review (rich JSON) ---------- */
function LeaseReview({ profile }) {
  const [text, setText] = useState('')
  const [data, setData] = useState(null)
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfData, setPdfData] = useState(null)
  const [pdfName, setPdfName] = useState('')
  const [reviewedAt, setReviewedAt] = useState('')
  const fileRef = useRef()

  function onPdf(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 4 * 1024 * 1024) { setRaw('That PDF is over 4MB. Try a smaller file or paste the text instead.'); e.target.value = ''; return }
    const r = new FileReader()
    r.onload = () => { setPdfData(r.result); setPdfName(f.name); setRaw('') }
    r.readAsDataURL(f)
    e.target.value = ''
  }

  async function run() {
    if (!text.trim() && !pdfData) return
    setLoading(true); setData(null); setRaw('')

    // Build personalization context from profile
    const ctx = []
    if (profile?.pets === 'yes') ctx.push('the renter has a pet')
    if (profile?.roommates === 'shared') ctx.push('this is a shared lease with roommates')
    if (profile?.cosigner === 'yes') ctx.push('there is a parent/guarantor co-signing')
    if (profile?.departure === 'maybe') ctx.push('the renter may need to leave early or sublet')
    if (profile?.furnished === 'yes') ctx.push('the unit is furnished')
    const ctxStr = ctx.length > 0 ? `Additional context about this renter: ${ctx.join(', ')}. Prioritize flags relevant to these circumstances.` : ''

    try {
      const userMsg = pdfData
        ? ('Analyze the attached lease PDF.' + (text.trim() ? '\n\nAdditional notes from the renter:\n' + text : ''))
        : ('Lease:\n\n' + text)
      const out = await callAPI(
        `You are a renter protection assistant. ${ctxStr} Analyze the lease and respond with ONLY valid JSON, no markdown fences, in this exact shape: {"summary":"2 to 3 sentence plain English summary","score":<integer 0-100 how renter-friendly this lease is, higher is safer>,"verdict":"short phrase like Sign with caution","flags":[{"title":"short","detail":"one sentence","severity":"high|medium|low"}],"questions":["question to ask landlord"]}. Include 3 to 6 flags and 3 to 5 questions.`,
        userMsg, null, pdfData)
      const clean = out.replace(/```json|```/g, '').trim()
      try { setData(JSON.parse(clean)); setReviewedAt(new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })) } catch { setRaw(out) }
    } catch { setRaw('Something went wrong. Please try again.') }
    setLoading(false)
  }
  const score = data?.score ?? 0
  const circ = 2 * Math.PI * 40
  return (
    <>
      <div className="c">
        <h2>AI lease risk review</h2>
        <p className="d">Paste your lease. We score how renter friendly it is, flag the clauses that cost you money, and hand you the questions to ask before signing.</p>
        <span className="lab">Lease document</span>
        <div className="lease-upload" onClick={() => fileRef.current?.click()}>
          {pdfName ? (
            <div className="lease-file">
              <span className="lf-ico">📄</span>
              <span className="lf-name">{pdfName}</span>
              <button className="lf-x" onClick={(e) => { e.stopPropagation(); setPdfData(null); setPdfName('') }}>×</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 24 }}>📄</div>
              <div style={{ fontWeight: 600, marginTop: 6 }}>Upload lease PDF</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>Tap to choose a PDF file</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="application/pdf" onChange={onPdf} style={{ display: 'none' }} />

        <div className="lease-or"><span>or paste text</span></div>

        <textarea className="ta2" style={{ minHeight: 130 }} placeholder="Paste your full lease here..." value={text} onChange={e => setText(e.target.value)} />
        <div style={{ marginTop: 14 }}>
          <button className="bp" onClick={run} disabled={loading || (!text.trim() && !pdfData)}>{loading ? <><i className="spin2" /> Analyzing</> : 'Analyze lease'}</button>
        </div>
      </div>

      {data && (
        <div className="c">
          {reviewedAt && <div className="review-stamp">🔒 Reviewed {reviewedAt}</div>}
          <div className="ring-wrap">
            <svg className="ring" viewBox="0 0 100 100">
              <circle className="bgc" cx="50" cy="50" r="40" />
              <circle className="fgc" cx="50" cy="50" r="40" transform="rotate(-90 50 50)"
                strokeDasharray={circ} strokeDashoffset={circ - (circ * score / 100)} />
              <text className="ring-num" x="50" y="58" textAnchor="middle">{score}</text>
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>{data.verdict || 'Lease reviewed'}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>Renter friendliness score</div>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, marginBottom: 22 }}>{data.summary}</p>

          <span className="lab">Risk flags</span>
          <div style={{ marginBottom: 22 }}>
            {(data.flags || []).map((f, i) => (
              <div className={`flag2 sev-${f.severity || 'low'}`} key={i}>
                <span className="fic">{f.severity === 'high' ? '!' : f.severity === 'medium' ? '!' : '✓'}</span>
                <div className="fx" style={{ flex: 1 }}><b>{f.title}</b><span>{f.detail}</span></div>
                <span className="sev-pill">{f.severity}</span>
              </div>
            ))}
          </div>

          <span className="lab">Ask your landlord</span>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {(data.questions || []).map((q, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14.5 }}><span style={{ color: 'var(--brand)', fontWeight: 800 }}>?</span>{q}</li>
            ))}
          </ul>
        </div>
      )}
      {raw && <div className="c"><div className="res">{raw}</div></div>}
    </>
  )
}

/* ---------- Move-in (photos + vision) ---------- */
const ROOMS = [['Living room', '🛋️'], ['Kitchen', '🍳'], ['Bedroom', '🛏️'], ['Bathroom', '🚿'], ['Entryway', '🚪'], ['Other', '📦']]
const FURNISHED_ITEMS = [['Sofa', '🛋️'], ['Dining table', '🍽️'], ['Bed frame', '🛏️'], ['Mattress', '😴'], ['Dresser', '🗄️'], ['TV', '📺']]

function MoveIn({ profile }) {
  const [room, setRoom] = useState('Living room')
  const [cond, setCond] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState([])
  const [entries, setEntries] = useState([])
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  async function onFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, 6)
    const c = await Promise.all(files.map(f => downscale(f)))
    setPhotos(p => [...p, ...c].slice(0, 6))
  }
  function add() {
    if (!cond) { alert('Pick a condition first.'); return }
    setEntries(en => [...en, { room, cond, notes: notes || 'No notes added.', photos }])
    setNotes(''); setCond(''); setPhotos([]); if (fileRef.current) fileRef.current.value = ''
  }
  async function gen() {
    setLoading(true); setReport('Looking at your photos and writing the report...')
    const imgs = entries.flatMap(e => e.photos)
    const log = entries.map(e => `${e.room}: ${e.cond}. Notes: ${e.notes}. Photos: ${e.photos.length}.`).join('\n')
    const furnishedNote = profile?.furnished === 'yes' ? ' Note: the unit is furnished — also assess the condition of provided furniture items.' : ''
    try {
      const out = await callAPI(
        `You are a renter protection assistant reviewing move-in photos. Look carefully at each photo and describe visible existing damage, wear, stains, or issues.${furnishedNote} Then write a professional, factual move-in condition report organized by room, under 280 words. Plain text, no markdown symbols.`,
        'Condition log. Review the attached photos and produce the report:\n\n' + log, imgs)
      setReport(out)
    } catch { setReport('Something went wrong. Please try again.') }
    setLoading(false)
  }
  const cb = (v, c) => ({ flex: 1, padding: 10, borderRadius: 11, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, border: cond === v ? `1.5px solid ${c}` : '1px solid var(--line-strong)', background: cond === v ? `${c}14` : '#fbfdfc', color: cond === v ? c : 'var(--ink-soft)' })
  return (
    <>
      <div className="c">
        <h2>Move-in photo report</h2>
        <p className="d">Go room by room, add photos, and our AI describes the existing damage it sees. This is the proof that protects your deposit.</p>
        {profile?.furnished === 'yes' && (
          <div style={{ background: 'var(--mint-soft)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span>🛋️</span>
            <span>Your unit is furnished. Make sure to document each provided item in your photos and notes.</span>
          </div>
        )}
        <span className="lab">Room</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px,1fr))', gap: 8, marginBottom: 20 }}>
          {ROOMS.map(([n, i]) => (
            <div key={n} onClick={() => setRoom(n)} style={{ border: room === n ? '1.5px solid var(--brand)' : '1px solid var(--line-strong)', background: room === n ? 'var(--mint-soft)' : '#fbfdfc', borderRadius: 12, padding: '12px 6px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 22 }}>{i}</div>
              <div style={{ fontSize: 12.5, marginTop: 3, fontWeight: room === n ? 600 : 500, color: room === n ? 'var(--brand)' : 'var(--ink-soft)' }}>{n}</div>
            </div>
          ))}
        </div>
        <span className="lab">Condition</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={cb('good', '#0e8a5f')} onClick={() => setCond('good')}>Good</button>
          <button style={cb('fair', '#c07c0c')} onClick={() => setCond('fair')}>Fair</button>
          <button style={cb('poor', '#c0392b')} onClick={() => setCond('poor')}>Poor</button>
        </div>
        <span className="lab">Photos</span>
        <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed var(--line-strong)', borderRadius: 14, padding: 22, textAlign: 'center', cursor: 'pointer', background: '#fbfdfc', marginBottom: photos.length ? 12 : 20 }}>
          <div style={{ fontSize: 26 }}>📸</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Tap to add photos</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>Up to 6 per room · AI reads each one</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
        {photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))', gap: 8, marginBottom: 20 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={p} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
                <button onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>×</button>
              </div>
            ))}
          </div>
        )}
        <span className="lab">Notes (optional)</span>
        <textarea className="ta2" style={{ minHeight: 70, marginBottom: 14 }} placeholder="Scuff on the wall, stain on the carpet, cracked tile..." value={notes} onChange={e => setNotes(e.target.value)} />
        <button className="bp" onClick={add}>Add {room} to report</button>
      </div>
      {entries.length > 0 && (
        <div className="c">
          <h2>Condition log</h2>
          <p className="d">{entries.length} room{entries.length > 1 ? 's' : ''} · {entries.reduce((n, e) => n + e.photos.length, 0)} photos</p>
          {entries.map((e, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: e.photos.length ? 10 : 0 }}>
                <b style={{ flex: 1, fontWeight: 600 }}>{e.room}</b>
                <span className={`status-pill ${e.cond === 'good' ? 'st-done' : e.cond === 'fair' ? 'st-sent' : 'st-open'}`}>{e.cond}</span>
              </div>
              {e.photos.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{e.photos.map((p, j) => <img key={j} src={p} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />)}</div>}
            </div>
          ))}
          <div style={{ marginTop: 14 }}><button className="bp" onClick={gen} disabled={loading}>{loading ? <><i className="spin2" /> Reading photos</> : 'Generate AI condition report'}</button></div>
          {report && <div className="res">{report}</div>}
        </div>
      )}
    </>
  )
}

/* ---------- Lease calendar ---------- */
const EVT = [['rent', 'Rent due', '💵'], ['notice', 'Move-out notice deadline', '⏰'], ['lease_end', 'Lease ends', '🏁'], ['insurance', 'Insurance renewal', '🛡️'], ['custom', 'Custom reminder', '📌']]
function Calendar() {
  const [items, setItems] = useState([])
  const [type, setType] = useState('notice')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => { setItems(load('ll_cal', [])) }, [])
  function persist(next) { setItems(next); save('ll_cal', next) }
  function add() {
    if (!date) { alert('Pick a date.'); return }
    const def = EVT.find(e => e[0] === type)
    persist([...items, { id: uid(), type, title: title || def[1], date }])
    setTitle(''); setDate('')
  }
  const sorted = [...items].sort((a, b) => new Date(a.date) - new Date(b.date))
  return (
    <>
      <div className="c">
        <h2>Lease calendar <span className="up">Premium</span></h2>
        <p className="d">Track every date that protects your deposit. Missing a notice deadline can cost you a full month of rent.</p>
        <span className="lab">Reminder type</span>
        <select className="sel" style={{ marginBottom: 14 }} value={type} onChange={e => setType(e.target.value)}>
          {EVT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="form-row">
          <div><span className="lab">Label (optional)</span><input className="inp" placeholder="Custom name" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><span className="lab">Date</span><input className="inp" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <button className="bp" onClick={add}>Add to calendar</button>
      </div>
      <div className="c">
        <h2>Your dates</h2>
        <p className="d">Sorted by what is coming up next.</p>
        {sorted.length === 0 ? <div className="empty"><div className="e-ic">📅</div>No dates yet. Add your move-out notice deadline first.</div> :
          sorted.map(it => {
            const d = daysUntil(it.date); const def = EVT.find(e => e[0] === it.type) || EVT[4]
            return (
              <div className="li" key={it.id}>
                <span className="li-ic">{def[2]}</span>
                <div className="li-main"><b>{it.title}</b><span>{new Date(it.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                <div className="li-right"><div className={`count ${d < 0 ? 'past' : d <= 7 ? 'soon' : 'ok'}`}>{d < 0 ? 'Passed' : d === 0 ? 'Today' : `${d}d`}</div></div>
                <button className="x" onClick={() => persist(items.filter(x => x.id !== it.id))}>×</button>
              </div>
            )
          })}
      </div>
    </>
  )
}

/* ---------- Maintenance tracker ---------- */
const ST = { open: 'st-open', sent: 'st-sent', prog: 'st-prog', done: 'st-done' }
const STLAB = { open: 'Open', sent: 'Reported', prog: 'In progress', done: 'Resolved' }
function Maintenance() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState(''); const [room, setRoom] = useState('Kitchen'); const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  useEffect(() => { setItems(load('ll_maint', [])) }, [])
  function persist(n) { setItems(n); save('ll_maint', n) }
  function add() {
    if (!title.trim()) { alert('What is the issue?'); return }
    persist([{ id: uid(), title, room, note, status: 'open', created: new Date().toISOString(), msg: '' }, ...items])
    setTitle(''); setNote('')
  }
  function setStatus(id, s) { persist(items.map(m => m.id === id ? { ...m, status: s } : m)) }
  async function draft(m) {
    setBusy(m.id)
    try {
      const msg = await callAPI(
        'You are a renter communication assistant. Write a short professional maintenance request to the landlord. Include a subject line. Under 120 words. Plain text, no markdown symbols.',
        `Issue in the ${m.room}: ${m.title}. ${m.note || ''}`)
      persist(items.map(x => x.id === m.id ? { ...x, msg, status: x.status === 'open' ? 'sent' : x.status } : x))
    } catch {}
    setBusy('')
  }
  return (
    <>
      <div className="c">
        <h2>Maintenance tracker <span className="up">Premium</span></h2>
        <p className="d">Log every issue, generate the message to your landlord, and keep a timestamped record. This trail is what wins deposit disputes.</p>
        <div className="form-row">
          <div><span className="lab">Issue</span><input className="inp" placeholder="Leaking faucet" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><span className="lab">Room</span><select className="sel" value={room} onChange={e => setRoom(e.target.value)}>{ROOMS.map(([n]) => <option key={n}>{n}</option>)}</select></div>
        </div>
        <span className="lab">Details (optional)</span>
        <textarea className="ta2" style={{ minHeight: 70, marginBottom: 14 }} placeholder="When it started, how bad, photos taken..." value={note} onChange={e => setNote(e.target.value)} />
        <button className="bp" onClick={add}>Log issue</button>
      </div>
      <div className="c">
        <h2>Your issues</h2>
        <p className="d">{items.filter(m => m.status !== 'done').length} open · {items.length} total</p>
        {items.length === 0 ? <div className="empty"><div className="e-ic">🔧</div>No issues logged yet.</div> :
          items.map(m => (
            <div key={m.id} style={{ border: '1px solid var(--line)', borderRadius: 13, padding: 15, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <b style={{ flex: 1, fontWeight: 600 }}>{m.title}</b>
                <span className={`status-pill ${ST[m.status]}`}>{STLAB[m.status]}</span>
                <button className="x" onClick={() => persist(items.filter(x => x.id !== m.id))}>×</button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>{m.room} · logged {new Date(m.created).toLocaleDateString()}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="bg2" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => draft(m)} disabled={busy === m.id}>{busy === m.id ? 'Drafting...' : m.msg ? 'Redraft message' : 'Draft message'}</button>
                <select className="sel" style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }} value={m.status} onChange={e => setStatus(m.id, e.target.value)}>
                  <option value="open">Open</option><option value="sent">Reported</option><option value="prog">In progress</option><option value="done">Resolved</option>
                </select>
              </div>
              {m.msg && <div className="res" style={{ marginTop: 12, fontSize: 13.5 }}>{m.msg}</div>}
            </div>
          ))}
      </div>
    </>
  )
}

/* ---------- Rent log ---------- */
function RentLog() {
  const [items, setItems] = useState([])
  const [month, setMonth] = useState(''); const [amount, setAmount] = useState(''); const [method, setMethod] = useState('Bank transfer')
  useEffect(() => { setItems(load('ll_rent', [])) }, [])
  function persist(n) { setItems(n); save('ll_rent', n) }
  function add() {
    if (!month || !amount) { alert('Add the month and amount.'); return }
    persist([{ id: uid(), month, amount, method, paid: new Date().toISOString() }, ...items])
    setAmount('')
  }
  const total = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  return (
    <>
      <div className="c">
        <h2>Rent payment log <span className="up">Premium</span></h2>
        <p className="d">One tap a month builds a clean record of on-time payments. Useful for deposit disputes and your next rental application.</p>
        <div className="form-row">
          <div><span className="lab">Month</span><input className="inp" type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
          <div><span className="lab">Amount</span><input className="inp" type="number" placeholder="2450" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        </div>
        <span className="lab">Method</span>
        <select className="sel" style={{ marginBottom: 14 }} value={method} onChange={e => setMethod(e.target.value)}>
          <option>Bank transfer</option><option>Check</option><option>Zelle</option><option>Venmo</option><option>Cash</option><option>Card</option>
        </select>
        <button className="bp" onClick={add}>Log payment</button>
      </div>
      <div className="c">
        <h2>Payment history</h2>
        <p className="d">{items.length} payment{items.length !== 1 ? 's' : ''} · ${total.toLocaleString()} total logged</p>
        {items.length === 0 ? <div className="empty"><div className="e-ic">💵</div>No payments logged yet.</div> :
          items.map(r => (
            <div className="li" key={r.id}>
              <span className="li-ic">💵</span>
              <div className="li-main"><b>{new Date(r.month + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b><span>{r.method} · logged {new Date(r.paid).toLocaleDateString()}</span></div>
              <div className="li-right"><div className="count ok">${parseFloat(r.amount).toLocaleString()}</div></div>
              <button className="x" onClick={() => persist(items.filter(x => x.id !== r.id))}>×</button>
            </div>
          ))}
      </div>
    </>
  )
}

/* ---------- Move-in launcher ---------- */
function MoveInLauncher() {
  return (
    <div className="c" style={{ textAlign: 'center', padding: '40px 26px' }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>📸</div>
      <h2 style={{ justifyContent: 'center' }}>Guided move-in inspection</h2>
      <p className="d" style={{ maxWidth: 420, margin: '0 auto 22px' }}>Walk through your unit room by room. Mostly tapping, a few photos, and our AI writes the condition report. You and your landlord both get the same locked record.</p>
      <a href="/report" className="bp" style={{ textDecoration: 'none' }}>Start guided inspection →</a>
    </div>
  )
}

/* ---------- App shell ---------- */
// Messages tab removed
const NAV = [
  ['home', 'Dashboard', '◫'],
  ['lease', 'Lease review', '📄'],
  ['movein', 'Move-in report', '📸'],
  ['calendar', 'Lease calendar', '📅'],
  ['maint', 'Maintenance', '🔧'],
  ['rent', 'Rent log', '💵'],
]
const TITLES = {
  home: 'Dashboard',
  lease: 'Lease review',
  movein: 'Move-in report',
  calendar: 'Lease calendar',
  maint: 'Maintenance tracker',
  rent: 'Rent log',
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useState(null)
  const [quizDone, setQuizDone] = useState(false)

  useEffect(() => {
    const forceSetup = typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('setup') === 'true'
    if (forceSetup) {
      save('rr_profile', null)
      setProfile(null)
      setQuizDone(false)
      return
    }
    const saved = load('rr_profile', null)
    if (saved) {
      setProfile(saved)
      setQuizDone(true)
    }
  }, [])

  function handleQuizComplete(answers) {
    setProfile(answers)
    setQuizDone(true)
    setTab('movein')
  }

  // Show quiz until completed
  if (!quizDone) {
    return (
      <>
        <style>{`@keyframes ll-spin{to{transform:rotate(360deg)}}`}</style>
        <Quiz onComplete={handleQuizComplete} />
      </>
    )
  }

  return (
    <div className="ax">
      <style>{`@keyframes ll-spin{to{transform:rotate(360deg)}}`}</style>
      <aside className="ax-side">
        <Link href="/" className="ax-brand"><Logo size={30} /> Renter<span style={{ color: 'var(--brand)' }}>Ready</span></Link>
        <nav className="ax-nav">
          {NAV.map(([k, l, i]) => <button key={k} className={`ax-link ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}><span className="ico">{i}</span>{l}</button>)}
        </nav>
        <div className="foot">
          <button
            onClick={() => { save('rr_profile', null); setQuizDone(false); setProfile(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'block' }}
          >
            ↺ Redo setup
          </button>
          <Link href="/">← Back to site</Link>
        </div>
      </aside>
      <main className="ax-main">
        <div className="ax-mobnav">
          {NAV.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <div className="ax-top"><h1>{TITLES[tab]}</h1><Link href="/" style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 500 }}>Home</Link></div>
        <div className="ax-body">
          {tab === 'home' && <Dashboard go={setTab} profile={profile} />}
          {tab === 'lease' && <LeaseReview profile={profile} />}
          {tab === 'movein' && <MoveInLauncher />}
          {tab === 'calendar' && <Calendar />}
          {tab === 'maint' && <Maintenance />}
          {tab === 'rent' && <RentLog />}
        </div>
      </main>
    </div>
  )
}
