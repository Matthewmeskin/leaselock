import Link from 'next/link'
export default function SiteNav() {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand"><span className="brand-mark">🔒</span> LeaseLock</Link>
        <div className="nav-links">
          <Link href="/report" className="hide-sm">Move-in inspection</Link>
          <Link href="/guides" className="hide-sm">Guides</Link>
          <Link href="/#pricing" className="hide-sm">Pricing</Link>
          <Link href="/report" className="btn btn-mint">Start an inspection</Link>
          <Link href="/app" className="btn btn-ghost">Launch app</Link>
        </div>
      </div>
    </nav>
  )
}
