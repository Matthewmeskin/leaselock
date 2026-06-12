import Link from 'next/link'
import SiteNav from '../../_components/SiteNav'
export const metadata = {
  title: 'Security deposit basics every renter should know | LeaseLock',
  description: 'What your landlord can legally keep from your security deposit, how long they have to return it, and how to protect your money.',
}
export default function Page() {
  return (
    <>
      <SiteNav />
      <article className="section"><div className="wrap article">
        <span className="tagk" style={{ color: 'var(--mint)' }}>Deposits</span>
        <h1>Security deposit basics every renter should know</h1>
        <p className="lede">Your deposit is often the largest sum of money in the whole rental relationship. Here is what actually decides whether you get it back.</p>

        <h2>What a landlord can keep</h2>
        <p>In most states a landlord can only deduct from your deposit for a short, specific list of reasons. The usual ones are unpaid rent, the cost of repairing damage beyond normal wear, and cleaning needed to return the unit to its move-in condition.</p>
        <ul>
          <li>Unpaid rent or unpaid utility bills you were responsible for</li>
          <li>Repairs for actual damage, like a broken window or a hole in the wall</li>
          <li>Cleaning to bring the unit back to how you received it</li>
        </ul>

        <h2>What a landlord cannot keep</h2>
        <p>A landlord generally cannot charge you for ordinary aging of the unit, or for problems that existed before you moved in. This is exactly why your move-in documentation matters so much. If you have photos proving a stain was there on day one, the landlord cannot put it on you at move-out.</p>

        <h2>How long they have to return it</h2>
        <p>Most states give landlords a deadline, often somewhere between 14 and 45 days after you move out, to either return your full deposit or send an itemized list of deductions. If they miss the deadline, many states force them to return the entire deposit and some add a penalty on top.</p>

        <h2>How to protect your money</h2>
        <p>The renters who get their deposits back almost always do the same three things. They document the unit with timestamped photos at move-in, they keep every landlord message in writing, and they send a written request for the deposit when they leave.</p>
        <ul>
          <li>Photograph every room before you move a single box in</li>
          <li>Put maintenance requests and questions in writing, never just a phone call</li>
          <li>Send a written deposit return request with your forwarding address</li>
        </ul>

        <div className="cta-band" style={{ marginTop: 40 }}>
          <h2>Build your proof in minutes.</h2>
          <p>LeaseLock documents your move-in and keeps every record in one place.</p>
          <Link href="/app" className="btn btn-mint btn-lg">Start free →</Link>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 28 }}>This guide is general education, not legal advice. Deposit laws vary by state, so check your local rules or talk to a tenant rights group for your situation.</p>
      </div></article>
    </>
  )
}
