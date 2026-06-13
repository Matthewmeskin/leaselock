import Link from 'next/link'
import SiteNav from '../../_components/SiteNav'
export const metadata = {
  title: 'Normal wear and tear vs damage | LeaseLock',
  description: 'The difference between normal wear and tear and tenant damage, with real examples that decide whether you lose part of your deposit.',
}
export default function Page() {
  return (
    <>
      <SiteNav />
      <article className="section"><div className="wrap article">
        <span className="tagk" style={{ color: 'var(--mint)' }}>Move-out</span>
        <h1>Normal wear and tear vs damage</h1>
        <p className="lede">This single distinction decides most deposit disputes. Wear and tear is the landlord's cost. Damage is yours.</p>

        <h2>The simple rule</h2>
        <p>Normal wear and tear is the natural aging that happens just from living in a place. Damage is harm caused by accident, neglect, or misuse. A landlord pays for the first and can charge you for the second.</p>

        <h2>Counts as normal wear and tear</h2>
        <ul>
          <li>Faded paint and small nail holes from hanging pictures</li>
          <li>Lightly worn carpet in walking paths</li>
          <li>Loose door handles or minor scuffs on the wall</li>
          <li>Worn finish on countertops from normal use</li>
        </ul>

        <h2>Counts as damage you pay for</h2>
        <ul>
          <li>Large holes in the wall or doors</li>
          <li>Stains, burns, or tears in the carpet</li>
          <li>Broken windows, fixtures, or appliances</li>
          <li>Pet damage or unapproved paint colors</li>
        </ul>

        <h2>Why move-in photos win the argument</h2>
        <p>The hardest disputes are the gray ones. A stain that was already there. A scuff you did not cause. Without proof it is your word against the landlord's, and the deposit is in their hands. Timestamped move-in photos flip that. If the photo shows the damage existed on day one, it is not your bill.</p>

        <div className="cta-band" style={{ marginTop: 40 }}>
          <h2>Don't get charged for damage you didn't cause.</h2>
          <p>LeaseLock builds a timestamped move-in record the moment you arrive.</p>
          <Link href="/app" className="btn btn-mint btn-lg">Document my move-in →</Link>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 28 }}>General education, not legal advice. Standards vary by state and lease.</p>
      </div></article>
    </>
  )
}
