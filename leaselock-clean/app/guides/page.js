import Link from 'next/link'
import SiteNav from '../_components/SiteNav'

export const metadata = {
  title: 'Renter guides — Know your rights | LeaseLock',
  description: 'Plain English guides to security deposits, normal wear and tear, and giving notice. Know your rights as a renter.',
}

const GUIDES = [
  { slug: 'security-deposit-basics', tag: 'Deposits', title: 'Security deposit basics every renter should know', desc: 'What a landlord can and cannot keep, and how to get your money back.' },
  { slug: 'normal-wear-and-tear', tag: 'Move-out', title: 'Normal wear and tear vs damage', desc: 'The line that decides whether you pay. Real examples for each side.' },
  { slug: 'giving-notice-to-vacate', tag: 'Move-out', title: 'How to give notice to vacate the right way', desc: 'Miss the deadline and you could owe another month. Here is how to do it.' },
]

export default function Guides() {
  return (
    <>
      <SiteNav />
      <header className="guide-hero">
        <div className="wrap">
          <span className="eyebrow" style={{ background: 'rgba(255,255,255,0.12)', color: '#cfeee4' }}>📚 Free renter guides</span>
          <h1>Know your rights before you sign.</h1>
          <p>Plain English answers to the questions that decide whether you keep your deposit. No legalese, no fluff.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap">
          <div className="guide-grid">
            {GUIDES.map(g => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="guide-card">
                <span className="tagk">{g.tag}</span>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
              </Link>
            ))}
          </div>
          <div className="cta-band" style={{ marginTop: 56 }}>
            <h2>Put it into practice.</h2>
            <p>Run your real lease through LeaseLock and see your risks in seconds.</p>
            <Link href="/app" className="btn btn-mint btn-lg">Launch the app free →</Link>
          </div>
        </div>
      </section>
      <footer className="footer"><div className="wrap"><div className="footer-base"><span>© 2026 LeaseLock</span><span>Educational content, not legal advice.</span></div></div></footer>
    </>
  )
}
