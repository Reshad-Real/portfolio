import type { Theme } from '../hooks/useTheme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
      title={`Switch to ${dark ? 'light' : 'dark'} theme`}
      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {/* The two glyphs slide past each other rather than swapping. */}
      <span
        aria-hidden="true"
        className="absolute grid place-items-center transition-all duration-400"
        style={{
          transform: dark ? 'translateY(0) rotate(0deg)' : 'translateY(-140%) rotate(-90deg)',
          opacity: dark ? 1 : 0,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M13.6 9.9A6.1 6.1 0 0 1 6.1 2.4 6.1 6.1 0 1 0 13.6 9.9Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span
        aria-hidden="true"
        className="absolute grid place-items-center transition-all duration-400"
        style={{
          transform: dark ? 'translateY(140%) rotate(90deg)' : 'translateY(0) rotate(0deg)',
          opacity: dark ? 0 : 1,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3.2" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3 3l1.3 1.3M11.7 11.7 13 13M13 3l-1.3 1.3M4.3 11.7 3 13" />
          </g>
        </svg>
      </span>
    </button>
  )
}
