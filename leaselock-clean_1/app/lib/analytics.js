'use client'
import { createClient } from './supabase/client'

// Lightweight product analytics: anonymous session id + A/B variant in
// localStorage, events written to the `events` table (insert-only for
// visitors; reads happen through the admin_metrics RPC).

const SKEY = 'rr_sid'
const VKEY = 'rr_ab_variant'

export function sessionId() {
  if (typeof window === 'undefined') return 'server'
  let s = localStorage.getItem(SKEY)
  if (!s) {
    s = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(SKEY, s)
  }
  return s
}

// Sticky 50/50 assignment: 'deposit' (deposit-protection framing) vs
// 'comprehension' (lease-comprehension framing).
export function getVariant() {
  if (typeof window === 'undefined') return null
  let v = localStorage.getItem(VKEY)
  if (v !== 'deposit' && v !== 'comprehension') {
    v = Math.random() < 0.5 ? 'deposit' : 'comprehension'
    localStorage.setItem(VKEY, v)
  }
  return v
}

export function track(name, props = {}) {
  if (typeof window === 'undefined') return
  try {
    const supabase = createClient()
    supabase.auth.getSession()
      .then(({ data }) => supabase.from('events').insert({
        session_id: sessionId(),
        user_id: data?.session?.user?.id ?? null,
        name,
        variant: getVariant(),
        path: window.location.pathname,
        props,
      }))
      .then(() => {})
      .catch(() => {})
  } catch { /* analytics must never break the app */ }
}
