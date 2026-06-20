import Link from 'next/link'
export default function SiteNav() {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand"><span className="brand-mark">🏠</span> RenterReady</Link>
        <div className="nav-links">
          <Link href="/#how" className="hide-sm">How it works</Link>
          <Link href="/guides" className="hide-sm">Guides</Link>
          <Link href="/#pricing" className="hide-sm">Pricing</Link>
          <Link href="/app" className="btn btn-mint">Start an inspection</Link>
          <Link href="/app" className="btn btn-ghost hide-sm">Launch app</Link>
        </div>
      </div>
    </nav>
  )
}
