/**
 * Small drawn accents that carry the hero's lighting into the rest of the page:
 * objects off the same desk, lit from the same window, each with one quiet
 * movement of its own.
 */

export type MotifId = 'chip' | 'wafer' | 'mug' | 'plant' | 'window' | 'lamp'

export function Motif({
  id,
  size = 92,
  className = '',
}: {
  id: MotifId
  size?: number
  className?: string
}) {
  const uid = `mo-${id}`
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-key`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7b37a" />
          <stop offset="55%" stopColor="#e57e83" />
          <stop offset="100%" stopColor="#7c5aa8" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* the light every motif shares */}
      <circle cx="38" cy="30" r="46" fill={`url(#${uid}-key)`} />

      {id === 'chip' && (
        <g>
          <ellipse cx="60" cy="98" rx="34" ry="6" fill="var(--ink)" opacity="0.14" filter={`url(#${uid}-soft)`} />
          <g stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round">
            {[36, 50, 64, 78].map((y) => (
              <g key={y}>
                <path d={`M18 ${y}h12`}>
                  <animate attributeName="opacity" values="1;0.25;1" dur={`${1.6 + y / 60}s`} repeatCount="indefinite" />
                </path>
                <path d={`M90 ${y}h12`}>
                  <animate attributeName="opacity" values="0.25;1;0.25" dur={`${1.9 + y / 70}s`} repeatCount="indefinite" />
                </path>
              </g>
            ))}
          </g>
          <rect x="30" y="28" width="60" height="60" rx="10" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3.5" />
          <rect x="42" y="40" width="36" height="36" rx="5" fill="var(--accent)" opacity="0.18" />
          <rect x="42" y="40" width="36" height="36" rx="5" fill="none" stroke="var(--accent)" strokeWidth="2.6" />
          <circle cx="38" cy="36" r="3" fill="var(--accent)" />
        </g>
      )}

      {id === 'wafer' && (
        <g>
          <ellipse cx="60" cy="100" rx="36" ry="6" fill="var(--ink)" opacity="0.13" filter={`url(#${uid}-soft)`} />
          <g style={{ transformOrigin: '60px 58px', animation: 'mo-spin 26s linear infinite' }}>
            <circle cx="60" cy="58" r="40" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3.5" />
            <path d="M60 18l-9 12h18z" fill="var(--ink)" />
            <g fill="var(--accent)" opacity="0.75">
              {[
                [44, 42], [60, 42], [76, 42],
                [36, 58], [52, 58], [68, 58], [84, 58],
                [44, 74], [60, 74], [76, 74],
              ].map(([x, y], i) => (
                <rect key={`${x}-${y}`} x={x - 6} y={y - 6} width="12" height="12" rx="2">
                  <animate
                    attributeName="opacity"
                    values="0.25;0.9;0.25"
                    dur={`${2.4 + (i % 5) * 0.7}s`}
                    repeatCount="indefinite"
                  />
                </rect>
              ))}
            </g>
          </g>
        </g>
      )}

      {id === 'mug' && (
        <g>
          <ellipse cx="58" cy="96" rx="28" ry="6" fill="var(--ink)" opacity="0.14" filter={`url(#${uid}-soft)`} />
          <g stroke="var(--muted)" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.55">
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${46 + i * 12} 40c-6-10 6-16 0-26`}
                style={{ animation: `hs-steam ${3.2 + i * 0.7}s ease-in-out ${i * 0.5}s infinite` }}
              />
            ))}
          </g>
          <path d="M34 48h48v30a14 14 0 0 1-14 14H48a14 14 0 0 1-14-14z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3.5" />
          <path d="M66 48h16v30a14 14 0 0 1-14 14h-2z" fill="var(--bg-2)" />
          <path d="M82 56h8a13 13 0 0 1 0 26h-8" fill="none" stroke="var(--ink)" strokeWidth="3.5" />
          <ellipse cx="58" cy="48" rx="24" ry="6" fill="#7b4a35" stroke="var(--ink)" strokeWidth="3" />
        </g>
      )}

      {id === 'plant' && (
        <g>
          <ellipse cx="60" cy="104" rx="28" ry="6" fill="var(--ink)" opacity="0.14" filter={`url(#${uid}-soft)`} />
          {[
            'M60 66c-16-26-13-56 5-78 8 26 6 56-5 78z',
            'M60 66c-30-14-42-40-37-68 21 16 35 42 37 68z',
            'M60 66c26-18 34-46 27-73-19 19-28 46-27 73z',
          ].map((d, i) => (
            <path
              key={d}
              d={d}
              fill={i % 2 ? '#2f7a5a' : '#3f9a6d'}
              stroke="var(--ink)"
              strokeWidth="3"
              style={{ transformOrigin: '60px 66px', animation: `hs-sway ${5 + i}s ease-in-out ${i * 0.4}s infinite` }}
            />
          ))}
          <path d="M36 64h48l-7 38a8 8 0 0 1-8 7H51a8 8 0 0 1-8-7z" fill="#b4674a" stroke="var(--ink)" strokeWidth="3.2" />
          <path d="M60 64h24l-7 38a8 8 0 0 1-8 7h-9z" fill="#8f4e37" />
        </g>
      )}

      {id === 'window' && (
        <g>
          <rect x="20" y="16" width="80" height="86" rx="8" fill={`url(#${uid}-sky)`} stroke="var(--ink)" strokeWidth="4" />
          <path d="M26 80h18v-14h10v14h14v-22h12v22h10" fill="#3a2b55" opacity="0.8" />
          <circle cx="80" cy="36" r="9" fill="#fff3d6" />
          <circle cx="80" cy="36" r="16" fill="#fff3d6" opacity="0.22" filter={`url(#${uid}-soft)`} />
          <path d="M60 16v86M20 59h80" stroke="var(--ink)" strokeWidth="4" />
          <g fill="#ffd9a0">
            {[[33, 70], [50, 72], [70, 66], [86, 70]].map(([x, y], i) => (
              <rect key={x} x={x} y={y} width="4" height="5" rx="1">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur={`${3 + i}s`} repeatCount="indefinite" />
              </rect>
            ))}
          </g>
        </g>
      )}

      {id === 'lamp' && (
        <g>
          <ellipse cx="60" cy="104" rx="26" ry="6" fill="var(--ink)" opacity="0.14" filter={`url(#${uid}-soft)`} />
          <circle cx="46" cy="44" r="30" fill="#ffcf9a" opacity="0.26" filter={`url(#${uid}-soft)`}>
            <animate attributeName="opacity" values="0.26;0.15;0.26" dur="4.5s" repeatCount="indefinite" />
          </circle>
          <path d="M44 96h32l-4-8H48z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3.2" />
          <path d="M60 88V52" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 52 42 34" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          <path d="M28 22h28l-6 22H34z" fill="#a970e0" stroke="var(--ink)" strokeWidth="3.4" strokeLinejoin="round" />
          <ellipse cx="42" cy="44" rx="8" ry="3" fill="#fff2c8" />
        </g>
      )}
    </svg>
  )
}
