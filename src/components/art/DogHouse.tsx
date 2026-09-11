/**
 * BYTE's kennel, parked in the corner he lives in. Drawn to the same rules as
 * he is: flat colour, one dark outline, light from the upper right.
 */
export function DogHouse({ className = '', occupied = false }: { className?: string; occupied?: boolean }) {
  const INK = '#3a2a18'
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="dh-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c98a5e" />
          <stop offset="100%" stopColor="#a76b45" />
        </linearGradient>
        <linearGradient id="dh-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8f5b6e" />
          <stop offset="100%" stopColor="#6d4253" />
        </linearGradient>
        <filter id="dh-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* what it sits in */}
      <ellipse cx="80" cy="130" rx="60" ry="8" fill="#1d1428" opacity="0.26" filter="url(#dh-soft)" />

      {/* body */}
      <path d="M26 128V62h108v66z" fill="url(#dh-wood)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      {/* plank lines */}
      <g stroke="#8a5537" strokeWidth="2" opacity="0.45">
        <path d="M26 84h108M26 104h108" />
      </g>
      {/* the shaded side, away from the window */}
      <path d="M26 128V62h22v66z" fill="#6d4430" opacity="0.35" />

      {/* doorway, and the dark of the inside */}
      <path d="M80 76c17 0 28 13 28 30v22H52v-22c0-17 11-30 28-30z" fill="#2a1b12" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M80 84c12 0 20 9 20 22v22H60v-22c0-13 8-22 20-22z" fill="#1a1009" />

      {/* roof */}
      <path d="M80 14 148 66H12z" fill="url(#dh-roof)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M80 14 148 66h-16L80 26z" fill="#ffffff" opacity="0.1" />
      <path d="M80 26 26 66H12z" fill="#000000" opacity="0.12" />
      {/* ridge */}
      <path d="M80 14v12" stroke={INK} strokeWidth="4" strokeLinecap="round" />

      {/* nameplate */}
      <rect x="58" y="52" width="44" height="15" rx="4" fill="#f2e0c4" stroke={INK} strokeWidth="3" />
      <text
        x="80"
        y="63.5"
        textAnchor="middle"
        fontSize="10"
        fill={INK}
        style={{ fontFamily: 'var(--font-tech)', letterSpacing: '0.1em' }}
      >
        BYTE
      </text>

      {/* Two eyes in the dark while he is in there, so it does not read as empty. */}
      {occupied && (
        <g>
          <circle cx="73" cy="112" r="3.6" fill="#2fb8f5">
            <animate attributeName="opacity" values="1;0.35;1" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="87" cy="112" r="3.6" fill="#f6d79c" opacity="0.9" />
        </g>
      )}
    </svg>
  )
}
