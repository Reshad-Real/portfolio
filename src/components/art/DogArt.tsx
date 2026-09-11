/**
 * BYTE, drawn rather than modelled: a golden retriever puppy with the left
 * side of his face replaced by a chrome plate and a lit optic.
 *
 * Two poses share one drawing — a front-facing sit and a side-on walk — and
 * every part that moves is a named group so the component above can pose them.
 */

export type Pose = 'sit' | 'walk'

export type DogArtProps = {
  pose: Pose
  /** 0..1 how pleased he is; closes the eyes and speeds the tail. */
  joy: number
  /** Mouth open, for a bark. */
  barking: boolean
  blinking: boolean
  /** Pupil offset, -1..1. */
  lookX: number
  lookY: number
  className?: string
}

const FUR = '#e8b96a'
const FUR_D = '#c8964a'
const FUR_L = '#f6d79c'
const CREAM = '#fbeccd'
const INK = '#3a2a18'
const CHROME = '#c3c9d4'
const CHROME_D = '#8f97a6'
const OPTIC = '#2fb8f5'

/**
 * One stride, and the four feet spread evenly across it. A dog walking puts
 * them down one at a time, a quarter of a cycle apart, near-fore first.
 * Firing all four off the same wave is what made him look wound up.
 */
const STRIDE = 0.9
const NEAR_LEGS = [
  { x: 78, hip: 106, delay: 0, kind: 'front' as const },
  { x: 138, hip: 110, delay: STRIDE * 0.75, kind: 'hind' as const },
]
const FAR_LEGS = [
  { x: 66, hip: 106, delay: STRIDE * 0.5, kind: 'front' as const },
  { x: 126, hip: 110, delay: STRIDE * 0.25, kind: 'hind' as const },
]

/**
 * A leg in two pieces. The thigh swings from the hip, the shank hangs off a
 * knee and folds as the leg swings through, so the foot clears the ground
 * instead of scuffing along it.
 */
function Leg({
  x,
  hip,
  delay,
  kind,
  far = false,
}: {
  x: number
  hip: number
  delay: number
  kind: 'front' | 'hind'
  far?: boolean
}) {
  const knee = hip + 30
  const fill = far ? FUR_D : 'url(#bd-fur)'
  const w = far ? 14 : 16.5
  return (
    <g
      style={{
        transformOrigin: `${x}px ${hip}px`,
        animation: `bd-hip ${STRIDE}s cubic-bezier(0.45, 0, 0.55, 1) ${delay}s infinite`,
      }}
    >
      {/* thigh */}
      <rect
        x={x - w / 2}
        y={hip - 4}
        width={w}
        height={knee - hip + 10}
        rx={w / 2}
        fill={fill}
        stroke={INK}
        strokeWidth="3"
      />
      <g
        style={{
          transformOrigin: `${x}px ${knee}px`,
          animation: `bd-knee-${kind} ${STRIDE}s cubic-bezier(0.45, 0, 0.55, 1) ${delay}s infinite`,
        }}
      >
        {/* shank */}
        <rect
          x={x - (w - 2) / 2}
          y={knee - 4}
          width={w - 2}
          height="29"
          rx={(w - 2) / 2}
          fill={fill}
          stroke={INK}
          strokeWidth="3"
        />
        {/* paw */}
        <ellipse
          cx={x - 1}
          cy={knee + 25}
          rx={far ? 8 : 9.5}
          ry={far ? 5 : 6}
          fill={far ? FUR_D : CREAM}
          stroke={INK}
          strokeWidth="3"
        />
      </g>
    </g>
  )
}

export function DogArt({
  pose,
  joy,
  barking,
  blinking,
  lookX,
  lookY,
  className = '',
}: DogArtProps) {
  const eyeShut = blinking || joy > 0.5
  const wagSpeed = (1.1 - joy * 0.7).toFixed(2)

  return (
    <svg viewBox="0 0 200 190" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bd-fur" x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={FUR_L} />
          <stop offset="60%" stopColor={FUR} />
          <stop offset="100%" stopColor={FUR_D} />
        </linearGradient>
        <radialGradient id="bd-optic" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#eaffff" />
          <stop offset="35%" stopColor={OPTIC} />
          <stop offset="100%" stopColor="#136a9e" />
        </radialGradient>
        <linearGradient id="bd-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6eaf2" />
          <stop offset="55%" stopColor={CHROME} />
          <stop offset="100%" stopColor={CHROME_D} />
        </linearGradient>
        <filter id="bd-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="bd-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* contact shadow */}
      <ellipse cx="100" cy="176" rx={pose === 'sit' ? 46 : 58} ry="8" fill="#1d1428" opacity="0.28" filter="url(#bd-soft)" />

      {/* =================================================== the sitting pose */}
      <g style={{ display: pose === 'sit' ? 'block' : 'none' }}>
        {/* tail, wagging behind him */}
        <g
          style={{
            transformOrigin: '142px 132px',
            animation: `mf-wag ${wagSpeed}s ease-in-out infinite`,
          }}
        >
          <path
            d="M142 134c18-6 30-22 28-42-12 6-24 18-30 30z"
            fill="url(#bd-fur)"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M156 104c8 4 12 12 12 22-6-4-10-12-12-22z" fill={CREAM} opacity="0.8" />
        </g>

        {/* haunches */}
        <path
          d="M58 172c-14-22-8-48 14-58 18-8 32 4 34 24 2 16-4 30-14 34z"
          fill="url(#bd-fur)"
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M142 172c14-22 8-48-14-58-18-8-32 4-34 24-2 16 4 30 14 34z"
          fill={FUR_D}
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* chest */}
        <g style={{ transformOrigin: '100px 140px', animation: 'mf-bob 3.6s ease-in-out infinite' }}>
          <path
            d="M100 96c26 0 42 20 42 46 0 20-8 32-42 32s-42-12-42-32c0-26 16-46 42-46z"
            fill="url(#bd-fur)"
            stroke={INK}
            strokeWidth="3.5"
          />
          <path d="M100 106c14 0 22 16 22 34s-8 26-22 26-22-8-22-26 8-34 22-34z" fill={CREAM} />
          {/* front paws */}
          <path d="M74 156c10 0 16 6 16 14 0 6-6 8-16 8s-16-2-16-8c0-8 6-14 16-14z" fill={CREAM} stroke={INK} strokeWidth="3.5" />
          <path d="M126 156c10 0 16 6 16 14 0 6-6 8-16 8s-16-2-16-8c0-8 6-14 16-14z" fill={CREAM} stroke={INK} strokeWidth="3.5" />
        </g>

        {/* ------------------------------------------------------------ head */}
        <g
          style={{
            transformOrigin: '100px 74px',
            animation: barking
              ? 'mf-bark 0.32s ease-out'
              : 'mf-bob 3.6s ease-in-out infinite',
          }}
        >
          {/* ears behind the skull */}
          <path
            d="M56 52c-14 6-20 26-16 48 4 20 14 32 26 30 8-2 10-16 6-36-4-18-6-36-16-42z"
            fill={FUR_D}
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
            style={{ transformOrigin: '58px 54px', animation: 'hs-strand 4.2s ease-in-out infinite' }}
          />
          <path
            d="M144 52c14 6 20 26 16 48-4 20-14 32-26 30-8-2-10-16-6-36 4-18 6-36 16-42z"
            fill={FUR_D}
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
            style={{ transformOrigin: '142px 54px', animation: 'hs-strand 5s ease-in-out 0.4s infinite' }}
          />

          {/* skull */}
          <path
            d="M100 22c30 0 46 20 46 48 0 30-20 48-46 48s-46-18-46-48c0-28 16-48 46-48z"
            fill="url(#bd-fur)"
            stroke={INK}
            strokeWidth="3.5"
          />
          {/* cel shadow under the brow */}
          <path d="M58 44h84v16c-28 12-56 12-84 0z" fill={FUR_D} opacity="0.55" />
          {/* crown tuft */}
          <path d="M92 22c4-10 12-14 18-10-2 6-4 10-2 14z" fill={FUR_L} stroke={INK} strokeWidth="3" strokeLinejoin="round" />

          {/* ------- the chrome half, on his left so it reads on the right */}
          <g>
            <path
              d="M100 22c30 0 46 20 46 48 0 30-20 48-46 48z"
              fill="url(#bd-chrome)"
              stroke={INK}
              strokeWidth="3.5"
            />
            <path d="M112 30c16 6 26 20 28 40-10-12-20-26-28-40z" fill="#eef2f8" opacity="0.7" />
            <path d="M104 108c18-4 30-16 36-32 2 18-6 32-20 38z" fill={CHROME_D} opacity="0.8" />
            <path d="M100 22v96" stroke={INK} strokeWidth="3" opacity="0.55" />
            {/* panel seams */}
            <path d="M116 44h24M120 92h20" stroke={CHROME_D} strokeWidth="3.5" strokeLinecap="round" />

            {/* optic */}
            <circle cx="124" cy="68" r="18" fill={CHROME_D} stroke={INK} strokeWidth="3" />
            <circle cx="124" cy="68" r="13" fill="url(#bd-optic)" />
            <circle cx="124" cy="68" r="19" fill={OPTIC} opacity="0.5" filter="url(#bd-glow)">
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="124" cy="68" r="5" fill="#f2ffff" />
            <circle cx="119" cy="63" r="3" fill="#ffffff" opacity="0.9" />
          </g>

          {/* ------- the fur half keeps the eye */}
          <g transform={`translate(${(lookX * 3).toFixed(1)} ${(lookY * 2).toFixed(1)})`}>
            <ellipse cx="74" cy="68" rx="13" ry={eyeShut ? 1.6 : 14} fill={INK} />
            {!eyeShut && (
              <>
                <circle cx="70" cy="63" r="4.6" fill="#ffffff" />
                <circle cx="78" cy="73" r="2.4" fill="#ffffff" opacity="0.8" />
              </>
            )}
          </g>
          {eyeShut && (
            <path d="M62 68c6 6 18 6 24 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          )}
          {/* brow */}
          <path d="M62 48c8-4 18-4 24 0" stroke={FUR_D} strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* muzzle */}
          <path
            d="M100 78c16 0 26 10 26 22s-12 20-26 20-26-8-26-20 10-22 26-22z"
            fill={CREAM}
            stroke={INK}
            strokeWidth="3.5"
          />
          <path d="M100 84c9 0 15 5 15 11 0 5-6 8-15 8s-15-3-15-8c0-6 6-11 15-11z" fill={FUR_L} opacity="0.6" />
          {/* nose */}
          <path d="M100 80c8 0 13 4 13 9s-6 8-13 8-13-3-13-8 5-9 13-9z" fill={INK} />
          <ellipse cx="95" cy="83" rx="3.5" ry="2.2" fill="#6b5540" opacity="0.85" />

          {/* mouth: a smile, or open when barking */}
          {barking ? (
            <g>
              <path d="M86 100c6 14 22 14 28 0 2 12-4 22-14 22s-16-10-14-22z" fill="#5e2334" stroke={INK} strokeWidth="3" />
              <path d="M94 112c4-4 12-4 14 2-2 6-12 6-14-2z" fill="#f69bb0" />
            </g>
          ) : (
            <path
              d="M88 98c4 6 8 8 12 8s8-2 12-8"
              stroke={INK}
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {/* tongue, out when he is pleased */}
          {joy > 0.35 && !barking && (
            <path d="M96 106c6-2 12 2 11 9-1 6-9 8-12 3z" fill="#f69bb0" stroke={INK} strokeWidth="2.6" />
          )}
        </g>
      </g>

      {/* ==================================================== the walk pose */}
      <g style={{ display: pose === 'walk' ? 'block' : 'none' }}>
        {/* In profile only one side of him shows, so the chrome becomes a
            cheek plate rather than a seam down the middle. */}
        <g style={{ transformOrigin: '100px 126px', animation: 'bd-pitch 1.8s ease-in-out infinite' }}>
        <g style={{ transformOrigin: '100px 120px', animation: 'bd-bob 0.9s ease-in-out infinite' }}>
          {/* far legs */}
          {FAR_LEGS.map((l) => (
            <Leg key={`far-${l.x}`} {...l} far />
          ))}

          {/* tail */}
          <g style={{ transformOrigin: '150px 110px', animation: `mf-wag ${wagSpeed}s ease-in-out infinite` }}>
            <path
              d="M150 112c16-4 26-18 24-36-12 4-22 16-28 26z"
              fill="url(#bd-fur)"
              stroke={INK}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </g>

          {/* body */}
          <path
            d="M58 128c-8-24 6-44 34-48 26-4 48 4 56 20 8 16 4 34-10 40-20 8-70 8-80-12z"
            fill="url(#bd-fur)"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M66 132c16 10 62 10 78 0-4 12-16 18-40 18s-34-6-38-18z" fill={CREAM} opacity="0.85" />

          {/* near legs */}
          {NEAR_LEGS.map((l) => (
            <Leg key={`near-${l.x}`} {...l} />
          ))}

          {/* head, in profile facing left: nose at x=6, tail at x=174 */}
          <g style={{ transformOrigin: '52px 96px', animation: 'bd-nod 0.9s ease-in-out infinite' }}>
            {/* ear */}
            <path
              d="M50 62c-12 4-18 22-14 42 4 16 12 24 20 22 6-2 8-14 4-30-4-16-4-30-10-34z"
              fill={FUR_D}
              stroke={INK}
              strokeWidth="3.5"
              strokeLinejoin="round"
              style={{ transformOrigin: '50px 64px', animation: 'bd-earflap 0.88s ease-in-out infinite' }}
            />
            <path
              d="M46 52c22 0 36 16 36 36 0 22-16 36-36 36s-32-14-32-36c0-20 12-36 32-36z"
              fill="url(#bd-fur)"
              stroke={INK}
              strokeWidth="3.5"
            />
            {/* cheek plate, with a status light rather than a second eye */}
            <path d="M58 64c14 4 22 16 22 30 0 10-4 18-10 22 6-18 2-38-12-52z" fill="url(#bd-chrome)" stroke={INK} strokeWidth="3" />
            <path d="M62 72c8 4 12 12 12 22" stroke={CHROME_D} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <circle cx="68" cy="94" r="3" fill={OPTIC}>
              <animate attributeName="opacity" values="1;0.3;1" dur="2.6s" repeatCount="indefinite" />
            </circle>
            {/* muzzle pointing forward */}
            <path d="M14 92c-8 0-12 6-12 12s6 12 16 12c12 0 20-6 20-14s-10-10-24-10z" fill={CREAM} stroke={INK} strokeWidth="3.5" />
            <ellipse cx="6" cy="98" rx="6" ry="5" fill={INK} />

            {/* One eye, because in profile only one is facing us. It keeps a
                fixed shape and size; only the lid moves, so it cannot pop
                between frames the way a squashed ellipse did. */}
            <circle cx="30" cy="82" r="11" fill={OPTIC} opacity="0.3" filter="url(#bd-glow)" />
            <circle cx="30" cy="82" r="8.5" fill="url(#bd-optic)" stroke={INK} strokeWidth="2.8" />
            <circle cx="30" cy="82" r="3.4" fill="#0a2333" />
            <circle cx="27.6" cy="79.4" r="2.4" fill="#ffffff" opacity="0.92" />
            <g className="bd-lid" data-shut={eyeShut ? 'true' : 'false'} style={{ transformOrigin: '30px 72px' }}>
              <path d="M19 82a11 11 0 0 1 22 0 11 11 0 0 1-22 0z" fill="url(#bd-fur)" />
              <path d="M19 82a11 11 0 0 1 22 0" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
            </g>
            {barking ? (
              <path d="M8 106c8 0 16 2 20 8-6 6-18 6-22-2z" fill="#5e2334" stroke={INK} strokeWidth="2.6" />
            ) : (
              <path d="M10 106c6 2 12 2 16 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
            {joy > 0.35 && (
              <path d="M14 110c6 0 10 4 8 10-4 4-12 0-8-10z" fill="#f69bb0" stroke={INK} strokeWidth="2.4" />
            )}
          </g>
        </g>
        </g>
      </g>
    </svg>
  )
}
