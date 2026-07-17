'use client'
import { useState, useEffect } from 'react'
import Logo from './Logo'

// Animated "AI is working" loader shared by the report builder and lease review.
export default function GeneratingLoader({ title, msgs }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % msgs.length), 1500)
    return () => clearInterval(t)
  }, [msgs.length])
  return (
    <div className="gen-wrap">
      <div className="gen-scene">
        <Logo size={96} className="gen-house" />
        <span className="gen-glass">🔍</span>
      </div>
      <h2 className="gen-title">{title}</h2>
      <p className="gen-msg" key={i}>{msgs[i]}…</p>
      <div className="gen-dots"><span /><span /><span /></div>
    </div>
  )
}
