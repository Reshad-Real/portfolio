import { useCallback, useEffect, useRef, useState } from 'react'
import type { DogMood, DogScene } from '../lib/dogScene'
import { detectQuality, hasWebGL } from '../lib/quality'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

const PET_KEY = 'mf-dog-petted'
const HIDE_KEY = 'mf-dog-hidden'

/** Short lines, tied to the section actually on screen. */
const LINES: Record<string, string> = {
  about: 'that is him, yes',
  labs: 'five nanometres. tiny.',
  energy: 'the grid is fine. probably.',
  papers: 'six of these are his',
  bench: 'do not touch the knobs',
  openings: 'he explains things at 8am',
  studio: 'simulate first. always.',
  arcade: 'high scores live here',
  contact: 'say hello',
}

type Heart = { id: number; x: number; y: number }

export function CyberDog() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<DogScene | null>(null)
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
  const [ready, setReady] = useState(false)

  const petRef = useRef(0)
  const holdRef = useRef(false)
  const holdTimer = useRef<number | null>(null)
  const lastHeart = useRef(0)
  const moodRef = useRef<DogMood>('idle')
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

    // Dragging fires this many times a second; hearts are rate-limited so the
    // list and its timers cannot run away.
    const now = performance.now()
    if (now - lastHeart.current < 220) return
    lastHeart.current = now
    const id = heartId.current++
    setHearts((h) => [...h.slice(-4), { id, x: 32 + Math.random() * 46, y: 26 }])
    window.setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1200)
  }, [petted])

  // ------------------------------------------------------------ the scene
  useEffect(() => {
    if (hidden || !supported) return
    let cancelled = false
    let raf = 0
    let disposed = false

    const boot = async () => {
      // The dog is lazy: he is not worth blocking first paint for.
      const { createDogScene } = await import('../lib/dogScene')
      const canvas = canvasRef.current
      if (cancelled || !canvas) return
      const scene = createDogScene(canvas, detectQuality(), reduced)
      if (!scene) return
      // The component may already have unmounted while the chunk loaded.
      if (disposed) {
        scene.dispose()
        return
      }
      sceneRef.current = scene
      setReady(true)

      const host = hostRef.current
      let posX = window.innerWidth - 160
      let targetX = posX
      let pointerX = posX
      let pointerY = window.innerHeight - 120
      let facing: 1 | -1 = -1
      let hasPointer = false

      const size = () => (window.innerWidth < 640 ? 104 : 140)

      const onMove = (e: PointerEvent) => {
        hasPointer = true
        pointerX = e.clientX
        pointerY = e.clientY
      }
      const onOver = (e: Event) => {
        const el = e.target as HTMLElement | null
        const interactive = el?.closest?.('a, button, input, select, [role="button"]')
        moodRef.current = interactive ? 'alert' : 'idle'
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerover', onOver, { passive: true })

      const frame = (now: number) => {
        if (disposed) return
        raf = requestAnimationFrame(frame)
        if (document.hidden) return

        const s = size()
        const margin = 12
        // He trails the cursor along the bottom of the window rather than
        // sitting glued to it.
        targetX = hasPointer
          ? Math.max(margin, Math.min(window.innerWidth - s - margin, pointerX - s / 2))
          : window.innerWidth - s - margin

        const delta = targetX - posX
        const travel = Math.min(Math.abs(delta), 14)
        if (Math.abs(delta) > 6) {
          posX += Math.sign(delta) * travel * (reduced ? 1 : 0.42)
          facing = delta > 0 ? 1 : -1
        }
        scene.setGait(Math.min(1, Math.abs(delta) / 160))
        scene.setFacing(facing)

        if (host) host.style.transform = `translate3d(${posX.toFixed(1)}px, 0, 0)`

        // Look toward the cursor, in the dog's own units.
        const cx = posX + s / 2
        const cy = window.innerHeight - s / 2 - margin
        scene.setLook(
          Math.max(-1, Math.min(1, (pointerX - cx) / 320)),
          Math.max(-1, Math.min(1, (pointerY - cy) / 260)),
        )

        if (!holdRef.current) petRef.current = Math.max(0, petRef.current - 0.012)
        scene.setPet(petRef.current)
        scene.setMood(petRef.current > 0.3 ? 'happy' : moodRef.current)

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

    let teardown: (() => void) | undefined
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
  }, [hidden, supported, reduced])

  // -------------------------------------------------------- section lines
  useEffect(() => {
    if (hidden || !supported) return
    const ids = Object.keys(LINES)
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return

    let currentId = ''
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          if (e.target.id === currentId) continue
          currentId = e.target.id
          const line = LINES[currentId]
          if (line) say(line)
        }
      },
      { threshold: 0.45 },
    )
    for (const s of sections) io.observe(s)
    return () => io.disconnect()
  }, [hidden, supported, say])

  useEffect(
    () => () => {
      if (speechTimer.current) window.clearTimeout(speechTimer.current)
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
    },
    [],
  )

  if (!supported || hidden) {
    return hidden ? (
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
      className="group pointer-events-none fixed bottom-3 left-0 z-[8] h-[104px] w-[104px] sm:h-[140px] sm:w-[140px]"
      style={{ transform: 'translate3d(-200px,0,0)' }}
    >
      {/* speech + hint */}
      <div className="pointer-events-none absolute -top-2 left-1/2 w-[170px] -translate-x-1/2 -translate-y-full text-center">
        {(speech || (!petted && ready)) && (
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
          className="pointer-events-none absolute text-[15px]"
          style={{
            left: h.x,
            top: h.y,
            animation: 'mf-heart 1.2s ease-out forwards',
          }}
        >
          ♥
        </span>
      ))}

      <button
        type="button"
        onPointerDown={pet}
        onPointerEnter={() => {
          moodRef.current = 'alert'
        }}
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
        className="pointer-events-auto absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full border border-line bg-bg/90 text-[12px] leading-none text-muted opacity-35 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}
