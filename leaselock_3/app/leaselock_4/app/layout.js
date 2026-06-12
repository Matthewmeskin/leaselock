import './globals.css'

export const metadata = {
  title: 'LeaseLock — Protect your security deposit',
  description: 'Understand your lease, document move-in condition, and get your deposit back. Built for renters.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
