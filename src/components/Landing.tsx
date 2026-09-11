import { useCallback, useEffect, useRef, useState } from 'react'
import { HEX_LINKS, createRoom, type Room } from '../lib/roomScene'
import { detectQuality, hasWebGL } from '../lib/quality'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useTypewriter } from '../hooks/useTypewriter'
import { brand, heroCopy, person } from '../data/site'
import { HexIcon } from './HexIcon'

const PILLS = [
  { label: 'Pitch us an idea', href: '#contact' },
  { label: 'Come work here', href: '#openings' },
  { label: 'Send a brief hello', href: `mailto:${person.email}` },
  { label: 'See how we operate', href: '#studio' },
] as const

const SOCIALS = [
  { label: 'Google Scholar', href: person.links.scholar, glyph: 'GS' },
  { label: 'GitHub', href: person.links.github, glyph: 'GH' },
  { label: 'LinkedIn', href: person.links.linkedin, glyph: 'in' },
] as const

const DETAIL = { high: 2, medium: 2, low: 1 } as const

export function Landing({ base }: { base: string }) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const roomRef = useRef<Room | null>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const reduced = usePrefersReducedMotion()

  const [webgl] = useState(() => hasWebGL())
  const [sceneOk, setSceneOk] = useState(webgl)
  const { displayed, done } = useTypewriter(heroCopy.typewriter, 38, 900)

  // -------------------------------------------------------------- the room
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !webgl) return

    const quality = detectQuality()
    const room = createRoom(canvas, DETAIL[quality], reduced)
    if (!room) {
      setSceneOk(false)
      return
    }
    roomRef.current = room

    const applyLayout = () => room.setLayout(window.innerWidth < 1024 ? 'compact' : 'wide')
    applyLayout()

    let raf = 0
    let visible = true

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      room.render(now)

      // The wall panels are real links, parked on top of the panels they
      // belong to. Writing straight to the DOM keeps React out of the loop.
      const spots = room.spots()
      const stageH = canvas.clientHeight
      for (let i = 0; i < spots.length; i++) {
        const el = linkRefs.current[i]
        if (!el) continue
        const s = spots[i]
        el.style.opacity = s.visible ? '1' : '0'
        el.style.pointerEvents = s.visible ? 'auto' : 'none'
        if (!s.visible) continue
        // left/top carry the position, because a percentage inside transform
        // would resolve against the link's own box rather than the stage.
        el.style.left = `${s.x.toFixed(2)}%`
        el.style.top = `${s.y.toFixed(2)}%`
        const size = Math.max(40, (s.radius / 100) * stageH * 1.5)
        el.style.width = `${size.toFixed(0)}px`
        el.style.height = `${size.toFixed(0)}px`
      }
    }
    raf = requestAnimationFrame(frame)

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      room.setPointer(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        ((e.clientY - r.top) / r.height) * 2 - 1,
      )
    }
    const onResize = () => {
      applyLayout()
      room.resize()
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('resize', onResize)

    let io: IntersectionObserver | null = null
    if (stageRef.current && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((es) => {
        visible = es.some((e) => e.isIntersecting)
      })
      io.observe(stageRef.current)
    }

    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', onResize)
      room.dispose()
      roomRef.current = null
    }
  }, [webgl, reduced])

  const hover = useCallback((id: string | null) => {
    roomRef.current?.setHover(id)
  }, [])

  const showFloating = sceneOk && webgl

  return (
    <section
      id="home"
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 0%, #5567ea 0%, #4355db 45%, #3644b8 100%)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-14 pt-24 sm:px-8 md:px-10 lg:grid lg:min-h-[100svh] lg:grid-cols-[minmax(0,43fr)_minmax(0,57fr)] lg:items-center lg:gap-6 lg:pb-16 lg:pt-28">
        {/* ---------------------------------------------------------- intro */}
        <div className="order-2 max-w-xl lg:order-1">
          <p
            className="mb-3 text-[11px] uppercase tracking-[0.26em] text-white/55"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            {person.title}
          </p>
          <h1 className="text-[clamp(34px,6.4vw,62px)] font-medium leading-[1.02] tracking-[-0.03em] text-white">
            {person.name}
          </h1>
          <p className="mt-3 text-[clamp(16px,2.1vw,21px)] leading-snug text-white/75">
            {person.role}. I design transistors about five nanometres wide, simulate them until
            the physics gives in, and teach the people who will build the next ones.
          </p>

          {/* The studio agent, kept as a quiet strip rather than a headline. */}
          <div className="mt-7 rounded-lg border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
            <p
              className="pointer-events-none select-none text-[12px] uppercase tracking-[0.2em] text-white/45"
              style={{ fontFamily: 'var(--font-tech)', filter: 'blur(0.4px)' }}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: heroCopy.intro }}
            />
            <span className="sr-only">
              Hey there, meet {brand.agent}, {brand.name}&rsquo;s {brand.agentExpanded}
            </span>
            <p
              className="mt-2 min-h-[48px] text-[15px] leading-snug text-white sm:text-[17px]"
            >
              {displayed}
              {!done && <span className="mf-cursor" aria-hidden="true" />}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-y-1">
            {PILLS.map((p) => (
              <a
                key={p.label}
                href={p.href}
                className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-[0.36em] text-[13px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:px-5 sm:text-[14px]"
              >
                {p.label}
              </a>
            ))}
            <EmailPill />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={`${base}${person.cv}`}
              download
              className="inline-flex items-center gap-2 rounded-full border border-white/70 px-5 py-2 text-[14px] text-white transition-colors hover:bg-white hover:text-[#3644b8]"
            >
              Download CV
              <span aria-hidden="true">↓</span>
            </a>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-[11px] font-medium text-white/80 transition-colors hover:border-white hover:bg-white hover:text-[#3644b8]"
              >
                {s.glyph}
              </a>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------- the room */}
        <div
          ref={stageRef}
          className="relative order-1 -mx-2 h-[42svh] min-h-[280px] sm:h-[48svh] lg:order-2 lg:-mr-6 lg:h-[78svh] lg:min-h-[540px]"
        >
          {webgl && sceneOk ? (
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="h-full w-full"
              style={{ touchAction: 'pan-y' }}
            />
          ) : (
            <RoomFallback />
          )}

          {/* Wall panels as real links, placed by the render loop. */}
          {showFloating && (
            <div className="pointer-events-none absolute inset-0 hidden lg:block">
              {HEX_LINKS.map((link, i) => (
                <a
                  key={link.id}
                  ref={(el) => {
                    linkRefs.current[i] = el
                  }}
                  href={link.href}
                  onMouseEnter={() => hover(link.id)}
                  onMouseLeave={() => hover(null)}
                  onFocus={() => hover(link.id)}
                  onBlur={() => hover(null)}
                  className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-2xl text-white opacity-0 transition-opacity duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  <HexIcon id={link.id} />
                  <span
                    className="text-[10px] uppercase tracking-[0.12em]"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* -------------------------------------------- panels, small screens */}
        <nav aria-label="Sections" className="order-3 lg:hidden">
          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {HEX_LINKS.map((link, i) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/15 px-2 py-4 text-white transition-colors active:bg-white/20"
                  style={{ background: `${HEX_TINT[i]}` }}
                >
                  <HexIcon id={link.id} size={20} />
                  <span
                    className="text-[10px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    {link.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}

const HEX_TINT = [
  'rgba(242,120,159,0.30)',
  'rgba(155,106,224,0.30)',
  'rgba(240,160,64,0.30)',
  'rgba(60,196,127,0.30)',
  'rgba(91,141,240,0.30)',
  'rgba(232,96,122,0.30)',
]

function RoomFallback() {
  return (
    <div className="grid h-full place-items-center">
      <p className="max-w-xs text-center text-[14px] leading-relaxed text-white/70">
        The 3D workspace needs WebGL, which this browser is not offering. Everything else on the
        page works exactly the same.
      </p>
    </div>
  )
}

function EmailPill() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(brand.studioEmail)
        ok = true
      }
    } catch {
      ok = false
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea')
        ta.value = brand.studioEmail
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        ok = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        ok = false
      }
    }
    setState(ok ? 'copied' : 'failed')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy email address ${brand.studioEmail}`}
      className="relative mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white bg-transparent px-4 py-[0.36em] text-[13px] text-white transition-colors duration-200 hover:bg-white hover:text-[#3644b8] sm:gap-3 sm:px-5 sm:text-[14px]"
    >
      <span>
        Reach us: <span className="underline underline-offset-1">{brand.studioEmail}</span>
      </span>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
        <rect x="0.6" y="0.6" width="7.6" height="7.6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <rect x="3.8" y="3.8" width="7.6" height="7.6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      </svg>
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[11px] text-[#3644b8] transition-all duration-200',
          state === 'idle' ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
        ].join(' ')}
      >
        {state === 'failed' ? 'Press Ctrl+C' : 'Copied!'}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Email address copied' : ''}
      </span>
    </button>
  )
}
