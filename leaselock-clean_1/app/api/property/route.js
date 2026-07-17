// Free property-record lookup backed by the LA County Assessor's public
// portal API (no key required). Returns beds / baths / sqft / year built /
// use type for an address inside LA County; { found: false } elsewhere.
export const runtime = 'edge'

const API = 'https://portal.assessor.lacounty.gov/api/search?search='

// Case-insensitive field grab that tolerates naming drift in the API.
function pick(obj, names) {
  if (!obj) return null
  const keys = Object.keys(obj)
  for (const n of names) {
    const k = keys.find(k => k.toLowerCase() === n.toLowerCase())
    if (k != null && obj[k] !== '' && obj[k] != null) return obj[k]
  }
  return null
}

const num = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)

  // Raw response probe for field discovery: /api/property?probe=<address>
  if (searchParams.get('probe')) {
    try {
      const r = await fetch(API + encodeURIComponent(searchParams.get('probe')), {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json' },
      })
      const body = await r.text()
      return new Response(body.slice(0, 20000), { status: r.status, headers: { 'Content-Type': 'application/json' } })
    } catch (e) {
      return Response.json({ probeError: String(e?.message || e) }, { status: 502 })
    }
  }

  const q = (searchParams.get('q') || '').trim()
  const m = q.match(/^(\d+)\s+([^,]+)/)
  if (!m) return Response.json({ found: false })
  // The portal matches best on "NUMBER STREET CITY" without state/zip noise.
  const parts = q.split(',').map(s => s.trim())
  const search = [parts[0], parts[1]].filter(Boolean).join(' ')

  try {
    const res = await fetch(API + encodeURIComponent(search), {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return Response.json({ found: false, error: `assessor ${res.status}` })
    const data = await res.json()
    const list = Array.isArray(data) ? data
      : pick(data, ['Parcels', 'parcels', 'results', 'items', 'data']) || []
    if (searchParams.get('debug')) return Response.json({ search, count: list.length, first: list[0] || null })
    const hit = list[0]
    if (!hit) return Response.json({ found: false })

    return Response.json({
      found: true,
      apn: pick(hit, ['AIN', 'ain', 'APN', 'ParcelNumber']),
      yearBuilt: num(pick(hit, ['YearBuilt', 'EffectiveYearBuilt', 'yearbuilt'])),
      sqft: num(pick(hit, ['SqftMain', 'SQFTmain', 'BuildingSqft', 'sqft'])),
      bedrooms: num(pick(hit, ['Bedrooms', 'NumOfBeds', 'bedrooms'])),
      bathrooms: num(pick(hit, ['Bathrooms', 'NumOfBaths', 'bathrooms'])),
      units: num(pick(hit, ['Units', 'NumOfUnits', 'units'])),
      use: pick(hit, ['UseType', 'UseDescription', 'SpecificUseDetail1', 'usetype']),
      situs: pick(hit, ['SitusAddress', 'situsaddress', 'Situs']),
      source: 'LA County Assessor public records',
    }, { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } })
  } catch (e) {
    return Response.json({ found: false, error: String(e?.message || e) })
  }
}
