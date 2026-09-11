import { useEffect, useRef } from 'react'
import { contactCta, navLinks } from '../data/site'

type Props = {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const firstRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (!open) {
      // Do not leave focus behind inside a panel that is now inert.
      const active = document.activeElement
      if (active instanceof HTMLElement && panelRef.current?.contains(active)) active.blur()
      return
    }
    firstRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      // Keep focus inside the overlay while it is open.
      const items = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button')
      if (!items || items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      id="mobile-nav"
      ref={panelRef}
      className={[
        'fixed inset-0 z-[9] bg-black/90 backdrop-blur-md transition-opacity duration-300 md:hidden',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      inert={!open}
    >
      <nav
        aria-label="Mobile"
        className="flex h-full flex-col justify-center gap-8 px-8 text-left"
      >
        {navLinks.map((link, i) => (
          <a
            key={link.href}
            ref={i === 0 ? firstRef : undefined}
            href={link.href}
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="text-[32px] font-medium text-white transition-opacity hover:opacity-60"
            style={{
              transform: open ? 'translateY(0)' : 'translateY(12px)',
              opacity: open ? 1 : 0,
              transition: `opacity 300ms ease ${60 + i * 45}ms, transform 300ms ease ${60 + i * 45}ms`,
            }}
          >
            {link.label}
          </a>
        ))}
        <a
          href={contactCta.href}
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className="text-[32px] font-medium text-white underline underline-offset-4 transition-opacity hover:opacity-60"
          style={{
            transform: open ? 'translateY(0)' : 'translateY(12px)',
            opacity: open ? 1 : 0,
            transition: `opacity 300ms ease ${60 + navLinks.length * 45}ms, transform 300ms ease ${60 + navLinks.length * 45}ms`,
          }}
        >
          {contactCta.label}
        </a>
      </nav>
    </div>
  )
}
