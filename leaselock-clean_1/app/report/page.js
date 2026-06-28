'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import AddressAutocomplete from '../components/AddressAutocomplete'
import Logo from '../components/Logo'
import { profileToReadable } from '../lib/quiz'

async function callAPI(system, user, images) {
  const res = await fetch('/api/claude', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, images }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'API error')
  return data.text
}

function downscale(file, max = 1100) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target.result
    }
    r.readAsDataURL(file)
  })
}

const ROOMS = [
  { name: 'Entry & hallway', emoji: '🚪', prompts: ['Front door and locks', 'Walls and ceiling', 'Flooring', 'Light switches and outlets'] },
  { name: 'Living room', emoji: '🛋️', prompts: ['Walls and ceiling', 'Flooring / carpet', 'Windows and blinds', 'Electrical outlets', 'Light fixtures'] },
  { name: 'Kitchen', emoji: '🍳', prompts: ['Countertops and cabinets', 'Appliances (stove, fridge, dishwasher)', 'Sink and faucet', 'Flooring', 'Walls and ceiling'] },
  { name: 'Bedroom', emoji: '🛏️', prompts: ['Walls and ceiling', 'Flooring / carpet', 'Closet and doors', 'Windows and blinds', 'Electrical outlets'] },
  { name: 'Bathroom', emoji: '🚿', prompts: ['Toilet and flush mechanism', 'Tub / shower and grout', 'Sink and vanity', 'Mirror and fixtures', 'Tiles and caulking', 'Ventilation fan'] },
  { name: 'Laundry area', emoji: '🫧', prompts: ['Washer / dryer or hookups', 'Flooring', 'Venting and connections'] },
  { name: 'Outdoor / patio', emoji: '🌿', prompts: ['Deck or patio surface', 'Fencing or railings', 'Exterior doors and locks'] },
  { name: 'Other / storage', emoji: '📦', prompts: ['Walls and flooring', 'Shelving', 'Doors and locks'] },
]

const ISSUE_TYPES = ['Damage', 'Stain', 'Crack', 'Missing item', 'Not working', 'Loose or broken', 'Wear and tear', 'Water damage', 'Mold or mildew', 'Pest evidence', 'Dirty / not cleaned', 'Other']

const LOADER_MSGS = [
  'Peeking behind the fridge',
  'Counting every scuff and scratch',
  'Inspecting the grout situation',
  'Hunting for sneaky stains',
  'Checking if that outlet actually works',
  'Reading the walls like a detective',
  'Building your deposit force field',
  'Making the landlord a little nervous',
]
function GeneratingLoader() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % LOADER_MSGS.length), 1500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="gen-wrap">
      <div className="gen-scene">
        <Logo size={96} className="gen-house" />
        <span className="gen-glass">🔍</span>
      </div>
      <h2 className="gen-title">Writing your report</h2>
      <p className="gen-msg" key={i}>{LOADER_MSGS[i]}…</p>
      <div className="gen-dots"><span /><span /><span /></div>
    </div>
  )
}

export default function Report() {
  const [step, setStep] = useState('rooms') // rooms | room-detail | review | generating | locked
  const [roomIdx, setRoomIdx] = useState(0)
  const [roomData, setRoomData] = useState({})
  const [tenantName, setTenantName] = useState('')
  const [unitAddress, setUnitAddress] = useState('')
  const [reportText, setReportText] = useState('')
  const [editingReport, setEditingReport] = useState(false)
  const [lockTs, setLockTs] = useState('')
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    try { const v = localStorage.getItem('rr_profile'); if (v) setProfile(JSON.parse(v)) } catch {}
  }, [])
  const profileRows = profileToReadable(profile)
  const fileRef = useRef()
  const noteRef = useRef()

  const [selected, setSelected] = useState(ROOMS.map(r => r.name))
  const [customRooms, setCustomRooms] = useState([])
  const [newRoom, setNewRoom] = useState('')
  const allRooms = [...ROOMS, ...customRooms]
  const activeRooms = allRooms.filter(r => selected.includes(r.name))
  function toggleSelect(name) { setSelected(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]) }
  function addCustomRoom() {
    const name = newRoom.trim()
    if (!name) return
    if (allRooms.some(r => r.name.toLowerCase() === name.toLowerCase())) { setNewRoom(''); return }
    setCustomRooms(c => [...c, { name, emoji: '📍', prompts: ['Walls and ceiling', 'Flooring', 'Windows and doors', 'Fixtures and outlets'], custom: true }])
    setSelected(s => [...s, name])
    setNewRoom('')
  }
  function removeCustomRoom(name) {
    setCustomRooms(c => c.filter(r => r.name !== name))
    setSelected(s => s.filter(x => x !== name))
  }
  function addAnother(base) {
    const tmpl = ROOMS.find(r => r.name === base) || { emoji: '📍', prompts: ['Walls and ceiling', 'Flooring', 'Windows and doors', 'Fixtures and outlets'] }
    const count = allRooms.filter(r => r.name === base || r.name.startsWith(base + ' ')).length
    const name = count === 0 ? base : `${base} ${count + 1}`
    if (allRooms.some(r => r.name === name)) return
    setCustomRooms(c => [...c, { name, emoji: tmpl.emoji, prompts: tmpl.prompts, custom: true }])
    setSelected(s => [...s, name])
  }
  const room = activeRooms[roomIdx]
  const current = roomData[room?.name] || { photos: [], issues: [], allGood: false, note: '' }
  const condGood = current.allGood === true || current.cond === 'good'
  const condIssues = current.cond === 'issues' || (!current.allGood && (current.issues?.length > 0))

  function updateRoom(patch) {
    setRoomData(d => ({ ...d, [room.name]: { ...current, ...patch } }))
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []).slice(0, 8)
    const scaled = await Promise.all(files.map(f => downscale(f)))
    updateRoom({ photos: [...current.photos, ...scaled].slice(0, 8) })
    e.target.value = ''
  }

  function removePhoto(i) {
    updateRoom({ photos: current.photos.filter((_, j) => j !== i) })
  }

  function removePhotoFromRoom(roomName, i) {
    setRoomData(d => {
      const rd = d[roomName]
      if (!rd) return d
      return { ...d, [roomName]: { ...rd, photos: rd.photos.filter((_, j) => j !== i) } }
    })
  }

  function toggleIssue(type) {
    const turningOn = !current.issues.includes(type)
    const issues = turningOn ? [...current.issues, type] : current.issues.filter(x => x !== type)
    updateRoom({ issues, allGood: false, cond: 'issues' })
    if (type === 'Other' && turningOn) {
      setTimeout(() => {
        noteRef.current?.focus()
        noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 60)
    }
  }

  function markAllGood() { updateRoom({ allGood: true, issues: [] }) }

  function nextRoom() {
    if (roomIdx < activeRooms.length - 1) { setRoomIdx(i => i + 1) }
    else { setStep('review') }
  }
  function skipRoom() {
    if (roomIdx < activeRooms.length - 1) setRoomIdx(i => i + 1)
    else setStep('review')
  }
  function prevRoom() {
    if (roomIdx > 0) setRoomIdx(i => i - 1)
    else setStep('rooms')
  }

  function totalPhotos() { return Object.values(roomData).reduce((n, r) => n + r.photos.length, 0) }

  async function generate() {
    setStep('generating')
    const log = activeRooms.map(r => {
      const d = roomData[r.name]
      if (!d) return null
      const status = d.allGood ? 'Good — no issues noted' : (d.issues.length ? `Issues: ${d.issues.join(', ')}` : 'Reviewed')
      return `${r.name}: ${status}. Notes: ${d.note || 'none'}. Photos: ${d.photos.length}.`
    }).filter(Boolean).join('\n')
    const allPhotos = Object.values(roomData).flatMap(r => r.photos)
    try {
      const out = await callAPI(
        'You are a renter protection assistant. Review the move-in photos and produce a professional, factual move-in condition report organized by room. Be specific about any damage, stains, or issues visible in the photos. Under 350 words. Plain text, no markdown.',
        `Unit: ${unitAddress || 'Not provided'}\nTenant: ${tenantName || 'Not provided'}`
        + (profileRows.length ? `\n\nTenant intake:\n${profileRows.map(r => `- ${r.question} ${r.answer}`).join('\n')}` : '')
        + `\n\nRoom-by-room log:\n${log}\n\nReview photos and write the report:`,
        allPhotos
      )
      setReportText(out)
      setLockTs(new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }))
      setStep('locked')
    } catch {
      setReportText('Something went wrong. Please try again.')
      setStep('review')
    }
  }

  const pct = roomIdx / activeRooms.length * 100

  if (step === 'rooms') return (
    <div className="wz">
      <div className="wz-top">
        <div className="wz-top-row">
          <Link href="/" className="brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={28} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
          </Link>
          <span className="pct">Move-in inspection</span>
        </div>
      </div>
      <div className="wz-body">
        <div className="wz-step-label">STEP 1 — SETUP</div>
        <h1 className="wz-h">Let's document your unit.</h1>
        <p className="wz-p">We'll go room by room. Take photos, note any existing issues, and our AI writes the condition report. Takes about 5 minutes.</p>
        <div className="wz-field">
          <label>Unit address</label>
          <AddressAutocomplete value={unitAddress} onChange={setUnitAddress} placeholder="123 Main St, Apt 4B" />
        </div>
        <div className="wz-field">
          <label>Your name</label>
          <input className="wz-input" placeholder="First and last name" value={tenantName} onChange={e => setTenantName(e.target.value)} />
        </div>
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600 }}>Rooms to inspect</h3>
            <button onClick={() => setSelected(selected.length === allRooms.length ? [] : allRooms.map(r => r.name))} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              {selected.length === allRooms.length ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>Tap to choose which rooms to document. {selected.length} selected.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10 }}>
            {allRooms.map((r) => {
              const on = selected.includes(r.name)
              const done = roomData[r.name]
              return (
                <div key={r.name} onClick={() => toggleSelect(r.name)} style={{ position: 'relative', background: on ? 'var(--mint-soft)' : 'var(--paper)', border: `1.5px solid ${on ? 'var(--brand)' : 'var(--line-strong)'}`, borderRadius: 14, padding: '16px 14px', cursor: 'pointer', textAlign: 'center', opacity: on ? 1 : 0.5, transition: 'opacity .12s, border-color .12s' }}>
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 5, background: on ? 'var(--brand)' : 'transparent', border: `1.5px solid ${on ? 'var(--brand)' : 'var(--line-strong)'}`, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, lineHeight: 1 }}>{on ? '✓' : ''}</div>
                  {r.custom && <button onClick={(e) => { e.stopPropagation(); removeCustomRoom(r.name) }} style={{ position: 'absolute', top: 4, left: 7, background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 17, lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>}
                  <div style={{ fontSize: 24 }}>{r.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 5, color: on ? 'var(--brand)' : 'var(--ink)' }}>{r.name}</div>
                  {done && <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 3 }}>✓ {done.photos.length} photo{done.photos.length !== 1 ? 's' : ''}</div>}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>More of a room? Add another:</span>
            <div className="wz-chips">
              {['Bedroom', 'Bathroom', 'Living room', 'Other / storage'].map(b => (
                <button key={b} className="wz-chip" onClick={() => addAnother(b)}>+ {b}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input className="wz-input" style={{ flex: 1 }} placeholder="Or name a custom room (e.g. Garage, Office)" value={newRoom} onChange={e => setNewRoom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomRoom() } }} />
            <button onClick={addCustomRoom} disabled={!newRoom.trim()} style={{ padding: '0 20px', borderRadius: 13, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-body)', cursor: newRoom.trim() ? 'pointer' : 'default', opacity: newRoom.trim() ? 1 : 0.45 }}>Add</button>
          </div>
        </div>
      </div>
      <div className="wz-nav">
        <div className="wz-nav-row">
          <button className="wz-next" onClick={() => { setRoomIdx(0); setStep('room-detail') }} disabled={(!unitAddress && !tenantName) || selected.length === 0}>
            Start inspection →
          </button>
        </div>
      </div>
    </div>
  )

  if (step === 'room-detail') return (
    <div className="wz">
      <div className="wz-top">
        <div className="wz-top-row">
          <Link href="/" className="brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={28} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
          </Link>
          <span className="pct">{roomIdx + 1} of {activeRooms.length}</span>
        </div>
        <div className="wz-prog"><div className="fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="wz-body">
        <div className="wz-room-emoji">{room.emoji}</div>
        <div className="wz-step-label">ROOM {roomIdx + 1} OF {activeRooms.length}</div>
        <h1 className="wz-h">{room.name}</h1>
        <p className="wz-p">Photograph the spots that matter most, then note any existing issues.</p>

        <div className="wz-field">
          <label>Photos</label>
          <div style={{ background: 'var(--paper)', border: '1.5px dashed var(--line-strong)', borderRadius: 14, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 10 }} onClick={() => fileRef.current?.click()}>
            <div style={{ fontSize: 26 }}>📸</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Tap to add photos</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>Focus on: {room.prompts.slice(0, 3).join(' · ')}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
          {current.photos.length > 0 && (
            <div className="wz-thumbs">
              {current.photos.map((p, i) => (
                <div key={i} className="wz-thumb">
                  <img src={p} alt="" />
                  <button className="rm" onClick={() => removePhoto(i)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="wz-field">
          <label>Condition</label>
          <div className="cond-toggle">
            <button type="button" className={`cond-seg good ${condGood ? 'on' : ''}`} onClick={() => updateRoom({ cond: 'good', allGood: true, issues: [] })}>
              <span className="cond-ico">✓</span> Looks good
            </button>
            <button type="button" className={`cond-seg issues ${condIssues ? 'on' : ''}`} onClick={() => updateRoom({ cond: 'issues', allGood: false })}>
              <span className="cond-ico">!</span> Has issues
            </button>
          </div>
          {condIssues && (
            <div className="cond-issues">
              <div className="cond-issues-label">What's the issue? Tap all that apply.</div>
              <div className="wz-chips">
                {ISSUE_TYPES.map(t => (
                  <button key={t} className={`wz-chip ${current.issues.includes(t) ? 'on' : ''}`} onClick={() => toggleIssue(t)}>{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="wz-field">
          <label>{current.issues?.includes('Other') ? 'Describe the issue' : 'Notes (optional)'}</label>
          <textarea ref={noteRef} className="wz-note" placeholder="Describe anything specific, like a scuff on the north wall, a stain near the window, or a cracked tile." value={current.note} onChange={e => updateRoom({ note: e.target.value })} />
        </div>
      </div>

      <div className="wz-nav">
        <div className="wz-nav-row">
          <button className="wz-back" onClick={prevRoom}>Back</button>
          <button className="wz-next" onClick={nextRoom}>
            {roomIdx < activeRooms.length - 1 ? `Next: ${activeRooms[roomIdx + 1].name} →` : 'Review report →'}
          </button>
        </div>
        <button className="wz-skip" onClick={skipRoom}>
          Skip this room {roomIdx < activeRooms.length - 1 ? '→' : ''}
        </button>
      </div>
    </div>
  )

  if (step === 'review') return (
    <div className="wz">
      <div className="wz-top">
        <div className="wz-top-row">
          <Link href="/" className="brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={28} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
          </Link>
          <span className="pct">Review</span>
        </div>
        <div className="wz-prog"><div className="fill" style={{ width: '95%' }} /></div>
      </div>
      <div className="wz-body">
        <div className="wz-step-label">ALMOST DONE</div>
        <h1 className="wz-h">Review and lock your report.</h1>
        <p className="wz-p">{Object.keys(roomData).length} rooms documented · {totalPhotos()} photos · AI will generate the condition notes.</p>

        {unitAddress && <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 6 }}>📍 {unitAddress}</div>}
        {tenantName && <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20 }}>👤 {tenantName}</div>}

        {activeRooms.map(r => {
          const d = roomData[r.name]
          if (!d) return null
          return (
            <div key={r.name} className="wz-rev">
              <div className="rh">
                <span style={{ fontSize: 18 }}>{r.emoji}</span>
                <b>{r.name}</b>
                <span className="ri">{d.photos.length} photo{d.photos.length !== 1 ? 's' : ''}</span>
              </div>
              {d.allGood && <div className="ri" style={{ color: 'var(--brand)', fontWeight: 600 }}>✓ All good</div>}
              {d.issues.length > 0 && <div className="ri issues">{d.issues.join(', ')}</div>}
              {d.note && <div className="ri" style={{ marginTop: 4 }}>{d.note}</div>}
              {d.photos.length > 0 && (
                <div className="wz-mini-thumbs">
                  {d.photos.map((p, i) => (
                    <div key={i} className="wz-mini-thumb">
                      <img src={p} alt="" />
                      <button className="rm-mini" onClick={() => removePhotoFromRoom(r.name, i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="wz-nav">
        <div className="wz-nav-row">
          <button className="wz-back" onClick={() => { setRoomIdx(activeRooms.length - 1); setStep('room-detail') }}>Back</button>
          <button className="wz-next" onClick={generate}>Generate & lock report →</button>
        </div>
      </div>
    </div>
  )

  if (step === 'generating') return (
    <div className="wz" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <GeneratingLoader />
    </div>
  )

  if (step === 'locked') return (
    <div className="wz">
      <div className="wz-top">
        <div className="wz-top-row">
          <Link href="/" className="brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={28} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span>
          </Link>
        </div>
      </div>
      <div className="wz-body print-area">
        <div className="wz-locked">
          <div className="wz-seal">🔒</div>
          <h1 className="wz-locked">Move-in report locked</h1>
          <p className="sub">Timestamped and complete. Save or print this page — it is your proof.</p>

          <div className="wz-receipt">
            {unitAddress && <div className="row"><span className="k">Unit</span><span className="v">{unitAddress}</span></div>}
            {tenantName && <div className="row"><span className="k">Tenant</span><span className="v">{tenantName}</span></div>}
            <div className="row"><span className="k">Rooms documented</span><span className="v">{Object.keys(roomData).length}</span></div>
            <div className="row"><span className="k">Photos taken</span><span className="v">{totalPhotos()}</span></div>
            <div className="row"><span className="k">Locked</span><span className="v">🔒 {lockTs}</span></div>
          </div>

          <div className="report-doc">
            <div className="report-doc-head">
              <h3>AI condition report</h3>
              <button className="report-edit-btn no-print" onClick={() => setEditingReport(v => !v)}>{editingReport ? '✓ Done' : '✎ Edit'}</button>
            </div>
            {editingReport && <p className="report-edit-hint no-print">Fix anything the AI got wrong. Your edits are saved into the report.</p>}
            {editingReport
              ? <textarea className="report-edit-ta" value={reportText} onChange={e => setReportText(e.target.value)} />
              : <div className="body">{reportText}</div>}
          </div>

          {profileRows.length > 0 && (
            <div className="report-profile">
              <h3>Tenant setup</h3>
              <p className="rp-sub">Intake answers recorded with this report.</p>
              <div className="tp-grid">
                {profileRows.map(r => (
                  <div className="tp-row" key={r.id}>
                    <span className="tp-q">{r.question}</span>
                    <span className="tp-a">{r.answer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalPhotos() > 0 && (
            <div className="report-photos">
              <h3>Photo record</h3>
              <p className="rp-sub">Every photo captured during this inspection, locked at {lockTs}.</p>
              {activeRooms.map(r => {
                const d = roomData[r.name]
                if (!d || d.photos.length === 0) return null
                return (
                  <div className="rp-room" key={r.name}>
                    <div className="rp-head">
                      <span>{r.emoji}</span><b>{r.name}</b>
                      <span className="ct">{d.photos.length} photo{d.photos.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="rp-grid">
                      {d.photos.map((p, j) => (
                        <figure key={j}>
                          <img src={p} alt={`${r.name} photo ${j + 1}`} />
                          <figcaption>{r.name} · Photo {j + 1}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }} className="no-print">
            <button className="bp" onClick={() => { setEditingReport(false); setTimeout(() => window.print(), 60) }}>Print / save as PDF</button>
            <Link href="/app" className="bg2" style={{ padding: '12px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 600, color: 'var(--brand)', border: '1.5px solid var(--line-strong)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Go to my dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  )

  return null
}
