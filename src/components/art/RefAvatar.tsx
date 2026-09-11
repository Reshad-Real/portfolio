import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/**
 * Stylised anime avatars for the two references. They are drawn characters,
 * not likenesses: blinking, breathing, glancing toward the cursor when it
 * crosses the card, and smiling when clicked.
 */

export type AvatarKind = 'senior' | 'junior'

type Props = {
  kind: AvatarKind
  name: string
  className?: string
}

const LOOKS = {
  senior: {
    skin: '#f0cbaa',
    skinShade: '#d8a985',
    hair: '#7d7a86',
    hairShade: '#5f5c69',
    beard: '#8b8892',
    shirt: '#37507e',
    shirtShade: '#26385c',
    glasses: true,
    receded: true,
    fullBeard: true,
  },
  junior: {
    skin: '#f6d2b0',
    skinShade: '#deab88',
    hair: '#2c2434',
    hairShade: '#1d1826',
    beard: '#2c2434',
    shirt: '#2f6f66',
    shirtShade: '#215049',
    glasses: false,
    receded: false,
    fullBeard: false,
  },
} as const

export function RefAvatar({ kind, name, className = '' }: Props) {
  const L = LOOKS[kind]
  const ref = useRef<HTMLButtonElement | null>(null)
  const eyesRef = useRef<SVGGElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const [smiling, setSmiling] = useState(false)
  const [blink, setBlink] = useState(false)
  const smileTimer = useRef<number | null>(null)

  // Blink on their own schedule, so the two are never in sync.
  useEffect(() => {
    if (reduced) return
    let t = window.setTimeout(function loop() {
      setBlink(true)
      window.setTimeout(() => setBlink(false), 120)
      t = window.setTimeout(loop, 2800 + Math.random() * 4200)
    }, 1200 + Math.random() * 2600)
    return () => window.clearTimeout(t)
  }, [reduced])

  // Glance toward the cursor while it is over the card.
  useEffect(() => {
    const el = ref.current
    const eyes = eyesRef.current
    if (!el || !eyes || reduced) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.x + r.width / 2)) / 220))
      const dy = Math.max(-1, Math.min(1, (e.clientY - (r.y + r.height / 2)) / 200))
      eyes.setAttribute('transform', `translate(${(dx * 3.4).toFixed(2)} ${(dy * 2.2).toFixed(2)})`)
    }
    const onLeave = () => eyes.setAttribute('transform', 'translate(0 0)')
    window.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  useEffect(
    () => () => {
      if (smileTimer.current) window.clearTimeout(smileTimer.current)
    },
    [],
  )

  const grin = () => {
    setSmiling(true)
    if (smileTimer.current) window.clearTimeout(smileTimer.current)
    smileTimer.current = window.setTimeout(() => setSmiling(false), 1600)
  }

  const gid = `av-${kind}`

  return (
    <button
      ref={ref}
      type="button"
      onClick={grin}
      aria-label={`Drawn avatar of ${name}. Click to make them smile.`}
      className={`group relative shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <defs>
          <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--bg-2)" />
            <stop offset="100%" stopColor="var(--surface)" />
          </linearGradient>
          <linearGradient id={`${gid}-skin`} x1="0.2" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={L.skin} />
            <stop offset="100%" stopColor={L.skinShade} />
          </linearGradient>
          <clipPath id={`${gid}-clip`}>
            <circle cx="60" cy="60" r="58" />
          </clipPath>
          <filter id={`${gid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <circle cx="60" cy="60" r="58" fill={`url(#${gid}-bg)`} />
        <g clipPath={`url(#${gid}-clip)`}>
          {/* a soft key light from the upper left */}
          <circle cx="34" cy="26" r="54" fill="#ffffff" opacity="0.35" filter={`url(#${gid}-soft)`} />

          <g style={{ animation: reduced ? undefined : 'hs-breathe 5s ease-in-out infinite' }}>
            {/* shoulders */}
            <path d="M14 124c0-24 20-38 46-38s46 14 46 38z" fill={L.shirt} />
            <path d="M14 124c0-20 14-33 34-37-10 10-16 22-16 37z" fill={L.shirtShade} />
            <path d="M48 88h24l-12 16z" fill="#f4f5fa" opacity="0.9" />

            {/* neck */}
            <path d="M50 72h20v18c0 6-20 6-20 0z" fill={L.skinShade} />

            {/* head: cheekbones out, then a jaw in to the chin. It was a plain
                egg before, the same fault the hero figure had. */}
            <path
              d="M60 22c16 0 28 11 28 28 0 10-1 18-5 25-4 8-12 14-23 14s-19-6-23-14c-4-7-5-15-5-25 0-17 12-28 28-28z"
              fill={`url(#${gid}-skin)`}
            />
            {/* cel shadow on the shaded side, following the cheek */}
            <path d="M45 38c-6 16-6 33 0 47-8-6-12-17-12-28 0-8 4-15 12-19z" fill={L.skinShade} opacity="0.55" />
            {/* ears */}
            <ellipse cx="32" cy="56" rx="4.5" ry="7" fill={L.skinShade} />
            <ellipse cx="88" cy="56" rx="4.5" ry="7" fill={L.skinShade} />

            {/* hair */}
            {L.receded ? (
              <>
                <path d="M36 44c2-16 12-24 24-24s22 8 24 24c-6-8-14-11-24-11s-18 3-24 11z" fill={L.hair} />
                <path d="M34 40c0 8 1 14 3 20-4-8-5-16-3-20zM86 40c0 8-1 14-3 20 4-8 5-16 3-20z" fill={L.hairShade} />
                {/* a thin strip over the crown */}
                <path d="M46 30c8-4 20-4 28 0-9-2-19-2-28 0z" fill={L.hairShade} />
              </>
            ) : (
              <>
                <path d="M32 50c-2-20 10-32 28-32s30 12 28 32c-4-10-8-16-14-19-8 6-26 8-34 2-4 4-6 10-8 17z" fill={L.hair} />
                <path d="M74 23c8 5 13 14 14 27-4-11-8-20-14-27z" fill={L.hairShade} opacity="0.8" />
              </>
            )}

            {/* brows */}
            <path
              d={`M42 50c4-3 10-3 13-1M65 49c3-2 9-2 13 1`}
              stroke={L.hairShade}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* eyes */}
            <g>
              {[-1, 1].map((s) => (
                <g key={s} transform={`translate(${60 + s * 11} 58)`}>
                  <ellipse cx="0" cy="0" rx="7" ry={blink ? 0.9 : 5.4} fill="#ffffff" />
                  {!blink && (
                    <g ref={s === -1 ? eyesRef : undefined}>
                      <circle cx="0" cy="0.4" r="3.4" fill="#3b2c22" />
                      <circle cx="-1.2" cy="-1.1" r="1.3" fill="#ffffff" />
                    </g>
                  )}
                  <path
                    d="M-7 -2c2-3 12-3 14 0"
                    stroke="#33261d"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              ))}
            </g>

            {/* nose */}
            <path d="M60 62c2 3 2 5-1 6" stroke={L.skinShade} strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* moustache, and a beard for the senior */}
            <path d="M50 72c4-3 16-3 20 0-4 2-16 2-20 0z" fill={L.beard} />
            {L.fullBeard && (
              <path
                d="M40 62c0 14 8 24 20 24s20-10 20-24c2 14-4 28-20 28s-22-14-20-28z"
                fill={L.beard}
                opacity="0.95"
              />
            )}

            {/* mouth */}
            <path
              d={smiling ? 'M51 78c5 6 13 6 18 0' : 'M52 78c5 2 11 2 16 0'}
              stroke="#8c4a3c"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
              style={{ transition: 'd 180ms ease' }}
            />
            {smiling && (
              <>
                <ellipse cx="44" cy="70" rx="5" ry="3" fill="#e8827a" opacity="0.4" />
                <ellipse cx="76" cy="70" rx="5" ry="3" fill="#e8827a" opacity="0.4" />
              </>
            )}

            {/* glasses */}
            {L.glasses && (
              <g stroke="#3a3242" strokeWidth="2.4" fill="none">
                <rect x="40" y="51" width="19" height="15" rx="6" fill="#bfe4ff" fillOpacity="0.16" />
                <rect x="61" y="51" width="19" height="15" rx="6" fill="#bfe4ff" fillOpacity="0.16" />
                <path d="M59 57h2M40 55l-7-2M80 55l7-2" />
              </g>
            )}
          </g>
        </g>

        <circle cx="60" cy="60" r="58" fill="none" stroke="var(--line)" strokeWidth="2" />
      </svg>

      {/* a small hint ring on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent/0 transition-all duration-300 group-hover:ring-accent/45"
      />
    </button>
  )
}
