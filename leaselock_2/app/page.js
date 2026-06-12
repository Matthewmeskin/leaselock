import Link from 'next/link'
import SiteNav from './_components/SiteNav'

export default function Landing() {
  return (
    <>
      <SiteNav />

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">⚡ Built for first-time renters</span>
            <h1>Don't lose your <span className="hl">deposit.</span></h1>
            <p className="hero-sub">
              LeaseLock reads your lease, documents your move-in with AI, tracks every deadline, and keeps your records in one place, so the proof is on your side when it is time to get your money back.
            </p>
            <div className="hero-cta">
              <Link href="/app" className="btn btn-mint btn-lg">Protect my deposit →</Link>
              <Link href="/tools/deposit-calculator" className="btn btn-ghost btn-lg">Try a free tool</Link>
            </div>
            <div className="trust-row">
              <span><b>$1,000 to $3,000</b> at stake per lease</span>
              <span className="dot" />
              <span>Free to start · no account needed</span>
            </div>
          </div>

          <div className="demo-card">
            <div className="demo-top">
              <div className="dots"><span /><span /><span /></div>
              <span className="ttl">Lease analysis · 2BR Apartment</span>
            </div>
            <div className="demo-body">
              <div className="demo-flag flag-warn"><span className="ic">!</span><span className="tx"><b>Cleaning fee is non refundable</b><span>$250 deducted from deposit regardless of condition.</span></span></div>
              <div className="demo-flag flag-info"><span className="ic">i</span><span className="tx"><b>60 day notice required</b><span>Move out notice must be in writing by March 1.</span></span></div>
              <div className="demo-flag flag-ok"><span className="ic">✓</span><span className="tx"><b>Wear and tear protected</b><span>Landlord cannot charge for ordinary use.</span></span></div>
              <div className="demo-score"><span className="lbl">Renter readiness</span><span className="pill">82 · Ready to sign</span></div>
            </div>
          </div>
        </div>
      </header>

      <div className="strip">
        <div className="wrap strip-inner">
          <div className="stat"><div className="n">26%</div><div className="c">of renters never get their full deposit back</div></div>
          <div className="stat"><div className="n">7</div><div className="c">renter tools in one place, from sign to move-out</div></div>
          <div className="stat"><div className="n">3 min</div><div className="c">to review a full lease with LeaseLock</div></div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="tag">The problem</span>
            <h2>Most deposit disputes are lost before move-in.</h2>
            <p>Renters sign what they do not fully understand, forget to document existing damage, and have no written record when a charge shows up months later.</p>
          </div>
          <div className="prob-grid reveal">
            <div className="prob"><span className="ic">?</span><div><b>Confusing lease language</b><span>Fees and clauses buried in legal wording you skim and sign.</span></div></div>
            <div className="prob"><span className="ic">📷</span><div><b>No move-in proof</b><span>Random camera roll photos that do not hold up as evidence.</span></div></div>
            <div className="prob"><span className="ic">⏰</span><div><b>Missed deadlines</b><span>Forget your notice date and you can owe another month of rent.</span></div></div>
            <div className="prob"><span className="ic">$</span><div><b>Surprise deductions</b><span>Money taken from your deposit with no way to push back.</span></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="features" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="tag">What you get</span>
            <h2>From signing day to move-out day.</h2>
            <p>Seven tools that build your paper trail and protect your money the whole way through your lease.</p>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Tool 01</div>
              <h3>AI lease risk review</h3>
              <p>Paste your lease and get a renter friendliness score, plain English summary, and flagged clauses in seconds.</p>
              <ul className="feat-list"><li>Scored 0 to 100 on how renter friendly it is</li><li>Risk flags ranked high, medium, and low</li><li>The exact questions to ask before signing</li></ul>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">📄 Renter friendliness</div><div className="s">Score 82 · Ready to sign with caution</div></div>
              <div className="fv-card"><div className="h">⚠ 3 high risk flags</div><div className="s">Auto renewal, cleaning fee, early termination</div></div>
              <div><span className="fv-chip">✓ Questions ready to send</span></div>
            </div>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Tool 02</div>
              <h3>AI move-in photo report</h3>
              <p>Snap photos room by room. Our AI looks at each one, describes the existing damage, and builds a timestamped report.</p>
              <ul className="feat-list"><li>Upload photos for every room</li><li>AI describes the damage it sees</li><li>A clean report ready on day one</li></ul>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">🛏 Bedroom · 4 photos</div><div className="s">Scuff on north wall, stain near closet</div></div>
              <div className="fv-card"><div className="h">🚿 Bathroom · 2 photos</div><div className="s">Cracked tile behind door logged</div></div>
              <div><span className="fv-chip">📋 Report generated</span></div>
            </div>
          </div>

          <div className="feat reveal">
            <div className="feat-text">
              <div className="num">Tool 03</div>
              <h3>Deadlines, maintenance, and rent, tracked</h3>
              <p>The calendar reminds you before your notice deadline. The maintenance log builds your record. The rent log proves you paid on time.</p>
              <ul className="feat-list"><li>Never miss a notice or renewal deadline</li><li>Every repair request logged and timestamped</li><li>A clean on-time payment history</li></ul>
            </div>
            <div className="feat-visual">
              <div className="fv-card"><div className="h">📅 Notice deadline</div><div className="s">In 12 days · reminder set</div></div>
              <div className="fv-card"><div className="h">🔧 Leaking faucet</div><div className="s">Reported · message drafted</div></div>
              <div><span className="fv-chip">💵 8 payments logged</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="tools">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="tag">Free, no signup</span>
            <h2>Start with a free tool.</h2>
            <p>Useful on their own, and a taste of what the full app does.</p>
          </div>
          <div className="tools-strip reveal">
            <div className="tool-card"><div className="ic">⏱</div><h4>Deposit deadline calculator</h4><p>Find the exact date your landlord must return your deposit by.</p><Link href="/tools/deposit-calculator">Open calculator →</Link></div>
            <div className="tool-card"><div className="ic">📚</div><h4>Know your rights guides</h4><p>Plain English answers on deposits, wear and tear, and notice.</p><Link href="/guides">Read the guides →</Link></div>
            <div className="tool-card"><div className="ic">📄</div><h4>Lease risk review</h4><p>Paste your lease and see the risky clauses in seconds.</p><Link href="/app">Review my lease →</Link></div>
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">How it works</span><h2>From lease to locked in.</h2></div>
          <div className="steps reveal">
            <div className="step"><div className="sn">1</div><h4>Review your lease</h4><p>Know exactly what you are agreeing to before you sign.</p></div>
            <div className="step"><div className="sn">2</div><h4>Document and track</h4><p>Photograph move-in and set your deadlines on day one.</p></div>
            <div className="step"><div className="sn">3</div><h4>Get your money back</h4><p>Walk out with proof and the records to back you up.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">Why not just ChatGPT</span><h2>One tool does the whole job.</h2></div>
          <div className="reveal">
            <table className="cmp">
              <thead><tr><th>What you need</th><th>Phone photos</th><th>ChatGPT</th><th className="us">LeaseLock</th></tr></thead>
              <tbody>
                <tr><td>Explain a confusing clause</td><td className="cross">✕</td><td className="tick">✓</td><td className="tick">✓</td></tr>
                <tr><td>Score how risky your lease is</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Timestamped move-in report</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>Deadline reminders</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
                <tr><td>All your records in one place</td><td className="cross">✕</td><td className="cross">✕</td><td className="tick">✓</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal"><span className="tag">Renters like you</span><h2>Deposits, recovered.</h2></div>
          <div className="quote-grid reveal">
            <div className="quote"><div className="stars">★★★★★</div><p>I would have signed a lease with a hidden auto renewal if LeaseLock had not flagged it. Saved me from another year.</p><div className="who"><span className="av">JM</span><div><b>Jordan M.</b><span>Senior, off campus</span></div></div></div>
            <div className="quote"><div className="stars">★★★★★</div><p>My landlord tried to charge me for a stain that was there when I moved in. I had the photo and the date. Full deposit back.</p><div className="who"><span className="av">AT</span><div><b>Alicia T.</b><span>First apartment</span></div></div></div>
            <div className="quote"><div className="stars">★★★★★</div><p>The deadline reminder is the whole thing for me. I never would have remembered the 60 day notice on my own.</p><div className="who"><span className="av">DR</span><div><b>Diego R.</b><span>Grad student</span></div></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="wrap">
          <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 52px' }}>
            <span className="tag">Pricing</span>
            <h2>Protect a $2,000 deposit for the price of a coffee.</h2>
            <p style={{ margin: '0 auto' }}>Start free. Upgrade to Protected when you want the calendar, tracking, and full records all year.</p>
          </div>
          <div className="price-grid reveal">
            <div className="price">
              <span className="name">Free starter</span>
              <div className="amt">$0</div>
              <div className="desc">Get oriented before you sign.</div>
              <ul><li>Basic lease summary and score</li><li>One landlord message</li><li>Deposit deadline calculator</li><li className="off">Move-in photo report</li><li className="off">Calendar, maintenance, and rent tracking</li></ul>
              <Link href="/app" className="btn btn-ghost btn-lg">Start free</Link>
            </div>
            <div className="price featured">
              <span className="badge">Most popular</span>
              <span className="name">Protected</span>
              <div className="amt">$3.99 <small>/ month</small></div>
              <div className="desc">Deposit insurance for the whole lease.</div>
              <ul><li>Everything in Free</li><li>Full AI photo move-in report</li><li>Lease calendar and deadline reminders</li><li>Maintenance and rent tracking</li><li>Exportable evidence locker</li></ul>
              <Link href="/app" className="btn btn-mint btn-lg">Get protected</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Move in protected.</h2>
            <p>It takes three minutes and could save you a thousand dollars.</p>
            <Link href="/app" className="btn btn-mint btn-lg">Launch LeaseLock free →</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-inner">
            <div>
              <div className="brand"><span className="brand-mark">🔒</span> LeaseLock</div>
              <p>Sign smarter. Move in protected. Get your deposit back.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col"><h5>Product</h5><a href="#features">Features</a><a href="#pricing">Pricing</a><Link href="/app">Launch app</Link></div>
              <div className="footer-col"><h5>Free</h5><Link href="/tools/deposit-calculator">Deposit calculator</Link><Link href="/guides">Renter guides</Link></div>
            </div>
          </div>
          <div className="footer-base"><span>© 2026 LeaseLock. A USC Marshall MOR 531 project.</span><span>Built by Grant, MJ, Matthew, and Claudia.</span></div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          if(!('IntersectionObserver' in window)) return;
          document.body.classList.add('has-reveal');
          var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:0.12});
          document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
        })();
      ` }} />
    </>
  )
}
