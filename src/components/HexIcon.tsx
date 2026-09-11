/** Small line icons for the wall panels. Drawn here so there is no icon set. */
export function HexIcon({ id, size = 22 }: { id: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (id) {
    case 'about':
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.6" />
          <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
        </svg>
      )
    case 'labs':
      return (
        <svg {...common}>
          <rect x="7.5" y="7.5" width="9" height="9" rx="1.4" />
          <path d="M10.5 4v3.5M13.5 4v3.5M10.5 16.5V20M13.5 16.5V20M4 10.5h3.5M4 13.5h3.5M16.5 10.5H20M16.5 13.5H20" />
        </svg>
      )
    case 'papers':
      return (
        <svg {...common}>
          <path d="M6 3.5h8.5L18 7v13.5H6z" />
          <path d="M9 11h6M9 14.5h6M9 7.5h2.5" />
        </svg>
      )
    case 'openings':
      return (
        <svg {...common}>
          <path d="M3.5 7.5 12 4l8.5 3.5L12 11z" />
          <path d="M6.5 9.6V15c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3V9.6" />
        </svg>
      )
    case 'arcade':
      return (
        <svg {...common}>
          <rect x="3" y="7.5" width="18" height="10" rx="4" />
          <path d="M7.5 10.5v4M5.5 12.5h4" />
          <circle cx="15.8" cy="11.6" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="17.8" cy="13.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'contact':
    default:
      return (
        <svg {...common}>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="m3.8 7 8.2 6 8.2-6" />
        </svg>
      )
  }
}
