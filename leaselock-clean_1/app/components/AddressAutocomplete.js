'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// Sources race in parallel; the highest-priority non-empty answer wins and
// replaces anything a faster, lower-priority source painted provisionally:
//  3 — Radar / Mapbox: authoritative nationwide, only when their key is set
//      (NEXT_PUBLIC_RADAR_KEY / NEXT_PUBLIC_MAPBOX_TOKEN).
//  2 — LA County Assessor roll (via /api/property?suggest=): keyless, exact
//      parcel addresses; picking one guarantees a property-record match.
//  1 — Geoapify (key or /api/places proxy): nationwide fallback.
//  0 — Photon (komoot, free): fast provisional fill only.
const RADAR_KEY = process.env.NEXT_PUBLIC_RADAR_KEY
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

async function fetchRadar(input, signal) {
  const res = await fetch(
    `https://api.radar.io/v1/search/autocomplete?query=${encodeURIComponent(input)}&countryCode=US&limit=6`,
    { signal, headers: { Authorization: RADAR_KEY } }
  )
  if (!res.ok) throw new Error(`radar ${res.status}`)
  const data = await res.json()
  return (data.addresses || []).map((a, i) => ({
    placeId: `rd-${i}-${a.formattedAddress || ''}`,
    text: (a.formattedAddress || '').replace(/,?\s*(United States of America|United States|USA)$/i, ''),
  })).filter(s => s.text)
}

async function fetchMapbox(input, signal) {
  const res = await fetch(
    `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(input)}&autocomplete=true&country=us&limit=6&types=address,street&access_token=${MAPBOX_TOKEN}`,
    { signal }
  )
  if (!res.ok) throw new Error(`mapbox ${res.status}`)
  const data = await res.json()
  return (data.features || []).map(f => ({
    placeId: f.id,
    text: (f.properties?.full_address || f.properties?.place_formatted || f.properties?.name || '')
      .replace(/,?\s*United States$/i, ''),
  })).filter(s => s.text)
}

async function fetchAssessor(input, signal) {
  const res = await fetch(`/api/property?suggest=${encodeURIComponent(input)}`, { signal })
  const data = await res.json()
  return data.suggestions || []
}

async function fetchPhoton(input, signal) {
  const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=8&lang=en`, { signal })
  const data = await res.json()
  // OSM often returns the street without the house number the user typed —
  // carry their number into the suggestion so it completes the address.
  const typedNum = (input.trim().match(/^(\d+)\s/) || [])[1]
  const seen = new Set()
  const out = []
  for (const f of data.features || []) {
    const p = f.properties || {}
    if (p.countrycode && p.countrycode !== 'US') continue
    let line1 = [p.housenumber, p.street].filter(Boolean).join(' ')
    if (!line1 && p.street) line1 = p.street
    if (!line1) line1 = p.name
    if (!line1) continue
    if (typedNum && !/^\d/.test(line1) && (p.street || p.osm_key === 'highway')) line1 = `${typedNum} ${line1}`
    const text = [line1, p.city || p.county, [p.state, p.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    if (seen.has(text)) continue
    seen.add(text)
    out.push({ placeId: `ph-${p.osm_id || text}`, text, hasNum: /^\d/.test(text) })
    if (out.length >= 6) break
  }
  return out
}

async function fetchGeoapify(input, signal) {
  if (GEO_KEY) {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&format=json&filter=countrycode:us&limit=6&apiKey=${GEO_KEY}`
    const res = await fetch(url, { signal })
    const data = await res.json()
    return (data.results || []).map(r => ({ placeId: r.place_id, text: (r.formatted || '').replace(/, United States of America$/, '') }))
  }
  const res = await fetch(`/api/places?q=${encodeURIComponent(input)}`, { signal })
  const data = await res.json()
  return (data.suggestions || []).map(s => ({ ...s, text: (s.text || '').replace(/, United States of America$/, '') }))
}

// Float completed house-number addresses above bare streets.
function rankByHouseNumber(list, input) {
  if (!/^\d/.test((input || '').trim())) return list
  return [...list].sort((a, b) => (/^\d/.test(b.text) ? 1 : 0) - (/^\d/.test(a.text) ? 1 : 0))
}

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, className = 'wz-input' }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)
  const timerRef = useRef(null)
  const abortRef = useRef(null)
  const cacheRef = useRef(new Map())
  const skipNextFetch = useRef(false)

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const apply = useCallback((sugg) => {
    setSuggestions(sugg)
    setActive(-1)
    setOpen(true)
  }, [])

  const fetchSuggestions = useCallback(async (input) => {
    const key = input.trim().toLowerCase()
    if (cacheRef.current.has(key)) { setLoading(false); apply(cacheRef.current.get(key)); return }
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true); setOpen(true)
    const sources = [
      RADAR_KEY ? { fn: fetchRadar, pri: 3 } : MAPBOX_TOKEN ? { fn: fetchMapbox, pri: 3 } : null,
      { fn: fetchAssessor, pri: 2 },
      { fn: fetchGeoapify, pri: 1 },
      { fn: fetchPhoton, pri: 0 },
    ].filter(Boolean)

    let bestPri = -1
    let bestList = []
    const promises = sources.map(s => ({
      pri: s.pri,
      p: s.fn(input, controller.signal).catch(() => []),
    }))
    promises.forEach(({ pri, p }) => p.then(list => {
      if (controller.signal.aborted || !list.length || pri <= bestPri) return
      bestPri = pri
      bestList = pri >= 2 ? list : rankByHouseNumber(list, input)
      setLoading(false)
      apply(bestList)
    }))

    Promise.allSettled(promises.map(x => x.p)).then(() => {
      if (controller.signal.aborted) return
      setLoading(false)
      if (bestList.length) { cacheRef.current.set(key, bestList); apply(bestList) }
      else { setSuggestions([]); setOpen(false) }
    })
  }, [apply])

  function handleChange(e) {
    const v = e.target.value
    onChange(v)
    if (skipNextFetch.current) { skipNextFetch.current = false; return }
    clearTimeout(timerRef.current)
    if (v.trim().length < 3) { setSuggestions([]); setOpen(false); setLoading(false); return }
    timerRef.current = setTimeout(() => fetchSuggestions(v), 140)
  }

  function selectSuggestion(s) {
    skipNextFetch.current = true
    if (abortRef.current) abortRef.current.abort()
    setOpen(false)
    setSuggestions([])
    setLoading(false)
    onChange(s.text)
    onSelect?.(s)
  }

  function handleKey(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); selectSuggestion(suggestions[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const showMenu = open && (loading || suggestions.length > 0)

  return (
    <div className="addr-wrap" ref={wrapRef}>
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
        autoComplete="off"
      />
      {showMenu && (
        <ul className="addr-menu">
          {loading && suggestions.length === 0 && (
            <li className="addr-loading"><span className="addr-spin" /> Searching addresses…</li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={s.placeId || i}
              className={'addr-item' + (i === active ? ' active' : '')}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="addr-pin">📍</span>{s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
