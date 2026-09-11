import { useEffect, useMemo, useRef, useState } from 'react'
import type { Phase } from './HeroChamber'

/** Boot lines describe the device that is actually assembling on screen. */
const LOG: [number, string][] = [
  [0.02, 'mounting inspection volume'],
  [0.14, 'growing GaN buffer on Si'],
  [0.28, 'etching fin, Lg = 5 nm'],
  [0.4, 'AlGaN barrier / 2DEG formed'],
  [0.52, 'wrapping gate on three sides'],
  [0.64, 'asymmetric spacers placed'],
  [0.78, 'routing source and drain'],
  [0.9, 'solving drift-diffusion'],
  [0.99, 'mesh converged'],
]

type Props = {
  phase: Phase
  progress: number
  onEnter: () => void
  webgl: boolean
}

export function StartupOverlay({ phase, progress, onEnter, webgl }: Props) {
  const booting = phase === 'boot'
  const ready = progress > 0.985
  const enterRef = useRef<HTMLButtonElement | null>(null)
  const [pulse, setPulse] = useState(false)

  const shown = useMemo(() => LOG.filter(([at]) => progress >= at), [progress])

  // Move focus to the way in as soon as there is one, so the keyboard path is
  // the same as the pointer path.
  useEffect(() => {
    if (ready && booting) {
      enterRef.current?.focus()
      setPulse(true)
    }
  }, [ready, booting])

  // Enter or Space anywhere on the boot screen opens the portfolio.
  useEffect(() => {
    if (!booting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        onEnter()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [booting, onEnter])

  return (
    <div
      className={[
        'absolute inset-0 z-20 transition-opacity duration-[900ms] ease-out',
        booting ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      aria-hidden={!booting}
    >
      {/* Corner brackets frame the volume like a microscope viewport. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-5 sm:inset-8">
        {(
          [
            'left-0 top-0 border-l border-t',
            'right-0 top-0 border-r border-t',
            'left-0 bottom-0 border-l border-b',
            'right-0 bottom-0 border-r border-b',
          ] as const
        ).map((cls) => (
          <span key={cls} className={`absolute h-7 w-7 border-white/25 ${cls}`} />
        ))}
      </div>

      {/* Boot log */}
      <div
        className="absolute bottom-24 left-5 right-5 sm:bottom-28 sm:left-8 md:left-10"
        style={{ fontFamily: 'var(--font-tech)' }}
      >
        <p className="mb-3 text-[10px] uppercase tracking-[0.36em] text-white/45">
          Mainframe device chamber
        </p>
        <ul className="space-y-1 text-[11px] leading-relaxed text-white/60 sm:text-[12.5px]">
          {shown.slice(-5).map(([at, text]) => (
            <li key={at} className="flex items-baseline gap-2">
              <span className="text-[#4ee8c6]">›</span>
              <span>{text}</span>
              <span className="text-white/25">
                {'.'.repeat(Math.max(2, 30 - text.length))}
              </span>
              <span className="text-[#4ee8c6]/80">ok</span>
            </li>
          ))}
          {!webgl && (
            <li className="text-white/45">
              <span className="text-[#ffb454]">›</span> WebGL unavailable, drawing static schematic
            </li>
          )}
        </ul>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-[2px] w-full max-w-sm bg-white/12">
            <div
              className="h-full bg-white transition-[width] duration-200 ease-linear"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-[11px] tabular-nums text-white/55">
            {String(Math.round(progress * 100)).padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* Entry */}
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 sm:bottom-10">
        <button
          ref={enterRef}
          type="button"
          onClick={onEnter}
          className={[
            'group relative inline-flex items-center gap-3 rounded-full border px-6 py-2.5 text-[14px] transition-all duration-500',
            ready
              ? 'border-white/70 bg-white text-black hover:bg-transparent hover:text-white'
              : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white',
            pulse ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-90',
          ].join(' ')}
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-current"
            style={{ animation: ready ? 'mf-pulse 1.6s ease-in-out infinite' : undefined }}
          />
          {ready ? 'Enter the studio' : 'Skip intro'}
        </button>
        <p className="text-[11px] tracking-wide text-white/35">
          move your cursor to look around · press Enter to continue
        </p>
      </div>
    </div>
  )
}
