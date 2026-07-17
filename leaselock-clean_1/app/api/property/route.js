// Free property-record lookup backed by the LA County Assessor's public
// portal API (no key required). Two steps: search resolves the address to
// an AIN, parceldetail returns beds / baths / sqft / year built / use type.
// Addresses outside LA County return { found: false }.
export const runtime = 'edge'

const SEARCH = 'https://portal.assessor.lacounty.gov/api/search?search='
const DETAIL = 'https://portal.assessor.lacounty.gov/api/parceldetail?ain='

// Strip directions + street-type suffixes so "W 30th St" matches "30TH".
const NOISE = /\b(STREET|ST|AVENUE|AVE|BOULEVARD|BLVD|DRIVE|DR|ROAD|RD|LANE|LN|COURT|CT|PLACE|PL|WAY|TERRACE|TER|CIRCLE|CIR|PARKWAY|PKWY|HIGHWAY|HWY|NORTH|SOUTH|EAST|WEST|N|S|E|W)\b/g

function coreStreet(s) {
  return (s || '').toUpperCase().replace(NOISE, ' ').replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Case-insensitive field grab that tolerates naming drift in the API.
function pick(obj, names) {
  if (!obj || typeof obj !== 'object') return null
  const keys = Object.keys(obj)
  for (const n of names) {
    const k = keys.find(k => k.toLowerCase() === n.toLowerCase())
    if (k != null && obj[k] !== '' && obj[k] != null && obj[k] !== '0') return obj[k]
  }
  return null
}

const num = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

// "19829 HAMILTON AVE" / "LOS ANGELES CA" → "19829 Hamilton Ave, Los Angeles, CA 90502"
const tc = (s) => s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/(\d)(St|Nd|Rd|Th)\b/g, (_, d, suf) => d + suf.toLowerCase())
function fmtSitus(p) {
  const street = tc(String(p.SitusStreet || '').replace(/\s+/g, ' ').trim())
  const city = tc(String(p.SitusCity || '').replace(/\s+(CA|CALIF|CALIFORNIA)$/i, '').replace(/\s+/g, ' ').trim())
  const zip = String(p.SitusZipCode || '').slice(0, 5)
  return [street, city ? `${city}, CA` : 'CA'].filter(Boolean).join(', ') + (/^\d{5}$/.test(zip) && zip !== '00000' ? ` ${zip}` : '')
}

function normalize(ain, d, situs) {
  return {
    found: true,
    apn: ain,
    situs,
    yearBuilt: num(pick(d, ['YearBuiltMain', 'YearBuilt', 'EffectiveYearBuilt', 'EffectiveYear'])),
    sqft: num(pick(d, ['SqftMain', 'SQFTMain', 'SquareFootageMain', 'BuildingSqft'])),
    bedrooms: num(pick(d, ['BedroomsMain', 'Bedrooms', 'NumOfBeds', 'TotalBedrooms'])),
    bathrooms: num(pick(d, ['BathroomsMain', 'Bathrooms', 'NumOfBaths', 'TotalBathrooms'])),
    units: num(pick(d, ['NumOfUnitsMain', 'Units', 'NumOfUnits', 'TotalUnits'])),
    use: pick(d, ['UseTypeDescription', 'UseDescription', 'UseType', 'SpecificUseType', 'PropertyType']),
    source: 'LA County Assessor public records',
  }
}

const fetchJson = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`assessor ${res.status}`)
  return res.json()
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)

  // Address suggestions straight from the assessor roll (keyless, LA County).
  // Every suggestion is a real parcel, so picking one guarantees a record match.
  if (searchParams.get('suggest') != null) {
    const s = (searchParams.get('suggest') || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
    if (s.length < 3) return Response.json({ suggestions: [] })
    try {
      const data = await fetchJson(SEARCH + encodeURIComponent(s))
      const seen = new Set()
      const out = []
      for (const p of data?.Parcels || []) {
        if (!p.SitusStreet || !p.AIN) continue
        const text = fmtSitus(p)
        if (seen.has(text)) continue
        seen.add(text)
        out.push({ placeId: `la-${p.AIN}`, text })
        if (out.length >= 6) break
      }
      return Response.json({ suggestions: out }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } })
    } catch {
      return Response.json({ suggestions: [] })
    }
  }

  // Direct parcel lookup by AIN (used when a suggestion above was picked).
  // ?debug=1 returns the raw payload for field discovery.
  if (searchParams.get('ain')) {
    try {
      const detailRaw = await fetchJson(DETAIL + encodeURIComponent(searchParams.get('ain')))
      const d = detailRaw?.Parcel || detailRaw?.parcel || detailRaw
      if (searchParams.get('debug')) {
        return new Response(JSON.stringify(detailRaw).slice(0, 20000), { headers: { 'Content-Type': 'application/json' } })
      }
      if (!d?.AIN) return Response.json({ found: false })
      return Response.json(
        normalize(d.AIN, d, [d.SitusStreet, d.SitusCity].filter(Boolean).join(', ')),
        { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } }
      )
    } catch (e) {
      return Response.json({ found: false, error: String(e?.message || e) })
    }
  }

  const q = (searchParams.get('q') || '').trim()
  const m = q.match(/^(\d+)\s+([^,]+)/)
  if (!m) return Response.json({ found: false })
  const houseNo = m[1]
  const streetCore = coreStreet(m[2])
  const parts = q.split(',').map(s => s.trim())
  const zip = ((q.match(/\b\d{5}\b/g) || []).filter(z => z !== houseNo).pop()) || null

  try {
    const data = await fetchJson(SEARCH + encodeURIComponent([parts[0], parts[1]].filter(Boolean).join(' ')))
    const list = data?.Parcels || []
    const hit = list.find(p => {
      const s = (p.SitusStreet || '').toUpperCase()
      if (!s.startsWith(houseNo + ' ')) return false
      if (zip && p.SitusZipCode && !String(p.SitusZipCode).startsWith(zip)) return false
      const c = coreStreet(s.slice(houseNo.length))
      return c && streetCore && (c === streetCore || c.includes(streetCore) || streetCore.includes(c))
    }) || list.find(p => (p.SitusStreet || '').toUpperCase().startsWith(houseNo + ' ') &&
      coreStreet((p.SitusStreet || '').slice(houseNo.length)).includes(streetCore))
    if (!hit?.AIN) return Response.json({ found: false })

    const detailRaw = await fetchJson(DETAIL + hit.AIN)
    const d = detailRaw?.Parcel || detailRaw?.parcel || detailRaw
    if (searchParams.get('debug')) {
      return Response.json({ hit, detailKeys: Object.keys(d || {}), detail: d })
    }

    return Response.json(
      normalize(hit.AIN, d, [hit.SitusStreet, hit.SitusCity].filter(Boolean).join(', ')),
      { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } }
    )
  } catch (e) {
    return Response.json({ found: false, error: String(e?.message || e) })
  }
}
