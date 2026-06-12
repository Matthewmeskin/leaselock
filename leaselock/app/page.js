'use client'
import { useState } from 'react'

const NAVY = '#1a3c5e'
const NAVY_DARK = '#153050'

const styles = {
  app: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' },
  topbar: {
    background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1rem', height: 56
  },
  logo: { fontSize: 18, fontWeight: 600, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 30, height: 30, background: NAVY, borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15
  },
  tagline: { fontSize: 13, color: '#6b7280', marginLeft: 'auto' },
  nav: {
    background: '#fff', borderBottom: '1px solid #e5e7eb',
    display: 'flex', padding: '0 1.5rem', gap: 0
  },
  content: { flex: 1, padding: '1.5rem', maxWidth: 740, margin: '0 auto', width: '100%' },
  card: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '1.25rem', marginBottom: '1rem'
  },
  h2: { fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6b7280', marginBottom: '1rem' },
  label: { fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' },
  textarea: {
    width: '100%', minHeight: 130, resize: 'vertical', border: '1px solid #e5e7eb',
    borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
    background: '#f9fafb', color: '#111', outline: 'none', boxSizing: 'border-box'
  },
  input: {
    width: '100%', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, fontFamily: 'inherit',
    background: '#f9fafb', color: '#111', outline: 'none', boxSizing: 'border-box', marginBottom: 12
  },
  btnPrimary: {
    background: NAVY, color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
  },
  btnSecondary: {
    background: '#fff', color: NAVY, border: `1px solid ${NAVY}`, borderRadius: 8,
    padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
  },
  resultBox: {
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '1rem', marginTop: '1rem', fontSize: 14, color: '#111',
    lineHeight: 1.7, whiteSpace: 'pre-wrap', minHeight: 80
  },
  chip: {
    padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb',
    background: '#f9fafb', fontSize: 13, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit'
  },
  chipActive: {
    padding: '6px 14px', borderRadius: 20, border: `1px solid ${NAVY}`,
    background: '#eef2f7', fontSize: 13, cursor: 'pointer', color: NAVY, fontWeight: 500, fontFamily: 'inherit'
  },
  roomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: '1rem' },
  roomCard: {
    border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 6px',
    background: '#f9fafb', cursor: 'pointer', textAlign: 'center'
  },
  roomCardActive: {
    border: `1px solid ${NAVY}`, borderRadius: 8, padding: '10px 6px',
    background: '#eef2f7', cursor: 'pointer', textAlign: 'center'
  },
  condRow: { display: 'flex', gap: 8, marginBottom: '1rem' },
  badge: (cond) => {
    const map = { good: { bg: '#ecfdf5', color: '#059669' }, fair: { bg: '#fffbeb', color: '#d97706' }, poor: { bg: '#fef2f2', color: '#dc2626' } }
    const s = map[cond] || { bg: '#f3f4f6', color: '#6b7280' }
    return { fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: s.bg, color: s.color }
  },
  entryRow: {
    border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px',
    marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13
  }
}

async function callAPI(system, user) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'API error')
  return data.text
}

function NavBtn({ id, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '0 1rem', height: 44, border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 14, color: active ? NAVY : '#6b7280', fontFamily: 'inherit',
      borderBottom: active ? `2px solid ${NAVY}` : '2px solid transparent',
      fontWeight: active ? 600 : 400
    }}>
      {label}
    </button>
  )
}

function LeaseReview() {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function analyze() {
    if (!text.trim()) return
    setLoading(true)
    setResult('Reviewing your lease...')
    try {
      const out = await callAPI(
        'You are a renter protection assistant. Analyze lease text and respond in plain English with these sections: SUMMARY (2-3 sentences), KEY DATES & FEES (bullet list), RISK FLAGS (bullet list of concerning clauses), QUESTIONS TO ASK (bullet list). Be concise and practical. Plain text only, no markdown symbols.',
        'Please analyze this lease:\n\n' + text
      )
      setResult(out)
    } catch {
      setResult('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <div style={styles.card}>
        <h2 style={styles.h2}>AI lease risk review</h2>
        <p style={styles.sub}>Paste your lease text below. We will flag risky clauses, summarize key terms, and tell you what to ask before signing.</p>
        <textarea
          style={styles.textarea}
          placeholder="Paste lease text here..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div style={{ marginTop: 10 }}>
          <button style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={analyze} disabled={loading}>
            {loading ? 'Analyzing...' : '🔍 Analyze lease'}
          </button>
        </div>
      </div>
      {result && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Lease analysis</h2>
          <div style={styles.resultBox}>{result}</div>
        </div>
      )}
    </>
  )
}

const ROOMS = [
  { name: 'Living room', icon: '🛋️' }, { name: 'Kitchen', icon: '🍳' },
  { name: 'Bedroom', icon: '🛏️' }, { name: 'Bathroom', icon: '🚿' },
  { name: 'Entryway', icon: '🚪' }, { name: 'Balcony', icon: '🌿' }
]

function MoveInReport() {
  const [room, setRoom] = useState('Living room')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState([])
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)

  function addEntry() {
    if (!condition) { alert('Please select a condition.'); return }
    setEntries(prev => [...prev, { room, condition, notes: notes || 'No damage noted.' }])
    setNotes('')
    setCondition('')
  }

  async function generateReport() {
    setLoading(true)
    setReport('Generating report summary...')
    const summary = entries.map(e => `${e.room}: ${e.condition} condition. Notes: ${e.notes}`).join('\n')
    try {
      const out = await callAPI(
        'You are a renter protection assistant. Write a professional move-in condition summary a renter can share with their landlord. Keep it factual, organized, and under 200 words. Plain text only.',
        'Generate a move-in condition report based on this log:\n\n' + summary
      )
      setReport(out)
    } catch {
      setReport('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const condBtnStyle = (val) => ({
    flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    border: condition === val
      ? val === 'good' ? '1px solid #059669' : val === 'fair' ? '1px solid #d97706' : '1px solid #dc2626'
      : '1px solid #e5e7eb',
    background: condition === val
      ? val === 'good' ? '#ecfdf5' : val === 'fair' ? '#fffbeb' : '#fef2f2'
      : '#f9fafb',
    color: condition === val
      ? val === 'good' ? '#059669' : val === 'fair' ? '#d97706' : '#dc2626'
      : '#6b7280',
    fontWeight: condition === val ? 600 : 400
  })

  return (
    <>
      <div style={styles.card}>
        <h2 style={styles.h2}>Move-in condition report</h2>
        <p style={styles.sub}>Document each room before you move in. This creates your paper trail.</p>
        <span style={styles.label}>Select room</span>
        <div style={styles.roomGrid}>
          {ROOMS.map(r => (
            <div key={r.name} style={room === r.name ? styles.roomCardActive : styles.roomCard} onClick={() => setRoom(r.name)}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontSize: 13, color: room === r.name ? NAVY : '#6b7280', fontWeight: room === r.name ? 600 : 400 }}>{r.name}</div>
            </div>
          ))}
        </div>
        <span style={styles.label}>Overall condition</span>
        <div style={styles.condRow}>
          <button style={condBtnStyle('good')} onClick={() => setCondition('good')}>✓ Good</button>
          <button style={condBtnStyle('fair')} onClick={() => setCondition('fair')}>⚠ Fair</button>
          <button style={condBtnStyle('poor')} onClick={() => setCondition('poor')}>✕ Poor</button>
        </div>
        <span style={styles.label}>Damage notes</span>
        <textarea
          style={{ ...styles.textarea, minHeight: 80, marginBottom: 10 }}
          placeholder="Describe any existing damage, stains, scuffs, broken fixtures..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <button style={styles.btnPrimary} onClick={addEntry}>+ Add to report</button>
      </div>

      {entries.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Condition log</h2>
          <p style={styles.sub}>{entries.length} room{entries.length > 1 ? 's' : ''} documented</p>
          {entries.map((e, i) => (
            <div key={i} style={styles.entryRow}>
              <span style={{ flex: 1, fontWeight: 600, color: '#111' }}>{e.room}</span>
              <span style={styles.badge(e.condition)}>{e.condition.charAt(0).toUpperCase() + e.condition.slice(1)}</span>
              <span style={{ color: '#6b7280', flex: 2, marginLeft: 8 }}>{e.notes}</span>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <button style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : '📋 Generate AI summary'}
            </button>
          </div>
          {report && <div style={styles.resultBox}>{report}</div>}
        </div>
      )}
    </>
  )
}

const MSG_TYPES = [
  'Report existing damage', 'Request a repair', 'Ask about lease terms',
  'Request deposit return', 'Dispute a charge', 'Follow up on maintenance'
]

function LandlordMessage() {
  const [msgType, setMsgType] = useState('Report existing damage')
  const [context, setContext] = useState('')
  const [landlord, setLandlord] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!context.trim()) { alert('Please describe your situation first.'); return }
    setLoading(true)
    setResult('Drafting your message...')
    try {
      const out = await callAPI(
        'You are a renter communication assistant. Write professional, polite, and clear landlord messages that protect the renter. Keep messages under 150 words. Plain text only. Include a subject line at the top.',
        `Write a message to ${landlord || 'my landlord'} to ${msgType.toLowerCase()}.\n\nContext: ${context}`
      )
      setResult(out)
    } catch {
      setResult('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  function copy() {
    navigator.clipboard.writeText(result).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div style={styles.card}>
        <h2 style={styles.h2}>Landlord message generator</h2>
        <p style={styles.sub}>Choose your situation and describe what happened. We will draft a professional message you can send.</p>
        <span style={styles.label}>Message type</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
          {MSG_TYPES.map(t => (
            <button key={t} style={msgType === t ? styles.chipActive : styles.chip} onClick={() => setMsgType(t)}>{t}</button>
          ))}
        </div>
        <span style={styles.label}>Describe the situation</span>
        <textarea
          style={{ ...styles.textarea, minHeight: 100, marginBottom: 10 }}
          placeholder="Describe what happened or what you need to communicate..."
          value={context}
          onChange={e => setContext(e.target.value)}
        />
        <label style={{ ...styles.label, marginBottom: 6 }}>Landlord name (optional)</label>
        <input style={styles.input} placeholder="e.g. Mr. Johnson" value={landlord} onChange={e => setLandlord(e.target.value)} />
        <button style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={generate} disabled={loading}>
          {loading ? 'Drafting...' : '✉ Draft message'}
        </button>
      </div>
      {result && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Your message</h2>
          <div style={styles.resultBox}>{result}</div>
          <div style={{ marginTop: 10 }}>
            <button style={styles.btnSecondary} onClick={copy}>
              {copied ? '✓ Copied' : '⎘ Copy message'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Home() {
  const [tab, setTab] = useState('lease')

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🔒</div>
          LeaseLock
        </div>
        <span style={styles.tagline}>Sign smarter. Move in protected.</span>
      </div>
      <div style={styles.nav}>
        <NavBtn label="🔍 Lease review" active={tab === 'lease'} onClick={() => setTab('lease')} />
        <NavBtn label="📸 Move-in report" active={tab === 'movein'} onClick={() => setTab('movein')} />
        <NavBtn label="✉ Landlord message" active={tab === 'message'} onClick={() => setTab('message')} />
      </div>
      <div style={styles.content}>
        {tab === 'lease' && <LeaseReview />}
        {tab === 'movein' && <MoveInReport />}
        {tab === 'message' && <LandlordMessage />}
      </div>
    </div>
  )
}
