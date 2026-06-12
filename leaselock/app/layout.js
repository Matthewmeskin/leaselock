export const metadata = {
  title: 'LeaseLock — Renter Protection Toolkit',
  description: 'Sign smarter. Move in protected. Get your deposit back.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', background: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}
