'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// Call Geoapify directly from the browser when a public key is available (fastest:
// no proxy hop). Falls back to the /api/places server route if the public key isn't set.
const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

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
      let sugg
      if (GEO_KEY) {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&format=json&filter=countrycode:us&limit=6&apiKey=${GEO_KEY}`
        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()
        sugg = (data.results || []).map(r => ({ placeId: r.place_id, text: r.formatted }))
      } else {
        const res = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'autocomplete', input }),
          signal: controller.signal,
        })
        const data = await res.json()
        sugg = data.suggestions || []
      }
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
