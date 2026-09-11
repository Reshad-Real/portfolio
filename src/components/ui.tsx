import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useInView } from '../hooks/useInView'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

/** Fades a block up the first time it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'article' | 'section' | 'p'
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <Tag
      ref={ref as never}
      className={`mf-reveal ${className}`}
      data-shown={inView ? 'true' : 'false'}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

export function Section({
  id,
  children,
  className = '',
  tone = 'base',
}: {
  id: string
  children: ReactNode
  className?: string
  tone?: 'base' | 'alt'
}) {
  return (
    <section
      id={id}
      className={[
        'relative border-t border-line',
        tone === 'alt' ? 'bg-bg2' : 'bg-bg',
        className,
      ].join(' ')}
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 md:px-10 md:py-28">
        {children}
      </div>
    </section>
  )
}

export function SectionHeading({
  index,
  kicker,
  title,
  lede,
  align = 'left',
}: {
  index: string
  kicker: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'wide'
}) {
  return (
    <header className={align === 'wide' ? 'mb-12 md:mb-16' : 'mb-12 max-w-3xl md:mb-16'}>
      <Reveal>
        <div className="mb-6 flex items-center gap-4">
          <span
            className="text-[11px] tracking-[0.2em] text-accent"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            {index}
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.3em] text-muted"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            {kicker}
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>
      </Reveal>
      <Reveal delay={60}>
        <h2 className="max-w-3xl text-[clamp(30px,5.2vw,58px)] font-medium leading-[1.04] tracking-[-0.025em] text-ink">
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal delay={120}>
          <p className="mt-5 max-w-2xl text-[clamp(15px,1.6vw,19px)] leading-relaxed text-muted">
            {lede}
          </p>
        </Reveal>
      )}
    </header>
  )
}

/** Counts up to `value` the first time it is seen. */
export function Counter({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className = '',
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setShown(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 1100
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, reduced])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-line px-2.5 py-[3px] text-[11px] tracking-wide text-muted"
      style={{ fontFamily: 'var(--font-tech)' }}
    >
      {children}
    </span>
  )
}

/**
 * Nudges toward the cursor while it is nearby. Pointer-driven, so it simply
 * does nothing on touch devices and under reduced motion.
 */
export function Magnetic({
  children,
  strength = 0.32,
  className = '',
  style,
}: {
  children: ReactNode
  strength?: number
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (window.matchMedia?.('(pointer: coarse)').matches) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy)
      const radius = Math.max(r.width, r.height) * 1.1 + 60
      if (dist < radius) {
        tx = dx * strength
        ty = dy * strength
      } else {
        tx = 0
        ty = 0
      }
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const loop = () => {
      cx += (tx - cx) * 0.16
      cy += (ty - cy) * 0.16
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
      if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) {
        raf = requestAnimationFrame(loop)
      } else {
        raf = 0
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
      el.style.transform = ''
    }
  }, [strength, reduced])

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`} style={style}>
      {children}
    </span>
  )
}

/** A thin progress rail pinned to the top of the page. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      el.style.transform = `scaleX(${p.toFixed(4)})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[2px]">
      <div ref={ref} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}
