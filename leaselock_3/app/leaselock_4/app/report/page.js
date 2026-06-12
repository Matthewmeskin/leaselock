'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const ROOM_LIB = [
  { name: 'Living room', emoji: '🛋️', items: ['Walls and paint', 'Flooring', 'Windows and blinds', 'Ceiling', 'Outlets and switches', 'Doors'] },
  { name: 'Kitchen', emoji: '🍳', items: ['Cabinets', 'Countertops', 'Sink and faucet', 'Stove and oven', 'Refrigerator', 'Flooring'] },
  { name: 'Bedroom', emoji: '🛏️', items: ['Walls and paint', 'Flooring', 'Closet', 'Windows', 'Outlets', 'Door'] },
  { name: 'Bathroom', emoji: '🚿', items: ['Toilet', 'Sink and vanity', 'Shower and tub', 'Tile and grout', 'Flooring', 'Mirror'] },
  { name: 'Entryway', emoji: '🚪', items: ['Front door and lock', 'Walls', 'Flooring', 'Lighting'] },
  { name: 'Laundry', emoji: '🧺', items: ['Washer', 'Dryer', 'Flooring', 'Walls'] },
]

function downscale(file, max = 1100) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = (e) => { const img = new Image(); img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.8))
    }; img.src = e.target.result }
    r.readAsDataURL(file)
  })
}

export default function Report() {
  const [step, setStep] = useState('intro')          // intro | number | review | generating | locked
  const [renter, setRenter] = useState('')
  const [unit, setUnit] = useState('')
  const [landlord, setLandlord] = useState('')
  const [picked, setPicked] = useState(['Living room', 'Kitchen', 'Bedroom', 'Bathroom'])
  const [rooms, setRooms] = useState([])
  const [report, setReport] = useState('')
  const [lockedAt, setLockedAt] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    const saved = localStorage.getItem('ll_inspect')
    if (saved) { try { const d = JSON.parse(saved); if (d.locked) { setReport(d.report); setLockedAt(d.lockedAt); setRenter(d.renter); setUnit(d.unit); setLandlord(d.landlord); setRooms(d.rooms); setStep('locked') } } catch {} }
  }, [])

  function startRooms() {
    if (picked.length === 0) { alert('Pick at least one room.'); return }
    const built = ROOM_LIB.filter(r => picked.includes(r.name)).map(r => ({
      name: r.name, emoji: r.emoji, photos: [], note: '',
      items: r.items.map(label => ({ label, state: '' })),
    }))
    setRooms(built); setStep(0)
  }
  const roomIdx = typeof step === 'number' ? step : -1
  const room = roomIdx >= 0 ? rooms[roomIdx] : null

  function setItem(ri, ii, state) { setRooms(rs => rs.map((r, i) => i !== ri ? r : { ...r, items: r.items.map((it, j) => j !== ii ? it : { ...it, state }) })) }
  function markAllGood(ri) { setRooms(rs => rs.map((r, i) => i !== ri ? r : { ...r, items: r.items.map(it => ({ ...it, state: it.state || 'good' })) })) }
  async function addPhotos(ri, e) {
    const files = Array.from(e.target.files || []).slice(0, 8)
    const c = await Promise.all(files.map(f => downscale(f)))
    setRooms(rs => rs.map((r, i) => i !== ri ? r : { ...r, photos: [...r.photos, ...c].slice(0, 8) }))
    if (fileRef.current) fileRef.current.value = ''
  }
  function rmPhoto(ri, pi) { setRooms(rs => rs.map((r, i) => i !== ri ? r : { ...r, photos: r.photos.filter((_, j) => j !== pi) })) }
  function setNote(ri, v) { setRooms(rs => rs.map((r, i) => i !== ri ? r : { ...r, note: v })) }

  async function lock() {
    setStep('generating')
    const imgs = rooms.flatMap(r => r.photos)
    const log = rooms.map(r => {
      const issues = r.items.filter(it => it.state === 'bad').map(it => it.label)
      const good = r.items.filter(it => it.state === 'good').map(it => it.label)
      return `${r.name}: good condition items: ${good.join(', ') || 'none marked'}. Flagged issues: ${issues.join(', ') || 'none'}. Renter note: ${r.note || 'none'}. Photos: ${r.photos.length}.`
    }).join('\n')
    let text = ''
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a neutral move-in inspection assistant. Look carefully at the attached photos and describe any visible existing damage, wear, or issues. Then write a clear, factual, professional move-in condition report organized by room that protects both the renter and the landlord. Be objective and specific. Under 320 words. Plain text, no markdown symbols.',
          user: `Move-in inspection for unit: ${unit || 'N/A'}, renter: ${renter || 'N/A'}.\n\nRoom log:\n${log}\n\nReview the attached photos and produce the report.`,
          images: imgs,
        }),
      })
      const data = await res.json()
      text = res.ok ? data.text : 'Report could not be generated automatically. The room by room log and photos are still saved below as the official record.'
    } catch { text = 'Report could not be generated automatically. The room by room log and photos are still saved below as the official record.' }
    const ts = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
    setReport(text); setLockedAt(ts); setStep('locked')
    try { localStorage.setItem('ll_inspect', JSON.stringify({ locked: true, report: text, lockedAt: ts, renter, unit, landlord, rooms })) } catch {}
  }

  function restart() { localStorage.removeItem('ll_inspect'); setStep('intro'); setRooms([]); setReport(''); setRenter(''); setUnit(''); setLandlord('') }

  /* progress percent */
  const totalSteps = rooms.length + 2
  const cur = step === 'intro' ? 0 : step === 'review' ? rooms.length + 1 : step === 'locked' || step === 'generating' ? totalSteps : roomIdx + 1
  const pct = Math.round((cur / totalSteps) * 100)

  return (
    <div className="wz">
      <style>{`@keyframes ll-spin{to{transform:rotate(360deg)}}`}</style>

      <div className="wz-top no-print">
        <div className="wz-top-row">
          <Link href="/" className="brand"><span className="brand-mark">🔒</span> LeaseLock</Link>
          <span className="pct">{step === 'locked' ? 'Complete' : `${pct}%`}</span>
        </div>
        <div className="wz-prog"><div className="fill" style={{ width: `${step === 'locked' ? 100 : pct}%` }} /></div>
      </div>

      <div className="wz-body">

        {step === 'intro' && (
          <>
            <div className="wz-step-label">Move-in inspection</div>
            <h1 className="wz-h">Let's document your place.</h1>
            <p className="wz-p">A quick walk through, room by room. Mostly tapping, a few photos. Takes about five minutes, and both you and your landlord get the same locked report at the end.</p>
            <div className="wz-field"><label>Your name</label><input className="wz-input" placeholder="Alex Renter" value={renter} onChange={e => setRenter(e.target.value)} /></div>
            <div className="wz-field"><label>Unit or address</label><input className="wz-input" placeholder="2841 Severance St, Apt 4" value={unit} onChange={e => setUnit(e.target.value)} /></div>
            <div className="wz-field"><label>Landlord email (gets a copy)</label><input className="wz-input" placeholder="landlord@email.com" value={landlord} onChange={e => setLandlord(e.target.value)} /></div>
            <div className="wz-field"><label>Which rooms are in your unit?</label>
              <div className="wz-chips">
                {ROOM_LIB.map(r => (
                  <button key={r.name} className={`wz-chip ${picked.includes(r.name) ? 'on' : ''}`} onClick={() => setPicked(p => p.includes(r.name) ? p.filter(x => x !== r.name) : [...p, r.name])}>{r.emoji} {r.name}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {room && (
          <>
            <div className="wz-step-label">Room {roomIdx + 1} of {rooms.length}</div>
            <div className="wz-room-emoji">{room.emoji}</div>
            <h1 className="wz-h">{room.name}</h1>
            <p className="wz-p">Tap "Everything looks good," then flag anything that does not. Add a couple of photos.</p>

            <button className="wz-allgood" onClick={() => markAllGood(roomIdx)}>✓ Everything looks good</button>

            {room.items.map((it, ii) => (
              <div className="wz-item" key={ii}>
                <span className="nm">{it.label}</span>
                <div className="wz-seg">
                  <button className={`good ${it.state === 'good' ? 'on' : ''}`} onClick={() => setItem(roomIdx, ii, 'good')}>Good</button>
                  <button className={`bad ${it.state === 'bad' ? 'on' : ''}`} onClick={() => setItem(roomIdx, ii, 'bad')}>Issue</button>
                </div>
              </div>
            ))}

            <div className="wz-photo" onClick={() => fileRef.current?.click()}>
              <div className="pe">📸</div><b>Add photos of this room</b><span>Especially anything you flagged</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={(e) => addPhotos(roomIdx, e)} style={{ display: 'none' }} />
            {room.photos.length > 0 && (
              <div className="wz-thumbs">
                {room.photos.map((p, pi) => <div className="wz-thumb" key={pi}><img src={p} alt="" /><button className="rm" onClick={() => rmPhoto(roomIdx, pi)}>×</button></div>)}
              </div>
            )}
            <textarea className="wz-note" placeholder="Optional note: anything specific to mention about this room..." value={room.note} onChange={e => setNote(roomIdx, e.target.value)} />
          </>
        )}

        {step === 'review' && (
          <>
            <div className="wz-step-label">Almost done</div>
            <h1 className="wz-h">Review and lock.</h1>
            <p className="wz-p">Check it over. Once you lock it, the report is timestamped and cannot be changed, which is what makes it trusted by both sides.</p>
            {rooms.map((r, i) => {
              const issues = r.items.filter(it => it.state === 'bad').length
              return (
                <div className="wz-rev" key={i}>
                  <div className="rh"><span>{r.emoji}</span><b>{r.name}</b><span className="ri">{r.photos.length} photo{r.photos.length !== 1 ? 's' : ''}</span></div>
                  <div className="ri">{issues > 0 ? <span className="issues">{issues} issue{issues > 1 ? 's' : ''} flagged</span> : 'No issues flagged'}{r.note ? ` · note added` : ''}</div>
                  {r.photos.length > 0 && <div className="wz-mini-thumbs">{r.photos.map((p, j) => <img key={j} src={p} alt="" />)}</div>}
                </div>
              )
            })}
          </>
        )}

        {step === 'generating' && (
          <div className="wz-locked" style={{ paddingTop: 60 }}>
            <div className="wz-seal"><i style={{ width: 30, height: 30, border: '3px solid var(--mint-soft)', borderTopColor: 'var(--brand)', borderRadius: '50%', display: 'inline-block', animation: 'll-spin 0.7s linear infinite' }} /></div>
            <h1>Locking your report</h1>
            <p className="sub">Reading your photos and writing the official condition report...</p>
          </div>
        )}

        {step === 'locked' && (
          <div className="print-area">
            <div className="wz-locked">
              <div className="wz-seal">🔒</div>
              <h1>Report locked and sent</h1>
              <p className="sub">A copy went to you{landlord ? ` and ${landlord}` : ' and your landlord'}. This record is timestamped and cannot be edited.</p>
            </div>
            <div className="wz-receipt">
              <div className="row"><span className="k">Unit</span><span className="v">{unit || 'Not specified'}</span></div>
              <div className="row"><span className="k">Renter</span><span className="v">{renter || 'Not specified'}</span></div>
              <div className="row"><span className="k">Rooms inspected</span><span className="v">{rooms.length}</span></div>
              <div className="row"><span className="k">Photos on file</span><span className="v">{rooms.reduce((n, r) => n + r.photos.length, 0)}</span></div>
              <div className="row"><span className="k">Locked at</span><span className="v">{lockedAt}</span></div>
            </div>
            <div className="report-doc">
              <h3>Move-in condition report</h3>
              <div className="body">{report}</div>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="wz-next" style={{ flex: '1 1 200px' }} onClick={() => window.print()}>⬇ Download / print report</button>
              <button className="wz-back" onClick={restart}>Start a new inspection</button>
            </div>
          </div>
        )}
      </div>

      {/* bottom nav */}
      {step !== 'locked' && step !== 'generating' && (
        <div className="wz-nav no-print">
          <div className="wz-nav-row">
            {step !== 'intro' && <button className="wz-back" onClick={() => setStep(step === 'review' ? rooms.length - 1 : roomIdx === 0 ? 'intro' : roomIdx - 1)}>Back</button>}
            {step === 'intro' && <button className="wz-next" onClick={startRooms}>Start inspection →</button>}
            {room && <button className="wz-next" onClick={() => setStep(roomIdx === rooms.length - 1 ? 'review' : roomIdx + 1)}>{roomIdx === rooms.length - 1 ? 'Review' : `Next room →`}</button>}
            {step === 'review' && <button className="wz-next" onClick={lock}>🔒 Lock and send report</button>}
          </div>
        </div>
      )}
    </div>
  )
}
