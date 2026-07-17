'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// Two geocoders race in parallel and the fastest non-empty answer wins:
// Photon (komoot, free, no key) and Geoapify (direct from the browser when a
// public key is set, otherwise via the /api/places proxy).
const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

async function fetchPhoton(input, signal) {
  const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=8&lang=en`, { signal })
  const data = await res.json()
  const seen = new Set()
  const out = []
  for (const f of data.features || []) {
    const p = f.properties || {}
    if (p.countrycode && p.countrycode !== 'US') continue
    const line1 = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name
    if (!line1) continue
    const text = [line1, p.city || p.county, [p.state, p.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    if (seen.has(text)) continue
    seen.add(text)
    out.push({ placeId: `ph-${p.osm_id || text}`, text })
    if (out.length >= 6) break
  }
  return out
}

async function fetchGeoapify(input, signal) {
  if (GEO_KEY) {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&format=json&filter=countrycode:us&limit=6&apiKey=${GEO_KEY}`
    const res = await fetch(url, { signal })
    const data = await res.json()
    return (data.results || []).map(r => ({ placeId: r.place_id, text: r.formatted }))
  }
  const res = await fetch(`/api/places?q=${encodeURIComponent(input)}`, { signal })
  const data = await res.json()
  return data.suggestions || []
}

// Resolve with the first non-empty result; empty only if every source is empty/failed.
function firstNonEmpty(promises) {
  return new Promise((resolve) => {
    let pending = promises.length
    for (const p of promises) {
      p.then(r => {
        if (Array.isArray(r) && r.length) resolve(r)
        else if (--pending === 0) resolve([])
      }).catch(() => {
        if (--pending === 0) resolve([])
      })
    }
  })
}

export default function AddressAutocomplete({ value, onChange, placeholder, className = 'wz-input' }) {
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
    try {
      const sugg = await firstNonEmpty([
        fetchPhoton(input, controller.signal),
        fetchGeoapify(input, controller.signal),
      ])
      if (controller.signal.aborted) return
      cacheRef.current.set(key, sugg)
      setLoading(false)
      apply(sugg)
    } catch (e) {
      if (e.name === 'AbortError') return
      setLoading(false); setSuggestions([]); setOpen(false)
    }
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
