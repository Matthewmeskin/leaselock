'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import AddressAutocomplete from '../components/AddressAutocomplete'

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

const ISSUE_TYPES = ['Damage', 'Stain', 'Crack', 'Missing item', 'Not working', 'Wear and tear', 'Other']

export default function Report() {
  const [step, setStep] = useState('rooms') // rooms | room-detail | review | generating | locked
  const [roomIdx, setRoomIdx] = useState(0)
  const [roomData, setRoomData] = useState({})
  const [tenantName, setTenantName] = useState('')
  const [unitAddress, setUnitAddress] = useState('')
  const [reportText, setReportText] = useState('')
  const [lockTs, setLockTs] = useState('')
  const fileRef = useRef()

  const [selected, setSelected] = useState(ROOMS.map(r => r.name))
  const activeRooms = ROOMS.filter(r => selected.includes(r.name))
  function toggleSelect(name) { setSelected(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]) }
  const room = activeRooms[roomIdx]
  const current = roomData[room?.name] || { photos: [], issues: [], allGood: false, note: '' }

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

  function toggleIssue(type) {
    const issues = current.issues.includes(type) ? current.issues.filter(x => x !== type) : [...current.issues, type]
    updateRoom({ issues, allGood: false })
  }

  function markAllGood() { updateRoom({ allGood: true, issues: [] }) }

  function nextRoom() {
    if (roomIdx < activeRooms.length - 1) { setRoomIdx(i => i + 1) }
    else { setStep('review') }
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
        `Unit: ${unitAddress || 'Not provided'}\nTenant: ${tenantName || 'Not provided'}\n\nRoom-by-room log:\n${log}\n\nReview photos and write the report:`,
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
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', display: 'grid', placeItems: 'center', color: 'var(--mint)', fontSize: 14 }}>🏠</span> RenterReady
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
            <button onClick={() => setSelected(selected.length === ROOMS.length ? [] : ROOMS.map(r => r.name))} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              {selected.length === ROOMS.length ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>Tap to choose which rooms to document. {selected.length} selected.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10 }}>
            {ROOMS.map((r) => {
              const on = selected.includes(r.name)
              const done = roomData[r.name]
              return (
                <div key={r.name} onClick={() => toggleSelect(r.name)} style={{ position: 'relative', background: on ? 'var(--mint-soft)' : 'var(--paper)', border: `1.5px solid ${on ? 'var(--brand)' : 'var(--line-strong)'}`, borderRadius: 14, padding: '16px 14px', cursor: 'pointer', textAlign: 'center', opacity: on ? 1 : 0.5, transition: 'opacity .12s, border-color .12s' }}>
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 5, background: on ? 'var(--brand)' : 'transparent', border: `1.5px solid ${on ? 'var(--brand)' : 'var(--line-strong)'}`, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, lineHeight: 1 }}>{on ? '✓' : ''}</div>
                  <div style={{ fontSize: 24 }}>{r.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 5, color: on ? 'var(--brand)' : 'var(--ink)' }}>{r.name}</div>
                  {done && <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 3 }}>✓ {done.photos.length} photo{done.photos.length !== 1 ? 's' : ''}</div>}
                </div>
              )
            })}
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
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', display: 'grid', placeItems: 'center', color: 'var(--mint)', fontSize: 14 }}>🏠</span> RenterReady
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
          <button className="wz-allgood" onClick={markAllGood} style={{ background: current.allGood ? 'var(--mint-soft)' : undefined, borderColor: current.allGood ? 'var(--brand)' : undefined }}>
            {current.allGood ? '✓ All good — no issues' : '✓ Everything looks good in here'}
          </button>
          {!current.allGood && (
            <div className="wz-chips">
              {ISSUE_TYPES.map(t => (
                <button key={t} className={`wz-chip ${current.issues.includes(t) ? 'on' : ''}`} onClick={() => toggleIssue(t)}>{t}</button>
              ))}
            </div>
          )}
        </div>

        <div className="wz-field">
          <label>Notes (optional)</label>
          <textarea className="wz-note" placeholder="Describe anything specific — scuff on north wall, stain near window, cracked tile..." value={current.note} onChange={e => updateRoom({ note: e.target.value })} />
        </div>
      </div>

      <div className="wz-nav">
        <div className="wz-nav-row">
          <button className="wz-back" onClick={prevRoom}>Back</button>
          <button className="wz-next" onClick={nextRoom}>
            {roomIdx < activeRooms.length - 1 ? `Next: ${activeRooms[roomIdx + 1].name} →` : 'Review report →'}
          </button>
        </div>
      </div>
    </div>
  )

  if (step === 'review') return (
    <div className="wz">
      <div className="wz-top">
        <div className="wz-top-row">
          <Link href="/" className="brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', display: 'grid', placeItems: 'center', color: 'var(--mint)', fontSize: 14 }}>🏠</span> RenterReady
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
                  {d.photos.map((p, i) => <img key={i} src={p} alt="" />)}
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
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 10 }}>Reading your photos...</h2>
        <p style={{ color: 'var(--ink-soft)' }}>AI is reviewing each image and writing the condition notes.</p>
        <i className="spin2" style={{ marginTop: 20, display: 'block', width: 24, height: 24, border: '3px solid var(--line)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'll-spin 0.7s linear infinite', margin: '20px auto 0' }} />
      </div>
    </div>
  )

  if (step === 'locked') return (
    <div className="wz">
      <div className="wz-top">
        <div className="wz-top-row">
          <Link href="/" className="brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', display: 'grid', placeItems: 'center', color: 'var(--mint)', fontSize: 14 }}>🏠</span> RenterReady
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
            <h3>AI condition report</h3>
            <div className="body">{reportText}</div>
          </div>

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
            <button className="bp" onClick={() => window.print()}>Print / save as PDF</button>
            <Link href="/app" className="bg2" style={{ padding: '12px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 600, color: 'var(--brand)', border: '1.5px solid var(--line-strong)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Go to my dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  )

  return null
}
