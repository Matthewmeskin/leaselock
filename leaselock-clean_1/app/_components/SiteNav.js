import Link from 'next/link'
import Logo from '../components/Logo'

export default function SiteNav() {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand"><Logo size={34} /><span>Renter<span style={{ color: 'var(--brand)' }}>Ready</span></span></Link>
        <div className="nav-links">
          <Link href="/#how" className="hide-sm">How it works</Link>
          <Link href="/guides" className="hide-sm">Guides</Link>
          <Link href="/#pricing" className="hide-sm">Pricing</Link>
          <Link href="/signup" className="btn btn-mint">Get started free</Link>
          <Link href="/login" className="btn btn-ghost hide-sm">Log in</Link>
        </div>
      </div>
    </nav>
  )
}
