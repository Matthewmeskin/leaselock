import './globals.css'

export const metadata = {
  title: 'LeaseLock for Landlords | Locked move-in reports, zero deposit disputes',
  description: 'Send your tenant one link. They complete a guided AI move-in inspection in five minutes and the report locks with a timestamp. Both sides hold the same record.',
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
