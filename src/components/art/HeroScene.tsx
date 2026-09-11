import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { WallPanels } from './WallPanels'

/**
 * What goes through his head while he works. Musings about the simulation in
 * front of him, not claims about anything he has done.
 */
const THOUGHTS = [
  'Subthreshold slope is off.',
  'Mesh too coarse. Refine.',
  'Self-heating? Or mobility?',
  'Check the trap density.',
  'That will be DIBL.',
  'Convergence failed again.',
  'Halve the timestep.',
  'The 2DEG is depleting.',
  'Finer grid at the gate.',
  'Gate leakage? Or tunnel?',
  'Add a quantum correction.',
  'Rerun it with SRH on.',
  'Is that contact ohmic yet?',
  'Try a thinner barrier.',
  'Where is that kink from?',
  'Bias step is too big.',
] as const

/**
 * The hero illustration: cel-shaded anime over a lit room.
 *
 * Light comes from the window on the right, so every form carries a hard cel
 * shadow on its left and a thin rim on its right. The laptop adds a cool fill
 * from below. Nothing here is a photograph or a stock asset; it is all paths.
 */
export function HeroScene({ className = '' }: { className?: string }) {
  const rootRef = useRef<SVGSVGElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const [thought, setThought] = useState('')
  const [thinking, setThinking] = useState(false)

  // A thought every so often, never the same one twice running.
  useEffect(() => {
    if (reduced) return
    let alive = true
    let last = -1
    const timers: number[] = []
    const wait = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(() => alive && fn(), ms))
    }
    const cycle = () => {
      wait(2600 + Math.random() * 7000, () => {
        let i = last
        while (i === last) i = Math.floor(Math.random() * THOUGHTS.length)
        last = i
        setThought(THOUGHTS[i])
        setThinking(true)
        wait(4200, () => {
          setThinking(false)
          cycle()
        })
      })
    }
    cycle()
    return () => {
      alive = false
      for (const t of timers) window.clearTimeout(t)
    }
  }, [reduced])

  // Cursor parallax and eye tracking, written straight to the DOM.
  useEffect(() => {
    const svg = rootRef.current
    if (!svg || reduced) return
    if (window.matchMedia?.('(pointer: coarse)').matches) return

    const layers = Array.from(svg.querySelectorAll<SVGGElement>('[data-depth]'))
    // Both pupils, not just the one that used to carry the id.
    const eyes = Array.from(svg.querySelectorAll<SVGGElement>('.hs-look'))
    const head = svg.querySelector<SVGGElement>('#head-tilt')
    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1
      ty = (e.clientY / window.innerHeight) * 2 - 1
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const loop = () => {
      cx += (tx - cx) * 0.07
      cy += (ty - cy) * 0.07
      for (const l of layers) {
        const d = Number(l.dataset.depth ?? 0)
        l.setAttribute('transform', `translate(${(cx * d).toFixed(2)} ${(cy * d * 0.6).toFixed(2)})`)
      }
      const look = `translate(${(cx * 7).toFixed(2)} ${(cy * 4).toFixed(2)})`
      for (const e of eyes) e.setAttribute('transform', look)
      if (head) {
        head.setAttribute(
          'transform',
          `rotate(${(cx * 1.6).toFixed(2)} 330 300) translate(${(cx * 4).toFixed(2)} ${(cy * 2.5).toFixed(2)})`,
        )
      }
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) {
        raf = requestAnimationFrame(loop)
      } else {
        raf = 0
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 720 560"
      className={className}
      role="img"
      aria-label="Illustration of Reshad at his desk, working on a laptop with headphones on, a window and framed prints behind him."
    >
      <defs>
        {/* ------------------------------------------------------ gradients */}
        <linearGradient id="hs-room" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#2b2b4a" />
          <stop offset="55%" stopColor="#20203a" />
          <stop offset="100%" stopColor="#171729" />
        </linearGradient>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7b37a" />
          <stop offset="45%" stopColor="#e57e83" />
          <stop offset="100%" stopColor="#7c5aa8" />
        </linearGradient>
        {/* The daylight half of the room. Everything tagged .hs-day cross-fades
            against its night twin when the theme changes. */}
        <linearGradient id="hs-room-day" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#eceaf6" />
          <stop offset="55%" stopColor="#dfdcee" />
          <stop offset="100%" stopColor="#cdc8e0" />
        </linearGradient>
        <linearGradient id="hs-sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fb6ef" />
          <stop offset="55%" stopColor="#a8dcf7" />
          <stop offset="100%" stopColor="#e4f3fd" />
        </linearGradient>
        <radialGradient id="hs-sunglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-shaft" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd9a8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hs-skin" x1="0.2" y1="0" x2="1" y2="0.8">
          <stop offset="0%" stopColor="#ffe3c8" />
          <stop offset="100%" stopColor="#f6cba7" />
        </linearGradient>
        <linearGradient id="hs-hair" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#3b3355" />
          <stop offset="60%" stopColor="#2a2440" />
          <stop offset="100%" stopColor="#1d1930" />
        </linearGradient>
        <linearGradient id="hs-hoodie" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3c4f8f" />
          <stop offset="100%" stopColor="#27335f" />
        </linearGradient>
        <radialGradient id="hs-iris" cx="0.4" cy="0.32" r="0.75">
          <stop offset="0%" stopColor="#8fd8f2" />
          <stop offset="55%" stopColor="#3d92c9" />
          <stop offset="100%" stopColor="#1d4f7d" />
        </radialGradient>
        <radialGradient id="hs-screenglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#9fd7ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#9fd7ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hs-lampglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffcf9a" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffcf9a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3a52" />
          <stop offset="100%" stopColor="#2e2436" />
        </linearGradient>

        {/* --------------------------------------------------------- filters */}
        <filter id="hs-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="hs-softer" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="hs-tiny" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>

        {/* Face mask, so cel shadows never spill past the jaw. */}
        <clipPath id="hs-face-clip">
          <path d="M330 166c50 0 84 34 84 86 0 30-4 56-14 76-12 24-36 42-70 42s-58-18-70-42c-10-20-14-46-14-76 0-52 34-86 84-86z" />
        </clipPath>
        {/* One per lens, so the screen can reflect in the glass. */}
        <clipPath id="hs-lens-l">
          <rect x="255" y="244" width="66" height="48" rx="15" />
        </clipPath>
        <clipPath id="hs-lens-r">
          <rect x="339" y="244" width="66" height="48" rx="15" />
        </clipPath>
        <clipPath id="hs-window-clip">
          <rect x="432" y="44" width="252" height="286" rx="10" />
        </clipPath>
      </defs>

      {/* ============================================================ room */}
      <rect x="0" y="0" width="720" height="560" fill="url(#hs-room)" />
      <rect x="0" y="0" width="720" height="560" fill="url(#hs-room-day)" className="hs-day" />

      {/* ---------------------------------------------------------- window */}
      <g data-depth="6">
        <rect x="424" y="36" width="268" height="302" rx="14" fill="#151427" />
        <g clipPath="url(#hs-window-clip)">
          <rect x="432" y="44" width="252" height="286" fill="url(#hs-sky)" />
          <g className="hs-day">
            <rect x="432" y="44" width="252" height="286" fill="url(#hs-sky-day)" />
            {/* a few clouds, drifting */}
            <g fill="#ffffff" opacity="0.8">
              {[
                { x: 470, y: 92, s: 1, d: 46 },
                { x: 588, y: 140, s: 0.75, d: 34 },
                { x: 520, y: 178, s: 0.55, d: 26 },
              ].map((c) => (
                <g key={c.x} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
                  <g style={{ animation: `hs-drift ${c.d}s linear infinite` }}>
                    <ellipse cx="0" cy="0" rx="30" ry="13" />
                    <ellipse cx="-16" cy="4" rx="20" ry="10" />
                    <ellipse cx="14" cy="5" rx="22" ry="10" />
                    <ellipse cx="2" cy="-9" rx="18" ry="11" />
                  </g>
                </g>
              ))}
            </g>
          </g>
          {/* skyline */}
          <path
            d="M432 268h26v-42h18v42h22v-64h20v64h24v-30h22v30h26v-52h20v52h24v-38h20v38h30v62H432z"
            fill="#3a2b55"
            opacity="0.85"
          />
          <path
            className="hs-day"
            d="M432 268h26v-42h18v42h22v-64h20v64h24v-30h22v30h26v-52h20v52h24v-38h20v38h30v62H432z"
            fill="#93a4c6"
          />
          {/* lit windows in the skyline, after dark */}
          <g className="hs-night" fill="#ffd9a0">
            {[
              [468, 238], [468, 250], [504, 216], [504, 232], [504, 248],
              [548, 228], [548, 244], [592, 222], [592, 240], [636, 244],
            ].map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="6" height="7" rx="1">
                <animate
                  attributeName="opacity"
                  values="0.85;0.35;0.85"
                  dur={`${3 + ((x + y) % 5)}s`}
                  repeatCount="indefinite"
                />
              </rect>
            ))}
          </g>
          {/* a moon, low and hazy */}
          <g className="hs-night">
            <circle cx="630" cy="96" r="26" fill="#fff3d6" opacity="0.92" />
            <circle cx="630" cy="96" r="44" fill="#fff3d6" opacity="0.16" filter="url(#hs-soft)" />
          </g>
          {/* and the sun in its place by day */}
          <g className="hs-day">
            <circle cx="630" cy="96" r="72" fill="url(#hs-sunglow)" />
            <circle cx="630" cy="96" r="25" fill="#fffaea" />
          </g>
        </g>
        {/* frame */}
        <rect
          x="432"
          y="44"
          width="252"
          height="286"
          rx="10"
          fill="none"
          stroke="#100f1e"
          strokeWidth="9"
        />
        <path d="M558 44v286M432 187h252" stroke="#100f1e" strokeWidth="7" />
      </g>

      {/* Framed panels on the wall: the portfolio navigation, in the room. */}
      <g data-depth="9">
        <WallPanels />
      </g>

      {/* light spilling into the room */}
      <g opacity="0.55" pointerEvents="none" style={{ mixBlendMode: 'screen' }}>
        <path d="M470 60 L250 560 L470 560 Z" fill="url(#hs-shaft)">
          <animate attributeName="opacity" values="0.75;0.5;0.75" dur="7s" repeatCount="indefinite" />
        </path>
        <path d="M600 60 L430 560 L560 560 Z" fill="url(#hs-shaft)" opacity="0.6">
          <animate attributeName="opacity" values="0.5;0.72;0.5" dur="9s" repeatCount="indefinite" />
        </path>
      </g>
      {/* daylight is stronger and cooler, and washes the whole room */}
      <g className="hs-day" pointerEvents="none" style={{ mixBlendMode: 'screen' }}>
        <g opacity="0.5">
          <path d="M470 60 L230 560 L500 560 Z" fill="url(#hs-shaft)" />
          <path d="M600 60 L420 560 L600 560 Z" fill="url(#hs-shaft)" />
          <rect x="0" y="0" width="720" height="560" fill="#cfe6ff" opacity="0.22" />
        </g>
      </g>

      {/* ----------------------------------------------------------- plant */}
      <g data-depth="11" pointerEvents="none">
        {/* The pot ends at y=367 and the desk does not start until 498, so
            without this the plant hangs in the air. */}
        <ellipse cx="106" cy="390" rx="72" ry="10" fill="#0d0c1a" opacity="0.45" filter="url(#hs-softer)" />
        <rect x="42" y="366" width="128" height="15" rx="4" fill="#4c3c60" stroke="#16141f" strokeWidth="3" />
        <rect x="46" y="368" width="120" height="5" rx="2.5" fill="#7a6592" opacity="0.75" />
        <g id="hs-plant">
          {[
            'M104 300c-26-44-22-96 8-136 14 44 10 96-8 136z',
            'M104 300c-52-24-72-70-64-118 36 28 60 72 64 118z',
            'M104 300c44-30 58-78 46-124-32 32-48 78-46 124z',
            'M104 302c-14-56 6-102 44-128-10 52-24 96-44 128z',
          ].map((d, i) => (
            <path
              key={d}
              d={d}
              fill={i % 2 ? '#2f7a5a' : '#3f9a6d'}
              stroke="#16261f"
              strokeWidth="3"
              style={{
                transformOrigin: '104px 300px',
                animation: `hs-sway ${5 + i}s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}
          <path d="M70 296h68l-9 62a10 10 0 0 1-10 9H89a10 10 0 0 1-10-9z" fill="#b4674a" />
          <path d="M70 296h68l-3 20H73z" fill="#c97a5a" />
          <path d="M104 296h34l-9 62a10 10 0 0 1-10 9h-15z" fill="#8f4e37" />
          <path
            d="M70 296h68l-9 62a10 10 0 0 1-10 9H89a10 10 0 0 1-10-9z"
            fill="none"
            stroke="#16261f"
            strokeWidth="3"
          />
        </g>
      </g>

      {/* ============================================== desk and the figure */}
      <g data-depth="4" pointerEvents="none">
        {/* He sits 34 higher than the desk was drawn for, so the hoodie clears
            the laptop and the head is attached to a body rather than a bare neck. */}
        <g transform="translate(0 -34)">
        {/* cast shadow on the wall behind him */}
        <ellipse cx="286" cy="330" rx="150" ry="176" fill="#0d0c1a" opacity="0.42" filter="url(#hs-softer)" />

        <g id="hs-body" style={{ animation: 'hs-breathe 5.5s ease-in-out infinite' }}>
          {/* ---- shoulders */}
          {/* A trapezius slope out to the arms. A plain dome read as a balloon.
              Drawn past the bottom of the viewBox so breathing never opens a gap. */}
          <path
            d="M150 600c4-90 30-150 86-180 28-9 56-13 94-13s66 4 94 13c56 30 82 90 86 180z"
            fill="url(#hs-hoodie)"
            stroke="#141326"
            strokeWidth="4"
          />
          {/* cel shadow on the far side */}
          <path d="M150 600c4-90 30-150 86-180-22 44-34 106-36 180z" fill="#1d2748" opacity="0.7" />
          {/* rim light: a stroke along the lit silhouette, so it stays a line */}
          <path
            d="M330 407c38 0 66 4 94 13 56 30 82 90 86 180"
            fill="none"
            stroke="#ffcf9a"
            strokeWidth="6"
            opacity="0.5"
          />
          {/* hood bunched at the neck */}
          <path
            d="M252 426c22 26 134 26 156 0 18 16 24 34 22 48-64 22-136 22-200 0-2-14 4-32 22-48z"
            fill="#32427a"
            stroke="#141326"
            strokeWidth="4"
          />
          {/* drawstrings */}
          <path d="M306 466v46M358 466v38" stroke="#cdc7e6" strokeWidth="4" strokeLinecap="round" />

          {/* ---- neck, narrowed to the jaw so it is not a column */}
          <path d="M302 372h56v58c0 16-56 16-56 0z" fill="#f0c0a0" stroke="#141326" strokeWidth="4" />
          <path d="M302 372h56v22c-18 14-38 14-56 0z" fill="#d9a084" />

          <g id="head-tilt" style={{ transformBox: 'view-box' }}>
            {/* ---- hair, back mass */}
            <path
              d="M330 140c74 0 116 48 112 118-4 62 6 82-18 96 4-40-8-64-14-86-28 16-132 16-160 0-6 22-18 46-14 86-24-14-14-34-18-96-4-70 38-118 112-118z"
              fill="url(#hs-hair)"
              stroke="#100f1e"
              strokeWidth="4"
            />

            {/* ---- face: wide at the cheekbones, tapering to a jaw and chin.
                 The old shape was a plain egg, which is why it read as a ball. */}
            <path
              d="M330 166c50 0 84 34 84 86 0 30-4 56-14 76-12 24-36 42-70 42s-58-18-70-42c-10-20-14-46-14-76 0-52 34-86 84-86z"
              fill="url(#hs-skin)"
              stroke="#141326"
              strokeWidth="4"
            />
            <g clipPath="url(#hs-face-clip)">
              {/* cel shadow away from the window: a crescent on the cheek, so it
                  reads as a turning form rather than a seam down the middle */}
              <path d="M292 172c-24 40-28 116-6 190-30-20-46-66-46-116 0-36 18-60 52-74z" fill="#d9a084" opacity="0.7" />
              {/* soft form shadow under the fringe */}
              <path d="M240 160h180v56c-60 22-120 22-180 0z" fill="#c9917a" opacity="0.55" filter="url(#hs-tiny)" />
              {/* bounce from the laptop, cool and from below */}
              <path d="M240 300h180v80H240z" fill="#9fd7ff" opacity="0.16" filter="url(#hs-soft)" />
            </g>
            {/* ears */}
            <path d="M246 250c-14-6-22 6-18 22 4 14 14 22 22 18z" fill="#f2c3a2" stroke="#141326" strokeWidth="4" />
            <path d="M414 250c14-6 22 6 18 22-4 14-14 22-22 18z" fill="#f2c3a2" stroke="#141326" strokeWidth="4" />

            {/* ---- eyes */}
            <g id="hs-eyes">
              {[-1, 1].map((s) => (
                <g key={s} transform={`translate(${330 + s * 42} 268)`}>
                  {/* socket shadow */}
                  <ellipse cx="0" cy="2" rx="26" ry="17" fill="#e8b596" opacity="0.5" />
                  <ellipse cx="0" cy="0" rx="24" ry="15" fill="#fdfbff" />
                  <g className="hs-look">
                    <circle cx={s * 2} cy="1" r="12" fill="url(#hs-iris)" />
                    <circle cx={s * 2} cy="1" r="5" fill="#12203a" />
                    <circle cx={s * 2 - 4} cy="-4" r="4" fill="#ffffff" />
                    <circle cx={s * 2 + 5} cy="5" r="2" fill="#bfe9ff" opacity="0.9" />
                  </g>
                  {/* upper lash, and the lid that does the blinking */}
                  <path d={`M-25 -5c8-11 42-11 50 0`} stroke="#1b1730" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <rect
                    x="-26"
                    y="-18"
                    width="52"
                    height="34"
                    fill="url(#hs-skin)"
                    style={{
                      transformOrigin: '0px -16px',
                      animation: 'hs-blink 6.2s ease-in-out infinite',
                    }}
                  />
                  <path
                    d={`M-25 -5c8-11 42-11 50 0`}
                    stroke="#1b1730"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      transformOrigin: '0px -16px',
                      animation: 'hs-blink 6.2s ease-in-out infinite',
                    }}
                  />
                </g>
              ))}
              {/* brows */}
              <path d="M292 232c10-8 30-8 40-2M368 230c10-6 30-6 40 2" stroke="#241f3a" strokeWidth="7" strokeLinecap="round" fill="none" />
            </g>

            {/* nose and mouth */}
            <path d="M330 292c6 6 6 12-2 14" stroke="#c98f74" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M312 322c12 12 24 12 36 0" stroke="#a8604f" strokeWidth="5" fill="none" strokeLinecap="round" />

            {/* ---- glasses */}
            <g fill="none" stroke="#241f3a" strokeWidth="5">
              {/* one lens per eye, centred on the pupils at 288 and 372 */}
              <rect x="255" y="244" width="66" height="48" rx="15" fill="#bfe4ff" fillOpacity="0.1" />
              <rect x="339" y="244" width="66" height="48" rx="15" fill="#bfe4ff" fillOpacity="0.1" />
              {/* bridge, arched over the nose */}
              <path d="M321 258c6-5 12-5 18 0" />
              {/* a temple to each ear */}
              <path d="M255 256l-14-4M405 256l14-4" />
            </g>
            {/* The screen, reflected in the glass. He faces us, so this is the
                only way to see that the laptop is actually on. */}
            <g opacity="0.42">
              {[
                { clip: 'hs-lens-l', x: 259 },
                { clip: 'hs-lens-r', x: 343 },
              ].map(({ clip, x }) => (
                <g key={clip} clipPath={`url(#${clip})`}>
                  <rect x={x - 4} y="244" width="74" height="48" fill="#0d2b3f" opacity="0.2" />
                  <g className="hs-code" fill="#7fe3ff">
                    {[
                      [0, 26], [10, 15], [20, 32], [30, 20],
                      [40, 36], [50, 14], [60, 28],
                    ].map(([dy, w]) => (
                      <rect key={dy} x={x + 3} y={244 + dy} width={w} height="2.5" rx="1.25" />
                    ))}
                  </g>
                </g>
              ))}
            </g>

            {/* lens glint, sweeping now and then */}
            <g clipPath="url(#hs-face-clip)">
              <rect
                x="280"
                y="238"
                width="12"
                height="64"
                fill="#ffffff"
                opacity="0.16"
                filter="url(#hs-tiny)"
                transform="rotate(18 293 270)"
                style={{ animation: 'hs-glint 11s ease-in-out infinite' }}
              />
            </g>

            {/* ---- hair, front */}
            <path
              d="M330 140c72 0 112 46 112 112-16-18-28-38-34-58-18 26-58 40-108 34-24-2-44-10-56-22-8 16-12 30-26 46-2-70 40-112 112-112z"
              fill="url(#hs-hair)"
              stroke="#100f1e"
              strokeWidth="4"
            />
            {/* hair sheen */}
            <path
              d="M356 162c30 8 52 30 60 60-20-16-36-34-44-54z"
              fill="#6a5f96"
              opacity="0.7"
            />
            {/* a couple of strands that move */}
            <path
              d="M262 176c-14 22-18 48-12 74"
              stroke="#2a2440"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
              style={{ transformOrigin: '262px 176px', animation: 'hs-strand 6s ease-in-out infinite' }}
            />
            <path
              d="M406 170c16 20 22 44 18 70"
              stroke="#2a2440"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
              style={{ transformOrigin: '406px 170px', animation: 'hs-strand 7.4s ease-in-out 0.6s infinite' }}
            />

            {/* ---- headphones */}
            <path
              d="M232 268c0-62 44-108 98-108s98 46 98 108"
              stroke="#2f2b46"
              strokeWidth="18"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M232 268c0-62 44-108 98-108"
              stroke="#4a4470"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <rect x="212" y="250" width="42" height="66" rx="18" fill="#3a3558" stroke="#100f1e" strokeWidth="4" />
            <rect x="406" y="250" width="42" height="66" rx="18" fill="#3a3558" stroke="#100f1e" strokeWidth="4" />
            {/* the same inset on both cups, lit on the window side and dark on the other */}
            <rect x="222" y="264" width="20" height="38" rx="10" fill="#2a2544" />
            <rect x="418" y="264" width="20" height="38" rx="10" fill="#6d5fa8" />
            {/* the little status light on the cup */}
            <circle cx="428" cy="326" r="5" fill="#68e8b0">
              <animate attributeName="opacity" values="1;0.25;1" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
        </g>

        {/* ---- desk and laptop, in front of him */}
        <rect x="0" y="498" width="720" height="62" fill="url(#hs-desk)" />
        <rect x="0" y="498" width="720" height="7" fill="#6a5674" />

        {/* Centred under his head. Off to one side it hid half the torso and the
            figure read as a head on a stick. */}
        <g id="hs-laptop" transform="translate(134 0)">
          <ellipse cx="196" cy="470" rx="190" ry="90" fill="url(#hs-screenglow)">
            <animate attributeName="opacity" values="0.9;0.65;0.9" dur="4.5s" repeatCount="indefinite" />
          </ellipse>
          {/* He faces us, so this is the back of the lid: the glow spills up at
              him, and we get a dark mass rather than a dead grey screen. */}
          <path d="M64 502l40-62h186l40 62z" fill="#23223a" stroke="#100f1e" strokeWidth="4" />
          <path d="M104 440h186l20 48H84z" fill="#2e2d4c" />
          {/* Light leaking around the lid, so it plainly reads as running */}
          <path d="M104 442h186" stroke="#cdf1ff" strokeWidth="4" opacity="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.8;0.6;0.8" dur="4.5s" repeatCount="indefinite" />
          </path>
          <path d="M290 442l30 58" stroke="#bfe4ff" strokeWidth="3" opacity="0.55" strokeLinecap="round" />
          <path d="M104 444l-20 44" stroke="#bfe4ff" strokeWidth="3" opacity="0.3" strokeLinecap="round" />
          <circle cx="197" cy="468" r="11" fill="none" stroke="#9fd7ff" strokeWidth="3" opacity="0.5" />
          <circle cx="197" cy="468" r="3.5" fill="#bfefff" opacity="0.85">
            <animate attributeName="opacity" values="0.85;0.4;0.85" dur="3.2s" repeatCount="indefinite" />
          </circle>
          {/* the pool it throws forward onto the desk */}
          <ellipse cx="197" cy="520" rx="160" ry="14" fill="#9fd7ff" opacity="0.22" filter="url(#hs-soft)" />
          <rect x="52" y="500" width="292" height="14" rx="7" fill="#4a4870" stroke="#100f1e" strokeWidth="4" />
        </g>
      </g>

      {/* --------------------------------------------------- what he is thinking */}
      {thought && (
        <g className="hs-thought" data-show={thinking ? 'true' : 'false'} pointerEvents="none">
          <circle cx="404" cy="106" r="6" fill="#fbf9ff" stroke="#241f3a" strokeWidth="3" />
          <circle cx="415" cy="120" r="4" fill="#fbf9ff" stroke="#241f3a" strokeWidth="2.5" />
          {/* The tech face is monospace, so the box can be sized from the
              character count: 6.9 per glyph at 11.5px, plus the padding. */}
          <rect
            x={416 - (thought.length * 6.9 + 26)}
            y="54"
            width={thought.length * 6.9 + 26}
            height="38"
            rx="13"
            fill="#fbf9ff"
            stroke="#241f3a"
            strokeWidth="3"
          />
          <text
            x={416 - (thought.length * 6.9 + 26) / 2}
            y="78"
            textAnchor="middle"
            fill="#241f3a"
            fontSize="11.5"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            {thought}
          </text>
        </g>
      )}

      {/* ======================================================= foreground */}
      <g data-depth="16" pointerEvents="none">
        {/* mug */}
        <ellipse cx="614" cy="514" rx="52" ry="14" fill="#0d0c1a" opacity="0.45" filter="url(#hs-soft)" />
        <path d="M584 452h60v46a18 18 0 0 1-18 18h-24a18 18 0 0 1-18-18z" fill="#e8f0fb" stroke="#141326" strokeWidth="4" />
        <path d="M626 452h18v46a18 18 0 0 1-18 18z" fill="#c2cfe4" />
        <path d="M644 462h10a16 16 0 0 1 0 32h-10" fill="none" stroke="#141326" strokeWidth="5" />
        <ellipse cx="614" cy="452" rx="30" ry="8" fill="#7b4a35" stroke="#141326" strokeWidth="3" />
        {/* steam */}
        <g stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5">
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${600 + i * 14} 440c-8-14 8-22 0-36`}
              className="hs-steam"
              style={{ animation: `hs-steam ${3.4 + i * 0.6}s ease-in-out ${i * 0.5}s infinite` }}
            />
          ))}
        </g>

        {/* warm lamp haze in the corner, only once it is dark */}
        <g className="hs-night">
          <ellipse cx="700" cy="380" rx="150" ry="150" fill="url(#hs-lampglow)" />
        </g>

        {/* dust in the light */}
        <g fill="#ffe6bd">
          {[
            [300, 300, 2.5, 9], [360, 210, 2, 11], [420, 360, 3, 13],
            [500, 250, 2, 10], [260, 420, 2.5, 12], [540, 420, 2, 14],
            [180, 250, 2, 15], [620, 300, 2.5, 12],
          ].map(([x, y, r, d]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity="0.5">
              <animate attributeName="cy" values={`${y};${y - 30};${y}`} dur={`${d}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.1;0.6;0.1" dur={`${d}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      </g>
    </svg>
  )
}
