// Free property-record lookup backed by the LA County Assessor's open
// dataset on Socrata (no API key, no request cap for reasonable use).
// Returns beds / baths / sqft / year built / use type for an address.
export const runtime = 'edge'

const DATASET = 'https://data.lacounty.gov/resource/9trm-uz8i.json'

// Strip directions + street-type suffixes so "W 30th St" matches "30TH".
const NOISE = /\b(STREET|ST|AVENUE|AVE|BOULEVARD|BLVD|DRIVE|DR|ROAD|RD|LANE|LN|COURT|CT|PLACE|PL|WAY|TERRACE|TER|CIRCLE|CIR|PARKWAY|PKWY|HIGHWAY|HWY|NORTH|SOUTH|EAST|WEST|N|S|E|W)\b/g

function coreStreet(s) {
  return (s || '').toUpperCase().replace(NOISE, ' ').replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)

  // Field-discovery probe: return one raw dataset row.
  if (searchParams.get('probe')) {
    try {
      const r = await fetch(`${DATASET}?$limit=1`, { signal: AbortSignal.timeout(8000) })
      return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json' } })
    } catch (e) {
      return Response.json({ probeError: String(e?.message || e) }, { status: 502 })
    }
  }

  const q = (searchParams.get('q') || '').trim()
  const m = q.match(/^(\d+)\s+([^,]+)/)
  if (!m) return Response.json({ found: false })
  const houseNo = m[1]
  const street = coreStreet(m[2])
  const parts = q.split(',').map(s => s.trim())
  const city = (parts[1] || '').toUpperCase().replace(/[^A-Z ]/g, '').trim()
  const zip = ((q.match(/\b\d{5}\b/g) || []).filter(z => z !== houseNo).pop()) || null

  let where = `situshouseno='${houseNo}'`
  if (zip) where += ` and situszip like '${zip}%'`
  else if (city) where += ` and upper(situscity) like '%${city.replace(/'/g, "''")}%'`

  const url = `${DATASET}?$where=${encodeURIComponent(where)}&$order=rollyear DESC&$limit=50`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return Response.json({ found: false, error: `dataset ${res.status}` })
    const rows = await res.json()
    if (searchParams.get('debug')) return Response.json({ where, count: rows.length, rows: rows.slice(0, 3) })

    // Newest roll year first; take the row whose street matches what was typed.
    const hit = rows.find(r => {
      const rc = coreStreet(r.situsstreet)
      return rc && street && (rc === street || rc.includes(street) || street.includes(rc))
    }) || (rows.length === 1 ? rows[0] : null)
    if (!hit) return Response.json({ found: false })

    return Response.json({
      found: true,
      apn: hit.ain || null,
      yearBuilt: num(hit.yearbuilt),
      sqft: num(hit.sqftmain),
      bedrooms: num(hit.bedrooms),
      bathrooms: num(hit.bathrooms),
      units: num(hit.units),
      use: hit.usedescription || hit.usetype || null,
      rollYear: hit.rollyear || null,
      source: 'LA County Assessor public records',
    }, { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } })
  } catch (e) {
    return Response.json({ found: false, error: String(e?.message || e) })
  }
}
