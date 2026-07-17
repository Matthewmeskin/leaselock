'use client'
import { useState } from 'react'
import { track } from '../lib/analytics'

// "Fake door" pricing test: measures willingness to pay before Plus exists.
export default function FakeDoor({ placement }) {
  const [clicked, setClicked] = useState(false)
  return (
    <div className="no-print" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)', borderRadius: 16, padding: '20px 22px', color: '#fff', marginTop: 18 }}>
      {clicked ? (
        <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>
          🎉 <b>Plus is launching soon.</b> We&apos;ve noted your interest — you&apos;ll be first in line when it goes live.
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>RenterReady Plus — $4.99/mo</div>
            <div style={{ fontSize: 13.5, opacity: 0.85, marginTop: 4 }}>
              Unlimited AI lease reviews, deposit dispute letters, and priority support.
            </div>
          </div>
          <button
            onClick={() => { track('fake_door_click', { placement }); setClicked(true) }}
            style={{ background: 'var(--mint)', color: 'var(--brand-deep)', border: 'none', borderRadius: 999, padding: '11px 22px', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Upgrade to Plus →
          </button>
        </div>
      )}
    </div>
  )
}
