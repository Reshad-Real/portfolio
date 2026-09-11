import { useEffect, useState } from 'react'
import { brand, contactCta, navLinks } from '../data/site'
import { ThemeToggle } from './ThemeToggle'
import { MobileNav } from './MobileNav'
import type { Theme } from '../hooks/useTheme'
import type { Phase } from './HeroChamber'

type Props = {
  phase: Phase
  theme: Theme
  onToggleTheme: () => void
}

export function Navbar({ phase, theme, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.82)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // The overlay owns the scroll while it is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (phase === 'boot') setOpen(false)
  }, [phase])

  const booting = phase === 'boot'
  // White over the dark chamber, themed ink once the page proper is in view.
  const onDark = !pastHero
  const ink = onDark ? 'text-white' : 'text-ink'

  return (
    <>
      <header
        className={[
          'fixed left-0 right-0 top-0 z-10 px-5 py-4 transition-colors duration-500 sm:px-8 sm:py-5',
          pastHero ? 'border-b border-line bg-bg/85 backdrop-blur-md' : 'bg-transparent',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-4">
          <a
            href="#hero"
            aria-label={`${brand.name}${brand.mark} — home`}
            className={`flex flex-row items-center tracking-tight transition-opacity hover:opacity-60 ${ink}`}
            style={{ fontFamily: 'var(--font-heading)', gap: '0.75rem' }}
          >
            <span className="text-[21px] sm:text-[26px]">
              {brand.name}
              {brand.mark}
            </span>
            <span
              aria-hidden="true"
              className="select-none text-[25px] leading-none sm:text-[30px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {brand.asterisk}
            </span>
          </a>

          <nav
            aria-label="Primary"
            className={[
              'hidden items-center gap-4 transition-opacity duration-700 md:flex lg:gap-6',
              booting ? 'pointer-events-none opacity-0' : 'opacity-100',
            ].join(' ')}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-[23px] transition-opacity hover:opacity-60 ${ink}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div
            className={[
              'flex items-center gap-3 transition-opacity duration-700 sm:gap-4',
              booting ? 'pointer-events-none opacity-0' : 'opacity-100',
            ].join(' ')}
          >
            <ThemeToggle theme={theme} onToggle={onToggleTheme} onDark={onDark} />

            <a
              href={contactCta.href}
              className={`hidden whitespace-nowrap text-[23px] underline underline-offset-2 transition-opacity hover:opacity-60 md:inline ${ink}`}
            >
              {contactCta.label}
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="relative z-[11] flex flex-col justify-center md:hidden"
              style={{ gap: '5px' }}
            >
              <Bar open={open} onDark={onDark || open} position="top" />
              <Bar open={open} onDark={onDark || open} position="mid" />
              <Bar open={open} onDark={onDark || open} position="bot" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function Bar({
  open,
  onDark,
  position,
}: {
  open: boolean
  onDark: boolean
  position: 'top' | 'mid' | 'bot'
}) {
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
      className={`block h-[2px] w-6 ${onDark ? 'bg-white' : 'bg-ink'}`}
      style={{
        transform,
        opacity: position === 'mid' && open ? 0 : 1,
        transition: 'transform 300ms ease, opacity 300ms ease, background-color 500ms ease',
      }}
    />
  )
}
