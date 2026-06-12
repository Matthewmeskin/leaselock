import Link from 'next/link'
export default function SiteNav() {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand"><span className="brand-mark">🔒</span> LeaseLock</Link>
        <div className="nav-links">
          <Link href="/guides" className="hide-sm">Guides</Link>
          <Link href="/tools/deposit-calculator" className="hide-sm">Free tools</Link>
          <Link href="/app" className="btn btn-ink">Launch app</Link>
        </div>
      </div>
    </nav>
  )
}
