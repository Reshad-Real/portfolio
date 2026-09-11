import type { Theme } from '../hooks/useTheme'

type Props = {
  theme: Theme
  onToggle: () => void
  /** White treatment while the control sits over the dark hero. */
  onDark: boolean
  className?: string
}

export function ThemeToggle({ theme, onToggle, onDark, className = '' }: Props) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
      title={`Switch to ${dark ? 'light' : 'dark'} theme`}
      className={[
        'relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border transition-colors duration-500',
        onDark ? 'border-white/35 bg-white/10' : 'border-line bg-bg2',
        className,
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'absolute left-[3px] grid h-[21px] w-[21px] place-items-center rounded-full transition-transform duration-500',
          onDark ? 'bg-white text-black' : 'bg-ink text-bg',
          dark ? 'translate-x-[24px]' : 'translate-x-0',
        ].join(' ')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.5, 1.4, 0.4, 1)' }}
      >
        {dark ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M10.2 7.4A4.6 4.6 0 0 1 4.6 1.8 4.6 4.6 0 1 0 10.2 7.4Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="2.5" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
              <path d="M6 0.8v1.4M6 9.8v1.4M0.8 6h1.4M9.8 6h1.4M2.3 2.3l1 1M8.7 8.7l1 1M9.7 2.3l-1 1M3.3 8.7l-1 1" />
            </g>
          </svg>
        )}
      </span>
    </button>
  )
}
