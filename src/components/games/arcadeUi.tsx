import { useCallback, useEffect, useState, type ReactNode } from 'react'

export type GameState = 'ready' | 'playing' | 'over'

/** Best score per game, kept in localStorage and tolerant of it being absent. */
export function useHighScore(key: string) {
  const storageKey = `mf-hs-${key}`
  const [best, setBest] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setBest(Number(raw) || 0)
    } catch {
      /* storage unavailable: scores simply do not persist */
    }
  }, [storageKey])

  const submit = useCallback(
    (score: number) => {
      setBest((prev) => {
        if (score <= prev) return prev
        try {
          localStorage.setItem(storageKey, String(score))
        } catch {
          /* ignore */
        }
        return score
      })
    },
    [storageKey],
  )

  return { best, submit }
}

export function Cabinet({
  accent,
  children,
  className = '',
}: {
  accent: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`mf-crt relative overflow-hidden rounded-sm border ${className}`}
      style={{
        borderColor: `${accent}55`,
        background: '#05060a',
        boxShadow: `inset 0 0 60px ${accent}18`,
      }}
    >
      <span aria-hidden="true" className="mf-scanbar" />
      {children}
    </div>
  )
}

export function ArcadeHud({
  accent,
  left,
  right,
}: {
  accent: string
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between border-b px-3 py-2 text-[11px] uppercase tracking-[0.18em]"
      style={{ borderColor: `${accent}33`, color: accent, fontFamily: 'var(--font-tech)' }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}

/** Full-screen overlay used for both the start and the game-over screens. */
export function ScreenOverlay({
  accent,
  title,
  lines,
  action,
  onAction,
  art,
  show,
}: {
  accent: string
  title: string
  lines: ReactNode
  action: string
  onAction: () => void
  art?: ReactNode
  show: boolean
}) {
  if (!show) return null
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{
        background: 'linear-gradient(180deg, rgba(4,5,9,0.9), rgba(4,5,9,0.97))',
        fontFamily: 'var(--font-tech)',
      }}
    >
      {art}
      <h4
        className="text-[clamp(20px,4vw,34px)] font-medium uppercase tracking-[0.14em]"
        style={{ color: accent, textShadow: `0 0 18px ${accent}88` }}
      >
        {title}
      </h4>
      <div className="max-w-md text-[12.5px] leading-relaxed text-white/70">{lines}</div>
      <button
        type="button"
        onClick={onAction}
        className="mt-1 rounded-sm border px-5 py-2 text-[13px] uppercase tracking-[0.2em] transition-colors"
        style={{ borderColor: accent, color: accent }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = accent
          e.currentTarget.style.color = '#05060a'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = accent
        }}
      >
        {action}
      </button>
    </div>
  )
}

/** Touch controls. Hidden from pointer devices, which use the keyboard. */
export function TouchPad({
  accent,
  buttons,
}: {
  accent: string
  buttons: { label: string; aria: string; onPress: () => void; onRelease?: () => void }[]
}) {
  return (
    <div className="flex items-center justify-center gap-3 border-t px-3 py-3 md:hidden" style={{ borderColor: `${accent}33` }}>
      {buttons.map((b) => (
        <button
          key={b.aria}
          type="button"
          aria-label={b.aria}
          onPointerDown={(e) => {
            e.preventDefault()
            b.onPress()
          }}
          onPointerUp={() => b.onRelease?.()}
          onPointerLeave={() => b.onRelease?.()}
          className="grid h-12 min-w-12 flex-1 place-items-center rounded-sm border text-[15px] active:opacity-70"
          style={{ borderColor: `${accent}66`, color: accent, fontFamily: 'var(--font-tech)' }}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
