'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

export default function AddressAutocomplete({ value, onChange, placeholder, className = 'wz-input' }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
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
    setOpen(sugg.length > 0)
    setActive(-1)
  }, [])

  const fetchSuggestions = useCallback(async (input) => {
    const key = input.trim().toLowerCase()
    if (cacheRef.current.has(key)) { apply(cacheRef.current.get(key)); return }
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'autocomplete', input }),
        signal: controller.signal,
      })
      const data = await res.json()
      const sugg = data.suggestions || []
      cacheRef.current.set(key, sugg)
      apply(sugg)
    } catch (e) {
      if (e.name === 'AbortError') return
      setSuggestions([]); setOpen(false)
    }
  }, [apply])

  function handleChange(e) {
    const v = e.target.value
    onChange(v)
    if (skipNextFetch.current) { skipNextFetch.current = false; return }
    clearTimeout(timerRef.current)
    if (v.trim().length < 3) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(() => fetchSuggestions(v), 150)
  }

  function selectSuggestion(s) {
    skipNextFetch.current = true
    if (abortRef.current) abortRef.current.abort()
    setOpen(false)
    setSuggestions([])
    onChange(s.text)
  }

  function handleKey(e) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); selectSuggestion(suggestions[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

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
      {open && (
        <ul className="addr-menu">
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
