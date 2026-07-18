'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import AddressAutocomplete from '../components/AddressAutocomplete'
import Logo from '../components/Logo'
import GeneratingLoader from '../components/GeneratingLoader'
import FakeDoor from '../components/FakeDoor'
import { track } from '../lib/analytics'
import { profileToReadable } from '../lib/quiz'
import { getProfile, saveMoveInReport, latestMoveInReport, refreshMoveInReport, updateMoveInReportText, uploadDocument, uploadReportPhoto, dataUrlToBlob } from '../lib/db'

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

export default function Report() {
  const [step, setStep] = useState('rooms') // rooms | room-detail | review | generating | locked
  const [liveText, setLiveText] = useState('')
  const [saved, setSaved] = useState(null) // DB row once the report is stored (id, token, landlord signature)
  const [updateOf, setUpdateOf] = useState(null) // original report when this is a follow-up re-inspection
  const [copied, setCopied] = useState(false)
  const [roomIdx, setRoomIdx] = useState(0)
  const [roomData, setRoomData] = useState({})
  const [tenantName, setTenantName] = useState('')
  const [unitAddress, setUnitAddress] = useState('')
  const [unitNum, setUnitNum] = useState('')
  const [reportText, setReportText] = useState('')
  const [editingReport, setEditingReport] = useState(false)
  const [lockTs, setLockTs] = useState('')
  const flowStart = useRef(null)
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    track('movein_view')
    getProfile().then(p => { if (p) setProfile(p) }).catch(() => {})
    const sp = new URLSearchParams(window.location.search)
    // ?update=<id> starts a follow-up inspection that builds on a locked
    // report: same rooms, previous issues shown, new report linked back.
    const updateId = sp.get('update')
    if (updateId) {
      refreshMoveInReport(updateId).then(r => {
        if (!r) return
        setUpdateOf(r)
        setUnitAddress(r.unit_address || '')
        setTenantName(r.tenant_name || '')
        const pr = r.property
        if (pr && (pr.bedrooms || pr.sqft || pr.yearBuilt || pr.use || pr.units)) setProperty(pr)
        const rooms = Array.isArray(r.rooms) ? r.rooms : []
        if (rooms.length) {
          setSelected(rooms.map(x => x.name))
          setCustomRooms(rooms.filter(x => !ROOMS.some(b => b.name === x.name)).map(x => {
            const base = ROOMS.find(b => x.name === b.name || x.name.startsWith(b.name + ' '))
            return {
              name: x.name, emoji: x.emoji || base?.emoji || '📍',
              prompts: base?.prompts || ['Walls and ceiling', 'Flooring', 'Windows and doors', 'Fixtures and outlets'],
              custom: true,
            }
          }))
        }
      }).catch(() => {})
      return
    }
    // ?new=1 skips the restore so "Start a new inspection" begins fresh.
    if (sp.get('new') === '1') return
    // Restore the most recent locked report so it survives refreshes.
    latestMoveInReport().then(r => {
      if (!r) return
      setSaved(r)
      if (r.property) setProperty(r.property)
      setUnitAddress(r.unit_address || '')
      setTenantName(r.tenant_name || '')
      setReportText(r.report_text)
      setLockTs(new Date(r.locked_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }))
      setStep('locked')
    }).catch(() => {})
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

  // Free public-record lookup (LA County assessor open data) when an address
  // is picked from the dropdown. Best-effort: silently skipped outside LA.
  const [property, setProperty] = useState(null)
  const [propLoading, setPropLoading] = useState(false)
  async function lookupProperty(sel) {
    setProperty(null)
    setPropLoading(true)
    try {
      // Assessor suggestions carry the parcel id (la-<AIN>) — exact lookup,
      // no re-matching needed. Everything else goes through address search.
      const qs = typeof sel === 'object' && sel?.placeId?.startsWith('la-')
        ? `ain=${encodeURIComponent(sel.placeId.slice(3))}`
        : `q=${encodeURIComponent(typeof sel === 'string' ? sel : sel?.text || '')}`
      const res = await fetch(`/api/property?${qs}`)
      const p = await res.json()
      if (p?.found) {
        // Remember "1234 MAIN" so appending "Apt 4B" keeps the card while
        // typing a different address clears it.
        const base = (typeof sel === 'object' ? sel?.text : String(sel || '')) || ''
        p.baseKey = base.split(',')[0].trim().toUpperCase().split(/\s+/).slice(0, 2).join(' ')
        setProperty(p)
        // Apartment buildings report building-wide totals (e.g. 36 beds
        // across 22 units) — only mirror rooms for single-unit records.
        if (!(p.units > 1)) applyPropertyRooms(p)
        track('property_matched')
      }
    } catch { /* lookup is best-effort */ }
    setPropLoading(false)
  }
  function applyPropertyRooms(p) {
    const beds = Math.min(Math.round(p.bedrooms || 0), 6)
    const baths = Math.min(Math.round(p.bathrooms || 0), 6)
    const extras = []
    for (let i = 2; i <= beds; i++) extras.push({ base: 'Bedroom', name: `Bedroom ${i}` })
    for (let i = 2; i <= baths; i++) extras.push({ base: 'Bathroom', name: `Bathroom ${i}` })
    if (!extras.length) return
    setCustomRooms(c => {
      const have = new Set([...ROOMS.map(r => r.name), ...c.map(r => r.name)])
      const add = extras.filter(e => !have.has(e.name)).map(e => {
        const tmpl = ROOMS.find(r => r.name === e.base)
        return { name: e.name, emoji: tmpl.emoji, prompts: tmpl.prompts, custom: true }
      })
      return add.length ? [...c, ...add] : c
    })
    setSelected(s => Array.from(new Set([...s, ...extras.map(e => e.name)])))
  }
  const room = activeRooms[roomIdx]
  const current = roomData[room?.name] || { photos: [], issues: [], allGood: false, note: '' }
  const condGood = current.allGood === true || current.cond === 'good'
  const condIssues = current.cond === 'issues' || (!current.allGood && (current.issues?.length > 0))

  function updateRoom(patch) {
    setRoomData(d => ({ ...d, [room.name]: { ...current, ...patch } }))
  }

  const [dragOver, setDragOver] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanNote, setScanNote] = useState('')
  useEffect(() => { setScanNote('') }, [roomIdx])

  // AI pre-assessment: look at the room's photos and pre-select the condition
  // and issue types. Only applies if the user hasn't chosen anything yet.
  async function analyzeRoomPhotos(roomName, photos) {
    if (!photos.length) return
    setScanning(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are inspecting move-in photos of a rental unit. Respond with ONLY valid JSON, no markdown fences, in this exact shape: {"condition":"good"|"issues","issues":[...],"note":"one short sentence on what you see"}. "issues" must be a subset of: ${ISSUE_TYPES.join(', ')}. Use "issues" only for clearly visible problems; normal furnishings and clean rooms are "good".`,
          user: `Room: ${roomName}. Assess the visible condition in these photos.`,
          images: photos,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'scan failed')
      // The model sometimes wraps the JSON in prose or fences — extract it.
      const raw = (data.text || '').replace(/```json|```/g, '').trim()
      const parsed = JSON.parse((raw.match(/\{[\s\S]*\}/) || [raw])[0])
      const suggested = Array.isArray(parsed.issues) ? parsed.issues.filter(i => ISSUE_TYPES.includes(i)) : []
      setScanNote(
        parsed.condition === 'issues' && suggested.length
          ? `✨ AI spotted: ${suggested.join(', ')} — pre-filled below, adjust if it's wrong.`
          : '✨ AI checked your photos — this room looks in good shape.'
      )
      setRoomData(d => {
        const cur = d[roomName] || { photos, issues: [], allGood: false, note: '' }
        // Respect anything the user already chose.
        if (cur.cond || cur.allGood || (cur.issues?.length ?? 0) > 0) return d
        const foundIssues = Array.isArray(parsed.issues) ? parsed.issues.filter(i => ISSUE_TYPES.includes(i)) : []
        if (parsed.condition === 'issues' && foundIssues.length) {
          return { ...d, [roomName]: { ...cur, cond: 'issues', allGood: false, issues: foundIssues, note: cur.note || parsed.note || '', aiSuggested: true } }
        }
        return { ...d, [roomName]: { ...cur, cond: 'good', allGood: true, issues: [], aiSuggested: true } }
      })
    } catch (err) {
      console.error('Photo scan failed:', err?.message)
      setScanNote('⚠️ AI couldn’t read these photos — pick the condition yourself below.')
    }
    setScanning(false)
  }

  async function addPhotoFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/')).slice(0, 8)
    if (!files.length) return
    const scaled = await Promise.all(files.map(f => downscale(f)))
    const allPhotos = [...current.photos, ...scaled].slice(0, 8)
    const allTimes = [...(current.photoTimes || []), ...scaled.map(() => new Date().toISOString())].slice(0, 8)
    updateRoom({ photos: allPhotos, photoTimes: allTimes })
    analyzeRoomPhotos(room.name, allPhotos)
    // Persist to household documents (shared with roommates).
    scaled.forEach((dataUrl) => {
      dataUrlToBlob(dataUrl)
        .then(b => uploadDocument(b, { name: `${room.name} photo.jpg`, kind: 'photo', context: `Move-in report · ${room.name}` }))
        .catch(() => {})
    })
  }

  async function onFiles(e) {
    await addPhotoFiles(e.target.files)
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    addPhotoFiles(e.dataTransfer?.files)
  }

  function removePhoto(i) {
    updateRoom({
      photos: current.photos.filter((_, j) => j !== i),
      photoTimes: (current.photoTimes || []).filter((_, j) => j !== i),
    })
  }

  function removePhotoFromRoom(roomName, i) {
    setRoomData(d => {
      const rd = d[roomName]
      if (!rd) return d
      return {
        ...d,
        [roomName]: {
          ...rd,
          photos: rd.photos.filter((_, j) => j !== i),
          photoTimes: (rd.photoTimes || []).filter((_, j) => j !== i),
        },
      }
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
    else { track('movein_review'); setStep('review') }
  }
  function skipRoom() {
    if (roomIdx < activeRooms.length - 1) setRoomIdx(i => i + 1)
    else { track('movein_review'); setStep('review') }
  }
  function prevRoom() {
    if (roomIdx > 0) setRoomIdx(i => i - 1)
    else setStep('rooms')
  }

  function totalPhotos() { return Object.values(roomData).reduce((n, r) => n + r.photos.length, 0) }

  async function generate() {
    track('movein_generate')
    setStep('generating')
    setLiveText('')
    // Fold the unit number into the saved address ("… , Apt 4B").
    const unitPart = unitNum.trim()
    const fullAddress = unitAddress && unitPart
      ? `${unitAddress.replace(/[\s,]+$/, '')}, ${/^(apt|unit|ste|suite|#|no\.?\s)/i.test(unitPart) ? unitPart : `Apt ${unitPart}`}`
      : unitAddress
    const log = activeRooms.map(r => {
      const d = roomData[r.name]
      if (!d) return null
      const status = d.allGood ? 'Good — no issues noted' : (d.issues.length ? `Issues: ${d.issues.join(', ')}` : 'Reviewed')
      return `${r.name}: ${status}. Notes: ${d.note || 'none'}. Photos: ${d.photos.length}.`
    }).filter(Boolean).join('\n')
    const allPhotos = Object.values(roomData).flatMap(r => r.photos)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: true,
          system: 'You are a renter protection assistant. Review the move-in photos and produce a professional, factual move-in condition report organized by room. Be specific about any damage, stains, or issues visible in the photos. Under 350 words. Plain text, no markdown.',
          user: `Unit: ${fullAddress || 'Not provided'}\nTenant: ${tenantName || 'Not provided'}`
            + (profileRows.length ? `\n\nTenant intake:\n${profileRows.map(r => `- ${r.question} ${r.answer}`).join('\n')}` : '')
            + (updateOf ? `\n\nIMPORTANT: This is a FOLLOW-UP inspection after the landlord had a chance to fix the issues from the previous report (locked ${new Date(updateOf.locked_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}). Previously reported issues by room:\n${(updateOf.rooms || []).filter(x => x.status && !x.status.startsWith('Good')).map(x => `- ${x.name}: ${x.status}${x.note ? ` (${x.note})` : ''}`).join('\n') || '- none recorded'}\nTitle the report as an updated condition report. For each previously reported issue, state clearly whether it now appears RESOLVED or STILL PRESENT, then note any new issues.` : '')
            + `\n\nRoom-by-room log:\n${log}\n\nReview photos and write the report:`,
          images: allPhotos,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'API error')
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += dec.decode(value, { stream: true })
        setLiveText(text)
      }
      if (!text.trim()) throw new Error('The AI returned an empty report. Please try again.')
      setReportText(text)
      setLockTs(new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }))
      // Persist the locked report so it survives refreshes and can be sent for signature.
      try {
        // Landlord-view photos go in a public bucket under an unguessable
        // folder — same trust model as the signing link itself.
        const shareId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const roomsSummary = []
        for (const r of activeRooms) {
          const d = roomData[r.name]
          if (!d) continue
          let photoUrls = []
          try {
            const slug = r.name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
            photoUrls = await Promise.all(d.photos.map(async (ph, i) => {
              const blob = await dataUrlToBlob(ph)
              return uploadReportPhoto(`${shareId}/${slug}-${i + 1}.jpg`, blob)
            }))
          } catch (err) { console.error('Report photo upload failed', err) }
          roomsSummary.push({
            name: r.name, emoji: r.emoji,
            status: d.allGood ? 'Good — no issues' : (d.issues?.length ? d.issues.join(', ') : 'Reviewed'),
            note: d.note || '', photos: d.photos.length,
            photo_urls: photoUrls,
            documented_at: d.photoTimes?.[0] || new Date().toISOString(),
            photo_times: d.photoTimes || [],
          })
        }
        // The follow-up link rides in the property jsonb (no schema change needed).
        const propertyPayload = updateOf
          ? { ...(property || {}), followupOf: { id: updateOf.id, locked_at: updateOf.locked_at } }
          : property
        const row = await saveMoveInReport({ unitAddress: fullAddress, tenantName, reportText: text, rooms: roomsSummary, property: propertyPayload })
        setSaved(row)
      } catch (err) {
        console.error('Could not save report', err)
      }
      track('movein_locked', flowStart.current ? { seconds: Math.round((Date.now() - flowStart.current) / 1000) } : {})
      setStep('locked')
    } catch (e) {
      alert(`Report generation failed: ${e.message || 'Unknown error'}`)
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
        <h1 className="wz-h">{updateOf ? 'Let’s re-inspect your unit.' : "Let's document your unit."}</h1>
        <p className="wz-p">We'll go room by room. Take photos, note any existing issues, and our AI writes the condition report. Takes about 5 minutes.</p>
        {updateOf && (
          <div style={{ background: 'var(--mint-soft)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, lineHeight: 1.55, marginBottom: 16 }}>
            🔁 <b>Updated inspection</b> — building on your report from{' '}
            {new Date(updateOf.locked_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            Your rooms are pre-selected, each one shows what was wrong last time, and the new report will
            record what the landlord fixed (and what they didn&apos;t).
          </div>
        )}
        <div className="wz-field">
          <label>Unit address</label>
          <AddressAutocomplete
            value={unitAddress}
            onChange={(v) => {
              setUnitAddress(v)
              // Appending "Apt 4B" keeps the record card; changing the base address clears it.
              if (property && !(property.baseKey && v.toUpperCase().includes(property.baseKey))) setProperty(null)
            }}
            onSelect={lookupProperty}
            placeholder="123 Main St, Apt 4B"
          />          {propLoading && (
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>Checking public property records…</div>
          )}
          {property && (
            <div style={{ marginTop: 8, background: 'var(--mint-soft)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.5 }}>
              🏠 <b>Public record match:</b>{' '}
              {property.units > 1 ? (
                [
                  `${property.units}-unit building`,
                  property.sqft && `${Math.round(property.sqft).toLocaleString()} sqft`,
                  property.yearBuilt && `built ${property.yearBuilt}`,
                  property.use,
                ].filter(Boolean).join(' · ')
              ) : (
                [
                  property.bedrooms && `${property.bedrooms} bed`,
                  property.bathrooms && `${property.bathrooms} bath`,
                  property.sqft && `${Math.round(property.sqft).toLocaleString()} sqft`,
                  property.yearBuilt && `built ${property.yearBuilt}`,
                  property.use,
                ].filter(Boolean).join(' · ')
              )}
              {!(property.units > 1) && (property.bedrooms > 1 || property.bathrooms > 1) && <> — we pre-selected the rooms below to match.</>}
              {property.units > 1 && <> — add your unit number below.</>}
              {property.units > 1 && (
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                  ℹ️ County records cover the whole building — individual units aren&apos;t in public records, so
                  pick the rooms in <b>your</b> unit below.
                </div>
              )}
              <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>Source: {property.source} · saved with your report</div>
            </div>
          )}
        </div>
        <div className="wz-field">
          <label>Unit / Apt # (optional)</label>
          <input
            className="wz-input" style={{ maxWidth: 220 }} placeholder="e.g. 4B"
            value={unitNum} onChange={e => setUnitNum(e.target.value)}
          />
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
                  {on && !r.custom && ['Bedroom', 'Bathroom', 'Living room', 'Other / storage'].includes(r.name) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addAnother(r.name) }}
                      style={{ marginTop: 7, background: '#fff', border: '1px solid var(--line-strong)', borderRadius: 999, padding: '3px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--brand)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      + Add another
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <input className="wz-input" style={{ flex: 1 }} placeholder="Add a custom room (e.g. Garage, Office)" value={newRoom} onChange={e => setNewRoom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomRoom() } }} />
            <button onClick={addCustomRoom} disabled={!newRoom.trim()} style={{ padding: '0 20px', borderRadius: 13, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-body)', cursor: newRoom.trim() ? 'pointer' : 'default', opacity: newRoom.trim() ? 1 : 0.45 }}>Add</button>
          </div>
        </div>
      </div>
      <div className="wz-nav">
        <div className="wz-nav-row">
          <button className="wz-next" onClick={() => { track('movein_start'); flowStart.current = Date.now(); setRoomIdx(0); setStep('room-detail') }} disabled={(!unitAddress && !tenantName) || selected.length === 0}>
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
        {(() => {
          const prev = updateOf?.rooms?.find?.(x => x.name === room?.name)
          if (!prev?.status) return null
          const hadIssues = !prev.status.startsWith('Good')
          return (
            <div style={{ background: hadIssues ? '#fff7e8' : 'var(--mint-soft)', border: `1px solid ${hadIssues ? '#f0d9a8' : 'var(--line-strong)'}`, borderRadius: 12, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>
              🔁 <b>Last inspection:</b> {prev.status}{prev.note ? <> — &ldquo;{prev.note}&rdquo;</> : ''}.
              {hadIssues ? ' Check whether it was fixed and photograph it either way.' : ' Confirm it still looks good.'}
            </div>
          )
        })()}

        <div className="wz-field">
          <label>Photos</label>
          <div
            style={{
              background: dragOver ? 'var(--mint-soft)' : 'var(--paper)',
              border: dragOver ? '1.5px dashed var(--brand)' : '1.5px dashed var(--line-strong)',
              borderRadius: 14, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 10,
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <div style={{ fontSize: 26 }}>📸</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{dragOver ? 'Drop photos here' : 'Tap to add photos — or drag & drop'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>Focus on: {room.prompts.slice(0, 3).join(' · ')}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
          {scanning && (
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, margin: '4px 0 8px' }}>
              ✨ AI is checking your photos…
            </div>
          )}
          {!scanning && scanNote && (
            <div style={{ fontSize: 13, color: scanNote.startsWith('⚠️') ? '#c07c0c' : 'var(--ink-soft)', margin: '4px 0 8px' }}>
              {scanNote}
            </div>
          )}
          {current.photos.length > 0 && (
            <div className="wz-thumbs">
              {current.photos.map((p, i) => (
                <div key={i} className="wz-thumb" title={current.photoTimes?.[i] ? `Added ${new Date(current.photoTimes[i]).toLocaleString()}` : undefined}>
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
        {(current.photos.length === 0 || !(condGood || condIssues)) && (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>
            {current.photos.length === 0
              ? 'Add at least one photo to continue — photos are your evidence. Or skip this room.'
              : 'Select a condition above to continue — or skip this room.'}
          </div>
        )}
        <div className="wz-nav-row">
          <button className="wz-back" onClick={prevRoom}>Back</button>
          <button className="wz-next" onClick={nextRoom} disabled={current.photos.length === 0 || !(condGood || condIssues)}>
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
      <GeneratingLoader title="Writing your report" msgs={LOADER_MSGS} />
      {liveText && (
        <div style={{
          maxWidth: 640, width: '100%', margin: '18px auto 40px', padding: '18px 22px',
          background: '#fff', border: '1px solid var(--line)', borderRadius: 14,
          fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-wrap',
        }}>
          {liveText}
          <span style={{ display: 'inline-block', width: 8, height: 16, background: 'var(--brand)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'gen-bounce 1s infinite' }} />
        </div>
      )}
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
            <div className="row"><span className="k">Rooms documented</span><span className="v">{Object.keys(roomData).length || (saved?.rooms?.length ?? 0)}</span></div>
            <div className="row"><span className="k">Photos taken</span><span className="v">{totalPhotos() || (saved?.rooms?.reduce((n, r) => n + (r.photos || 0), 0) ?? 0)}</span></div>
            <div className="row"><span className="k">Locked</span><span className="v">🔒 {lockTs}</span></div>
            {saved?.property?.followupOf && (
              <div className="row"><span className="k">Updates report from</span><span className="v">🔁 {new Date(saved.property.followupOf.locked_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
            )}
            {saved?.landlord_signed_at && (
              <div className="row"><span className="k">Landlord signed</span><span className="v">✍️ {saved.landlord_name} · {new Date(saved.landlord_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
            )}
          </div>

          <div className="report-doc">
            <div className="report-doc-head">
              <h3>AI condition report</h3>
              <button className="report-edit-btn no-print" onClick={() => {
                if (editingReport && saved) updateMoveInReportText(saved.id, reportText).catch(() => {})
                setEditingReport(v => !v)
              }}>{editingReport ? '✓ Done' : '✎ Edit'}</button>
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
                          <figcaption>
                            {r.name} · Photo {j + 1}
                            {d.photoTimes?.[j] && <> · 🕐 {new Date(d.photoTimes[j]).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</>}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {saved && (
            <div className="no-print" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px', marginTop: 18, textAlign: 'left' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: 0 }}>Landlord signature</h3>
              {saved.landlord_signed_at ? (
                <div style={{ marginTop: 12, background: 'var(--mint-soft)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: '12px 16px', fontSize: 14.5 }}>
                  ✍️ Signed by <b>{saved.landlord_name}</b> on {new Date(saved.landlord_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Your report is acknowledged.
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '6px 0 12px' }}>
                    Send this link to your landlord — they can review the report and sign it, no account needed.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <code style={{ flex: '1 1 220px', fontSize: 12.5, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/sign/${saved.token}`}
                    </code>
                    <button className="bg2" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/sign/${saved.token}`)
                      setCopied(true); setTimeout(() => setCopied(false), 2000)
                    }}>{copied ? '✓ Copied' : 'Copy link'}</button>
                    <a className="bg2" style={{ textDecoration: 'none' }} href={`mailto:?subject=${encodeURIComponent('Move-in condition report — please review and sign')}&body=${encodeURIComponent(`Hi,\n\nHere is the move-in condition report for ${unitAddress || 'the unit'}. Please review and sign it here:\n\n${typeof window !== 'undefined' ? window.location.origin : ''}/sign/${saved.token}\n\nThanks,\n${tenantName || ''}`)}`}>Email to landlord</a>
                    <button className="bg2" onClick={() => refreshMoveInReport(saved.id).then(r => r && setSaved(r)).catch(() => {})}>Check for signature</button>
                  </div>
                </>
              )}
            </div>
          )}

          <FakeDoor placement="report_locked" />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }} className="no-print">
            <button className="bp" onClick={() => { setEditingReport(false); setTimeout(() => window.print(), 60) }}>Print / save as PDF</button>
            <Link href="/app" className="bg2" style={{ padding: '12px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 600, color: 'var(--brand)', border: '1.5px solid var(--line-strong)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Go to my dashboard</Link>
            {saved && (
              <a href={`/report?update=${saved.id}`} className="bg2" style={{ padding: '12px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 600, color: 'var(--brand)', border: '1.5px solid var(--line-strong)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                🔁 Re-inspect after fixes
              </a>
            )}
            <button className="bg2" onClick={() => {
              setSaved(null); setRoomData({}); setReportText(''); setEditingReport(false); setLiveText(''); setRoomIdx(0); setStep('rooms')
            }}>Start a new report</button>
          </div>
        </div>
      </div>
    </div>
  )

  return null
}
