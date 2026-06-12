import Link from 'next/link'
import SiteNav from '../../_components/SiteNav'
export const metadata = {
  title: 'How to give notice to vacate the right way | LeaseLock',
  description: 'Giving proper notice to vacate protects you from owing another month of rent. Here is exactly how and when to do it.',
}
export default function Page() {
  return (
    <>
      <SiteNav />
      <article className="section"><div className="wrap article">
        <span className="tagk" style={{ color: 'var(--mint)' }}>Move-out</span>
        <h1>How to give notice to vacate the right way</h1>
        <p className="lede">Miss the notice deadline and many leases roll you into another month or another full term. This is the deadline worth setting a reminder for.</p>

        <h2>Check your notice period first</h2>
        <p>Your lease states how much warning you must give before moving out, usually 30 or 60 days. Read the exact wording. Some leases require the notice to land a specific number of days before the lease ends, not just before your chosen move-out date.</p>

        <h2>Put it in writing</h2>
        <p>A text or a verbal heads up is easy to dispute. Send written notice by email or letter so there is a clear record of the date you gave it. Keep a copy for yourself.</p>
        <ul>
          <li>State the date you are giving notice</li>
          <li>State your intended last day in the unit</li>
          <li>Include your forwarding address for the deposit</li>
          <li>Ask for written confirmation that they received it</li>
        </ul>

        <h2>Watch the auto renewal trap</h2>
        <p>Many leases automatically renew unless you give notice in time, sometimes at a higher rent. If your lease has an auto renewal clause, the notice deadline is the only thing standing between you and another year you may not want.</p>

        <div className="cta-band" style={{ marginTop: 40 }}>
          <h2>Never miss the deadline.</h2>
          <p>The LeaseLock calendar reminds you before your notice window closes.</p>
          <Link href="/app" className="btn btn-mint btn-lg">Set my reminder →</Link>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 28 }}>General education, not legal advice. Notice rules vary by lease and state.</p>
      </div></article>
    </>
  )
}
