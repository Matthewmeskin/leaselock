import Link from 'next/link'
import SiteNav from './_components/SiteNav'
import Logo from './components/Logo'
import HeroAB, { HeroCardAB } from './_components/HeroAB'

export default function Landing() {
  return (
    <>
      <SiteNav />

      <header className="hero hero-dark">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow eyebrow-dark">For renters who want to stay protected</span>
            <HeroAB />
            <div className="trust-row trust-row-dark">
              <span><b>5 minutes</b> to set up. Protected for the full lease.</span>
              <span className="dot" />
              <span>Free to start · no account needed</span>
            </div>
          </div>

          <HeroCardAB />
        </div>
      </header>

      <div className="strip">
        <div className="wrap strip-inner">
          <div className="stat"><div className="n">5 min</div><div className="c">to set up your full renter protection suite.</div></div>
          <div className="stat"><div className="n">0 disputes</div><div className="c">when you have the right documentation from day one.</div></div>
          <div className="stat"><div className="n">1 place</div><div className="c">for your lease, photos, deadlines, and maintenance log.</div></div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="tag">The problem</span>
            <h2>Most renters lose their deposit because they did not document anything.</h2>
            <p>The damage was already there. The landlord says otherwise. And without proof from day one, you have nothing to stand on.</p>
          </div>
          <div className="prob-grid reveal">
            <div className="prob"><span className="ic">🗯</span><div><b>No move-in record</b><span>Pre-existing damage becomes your problem at move-out because nothing was documented on arrival.</span></div></div>
            <div className="prob"><span className="ic">📄</span><div><b>Lease clauses you missed</b><span>Pet fees buried in an addendum. Unauthorized sublet penalties. Early termination costs that weren't in the summary.</span></div></div>
            <div className="prob"><span className="ic">⏰</span><div><b>Missed notice deadlines</b><span>One missed 60-day notice and your landlord can legally charge an extra month of rent.</span></div></div>
            <div className="prob"><span className="ic">🔧</span><div><b>Verbal maintenance requests</b><span>If you did not put it in writing, it did not happen — and your deposit pays for it at move-out.</span></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">How it works</span><h2>Personalized setup. Full protection.</h2></div>
          <div className="steps reveal">
            <div className="step"><div className="sn">1</div><h4>Answer 5 quick questions</h4><p>Pets, roommates, co-signer, furnished unit — RenterReady tailors your lease review and inspection checklist around your situation.</p></div>
            <div className="step"><div className="sn">2</div><h4>Review your lease with AI</h4><p>Paste your lease and get a renter-friendliness score, clause-by-clause risk flags, and the exact questions to ask your landlord before signing.</p></div>
            <div className="step"><div className="sn">3</div><h4>Document your move-in</h4><p>Room by room, photo by photo. AI reads every image and writes the condition notes. You get a locked, timestamped report both sides hold.</p></div>
          </div>
          <div className="reveal" style={{ marginTop: 36 }}>
            <Link href="/app" className="btn btn-mint btn-lg">Set up your protection →</Link>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="tag">What you get</span>
            <h2>Built around the full renter lifecycle.</h2>
            <p>From the day you sign to the day you move out. RenterReady is the one place that has all of it.</p>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Before you sign</div>
              <h3>AI lease review that flags what costs you money</h3>
              <p>Paste your lease. Get a renter-friendliness score, high-risk clause flags, and questions to send your landlord — personalized to your situation.</p>
              <ul className="feat-list"><li>Scored 0–100 on how renter-friendly the lease is</li><li>Flags tailored to your pets, roommates, and plans</li><li>Ready-made questions to ask before signing</li></ul>
              <Link href="/app" className="btn btn-mint" style={{ marginTop: 18 }}>Review your lease →</Link>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">⚠️ Early termination fee</div><div className="s">2 months rent if you leave before the lease ends — no exceptions listed</div></div>
              <div className="fv-card"><div className="h">🐾 Pet clause</div><div className="s">Non-refundable $500 pet fee buried in addendum B</div></div>
              <div><span className="fv-chip">📄 Score: 61 · Review with caution</span></div>
            </div>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Move-in day</div>
              <h3>Guided inspection that actually gets done.</h3>
              <p>A room-by-room photo flow that takes about five minutes. AI writes the condition notes from your photos. The report locks with a timestamp and both sides hold identical copies.</p>
              <ul className="feat-list"><li>Personalized checklist based on your unit type</li><li>AI describes damage so notes are consistent and credible</li><li>Locked, timestamped, identical copies to both parties</li></ul>
              <Link href="/app" className="btn btn-mint" style={{ marginTop: 18 }}>Start a free inspection →</Link>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">🛏 Bedroom · 4 photos</div><div className="s">Scuff on north wall, stain near closet</div></div>
              <div className="fv-card"><div className="h">🚿 Bathroom · 2 photos</div><div className="s">Cracked tile behind door logged</div></div>
              <div><span className="fv-chip">🔒 Report locked and delivered</span></div>
            </div>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Living together</div>
              <h3>A roommate agreement everyone actually signs.</h3>
              <p>Add your roommates, fill in what you have agreed on, and the AI turns it into a clean, fair agreement. Rent splits, chores, quiet hours, guests, and move-out notice, all in plain English so nobody is relying on memory six months in.</p>
              <ul className="feat-list"><li>Covers rent, utilities, deposit, chores, guests, and more</li><li>Written balanced and neutral for every roommate</li><li>Each roommate signs, then print it or save it as proof</li></ul>
              <Link href="/app" className="btn btn-mint" style={{ marginTop: 18 }}>Write your agreement →</Link>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">🤝 Rent split</div><div className="s">Alex $900, Sam $750, both due the 1st</div></div>
              <div className="fv-card"><div className="h">🧹 Chores and quiet hours</div><div className="s">Weekly cleaning rotation, quiet after 11pm</div></div>
              <div><span className="fv-chip">✍️ Signed by all 3 roommates</span></div>
            </div>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Throughout the lease</div>
              <h3>Maintenance log, deadlines, and rent records.</h3>
              <p>Log every maintenance issue in writing, track your notice deadlines so you never miss one, and keep a clean rent payment record. All in one place.</p>
              <ul className="feat-list"><li>Written maintenance requests with timestamps</li><li>Notice deadline reminders before it costs you</li><li>On-time payment record for your next application</li></ul>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">📅 Move-out notice</div><div className="s">Deadline in 60 days · reminder set</div></div>
              <div className="fv-card"><div className="h">🔧 Leaking faucet</div><div className="s">Reported in writing · June 3, 2026</div></div>
              <div><span className="fv-chip">✓ Everything on the record</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">Compare</span><h2>Better than going in unprepared.</h2></div>
          <div className="reveal">
            <table className="cmp">
              <thead><tr><th>What you need</th><th>Doing nothing</th><th>Paper checklist</th><th className="us">RenterReady</th></tr></thead>
              <tbody>
                <tr><td>Lease risk flagged before signing</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Timestamped move-in proof</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Personalized to your situation</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Maintenance requests on record</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Deadline reminders that actually work</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">Renters like you</span><h2>Documentation that actually held up.</h2></div>
          <div className="quote-grid reveal">
            <div className="quote"><div className="stars">★★★★★</div><p>The lease review flagged a clause about unauthorized guests that I never would have caught. My landlord removed it before I signed.</p><div className="who"><span className="av">AK</span><div><b>Aisha K.</b><span>Renter, first apartment</span></div></div></div>
            <div className="quote"><div className="stars">★★★★★</div><p>My landlord tried to charge me for carpet damage at move-out. I pulled up the locked move-in report with photos from day one. Full deposit returned.</p><div className="who"><span className="av">TM</span><div><b>Tyler M.</b><span>Renter, 2-year lease</span></div></div></div>
            <div className="quote"><div className="stars">★★★★★</div><p>I shared a lease with three roommates. RenterReady caught a joint liability clause that could have made me responsible for everyone else's portion if they left.</p><div className="who"><span className="av">JL</span><div><b>Jordan L.</b><span>Shared lease, college housing</span></div></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="pricing" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 52px' }}>
            <span className="tag">Pricing</span>
            <h2>Start free. Upgrade when you need more.</h2>
            <p style={{ margin: '0 auto' }}>The core tools are free. Premium unlocks the calendar, maintenance tracker, and rent log for $19.99 per lease.</p>
          </div>
          <div className="price-grid reveal">
            <div className="price featured">
              <span className="badge">Start here</span>
              <span className="name">Free</span>
              <div className="amt">$0 <small>forever</small></div>
              <div className="desc">The protection every renter needs from day one.</div>
              <ul>
                <li>Personalized setup quiz</li>
                <li>AI lease risk review with score and flags</li>
                <li>Guided move-in inspection</li>
                <li>Locked, timestamped condition report</li>
                <li>Dashboard overview</li>
              </ul>
              <Link href="/app" className="btn btn-mint btn-lg">Set up your protection</Link>
            </div>
            <div className="price">
              <span className="name">Premium</span>
              <div className="amt">$19.99 <small>per lease</small></div>
              <div className="desc">Everything in Free, plus the tools that protect you throughout the lease.</div>
              <ul>
                <li>Lease calendar with deadline reminders</li>
                <li>Maintenance tracker with written request drafts</li>
                <li>Rent payment log</li>
                <li>Move-out comparison and deduction support</li>
                <li>Court-ready report export</li>
              </ul>
              <Link href="/app" className="btn btn-ghost btn-lg">See the full app</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Set up your protection before you sign.</h2>
            <p>Five minutes of setup. Years of documentation if you ever need it.</p>
            <Link href="/app" className="btn btn-mint btn-lg">Get started free →</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-inner">
            <div>
              <div className="brand"><Logo size={34} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span></div>
              <p>Lease review. Move-in proof. Deposit protection. All in one place.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col"><h5>Product</h5><Link href="/app">Move-in inspection</Link><a href="#pricing">Pricing</a><Link href="/signup">Sign up</Link><Link href="/login">Log in</Link></div>
              <div className="footer-col"><h5>Resources</h5><Link href="/tools/deposit-calculator">Deposit deadline calculator</Link><Link href="/guides">Renter guides</Link></div>
            </div>
          </div>
          <div className="footer-base"><span>© 2026 RenterReady. A USC Marshall MOR 531 project.</span><span>Built by Grant, MJ, Matthew, and Claudia.</span></div>
        </div>
      </footer>
    </>
  )
}
