import { useCallback, useEffect, useRef, useState } from 'react'
import type { Companion } from '../lib/dogCompanion'
import { detectQuality, hasWebGL } from '../lib/quality'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

const PET_KEY = 'mf-dog-petted'
const HIDE_KEY = 'mf-dog-hidden'

/** Short lines, tied to whichever section is on screen. */
const LINES: Record<string, string> = {
  about: 'that is him, yes',
  labs: 'five nanometres. tiny.',
  energy: 'the grid is fine. probably.',
  papers: 'six of these are his',
  openings: 'he explains things at 8am',
  studio: 'simulate first. always.',
  arcade: 'high scores live here',
  contact: 'say hello',
}

type Heart = { id: number; x: number }

const DETAIL = { high: 2, medium: 2, low: 1 } as const

/**
 * BYTE follows the reader once the landing room is behind them. On a pointer
 * device he trails the cursor along the bottom of the window; on touch he sits
 * in the corner, because there is no cursor to follow.
 */
export function CyberDog() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<Companion | null>(null)
  const reduced = usePrefersReducedMotion()

  const [supported] = useState(() => hasWebGL())
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [petted, setPetted] = useState(() => {
    try {
      return localStorage.getItem(PET_KEY) === '1'
    } catch {
      return false
    }
  })
  const [hearts, setHearts] = useState<Heart[]>([])
  const [speech, setSpeech] = useState<string | null>(null)
  const [awake, setAwake] = useState(false)

  const petRef = useRef(0)
  const holdRef = useRef(false)
  const holdTimer = useRef<number | null>(null)
  const lastHeart = useRef(0)
  const alertRef = useRef(0)
  const heartId = useRef(0)
  const speechTimer = useRef<number | null>(null)

  const say = useCallback((text: string) => {
    setSpeech(text)
    if (speechTimer.current) window.clearTimeout(speechTimer.current)
    speechTimer.current = window.setTimeout(() => setSpeech(null), 2800)
  }, [])

  const pet = useCallback(() => {
    petRef.current = 1
    holdRef.current = true
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => {
      holdRef.current = false
    }, 1400)

    if (!petted) {
      setPetted(true)
      try {
        localStorage.setItem(PET_KEY, '1')
      } catch {
        /* ignore */
      }
    }

    const now = performance.now()
    if (now - lastHeart.current < 240) return
    lastHeart.current = now
    const id = heartId.current++
    setHearts((h) => [...h.slice(-4), { id, x: 26 + Math.random() * 46 }])
    window.setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1200)
  }, [petted])

  /**
   * He appears once the landing has scrolled away, and steps out again over
   * the arcade on a narrow screen, where he would otherwise sit on top of the
   * on-screen game controls.
   */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setAwake(true)
      return
    }
    const landing = document.getElementById('home')
    const arcade = document.getElementById('arcade')
    const state = { onLanding: !!landing, onArcade: false }

    const apply = () => {
      const narrow = window.innerWidth < 900
      setAwake(!state.onLanding && !(narrow && state.onArcade))
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === landing) state.onLanding = e.isIntersecting
          if (e.target === arcade) state.onArcade = e.isIntersecting
        }
        apply()
      },
      { threshold: 0.12 },
    )
    if (landing) io.observe(landing)
    if (arcade) io.observe(arcade)
    if (!landing) apply()

    window.addEventListener('resize', apply)
    return () => {
      io.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [])

  useEffect(() => {
    if (hidden || !supported || !awake) return
    let cancelled = false
    let disposed = false
    let raf = 0
    let teardown: (() => void) | undefined

    const boot = async () => {
      const { createCompanion } = await import('../lib/dogCompanion')
      const canvas = canvasRef.current
      if (cancelled || !canvas) return
      const scene = createCompanion(canvas, DETAIL[detectQuality()], reduced)
      if (!scene) return
      if (disposed) {
        scene.dispose()
        return
      }
      sceneRef.current = scene

      const host = hostRef.current
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
      const size = () => (window.innerWidth < 640 ? 96 : 132)

      let posX = window.innerWidth - size() - 16
      let pointerX = posX
      let pointerY = window.innerHeight - 120
      let facing: 1 | -1 = -1
      let hasPointer = false

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        hasPointer = true
        pointerX = e.clientX
        pointerY = e.clientY
      }
      const onOver = (e: Event) => {
        const el = e.target as HTMLElement | null
        alertRef.current = el?.closest?.('a, button, input, select, [role="button"]') ? 1 : 0
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerover', onOver, { passive: true })

      const frame = (now: number) => {
        if (disposed) return
        raf = requestAnimationFrame(frame)
        if (document.hidden) return

        const sz = size()
        const margin = 14
        const target =
          hasPointer && !coarse
            ? Math.max(margin, Math.min(window.innerWidth - sz - margin, pointerX - sz / 2))
            : window.innerWidth - sz - margin

        const delta = target - posX
        if (Math.abs(delta) > 6) {
          posX += Math.sign(delta) * Math.min(Math.abs(delta), 13) * (reduced ? 1 : 0.4)
          facing = delta > 0 ? 1 : -1
        }
        scene.setFacing(facing)
        if (host) host.style.transform = `translate3d(${posX.toFixed(1)}px, 0, 0)`

        const cx = posX + sz / 2
        const cy = window.innerHeight - sz / 2 - margin
        scene.setLook((pointerX - cx) / 340, (pointerY - cy) / 280)

        if (!holdRef.current) petRef.current = Math.max(0, petRef.current - 0.012)
        scene.setPet(petRef.current)
        scene.setAlert(petRef.current > 0.3 ? 0 : alertRef.current)
        scene.render(now)
      }
      raf = requestAnimationFrame(frame)

      const onResize = () => scene.resize()
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerover', onOver)
        window.removeEventListener('resize', onResize)
      }
    }

    void boot().then((fn) => {
      if (cancelled) fn?.()
      else teardown = fn
    })

    return () => {
      cancelled = true
      disposed = true
      cancelAnimationFrame(raf)
      teardown?.()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [hidden, supported, reduced, awake])

  // A short line when a new section arrives.
  useEffect(() => {
    if (hidden || !supported || !awake) return
    const sections = Object.keys(LINES)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return

    let currentId = ''
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || e.target.id === currentId) continue
          currentId = e.target.id
          const line = LINES[currentId]
          if (line) say(line)
        }
      },
      { threshold: 0.45 },
    )
    for (const s of sections) io.observe(s)
    return () => io.disconnect()
  }, [hidden, supported, say, awake])

  useEffect(
    () => () => {
      if (speechTimer.current) window.clearTimeout(speechTimer.current)
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
    },
    [],
  )

  if (!supported) return null

  if (hidden) {
    return awake ? (
      <button
        type="button"
        onClick={() => {
          setHidden(false)
          try {
            localStorage.removeItem(HIDE_KEY)
          } catch {
            /* ignore */
          }
        }}
        className="fixed bottom-4 right-4 z-[8] rounded-full border border-line bg-bg/90 px-3 py-1.5 text-[12px] text-ink shadow-sm backdrop-blur transition-colors hover:bg-ink hover:text-bg"
      >
        Bring BYTE back
      </button>
    ) : null
  }

  return (
    <div
      ref={hostRef}
      aria-hidden={!awake}
      className={[
        'group pointer-events-none fixed bottom-3 left-0 z-[8] h-[96px] w-[96px] transition-opacity duration-500 sm:h-[132px] sm:w-[132px]',
        awake ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      style={{ transform: 'translate3d(-200px,0,0)' }}
    >
      <div className="pointer-events-none absolute -top-1 left-1/2 w-[168px] -translate-x-1/2 -translate-y-full text-center">
        {awake && (speech || !petted) && (
          <span
            className="inline-block rounded-full border border-line bg-bg/92 px-3 py-1 text-[11px] text-ink shadow-sm backdrop-blur"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            {speech ?? 'pet me'}
          </span>
        )}
      </div>

      {hearts.map((h) => (
        <span
          key={h.id}
          aria-hidden="true"
          className="pointer-events-none absolute top-6 text-[15px] text-accent2"
          style={{ left: h.x, animation: 'mf-heart 1.2s ease-out forwards' }}
        >
          ♥
        </span>
      ))}

      <button
        type="button"
        onPointerDown={pet}
        onPointerMove={(e) => {
          if (e.buttons > 0) pet()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            pet()
            say('good human')
          }
        }}
        aria-label="Pet BYTE, the cyber-dog"
        tabIndex={awake ? 0 : -1}
        className="pointer-events-auto block h-full w-full cursor-pointer rounded-full"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
      </button>

      <button
        type="button"
        onClick={() => {
          setHidden(true)
          try {
            localStorage.setItem(HIDE_KEY, '1')
          } catch {
            /* ignore */
          }
        }}
        aria-label="Hide BYTE"
        tabIndex={awake ? 0 : -1}
        className="pointer-events-auto absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full border border-line bg-bg/90 text-[12px] leading-none text-muted opacity-35 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}
