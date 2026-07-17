import Link from 'next/link'
import SiteNav from '../../_components/SiteNav'
export const metadata = {
  title: 'The move-in documentation checklist | RenterReady',
  description: 'Everything to photograph and write down on day one — room by room — so your security deposit is protected before you unpack a single box.',
}
export default function Page() {
  return (
    <>
      <SiteNav />
      <article className="section"><div className="wrap article">
        <span className="tagk" style={{ color: 'var(--mint)' }}>Move-in</span>
        <h1>The move-in documentation checklist</h1>
        <p className="lede">The hour you spend documenting your unit on day one is the single highest-leverage thing you can do to protect your deposit. Here is exactly what to capture, room by room.</p>

        <h2>Before you move a single box</h2>
        <p>Do your walkthrough while the unit is empty. Empty rooms photograph clearly, and nothing you own can be blamed for hiding damage. Turn on every light, open the blinds, and take your time.</p>
        <ul>
          <li>Shoot wide photos of every room from at least two corners</li>
          <li>Capture close-ups of any existing damage: stains, scratches, chips, dents, cracks</li>
          <li>Make sure your camera saves timestamps — screenshots and edited photos are weaker evidence</li>
        </ul>

        <h2>Room-by-room checklist</h2>
        <p>Walk in a loop so you never skip a space. For each room, photograph the floor, the walls, the ceiling, the windows, and anything the landlord provided.</p>
        <ul>
          <li><b>Entry and hallways:</b> front door and locks, doorbell, walls, flooring</li>
          <li><b>Kitchen:</b> inside and outside of every appliance, under the sink, counters, cabinet doors</li>
          <li><b>Bathrooms:</b> tub and grout, toilet, under-sink plumbing, exhaust fan, caulk lines</li>
          <li><b>Bedrooms and living room:</b> carpet or floor condition, closet doors and tracks, window screens and latches</li>
          <li><b>Laundry and utility areas:</b> washer and dryer condition, water heater, breaker panel</li>
          <li><b>Outdoors, if you have it:</b> balcony or patio surfaces, railings, any storage areas</li>
        </ul>

        <h2>The things everyone forgets</h2>
        <p>Damage disputes rarely come from the obvious stuff. They come from the corners nobody photographed. Add these to your list:</p>
        <ul>
          <li>Behind and under appliances — pull the fridge out a few inches if you can</li>
          <li>Inside drawers, cabinets, and the oven</li>
          <li>Water pressure and drain speed in every sink, tub, and shower</li>
          <li>Every outlet and light switch — a cheap outlet tester takes seconds per plug</li>
          <li>Smoke and carbon monoxide detectors, including whether they beep on test</li>
          <li>Utility meter readings the day you get the keys</li>
        </ul>

        <h2>Write it down, then lock it</h2>
        <p>Photos show condition, but notes give them meaning. For each problem you find, write one sentence: what it is, where it is, and how bad it is. "Quarter-sized stain on carpet, northeast corner of bedroom" beats a bare photo every time.</p>
        <p>Then put your documentation somewhere permanent. A report that is timestamped and can no longer be edited is far more convincing than photos scattered across your camera roll — and sending a copy to your landlord on day one means nobody can claim surprise at move-out.</p>

        <h2>Share it with your landlord</h2>
        <p>The final step is the one most renters skip: give your landlord a copy of the record and ask them to acknowledge it. If they sign off on the unit's condition at move-in, an unfair deduction at move-out becomes almost impossible to justify.</p>

        <div className="cta-band" style={{ marginTop: 40 }}>
          <h2>Do the whole checklist in about 5 minutes.</h2>
          <p>RenterReady walks you room by room, writes the condition notes with AI, locks the report with a timestamp, and sends it to your landlord to sign.</p>
          <Link href="/report" className="btn btn-mint btn-lg">Start your move-in report →</Link>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 28 }}>This guide is general education, not legal advice. Rules vary by state, so check your local tenant laws for specifics.</p>
      </div></article>
    </>
  )
}
