/**
 * Framed panels on the wall behind the desk. Each is a real anchor, so they
 * are clickable and keyboard reachable exactly like any other link, and they
 * carry the same lighting as the rest of the room: lit edge on the window
 * side, shadow away from it.
 *
 * Rendered as SVG children, so this must sit inside an <svg>.
 */

export type PanelLink = { id: string; href: string; label: string; hue: string }

export const PANELS: PanelLink[] = [
  { id: 'about', href: '#about', label: 'About', hue: '#7fd4ff' },
  { id: 'research', href: '#research', label: 'Research', hue: '#8affc8' },
  { id: 'papers', href: '#papers', label: 'Papers', hue: '#ffc978' },
  { id: 'teaching', href: '#teaching', label: 'Teaching', hue: '#d3a6ff' },
]

const SIZE = 56
const GAP = 12
const ORIGIN = { x: 80, y: 34 }

function Glyph({ id, hue }: { id: string; hue: string }) {
  const s = {
    fill: 'none',
    stroke: hue,
    strokeWidth: 2.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (id) {
    case 'about':
      return (
        <g {...s}>
          <circle cx="0" cy="-5" r="6" />
          <path d="M-11 11a11 11 0 0 1 22 0" />
        </g>
      )
    case 'research':
      return (
        <g {...s}>
          <rect x="-7" y="-7" width="14" height="14" rx="2" />
          <path d="M-3 -13v6M3 -13v6M-3 7v6M3 7v6M-13 -3h6M-13 3h6M7 -3h6M7 3h6" />
        </g>
      )
    case 'papers':
      return (
        <g {...s}>
          <path d="M-8 -12h11l6 6v18h-17z" />
          <path d="M-4 -1h9M-4 5h9" />
        </g>
      )
    default:
      return (
        <g {...s}>
          <path d="M-13 -5 0-11l13 6-13 6z" />
          <path d="M-8 -2v7c0 3 4 5 8 5s8-2 8-5v-7" />
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
              {/* the glow it throws on the wall */}
              <rect
                x={x - 6}
                y={y - 6}
                width={SIZE + 12}
                height={SIZE + 12}
                rx="16"
                fill={p.hue}
                opacity="0.13"
                filter="url(#hs-soft)"
                className="hs-panel-glow"
              />
              {/* frame */}
              <rect x={x} y={y} width={SIZE} height={SIZE} rx="11" fill="#141328" stroke="#0d0c1c" strokeWidth="3" />
              {/* glass */}
              <rect x={x + 4} y={y + 4} width={SIZE - 8} height={SIZE - 8} rx="8" fill="#1b1a38" />
              {/* lit edge on the window side, shadow on the other */}
              <path
                d={`M${x + SIZE - 9} ${y + 12}v${SIZE - 24}`}
                stroke={p.hue}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.45"
              />
              <path
                d={`M${x + 5} ${y + 8}v${SIZE - 16}`}
                stroke="#0b0a18"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.7"
              />
              <g transform={`translate(${cx} ${cy})`}>
                <Glyph id={p.id} hue={p.hue} />
              </g>
              {/* a small status dot, blinking on its own beat */}
              <circle cx={x + SIZE - 11} cy={y + 11} r="2.6" fill={p.hue}>
                <animate
                  attributeName="opacity"
                  values="1;0.25;1"
                  dur={`${2.2 + i * 0.55}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <title>{p.label}</title>
            </g>
          </a>
        )
      })}
    </g>
  )
}
