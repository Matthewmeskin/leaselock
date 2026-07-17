'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '../components/Logo'
import GeneratingLoader from '../components/GeneratingLoader'
import AddressAutocomplete from '../components/AddressAutocomplete'
import FakeDoor from '../components/FakeDoor'
import { track } from '../lib/analytics'
import { QUIZ_STEPS } from '../lib/quiz'
import * as db from '../lib/db'

const LEASE_LOADER_MSGS = [
  'Reading the fine print so you don’t have to',
  'Hunting for sneaky fees',
  'Checking who really pays for repairs',
  'Decoding the legalese',
  'Flagging anything that smells off',
  'Scoring how renter-friendly this is',
  'Drafting questions for your landlord',
]

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
function Dashboard({ go, profile }) {
  const [cal, setCal] = useState([])
  const [maint, setMaint] = useState([])
  const [rent, setRent] = useState([])
  useEffect(() => {
    (async () => {
      try {
        const [c, m, r] = await Promise.all([db.listCalendar(), db.listMaintenance(), db.listRent()])
        setCal(c); setMaint(m); setRent(r)
      } catch {}
    })()
  }, [])
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

      <FakeDoor placement="dashboard" />

      <div className="c">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Key dates</h2>
          <button className="bg2" onClick={() => go('calendar')}>Add a date</button>
        </div>
        <p className="d" style={{ marginTop: 6 }}>The dates that protect your deposit — notice deadlines, rent, lease end.</p>
        {upcoming.length === 0 ? (
          <div className="empty"><div className="e-ic">📅</div>No key dates yet. <button className="bg2" style={{ marginLeft: 8 }} onClick={() => go('calendar')}>Add one</button></div>
        ) : upcoming.map(e => {
          const d = daysUntil(e.date)
          const def = EVT.find(x => x[0] === e.type) || EVT[4]
          return (
            <div className="dash-row" key={e.id}>
              <span style={{ fontSize: 17 }}>{def[2]}</span>
              <b>{e.title}</b>
              <span className="meta" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <span style={{ fontWeight: 700, color: d <= 7 ? '#c0392b' : 'var(--brand)', marginLeft: 8 }}>
                  {d === 0 ? 'Today' : `in ${d} day${d > 1 ? 's' : ''}`}
                </span>
              </span>
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
          <button className="bg2" onClick={() => go('roommates')}>Write a roommate agreement</button>
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

  useEffect(() => {
    db.getLeaseReview().then(r => {
      if (r) { setData(r); setReviewedAt(r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '') }
    }).catch(() => {})
  }, [])

  const [pdfDragOver, setPdfDragOver] = useState(false)

  function loadPdf(f) {
    if (!f) return
    if (f.type !== 'application/pdf') { setRaw('That file is not a PDF. Drop a .pdf file or paste the lease text instead.'); return }
    if (f.size > 4 * 1024 * 1024) { setRaw('That PDF is over 4MB. Try a smaller file or paste the text instead.'); return }
    const r = new FileReader()
    r.onload = () => { setPdfData(r.result); setPdfName(f.name); setRaw('') }
    r.readAsDataURL(f)
    // Persist the lease to household documents (shared with roommates).
    db.uploadDocument(f, { name: f.name, kind: 'lease', context: 'Lease review' }).catch(() => {})
  }

  function onPdf(e) {
    loadPdf(e.target.files?.[0])
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
      try {
        const parsed = JSON.parse(clean)
        setData(parsed)
        setReviewedAt(new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }))
        db.saveLeaseReview(parsed).catch(() => {})
      } catch { setRaw(out) }
    } catch (e) {
      const msg = e?.message || ''
      if (msg.includes('ANTHROPIC_API_KEY') || msg.includes('authentication') || msg.includes('not configured')) {
        setRaw('AI lease review is not set up yet. Add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables, then redeploy.')
      } else {
        setRaw(msg || 'Something went wrong. Please try again.')
      }
    }
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
        <div
          className="lease-upload"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true) }}
          onDragEnter={(e) => { e.preventDefault(); setPdfDragOver(true) }}
          onDragLeave={() => setPdfDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setPdfDragOver(false); loadPdf(e.dataTransfer?.files?.[0]) }}
          style={pdfDragOver ? { borderColor: 'var(--brand)', background: 'var(--mint-soft)' } : undefined}
        >
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
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>Tap to choose a PDF — or drag &amp; drop it here</div>
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

      {loading && (
        <div className="c">
          <GeneratingLoader title="Reviewing your lease" msgs={LEASE_LOADER_MSGS} />
        </div>
      )}

      {!loading && data && (
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
  const [dragOver, setDragOver] = useState(false)

  async function addPhotoFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/')).slice(0, 6)
    if (!files.length) return
    const c = await Promise.all(files.map(f => downscale(f)))
    setPhotos(p => [...p, ...c].slice(0, 6))
    // Persist to household documents (shared with roommates).
    c.forEach((dataUrl) => {
      db.dataUrlToBlob(dataUrl)
        .then(b => db.uploadDocument(b, { name: `${room} photo.jpg`, kind: 'photo', context: `Move-in · ${room}` }))
        .catch(() => {})
    })
  }

  async function onFiles(e) {
    await addPhotoFiles(e.target.files)
    e.target.value = ''
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
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addPhotoFiles(e.dataTransfer?.files) }}
          style={{ border: dragOver ? '1.5px dashed var(--brand)' : '1.5px dashed var(--line-strong)', borderRadius: 14, padding: 22, textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--mint-soft)' : '#fbfdfc', marginBottom: photos.length ? 12 : 20 }}
        >
          <div style={{ fontSize: 26 }}>📸</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{dragOver ? 'Drop photos here' : 'Tap to add photos — or drag & drop'}</div>
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
  useEffect(() => { db.listCalendar().then(setItems).catch(() => {}) }, [])
  async function add() {
    if (!date) { alert('Pick a date.'); return }
    const def = EVT.find(e => e[0] === type)
    try {
      const row = await db.addCalendar({ type, title: title || def[1], date })
      setItems(prev => [...prev, row])
      setTitle(''); setDate('')
    } catch (e) { alert('Could not save. ' + (e?.message || 'Please try again.')) }
  }
  async function remove(id) {
    try { await db.deleteCalendar(id); setItems(prev => prev.filter(x => x.id !== id)) } catch {}
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
                <button className="x" onClick={() => remove(it.id)}>×</button>
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
  useEffect(() => { db.listMaintenance().then(setItems).catch(() => {}) }, [])
  async function add() {
    if (!title.trim()) { alert('What is the issue?'); return }
    try {
      const row = await db.addMaintenance({ title, room, note })
      setItems(prev => [row, ...prev])
      setTitle(''); setNote('')
    } catch (e) { alert('Could not save. ' + (e?.message || 'Please try again.')) }
  }
  async function remove(id) {
    try { await db.deleteMaintenance(id); setItems(prev => prev.filter(x => x.id !== id)) } catch {}
  }
  async function setStatus(id, s) {
    try { const row = await db.updateMaintenance(id, { status: s }); setItems(prev => prev.map(m => m.id === id ? row : m)) } catch {}
  }
  async function draft(m) {
    setBusy(m.id)
    try {
      const msg = await callAPI(
        'You are a renter communication assistant. Write a short professional maintenance request to the landlord. Include a subject line. Under 120 words. Plain text, no markdown symbols.',
        `Issue in the ${m.room}: ${m.title}. ${m.note || ''}`)
      const newStatus = m.status === 'open' ? 'sent' : m.status
      const row = await db.updateMaintenance(m.id, { msg, status: newStatus })
      setItems(prev => prev.map(x => x.id === m.id ? row : x))
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
                <button className="x" onClick={() => remove(m.id)}>×</button>
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
  useEffect(() => { db.listRent().then(setItems).catch(() => {}) }, [])
  async function add() {
    if (!month || !amount) { alert('Add the month and amount.'); return }
    try {
      const row = await db.addRent({ month, amount, method })
      setItems(prev => [row, ...prev])
      setAmount('')
    } catch (e) { alert('Could not save. ' + (e?.message || 'Please try again.')) }
  }
  async function remove(id) {
    try { await db.deleteRent(id); setItems(prev => prev.filter(x => x.id !== id)) } catch {}
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
              <button className="x" onClick={() => remove(r.id)}>×</button>
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

/* ---------- Roommate agreement ---------- */
const RM_CLAUSES = [
  ['rent', 'Rent split', 'How is monthly rent divided? e.g. split evenly, or Alex $900 / Sam $750'],
  ['utilities', 'Utilities and bills', 'How are electric, water, internet, and other shared bills split?'],
  ['deposit', 'Security deposit', 'Who paid the deposit, and how is it returned when someone moves out?'],
  ['cleaning', 'Cleaning and chores', 'How are cleaning and shared chores handled? e.g. weekly rotation'],
  ['quiet', 'Quiet hours', 'Any quiet hours or noise expectations?'],
  ['guests', 'Guests and overnight visitors', 'Policy on guests and how long they can stay'],
  ['shared', 'Shared groceries and supplies', 'How are shared groceries, supplies, or furniture handled?'],
  ['pets', 'Pets', 'Any pet rules or responsibilities?'],
  ['notice', 'Moving out notice', 'How much notice before a roommate moves out? e.g. 30 days'],
  ['custom', 'Anything else', 'Other house rules you want in writing'],
]

const RM_BLANK = { address: '', startDate: '', roommates: [], terms: {}, generated: '', generatedAt: '', signatures: {} }

function RoommateAgreement({ go }) {
  const [data, setData] = useState(RM_BLANK)
  const [household, setHousehold] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    db.getRoommate().then(setData).catch(() => {})
    db.getHousehold().then(setHousehold).catch(() => {})
  }, [])
  function persist(n) { setData(n); db.saveRoommate(n).catch(() => {}) }
  function patch(p) { persist({ ...data, ...p }) }
  function setTerm(k, v) { persist({ ...data, terms: { ...data.terms, [k]: v } }) }
  const filled = RM_CLAUSES.filter(([k]) => (data.terms[k] || '').trim())
  const members = household?.members || []

  async function generate() {
    if (filled.length === 0) { alert('Fill in at least one section.'); return }
    setBusy(true)
    try {
      const lines = filled.map(([k, label]) => `${label}: ${data.terms[k].trim()}`).join('\n')
      const who = members.length ? members.map(m => m.name).join(', ') : 'the roommates'
      const text = await callAPI(
        'You are a roommate agreement assistant. Turn the provided points into a clear, fair, plain-English roommate living agreement. Organize it into numbered sections with short headings. Keep it balanced and neutral toward every roommate. Only use the terms provided, do not invent specifics that were not given. Open with the roommate names, the address, and the start date. End with a short line stating that each roommate should sign and date below to show they agree. Under 450 words. Plain text only, no markdown symbols, no asterisks.',
        `Roommates: ${who}\nAddress: ${data.address || 'not provided'}\nStart date: ${data.startDate || 'not provided'}\n\nAgreed points:\n${lines}`
      )
      // Re-generating invalidates prior signatures.
      persist({ ...data, generated: text, generatedAt: new Date().toISOString(), signatures: {} })
    } catch (e) { alert('Could not generate the agreement. Please try again.') }
    setBusy(false)
  }
  function signSelf() {
    const me = members.find(m => m.isYou)
    if (!me) return
    persist({ ...data, signatures: { ...data.signatures, [me.userId]: new Date().toISOString() } })
  }
  function unsignSelf() {
    const me = members.find(m => m.isYou)
    if (!me) return
    const s = { ...data.signatures }; delete s[me.userId]
    persist({ ...data, signatures: s })
  }

  return (
    <>
      <div className="c no-print">
        <h2>Roommate agreement</h2>
        <p className="d">Put your living arrangement in writing so everyone is on the same page from day one. Fill in what you have agreed on, and the AI turns it into a clean agreement. Everyone on the lease shares this agreement, and each roommate signs from their own account.</p>

        <span className="lab">Roommates on this lease</span>
        {members.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {members.map(m => (
              <span key={m.userId} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--mint-soft)', color: 'var(--brand)', fontWeight: 600, fontSize: 14, padding: '7px 12px', borderRadius: 999 }}>
                {m.name}{m.isYou ? ' (you)' : ''}
              </span>
            ))}
          </div>
        ) : (
          <p className="d" style={{ marginBottom: 10 }}>Loading roommates…</p>
        )}
        <p className="d" style={{ marginTop: 0, marginBottom: 16, fontSize: 13 }}>
          Roommates come from your shared lease. {go && <button className="lnk" onClick={() => go('household')} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline', fontSize: 13 }}>Invite roommates →</button>}
        </p>

        <div className="form-row">
          <div><span className="lab">Address (optional)</span><AddressAutocomplete className="inp" placeholder="123 Main St, Apt 4B" value={data.address} onChange={v => patch({ address: v })} /></div>
          <div><span className="lab">Start date (optional)</span><input className="inp" type="date" value={data.startDate} onChange={e => patch({ startDate: e.target.value })} /></div>
        </div>

        <span className="lab">What have you agreed on?</span>
        <p className="d" style={{ marginTop: 2, marginBottom: 12 }}>Fill in only the ones that apply. Leave the rest blank.</p>
        {RM_CLAUSES.map(([k, label, ph]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <span className="lab">{label}</span>
            <textarea className="ta2" style={{ minHeight: 54 }} placeholder={ph} value={data.terms[k] || ''} onChange={e => setTerm(k, e.target.value)} />
          </div>
        ))}

        <button className="bp" onClick={generate} disabled={busy}>{busy ? 'Writing your agreement...' : data.generated ? 'Regenerate agreement' : 'Generate agreement'}</button>
      </div>

      {data.generated && (
        <div className="c">
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ flex: 1, margin: 0 }}>Your agreement</h2>
            <button className="bg2" onClick={() => window.print()}>Print / Save PDF</button>
          </div>
          <div className="res">{data.generated}</div>

          <div style={{ marginTop: 18 }}>
            <span className="lab">Signatures</span>
            <p className="d no-print" style={{ marginTop: 2, marginBottom: 6 }}>Each roommate signs from their own account. Printing also leaves a line for a handwritten signature.</p>
            {members.map(m => {
              const signed = data.signatures[m.userId]
              return (
                <div key={m.userId} className="rm-sign">
                  <div className="rm-sign-name">{m.name}{m.isYou ? ' (you)' : ''}</div>
                  {signed
                    ? <div className="rm-sign-done">✓ Signed {new Date(signed).toLocaleDateString()} {m.isYou && <button className="no-print" onClick={unsignSelf} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>undo</button>}</div>
                    : m.isYou
                      ? <button className="bg2 no-print" style={{ padding: '6px 14px', fontSize: 13 }} onClick={signSelf}>Sign as {m.name}</button>
                      : <div className="rm-sign-done" style={{ color: 'var(--ink-soft)' }}>Awaiting signature</div>}
                  <div className="rm-sign-line" />
                </div>
              )
            })}
          </div>
          <p className="d no-print" style={{ marginTop: 14, fontSize: 12.5 }}>This is a shared record for everyone on the lease. It is not legal advice. For binding terms, check your lease and local law.</p>
        </div>
      )}
    </>
  )
}

/* ---------- Lease & roommates (shared household) ---------- */
function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('')
}

function Household() {
  const [hh, setHh] = useState(null)
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState('')

  async function reload() {
    try {
      const h = await db.getHousehold()
      setHh(h)
      setNameInput(h?.name || '')
    } catch (e) {
      console.error('getHousehold failed', e)
    }
    setLoading(false)
  }
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
    reload()
  }, [])

  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  const inviteLink = hh?.inviteCode ? `${base}/join?code=${hh.inviteCode}` : ''

  async function copyLink() {
    const text = inviteLink || hh?.inviteCode || ''
    if (!text) return
    try {
      await navigator.clipboard.writeText(inviteLink || hh.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }
  async function saveName() {
    if (!nameInput.trim() || nameInput.trim() === hh?.name) return
    setBusy('name')
    try { await db.renameHousehold(nameInput.trim()); await reload() } catch { alert('Could not rename.') }
    setBusy('')
  }
  async function regenerate() {
    if (!confirm('Generate a new invite link? The old link will stop working.')) return
    setBusy('regen')
    try {
      const code = await db.regenerateInvite()
      if (code) setHh((h) => (h ? { ...h, inviteCode: code } : h))
      await reload()
    } catch (e) { alert('Could not regenerate the link. ' + (e?.message || '')) }
    setBusy('')
  }
  async function join() {
    const code = joinCode.trim()
    if (!code) return
    setBusy('join')
    try {
      await db.joinHousehold(code)
      window.location.reload()
    } catch (e) { alert('Could not join: ' + (e?.message || 'invalid code')); setBusy('') }
  }
  async function leave() {
    if (!confirm('Leave this shared lease? You will start fresh with your own lease and stop seeing this household\'s data.')) return
    setBusy('leave')
    try { await db.leaveHousehold(); window.location.reload() } catch { alert('Could not leave.'); setBusy('') }
  }

  if (loading) return <div className="c"><p className="d">Loading your lease…</p></div>

  return (
    <>
      <div className="c">
        <h2>Your lease {hh?.isShared && <span className="up" style={{ background: 'var(--mint-soft)', color: 'var(--brand)' }}>Shared</span>}</h2>
        <p className="d">Everyone you invite here shares the same calendar, maintenance log, rent records, lease review, and roommate agreement. One lease, one source of truth.</p>

        <span className="lab">Lease name</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <input className="inp" style={{ flex: 1 }} value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="e.g. 123 Main St, Apt 4B" />
          <button className="bg2" onClick={saveName} disabled={busy === 'name' || !nameInput.trim() || nameInput.trim() === hh?.name}>{busy === 'name' ? 'Saving…' : 'Save'}</button>
        </div>

        <span className="lab">Roommates ({hh?.members?.length || 0})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, marginBottom: 4 }}>
          {(hh?.members || []).map(m => (
            <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mint-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, overflow: 'hidden', flexShrink: 0 }}>
                {m.avatar ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(m.name)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m.name}{m.isYou ? ' (you)' : ''}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{m.role === 'owner' ? 'Lease owner' : 'Roommate'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="c">
        <h2>Invite roommates</h2>
        <p className="d">Share this link with your roommates. They create a free account and instantly join this lease.</p>
        <span className="lab">Invite code</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="inp" style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.04em' }} readOnly value={hh?.inviteCode || ''} placeholder="Loading…" onFocus={e => e.target.select()} />
          <button className="bg2" style={{ padding: '0 14px' }} onClick={() => { if (hh?.inviteCode) { navigator.clipboard.writeText(hh.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1800) } }}>{copied ? '✓' : 'Copy code'}</button>
        </div>
        <span className="lab">Invite link</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="inp" style={{ flex: 1 }} readOnly value={inviteLink} placeholder={hh?.inviteCode ? 'Building link…' : 'No invite code yet'} onFocus={e => e.target.select()} />
          <button className="bp" style={{ padding: '0 18px' }} onClick={copyLink} disabled={!inviteLink}>{copied ? '✓ Copied' : 'Copy link'}</button>
        </div>
        <button className="bg2" onClick={regenerate} disabled={busy === 'regen'} style={{ fontSize: 13 }}>{busy === 'regen' ? 'Working…' : '↺ Generate a new link'}</button>
      </div>

      <div className="c">
        <h2>Join a roommate's lease</h2>
        <p className="d">Got an invite link or code from a roommate? Paste the code here to join their lease instead. You can be on one shared lease at a time.</p>
        <span className="lab">Invite code</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="inp" style={{ flex: 1 }} value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Paste invite code" />
          <button className="bp" onClick={join} disabled={busy === 'join' || !joinCode.trim()}>{busy === 'join' ? 'Joining…' : 'Join'}</button>
        </div>
        {hh?.isShared && (
          <button className="bg2" onClick={leave} disabled={busy === 'leave'} style={{ marginTop: 10, fontSize: 13, color: '#c0392b', borderColor: '#e6c3bf' }}>{busy === 'leave' ? 'Leaving…' : 'Leave this lease'}</button>
        )}
      </div>
    </>
  )
}

/* ---------- Documents ---------- */
const DOC_ICONS = { lease: '📄', photo: '📸', file: '📎' }

function Documents() {
  const [docs, setDocs] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  async function load() {
    try {
      const [d, r] = await Promise.all([db.listDocuments(), db.listMoveInReports()])
      setDocs(d); setReports(r)
    } catch (e) { console.error(e) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function onUpload(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    for (const f of files) {
      try {
        await db.uploadDocument(f, { name: f.name, kind: f.type === 'application/pdf' ? 'lease' : f.type.startsWith('image/') ? 'photo' : 'file' })
      } catch (err) { alert(`Could not upload ${f.name}: ${err.message}`) }
    }
    setUploading(false)
    load()
  }

  async function open(doc) {
    try {
      const url = await db.documentUrl(doc.storage_path)
      window.open(url, '_blank', 'noopener')
    } catch { alert('Could not open this document. Try again.') }
  }

  async function remove(doc) {
    if (!confirm(`Delete "${doc.name}"? This removes it for everyone on the lease.`)) return
    try { await db.deleteDocument(doc); setDocs(d => d.filter(x => x.id !== doc.id)) } catch (e) { alert(e.message) }
  }

  const fmtSize = (b) => !b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

  return (
    <div className="c">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Documents</h2>
        <button className="bg2" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : '+ Upload'}
        </button>
        <input ref={fileRef} type="file" multiple onChange={onUpload} style={{ display: 'none' }} />
      </div>
      <p className="d" style={{ marginTop: 6 }}>
        Everything uploaded here — and every lease PDF or move-in photo you add anywhere in the app — is saved
        and visible to everyone on your shared lease.
      </p>
      {loading ? (
        <p className="d">Loading…</p>
      ) : (docs.length === 0 && reports.length === 0) ? (
        <div className="empty"><div className="e-ic">📁</div>No documents yet. Upload a lease, receipts, or photos — or add them through Lease review and Move-in report.</div>
      ) : (
        <div>
          {reports.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Move-in report{r.unit_address ? ` — ${r.unit_address}` : ''}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  Locked {new Date(r.locked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {r.landlord_signed_at ? ` · ✍️ signed by ${r.landlord_name}` : ' · awaiting landlord signature'}
                </div>
              </div>
              <button className="bg2" onClick={() => window.open(`/sign/${r.token}`, '_blank', 'noopener')}>View</button>
            </div>
          ))}
          {docs.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
              <span style={{ fontSize: 20 }}>{DOC_ICONS[doc.kind] || '📎'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  {doc.context ? `${doc.context} · ` : ''}
                  {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {doc.size_bytes ? ` · ${fmtSize(doc.size_bytes)}` : ''}
                </div>
              </div>
              <button className="bg2" onClick={() => open(doc)}>View</button>
              <button onClick={() => remove(doc)} aria-label={`Delete ${doc.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 16 }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- App shell ---------- */
// Messages tab removed
// Grouped by how often renters reach for each tool: daily protection first,
// ongoing tracking second, household setup last.
const NAV_GROUPS = [
  ['', [
    ['home', 'Dashboard', '◫'],
  ]],
  ['Protect', [
    ['lease', 'Lease review', '📄'],
    ['movein', 'Move-in report', '📸'],
    ['documents', 'Documents', '📁'],
  ]],
  ['Track', [
    ['calendar', 'Key dates', '📅'],
    ['maint', 'Maintenance', '🔧'],
    ['rent', 'Rent log', '💵'],
  ]],
  ['Household', [
    ['household', 'Lease & roommates', '🏠'],
    ['roommates', 'Roommate agreement', '🤝'],
  ]],
]
const NAV = NAV_GROUPS.flatMap(([, items]) => items)
const TITLES = {
  home: 'Dashboard',
  household: 'Lease & roommates',
  lease: 'Lease review',
  movein: 'Move-in report',
  roommates: 'Roommate agreement',
  calendar: 'Key dates',
  maint: 'Maintenance tracker',
  rent: 'Rent log',
  documents: 'Documents',
}

export default function App() {
  const router = useRouter()
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useState(null)
  const [quizDone, setQuizDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const forceSetup = typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('setup') === 'true'
      try {
        await db.activeHouseholdId()
        const p = await db.getProfile()
        setProfile(p)
        setQuizDone(!forceSetup && db.quizComplete(p))
      } catch (e) {
        console.error('Failed to load profile', e)
      }
      setLoading(false)
    })()
  }, [])

  async function handleQuizComplete(answers) {
    try {
      await db.saveQuizAnswers(answers)
      const p = await db.getProfile()
      setProfile(p)
      setQuizDone(true)
      setTab('movein')
    } catch (e) {
      console.error('Failed to save setup', e)
      alert('Could not save your setup. Please try again.')
    }
  }

  async function handleSignOut() {
    try { await db.signOut() } catch {}
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)', fontSize: 15 }}>
        <style>{`@keyframes ll-spin{to{transform:rotate(360deg)}}`}</style>
        Loading your dashboard…
      </div>
    )
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
        <Link href="/" className="ax-brand"><Logo size={30} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span></Link>
        <nav className="ax-nav">
          {NAV_GROUPS.map(([group, items]) => (
            <div key={group || 'main'}>
              {group && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '14px 12px 6px' }}>{group}</div>}
              {items.map(([k, l, i]) => <button key={k} className={`ax-link ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}><span className="ico">{i}</span>{l}</button>)}
            </div>
          ))}
        </nav>
        <div className="foot">
          <button
            onClick={() => { setQuizDone(false) }}
            style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'block' }}
          >
            ↺ Redo setup
          </button>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'block' }}
          >
            ⇥ Sign out
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
          {tab === 'household' && <Household />}
          {tab === 'lease' && <LeaseReview profile={profile} />}
          {tab === 'movein' && <MoveInLauncher />}
          {tab === 'roommates' && <RoommateAgreement go={setTab} />}
          {tab === 'calendar' && <Calendar />}
          {tab === 'maint' && <Maintenance />}
          {tab === 'rent' && <RentLog />}
          {tab === 'documents' && <Documents />}
        </div>
      </main>
    </div>
  )
}
