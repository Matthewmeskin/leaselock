export default function Logo({ size = 32, className, style }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="RenterReady"
    >
      <rect x="2" y="2" width="96" height="96" rx="24" fill="var(--brand)" />
      <path d="M50 22 L80 49 L70 49 L70 78 L30 78 L30 49 L20 49 Z" fill="var(--mint)" />
      <path
        d="M39 59 L46 67 L62 49"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
