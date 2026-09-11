import { useEffect, useState } from 'react'
import { contactCta, navLinks, person } from '../data/site'
import { ThemeToggle } from './ThemeToggle'
import { MusicToggle } from './MusicToggle'
import { MobileNav } from './MobileNav'
import type { Theme } from '../hooks/useTheme'

type Props = {
  theme: Theme
  onToggleTheme: () => void
  arcadeHref: string
  /** The arcade page has no in-page sections to scroll to. */
  simple?: boolean
}

export function Navbar({ theme, onToggleTheme, arcadeHref, simple = false }: Props) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Underline whichever section is currently in view.
  useEffect(() => {
    if (simple || typeof IntersectionObserver === 'undefined') return
    const targets = navLinks
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => !!el)
    if (targets.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const t of targets) io.observe(t)
    return () => io.disconnect()
  }, [simple])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <header
        className={[
          'fixed left-0 right-0 top-0 z-40 px-5 py-3.5 transition-all duration-300 sm:px-8 sm:py-4',
          scrolled
            ? 'border-b border-line bg-bg/80 backdrop-blur-md'
            : 'border-b border-transparent',
        ].join(' ')}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <a
            href={simple ? './' : '#home'}
            aria-label={`${person.mark}${person.markSuffix} — home`}
            className="flex items-baseline text-[20px] tracking-tight text-ink transition-opacity hover:opacity-70 sm:text-[23px]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {person.mark}
            <span className="text-accent">{person.markSuffix}</span>
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-[0.8em] w-[3px] translate-y-[1px] bg-accent"
              style={{ animation: 'blink 1.1s step-end infinite' }}
            />
          </a>

          {!simple && (
            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const on = active === link.href
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-current={on ? 'true' : undefined}
                    className={[
                      'relative rounded-full px-3.5 py-1.5 text-[15px] transition-colors',
                      on ? 'text-accent' : 'text-muted hover:text-ink',
                    ].join(' ')}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute inset-x-3 -bottom-0.5 h-[2px] origin-center rounded-full bg-accent transition-transform duration-300',
                        on ? 'scale-x-100' : 'scale-x-0',
                      ].join(' ')}
                    />
                  </a>
                )
              })}
            </nav>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href={arcadeHref}
              className="mf-arcade hidden items-center gap-1.5 rounded-full border border-[#3ef0c0] bg-[#3ef0c0]/12 px-3.5 py-1.5 text-[14px] font-medium text-[#12806a] transition-transform duration-200 hover:-translate-y-0.5 dark:text-[#3ef0c0] sm:inline-flex"
            >
              <span aria-hidden="true">🕹</span>
              {simple ? 'Back to portfolio' : 'Arcade'}
            </a>
            <MusicToggle />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            {!simple && (
              <a
                href={contactCta.href}
                className="hidden rounded-full bg-ink px-4 py-1.5 text-[14px] text-bg transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent md:inline-block"
              >
                {contactCta.label}
              </a>
            )}
            {!simple && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? 'Close menu' : 'Open menu'}
                className="relative z-[41] flex flex-col justify-center md:hidden"
                style={{ gap: '5px' }}
              >
                <Bar open={open} position="top" />
                <Bar open={open} position="mid" />
                <Bar open={open} position="bot" />
              </button>
            )}
          </div>
        </div>
      </header>

      {!simple && <MobileNav open={open} onClose={() => setOpen(false)} arcadeHref={arcadeHref} />}
    </>
  )
}

function Bar({ open, position }: { open: boolean; position: 'top' | 'mid' | 'bot' }) {
  const transform =
    position === 'top'
      ? open
        ? 'translateY(7px) rotate(45deg)'
        : 'none'
      : position === 'bot'
        ? open
          ? 'translateY(-7px) rotate(-45deg)'
          : 'none'
        : 'none'

  return (
    <span
      aria-hidden="true"
      className={`block h-[2px] w-6 ${open ? 'bg-white' : 'bg-ink'}`}
      style={{
        transform,
        opacity: position === 'mid' && open ? 0 : 1,
        transition: 'transform 300ms ease, opacity 300ms ease, background-color 300ms ease',
      }}
    />
  )
}
