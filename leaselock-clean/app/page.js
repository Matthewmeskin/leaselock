import Link from 'next/link'
import SiteNav from './_components/SiteNav'

export default function Landing() {
  return (
    <>
      <SiteNav />

      <header className="hero hero-dark">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow eyebrow-dark">For landlords and property managers</span>
            <h1>End deposit disputes <span className="hl-dark">before they start.</span></h1>
            <p className="hero-sub hero-sub-dark">
              Send your tenant one link. They complete a guided move-in inspection in five minutes, AI documents every photo, and the report locks with a timestamp. You both hold the same record, so there is nothing to argue about at move-out.
            </p>
            <div className="hero-cta">
              <Link href="/report" className="btn btn-mint btn-lg">Start a free inspection →</Link>
              <a href="#how" className="btn btn-ghost-dark btn-lg">See how it works</a>
            </div>
            <div className="trust-row trust-row-dark">
              <span><b>5 minutes</b> per unit, done by the tenant</span>
              <span className="dot" />
              <span>Free to try · no account needed</span>
            </div>
          </div>

          <div className="report-card">
            <div className="rc-top">
              <span className="rc-title">Move-in condition report</span>
              <span className="rc-lock">🔒 Locked · Jun 1, 2026 · 4:12 PM</span>
            </div>
            <div className="rc-body">
              <div className="rc-row"><span className="rc-room">🛏 Bedroom</span><span className="rc-note">Scuff on north wall, stain near closet · 4 photos</span></div>
              <div className="rc-row"><span className="rc-room">🚿 Bathroom</span><span className="rc-note">Cracked tile behind door · 2 photos</span></div>
              <div className="rc-row"><span className="rc-room">🍳 Kitchen</span><span className="rc-note">No damage found · 3 photos</span></div>
              <div className="rc-acks">
                <div className="rc-ack"><span className="rc-check">✓</span><span><b>Tenant</b> · J. Rivera · acknowledged</span></div>
                <div className="rc-ack"><span className="rc-check">✓</span><span><b>Landlord</b> · M. Chen · copy delivered</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="strip">
        <div className="wrap strip-inner">
          <div className="stat"><div className="n">1 link</div><div className="c">is all you send. The tenant does the walkthrough, not you.</div></div>
          <div className="stat"><div className="n">2 copies</div><div className="c">of one locked report. Both sides hold identical evidence.</div></div>
          <div className="stat"><div className="n">0 arguments</div><div className="c">about what the unit looked like on day one.</div></div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="tag">The problem</span>
            <h2>Move-out is where good tenancies go bad.</h2>
            <p>You deduct for real damage. The tenant swears it was already there. Now you are digging through old texts for photos that prove nothing, and a $300 deduction is headed to small claims court.</p>
          </div>
          <div className="prob-grid reveal">
            <div className="prob"><span className="ic">🗯</span><div><b>He said, she said</b><span>Without a shared record, every deduction turns into a negotiation.</span></div></div>
            <div className="prob"><span className="ic">📷</span><div><b>Photos that prove nothing</b><span>Loose camera roll shots with no timestamps, no room labels, no signatures.</span></div></div>
            <div className="prob"><span className="ic">⚖</span><div><b>Court costs more than the damage</b><span>One disputed deposit can eat a day of your time and the deduction itself.</span></div></div>
            <div className="prob"><span className="ic">📋</span><div><b>Paper checklists never come back</b><span>And when they do, they are half filled out and impossible to read.</span></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">How it works</span><h2>Your tenant does the work. You get the proof.</h2></div>
          <div className="steps reveal">
            <div className="step"><div className="sn">1</div><h4>Send the link</h4><p>Add LeaseLock to your lease or text the inspection link on move-in day.</p></div>
            <div className="step"><div className="sn">2</div><h4>Tenant walks the unit</h4><p>A guided, room by room flow that is mostly tapping. AI reads every photo and writes the condition notes.</p></div>
            <div className="step"><div className="sn">3</div><h4>The report locks</h4><p>Timestamped, signed off, and delivered to both of you. Nobody can edit it after the fact.</p></div>
          </div>
          <div className="reveal" style={{ marginTop: 36 }}>
            <Link href="/report" className="btn btn-mint btn-lg">Run a test inspection on your own unit →</Link>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="tag">What you get</span>
            <h2>Built around the move-in report.</h2>
            <p>The inspection is the product. Everything else exists to make sure it gets done and holds up.</p>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">The core</div>
              <h3>Guided move-in inspection</h3>
              <p>Tenants do not skip it because it is fast and it protects them too. One room at a time, photo prompts for the spots that cause disputes, AI condition notes on every image.</p>
              <ul className="feat-list"><li>Finished in about five minutes per unit</li><li>AI describes damage so notes are consistent across tenants</li><li>Locked, timestamped, identical copies to both parties</li></ul>
              <Link href="/report" className="btn btn-mint" style={{ marginTop: 18 }}>Start a free inspection →</Link>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">🛏 Bedroom · 4 photos</div><div className="s">Scuff on north wall, stain near closet</div></div>
              <div className="fv-card"><div className="h">🚿 Bathroom · 2 photos</div><div className="s">Cracked tile behind door logged</div></div>
              <div><span className="fv-chip">🔒 Report locked and delivered</span></div>
            </div>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Why tenants actually complete it</div>
              <h3>Mutual accountability, not surveillance.</h3>
              <p>The same report that protects your property protects their deposit. That is why completion beats any paper checklist you have ever handed out. Tenants also get lease deadline reminders, a maintenance log, and a rent payment record, which means fewer surprises for you.</p>
              <ul className="feat-list"><li>Tenants are motivated to document, not avoid it</li><li>Maintenance requests arrive written and timestamped</li><li>Notice deadlines stop getting missed</li></ul>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">📅 Notice deadline</div><div className="s">Tenant reminded 30 days out</div></div>
              <div className="fv-card"><div className="h">🔧 Leaking faucet</div><div className="s">Reported in writing, day one</div></div>
              <div><span className="fv-chip">✓ Both sides on the record</span></div>
            </div>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">At move-out</div>
              <h3>Deductions that hold up.</h3>
              <p>Pull up the locked move-in report next to move-out photos. New damage is obvious, normal wear and tear is obvious, and your deduction letter writes itself. If it ever does go to court, you walk in with the strongest record in the room.</p>
              <ul className="feat-list"><li>Side by side move-in condition for every room</li><li>Evidence your tenant already acknowledged</li><li>Exportable report for deduction letters or court</li></ul>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">📄 Move-in vs move-out</div><div className="s">Bedroom wall: scuff pre-existing</div></div>
              <div className="fv-card"><div className="h">🧾 Deduction support</div><div className="s">Carpet burn: new, documented</div></div>
              <div><span className="fv-chip">⚖ Court ready export</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">Compare</span><h2>Better than the way you do it now.</h2></div>
          <div className="reveal">
            <table className="cmp">
              <thead><tr><th>What you need</th><th>Paper checklist</th><th>Texted photos</th><th className="us">LeaseLock</th></tr></thead>
              <tbody>
                <tr><td>Actually gets completed</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Timestamped and tamper proof</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Acknowledged by both parties</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Consistent across every unit</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Zero minutes of your time</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">Landlords like you</span><h2>Fewer disputes. Faster turnovers.</h2></div>
          <div className="quote-grid reveal">
            <div className="quote"><div className="stars">★★★★★</div><p>I used to drive to the unit and do the walkthrough myself with a clipboard. Now I text a link from my couch and the report shows up signed.</p><div className="who"><span className="av">MC</span><div><b>Marcus C.</b><span>Duplex owner, 4 units</span></div></div></div>
            <div className="quote"><div className="stars">★★★★★</div><p>A tenant disputed a carpet charge at move-out. I sent the locked move-in report they had acknowledged. The conversation ended there.</p><div className="who"><span className="av">SP</span><div><b>Sandra P.</b><span>Independent landlord, 12 units</span></div></div></div>
            <div className="quote"><div className="stars">★★★★★</div><p>We made it a lease requirement across the portfolio. Every unit now has the same documentation, no matter which tenant moved in.</p><div className="who"><span className="av">DK</span><div><b>David K.</b><span>Property manager, 40 doors</span></div></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="pricing" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 52px' }}>
            <span className="tag">Pricing</span>
            <h2>One avoided dispute pays for years of this.</h2>
            <p style={{ margin: '0 auto' }}>Try it on one unit free. Make it a lease requirement when you are convinced.</p>
          </div>
          <div className="price-grid reveal">
            <div className="price">
              <span className="name">Single unit</span>
              <div className="amt">$0</div>
              <div className="desc">Prove it to yourself on your next move-in.</div>
              <ul><li>One guided move-in inspection</li><li>AI photo condition notes</li><li>Locked, timestamped report to both parties</li><li className="off">Multiple units and report archive</li><li className="off">Move-out comparison and exports</li></ul>
              <Link href="/report" className="btn btn-ghost btn-lg">Start free</Link>
            </div>
            <div className="price featured">
              <span className="badge">Most popular</span>
              <span className="name">Portfolio</span>
              <div className="amt">$3.99 <small>/ unit / month</small></div>
              <div className="desc">Every unit documented the same way, every time.</div>
              <ul><li>Unlimited move-in and move-out inspections</li><li>Report archive across all your units</li><li>Move-out comparison and deduction support</li><li>Court ready exports</li><li>Tenant tools included, no cost to tenants</li></ul>
              <Link href="/report" className="btn btn-mint btn-lg">Protect my units</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Require it on your next lease.</h2>
            <p>Five minutes of your tenant's time. Years of protection for your property.</p>
            <Link href="/report" className="btn btn-mint btn-lg">Start a free inspection →</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-inner">
            <div>
              <div className="brand"><span className="brand-mark">🔒</span> LeaseLock</div>
              <p>One locked move-in report. Both sides protected. Zero disputes.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col"><h5>Product</h5><Link href="/report">Move-in inspection</Link><a href="#pricing">Pricing</a><Link href="/app">Tenant app</Link></div>
              <div className="footer-col"><h5>Resources</h5><Link href="/tools/deposit-calculator">Deposit deadline calculator</Link><Link href="/guides">Deposit guides</Link></div>
            </div>
          </div>
          <div className="footer-base"><span>© 2026 LeaseLock. A USC Marshall MOR 531 project.</span><span>Built by Grant, MJ, Matthew, and Claudia.</span></div>
        </div>
      </footer>
    </>
  )
}
