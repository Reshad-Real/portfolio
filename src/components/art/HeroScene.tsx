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
        <linearGradient id="hs-lidback" x1="0.3" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#302e4d" />
          <stop offset="100%" stopColor="#1f1e33" />
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
          <path d="M330 166c48 0 79 33 79 84 0 30-4 55-14 75-11 24-34 41-65 41s-54-17-65-41c-10-20-14-45-14-75 0-51 31-84 79-84z" />
        </clipPath>
        {/* One per lens, so the screen can reflect in the glass. */}
        <clipPath id="hs-lens-l">
          <rect x="258" y="244" width="60" height="48" rx="14" />
        </clipPath>
        <clipPath id="hs-lens-r">
          <rect x="342" y="244" width="60" height="48" rx="14" />
        </clipPath>
        <clipPath id="hs-screen-clip">
          <path d="M208 463l124-7-11-48-124 7z" />
        </clipPath>
        <linearGradient id="hs-display" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#123246" />
          <stop offset="100%" stopColor="#0a1b28" />
        </linearGradient>
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
        {/* He sits 76 higher than the desk was drawn for, so the hoodie clears
            the laptop and the head is attached to a body rather than a bare neck. */}
        <g transform="translate(0 -76)">
        {/* What he casts on the wall. It was a plain ellipse sitting behind
            his head like a halo; a shadow is the silhouette of the thing that
            blocked the light, thrown away from the source. The window is up
            and to the right, so his goes down and to the left, and softens
            with distance. */}
        <g fill="#0d0c1a" opacity="0.34" filter="url(#hs-softer)" transform="translate(-34 20)">
          <path d="M330 138c68 0 106 44 103 110-3 58 5 76-17 89-26 15-146 15-172 0-22-13-14-31-17-89-3-66 35-110 103-110z" />
          <path d="M150 600c4-90 30-150 86-180 28-9 56-13 94-13s66 4 94 13c56 30 82 90 86 180z" />
        </g>

        <g id="hs-body" style={{ animation: 'hs-breathe 5.5s ease-in-out infinite' }}>
          {/* ---- shoulders */}
          {/* Torso. Trapezius out to a shoulder point at 231 and 429, then the
              upper arm drops from there. Widest across the arms rather than at
              the top, which is what separates a body from a beanbag. 310 wide
              against a 200-wide head: the same ratio the reference avatars use. */}
          {/* 300 across, which puts the silhouette barely ten units outside
              the top edge of the laptop: the machine hides him from the collar
              down, and what reads as his body is the shoulders and chest above
              it. Taking the torso to 380 and hanging forearms off it had made
              him close to twice the width of his own head. */}
          <path
            d="M180 600c-2-78 4-132 14-164 10-26 24-42 44-50 28-8 62-12 92-12s64 4 92 12c20 8 34 24 44 50 10 32 16 86 14 164z"
            fill="url(#hs-hoodie)"
            stroke="#141326"
            strokeWidth="4"
          />
          {/* Form shadow on the far side. Fabric has no hard terminator, so
              this is blurred where the face's core shadow is only softened. */}
          <path d="M180 600c-2-78 4-132 14-164 10-26 24-42 44-50-22 42-36 112-38 214z" fill="#1d2748" opacity="0.6" filter="url(#hs-soft)" />
          {/* the screen, throwing cool light up the near side of the chest */}
          <path d="M208 600c0-50 6-88 20-116-7 34-11 74-11 116z" fill="#9fd7ff" opacity="0.15" filter="url(#hs-soft)" />
          {/* raglan seams, so each arm is a separate form from the chest */}
          <g stroke="#222d55" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.6">
            <path d="M246 400c-13 26-20 62-22 104" />
            <path d="M414 400c13 26 20 62 22 104" />
          </g>
          {/* rim light: a thin line on the lit silhouette, not a band of tan */}
          <path
            d="M330 374c30 0 64 4 92 12 20 8 34 24 44 50 10 32 16 86 14 164"
            fill="none"
            stroke="#ffe0b8"
            strokeWidth="4"
            opacity="0.3"
          />
          {/* ---- neck. A neck is not a cylinder: it leaves the skull narrow,
               behind and below the jaw, and widens into the trapezius. The top
               sits under the chin so the join is never a visible seam.

               It runs down to 420, well past where the collar crosses it, and
               it is drawn BEFORE the collar so the neckline closes over it.
               Painted after, it ended in front of the shirt instead of going
               into it, and the two never read as joined. */}
          <path d="M307 342c1 28-1 48-6 78h58c-5-30-7-50-6-78z" fill="#f0c0a0" stroke="#141326" strokeWidth="4" />
          {/* what the jaw casts onto it: the darkest thing on him, and directly
              under the form that blocks the light */}
          <path d="M307 342c15 11 31 11 46 0 1 11 0 20-2 27-14 7-29 7-42 0-2-7-3-16-2-27z" fill="#c9917a" opacity="0.8" filter="url(#hs-tiny)" />
          {/* the cord of the neck on the lit side */}
          <path d="M348 356c3 15 4 28 3 42" stroke="#e0ac8c" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
          {/* and the shaded side, away from the window */}
          <path d="M307 342c1 26-1 46-6 78h13c-4-30-4-52-1-78z" fill="#d9a084" opacity="0.75" />
          {/* where the collar shades the neck it swallows */}
          <path d="M301 398h58v22h-58z" fill="#a8705c" opacity="0.5" filter="url(#hs-tiny)" />

          {/* hood bunched at the neck, closing over the base of it */}
          <path
            d="M288 392c13 16 71 16 84 0 12 12 17 25 16 36-39 14-116 14-117-1-1-10 5-23 17-35z"
            fill="#32427a"
            stroke="#141326"
            strokeWidth="4"
          />

          <g id="head-tilt" style={{ transformBox: 'view-box' }}>
          {/* The head was 0.66 of the shoulder width, which is bobblehead
              territory. The reference avatars get away with that because they
              are tight bust crops and this is not. Scaled about the chin, so
              the neck join and everything below it stay where they are. */}
          <g transform="translate(330 366) scale(0.87) translate(-330 -366)">
            {/* ---- hair, back mass. It used to hang in two lobes past the
                 ears, which poked out under the headphone cups as a pair of
                 tabs. It now stops above them. */}
            <path
              d="M330 138c66 0 102 44 100 110 1 20-1 32-5 42-5-30-11-48-17-60-27 14-129 14-156 0-6 12-12 30-17 60-4-10-6-22-5-42-2-66 34-110 100-110z"
              fill="url(#hs-hair)"
              stroke="#100f1e"
              strokeWidth="4"
            />

            {/* ---- face, on the reference avatars' proportions: 158 across
                 and 200 tall, cheekbones at a third down, jaw drawing in to a
                 chin rather than carrying full width all the way round. */}
            <path
              d="M330 166c48 0 79 33 79 84 0 30-4 55-14 75-11 24-34 41-65 41s-54-17-65-41c-10-20-14-45-14-75 0-51 31-84 79-84z"
              fill="url(#hs-skin)"
              stroke="#141326"
              strokeWidth="4"
            />
            {/* Two lights, and every shadow on him answers to one of them: the
                window is the warm key from the upper right, the screen is a
                cool fill from the lower left. The terminator therefore runs
                from the left temple down across the cheek, and lifts again
                near the jaw where the screen catches it. */}
            <g clipPath="url(#hs-face-clip)">
              {/* core shadow, soft-edged: a hard line here reads as a mask */}
              <path
                d="M296 170c-22 38-27 108-7 180-29-19-45-62-45-110 0-34 18-56 52-70z"
                fill="#d9a084"
                opacity="0.62"
                filter="url(#hs-tiny)"
              />
              {/* occlusion under the fringe, strongest where the hair sits on it */}
              <path d="M244 158h172v48c-58 20-114 20-172 0z" fill="#c9917a" opacity="0.45" filter="url(#hs-soft)" />
              {/* the screen, lifting the jaw and the shadow side from below */}
              <path d="M244 296h172v86H244z" fill="#9fd7ff" opacity="0.2" filter="url(#hs-soft)" />
              {/* and the window catching the right cheekbone */}
              <path d="M368 206c30 14 44 44 41 84-8-36-24-62-48-74z" fill="#fff0d6" opacity="0.35" filter="url(#hs-soft)" />
            </g>
            {/* ears */}
            <path d="M251 250c-14-6-22 6-18 22 4 14 14 22 22 18z" fill="#f2c3a2" stroke="#141326" strokeWidth="4" />
            <path d="M409 250c14-6 22 6 18 22-4 14-14 22-22 18z" fill="#f2c3a2" stroke="#141326" strokeWidth="4" />

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
              {/* Centred over the pupils at 288 and 372. They used to sit at
                  312 and 388, both pushed right and by different amounts, so
                  one brow rode the bridge of his nose. */}
              <path d="M268 239c9-7 33-7 42 0M350 239c9-7 33-7 42 0" stroke="#2d2744" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>

            {/* nose and mouth */}
            <path d="M330 292c6 6 6 12-2 14" stroke="#c98f74" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M312 322c12 12 24 12 36 0" stroke="#a8604f" strokeWidth="5" fill="none" strokeLinecap="round" />

            {/* ---- glasses */}
            <g fill="none" stroke="#241f3a" strokeWidth="5">
              {/* one lens per eye, centred on the pupils at 288 and 372 */}
              <rect x="258" y="244" width="60" height="48" rx="14" fill="#bfe4ff" fillOpacity="0.1" />
              <rect x="342" y="244" width="60" height="48" rx="14" fill="#bfe4ff" fillOpacity="0.1" />
              {/* bridge, arched over the nose */}
              <path d="M318 258c6-5 12-5 18 0" />
              {/* a temple to each ear */}
              <path d="M258 256l-13-4M402 256l13-4" />
            </g>
            {/* The screen, reflected in the glass. He faces us, so this is the
                only way to see that the laptop is actually on. */}
            <g opacity="0.42">
              {[
                { clip: 'hs-lens-l', x: 262 },
                { clip: 'hs-lens-r', x: 346 },
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
            {/* The outer arc is copied from the back mass exactly. It used to
                end three units short of it, leaving a lit sliver of the layer
                behind showing round the top of his head like a crack. */}
            <path
              d="M330 138c66 0 102 44 100 110-15-17-25-37-30-56-17 24-54 37-99 32-22-2-40-9-51-21-8 15-12 28-20 45-3-66 37-110 100-110z"
              fill="url(#hs-hair)"
              stroke="#100f1e"
              strokeWidth="4"
            />
            {/* sheen, on the window side where the key would actually catch it */}
            <path
              d="M354 160c28 8 48 28 56 56-19-15-34-32-41-50z"
              fill="#6a5f96"
              opacity="0.45"
            />
            {/* One strand, over the forehead where it reads as hair. The two
                that used to hang beside the ears came out under the headphone
                cups looking like hardware. */}
            <path
              d="M306 156c-12 14-18 30-18 46"
              stroke="#2a2440"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              style={{ transformOrigin: '306px 156px', animation: 'hs-strand 6s ease-in-out infinite' }}
            />

            {/* ---- headphones */}
            <path
              d="M240 262c0-58 40-102 90-102s90 44 90 102"
              stroke="#2f2b46"
              strokeWidth="18"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M240 262c0-58 40-102 90-102"
              stroke="#4a4470"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <rect x="220" y="250" width="42" height="66" rx="18" fill="#3a3558" stroke="#100f1e" strokeWidth="4" />
            <rect x="398" y="250" width="42" height="66" rx="18" fill="#3a3558" stroke="#100f1e" strokeWidth="4" />
            {/* the same inset on both cups, lit on the window side and dark on the other */}
            <rect x="230" y="264" width="20" height="38" rx="10" fill="#2a2544" />
            <rect x="410" y="264" width="20" height="38" rx="10" fill="#6d5fa8" />
            {/* the little status light on the cup */}
            {/* On the cup, not ten units below it where it read as a stray dot */}
            <circle cx="420" cy="306" r="4.5" fill="#68e8b0">
              <animate attributeName="opacity" values="1;0.25;1" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>
          </g>
        </g>
        </g>

        {/* ---- desk and laptop, in front of him */}
        <rect x="0" y="498" width="720" height="62" fill="url(#hs-desk)" />
        <rect x="0" y="498" width="720" height="7" fill="#6a5674" />
        {/* grain, so the front of the desk is a surface and not a stripe */}
        <g stroke="#241c2b" strokeWidth="1.6" opacity="0.3">
          <path d="M0 517h720M0 532h720M0 546h720" />
        </g>

        {/* Open, square on the desk, screen facing him. That does mean we see
            the back of the lid rather than the display, which is simply what a
            laptop looks like from the far side of somebody using it: what says
            it is on is the light around the lid, the wash it throws up at him,
            and the screen reflected in his glasses. */}
        <g id="hs-laptop">
          {/* what it throws up into the room */}
          <ellipse cx="330" cy="400" rx="212" ry="112" fill="url(#hs-screenglow)">
            <animate attributeName="opacity" values="0.95;0.72;0.95" dur="5s" repeatCount="indefinite" />
          </ellipse>
          {/* The bloom of screen light escaping past the top of the lid, drawn
              behind it so the light bleeds out from around the edge rather
              than sitting on the face of it. This is the thing that says the
              machine is on and pointed away from us. */}
          <path d="M190 336h280v24H190z" fill="#9fd7ff" opacity="0.34" filter="url(#hs-soft)">
            <animate attributeName="opacity" values="0.34;0.2;0.34" dur="5s" repeatCount="indefinite" />
          </path>

          {/* where it meets the desk */}
          <ellipse cx="330" cy="504" rx="145" ry="11" fill="#0d0c1a" opacity="0.5" filter="url(#hs-soft)" />

          {/* The lid: 258 across against 380 of shoulder, which is the 0.68 the
              reference uses. It was 200 against 310, so it read as a toy. One
              plain surface, tapering as it leans away, rounded at the top
              corners, with a camera dot and nothing else. A panel inset or a
              lit top edge would read as a bezel and turn it back to front. */}
          <path
            d="M198 352h264a8 8 0 0 1 8 7l-20 127H210l-20-127a8 8 0 0 1 8-7z"
            fill="url(#hs-lidback)"
            stroke="#100f1e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* the window, raking across the back of it */}
          <path d="M413 352h32l-18 134h-32z" fill="#ffffff" opacity="0.06" />
          <circle cx="229" cy="374" r="4.5" fill="#8f86c4" opacity="0.32" />

          {/* The base: a thin slab seen edge on, a little wider than the lid,
              with the hinge line in shadow where the two meet. The keyboard is
              on his side of that line, so there is none of it to draw. */}
          <path
            d="M200 486h260a7 7 0 0 1 7 7v3a8 8 0 0 1-8 8H201a8 8 0 0 1-8-8v-3a7 7 0 0 1 7-7z"
            fill="#312f4e"
            stroke="#100f1e"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M212 485h236" stroke="#0b0a16" strokeWidth="4" opacity="0.55" strokeLinecap="round" />
          <path d="M210 496h240" stroke="#6f66a0" strokeWidth="2.2" opacity="0.32" strokeLinecap="round" />

          {/* the light that gets past him, onto the desk */}
          <ellipse cx="330" cy="510" rx="172" ry="9" fill="#9fd7ff" opacity="0.16" filter="url(#hs-soft)" />
        </g>
      </g>

      {/* --------------------------------------------------- what he is thinking */}
      {thought && (
        <g className="hs-thought" data-show={thinking ? 'true' : 'false'} pointerEvents="none">
          <circle cx="404" cy="82" r="6" fill="#fbf9ff" stroke="#241f3a" strokeWidth="3" />
          <circle cx="415" cy="94" r="4" fill="#fbf9ff" stroke="#241f3a" strokeWidth="2.5" />
          {/* The tech face is monospace, so the box can be sized from the
              character count: 6.9 per glyph at 11.5px, plus the padding. */}
          <rect
            x={416 - (thought.length * 6.9 + 26)}
            y="30"
            width={thought.length * 6.9 + 26}
            height="38"
            rx="13"
            fill="#fbf9ff"
            stroke="#241f3a"
            strokeWidth="3"
          />
          <text
            x={416 - (thought.length * 6.9 + 26) / 2}
            y="54"
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
