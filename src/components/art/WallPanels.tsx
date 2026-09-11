/**
 * Four small framed prints hung on the wall behind the desk. Each is a real
 * anchor, so they are clickable and keyboard reachable exactly like any other
 * link, and each hangs off its own nail with a wire and a cast shadow.
 *
 * Rendered as SVG children, so this must sit inside an <svg>.
 */

export type PanelLink = {
  id: string
  href: string
  label: string
  /** The accent this section uses elsewhere on the page. */
  hue: string
  /** Pale ground of the print. */
  tint: string
  /** Line colour of the drawing inside it. */
  ink: string
}

export const PANELS: PanelLink[] = [
  { id: 'about', href: '#about', label: 'About', hue: '#2f7fd0', tint: '#dceefb', ink: '#1d4f7d' },
  { id: 'research', href: '#research', label: 'Research', hue: '#1f9d6b', tint: '#d9f5e8', ink: '#136142' },
  { id: 'papers', href: '#papers', label: 'Papers', hue: '#d08a2a', tint: '#fbeeda', ink: '#7d5115' },
  { id: 'teaching', href: '#teaching', label: 'Teaching', hue: '#7a4fc0', tint: '#ece0fb', ink: '#47297a' },
]

const SIZE = 56
const GAP = 14
const ORIGIN = { x: 80, y: 36 }

/** A tiny line drawing, the sort of thing that would be in a small print. */
function Glyph({ id, ink }: { id: string; ink: string }) {
  const s = {
    fill: 'none',
    stroke: ink,
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (id) {
    case 'about':
      return (
        <g {...s}>
          <circle cx="0" cy="-5" r="5.5" />
          <path d="M-10 10a10 10 0 0 1 20 0" />
        </g>
      )
    case 'research':
      return (
        <g {...s}>
          <rect x="-6.5" y="-6.5" width="13" height="13" rx="2" />
          <path d="M-2.5-12v5.5M2.5-12v5.5M-2.5 6.5v5.5M2.5 6.5v5.5M-12-2.5h5.5M-12 2.5h5.5M6.5-2.5h5.5M6.5 2.5h5.5" />
        </g>
      )
    case 'papers':
      return (
        <g {...s}>
          <path d="M-7.5-11h10l5.5 5.5v16.5h-15.5z" />
          <path d="M-3.5-1h8M-3.5 4.5h8" />
        </g>
      )
    default:
      return (
        <g {...s}>
          <path d="M-12-4.5 0-10l12 5.5-12 5.5z" />
          <path d="M-7.5-1.5v6.5c0 2.8 3.6 4.5 7.5 4.5s7.5-1.7 7.5-4.5v-6.5" />
        </g>
      )
  }
}

export function WallPanels({ onHover }: { onHover?: (id: string | null) => void }) {
  return (
    <g id="wall-panels">
      {PANELS.map((p, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = ORIGIN.x + col * (SIZE + GAP)
        const y = ORIGIN.y + row * (SIZE + GAP)
        const cx = x + SIZE / 2
        const cy = y + SIZE / 2
        // A degree or so off true, the way anything hung by hand ends up.
        const tilt = [-1.1, 0.9, 0.7, -0.8][i]
        return (
          <a
            key={p.id}
            href={p.href}
            aria-label={`${p.label} section`}
            className="hs-panel"
            onMouseEnter={() => onHover?.(p.id)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(p.id)}
            onBlur={() => onHover?.(null)}
            style={{ cursor: 'pointer' }}
          >
            <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
              {/* the nail, and the wire it hangs from */}
              <path
                d={`M${x + 9} ${y + 4}L${cx} ${y - 9}L${x + SIZE - 9} ${y + 4}`}
                fill="none"
                stroke="#8d8098"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.85"
              />
              <circle cx={cx} cy={y - 10} r="2.4" fill="#6d6478" />

              <g transform={`rotate(${tilt} ${cx} ${cy})`}>
                {/* what it throws on the wall */}
                <rect
                  x={x + 3}
                  y={y + 6}
                  width={SIZE}
                  height={SIZE}
                  rx="3"
                  fill="#0d0c1a"
                  opacity="0.3"
                  filter="url(#hs-soft)"
                />
                {/* the accent it picks up, so hover has something to brighten */}
                <rect
                  x={x - 5}
                  y={y - 5}
                  width={SIZE + 10}
                  height={SIZE + 10}
                  rx="8"
                  fill={p.hue}
                  opacity="0.1"
                  filter="url(#hs-soft)"
                  className="hs-panel-glow"
                />
                {/* light wooden frame */}
                <rect x={x} y={y} width={SIZE} height={SIZE} rx="3" fill="#f0e7d8" stroke="#bda88a" strokeWidth="2.4" />
                {/* mount board */}
                <rect x={x + 5} y={y + 5} width={SIZE - 10} height={SIZE - 10} fill="#fffdf7" />
                {/* the print itself */}
                <rect x={x + 10} y={y + 10} width={SIZE - 20} height={SIZE - 20} fill={p.tint} />
                <g transform={`translate(${cx} ${cy})`}>
                  <Glyph id={p.id} ink={p.ink} />
                </g>
                {/* glass, catching the window */}
                <path
                  d={`M${x + 2} ${y + SIZE - 2}L${x + SIZE - 2} ${y + 2}L${x + SIZE - 2} ${y + 16}L${x + 16} ${y + SIZE - 2}z`}
                  fill="#ffffff"
                  opacity="0.16"
                />
                <title>{p.label}</title>
              </g>
            </g>
          </a>
        )
      })}
    </g>
  )
}
