import { useEffect, useRef } from 'react'
import { contactCta, navLinks } from '../data/site'

type Props = {
  open: boolean
  onClose: () => void
  arcadeHref: string
}

export function MobileNav({ open, onClose, arcadeHref }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const firstRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (!open) {
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

  const items = [...navLinks, { label: 'Arcade', href: arcadeHref }, contactCta]

  return (
    <div
      id="mobile-nav"
      ref={panelRef}
      className={[
        'fixed inset-0 z-[39] bg-[#15142a]/95 backdrop-blur-md transition-opacity duration-300 md:hidden',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      {...(open ? {} : { inert: true })}
    >
      <nav aria-label="Mobile" className="flex h-full flex-col justify-center gap-6 px-8">
        {items.map((link, i) => (
          <a
            key={link.href}
            ref={i === 0 ? firstRef : undefined}
            href={link.href}
            onClick={onClose}
            className="group flex items-center gap-4 text-[30px] font-medium text-white transition-colors hover:text-[#8e9bff]"
            style={{
              transform: open ? 'translateY(0)' : 'translateY(14px)',
              opacity: open ? 1 : 0,
              transition: `opacity 300ms ease ${60 + i * 45}ms, transform 300ms ease ${60 + i * 45}ms`,
            }}
          >
            <span
              aria-hidden="true"
              className="text-[13px] text-white/35"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              0{i + 1}
            </span>
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
