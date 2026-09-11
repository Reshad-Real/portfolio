import { useCallback, useEffect, useRef, useState } from 'react'
import { DogArt, type Pose } from './art/DogArt'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { bark as barkSound, isSfxOn, setSfx } from '../lib/audio'

const HIDE_KEY = 'mf-dog-hidden'
const MET_KEY = 'mf-dog-met'

type Mode = 'idle' | 'menu' | 'petting' | 'walking' | 'goinghome'

type Heart = { id: number; dx: number }

const BARKS = ['woof!', 'wf!', 'borf!', 'arf!']
const PET_LINES = ['good human', 'again, please', 'best day', '*happy noises*']
const WALK_LINES = ['off we go', 'exploring', 'brb, sniffing']

const pick = (xs: readonly string[]) => xs[Math.floor(Math.random() * xs.length)]

/**
 * BYTE sits in the bottom-right corner. Click him and he barks, then offers a
 * menu: pet him, or send him wandering along the bottom of the page. Click him
 * again while he is out and the menu comes back. Three quick clicks and he
 * trots home.
 *
 * His position is written straight to the element inside the animation frame.
 * Keeping it in React state meant a re-render of the whole drawing sixty times
 * a second, and the render racing the frame made him stutter and jump back.
 */
export function Byte() {
  const reduced = usePrefersReducedMotion()
  const hostRef = useRef<HTMLDivElement | null>(null)

  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [met, setMet] = useState(() => {
    try {
      return localStorage.getItem(MET_KEY) === '1'
    } catch {
      return false
    }
  })

  const [mode, setMode] = useState<Mode>('idle')
  const [pose, setPose] = useState<Pose>('sit')
  const [facing, setFacing] = useState<1 | -1>(-1)
  const [barking, setBarking] = useState(false)
  const [blinking, setBlinking] = useState(false)
  const [joy, setJoy] = useState(0)
  const [say, setSay] = useState<string | null>(null)
  const [hearts, setHearts] = useState<Heart[]>([])
  const [ring, setRing] = useState(0)
  const [edge, setEdge] = useState<'left' | 'right' | 'centre'>('right')

  const size = () => (window.innerWidth < 640 ? 84 : 116)
  const homeX = () => Math.max(10, window.innerWidth - size() - 14)

  // Position lives here, never in state.
  const xRef = useRef(0)
  const targetRef = useRef(0)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const clickTimes = useRef<number[]>([])
  const timers = useRef<number[]>([])
  const heartId = useRef(0)
  const [look, setLook] = useState({ x: 0, y: 0 })

  const after = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t)
      timers.current = []
    },
    [],
  )

  /** Writes the element transform, and reports which edge the menu must avoid. */
  const place = useCallback((x: number) => {
    xRef.current = x
    const host = hostRef.current
    if (host) host.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`
    const vw = window.innerWidth
    setEdge(x > vw - 250 ? 'right' : x < 120 ? 'left' : 'centre')
  }, [])

  useEffect(() => {
    if (hidden) return
    place(homeX())
    targetRef.current = homeX()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, place])

  const speak = useCallback(
    (text: string, ms = 1800) => {
      setSay(text)
      after(ms, () => setSay((cur) => (cur === text ? null : cur)))
    },
    [after],
  )

  const bark = useCallback(
    (happy = false) => {
      setBarking(true)
      setRing((r) => r + 1)
      barkSound(happy)
      speak(pick(BARKS), 1100)
      after(340, () => setBarking(false))
    },
    [after, speak],
  )

  // ------------------------------------------------------------- behaviour
  const openMenu = useCallback(() => {
    setPose('sit')
    setMode('menu')
    bark()
    if (!met) {
      setMet(true)
      try {
        localStorage.setItem(MET_KEY, '1')
      } catch {
        /* ignore */
      }
    }
  }, [bark, met])

  const goHome = useCallback(() => {
    setMode('goinghome')
    setPose('walk')
    const home = homeX()
    targetRef.current = home
    setFacing(home > xRef.current ? 1 : -1)
    speak('heading back', 1500)
  }, [speak])

  const wanderSomewhereNew = useCallback(() => {
    const s = size()
    const next = 14 + Math.random() * Math.max(40, window.innerWidth - s - 28)
    targetRef.current = next
    setFacing(next > xRef.current ? 1 : -1)
    setPose('walk')
  }, [])

  const onDogClick = useCallback(() => {
    // A real gesture, so the arcade and the bark may make noise from here on.
    if (!isSfxOn()) setSfx(true)

    const now = performance.now()
    clickTimes.current = [...clickTimes.current.filter((t) => now - t < 1300), now]
    if (clickTimes.current.length >= 3) {
      clickTimes.current = []
      goHome()
      return
    }

    if (modeRef.current === 'menu') {
      // Close the menu; if he was out walking, let him carry on.
      setMode(pose === 'walk' ? 'walking' : 'idle')
      bark()
      return
    }
    openMenu()
  }, [bark, goHome, openMenu, pose])

  const petHim = useCallback(() => {
    setMode('petting')
    setPose('sit')
    setJoy(1)
    speak(pick(PET_LINES), 2200)
    barkSound(true)
    for (let i = 0; i < 5; i++) {
      after(i * 170, () => {
        const id = heartId.current++
        setHearts((h) => [...h.slice(-5), { id, dx: (Math.random() - 0.5) * 44 }])
        after(1200, () => setHearts((h) => h.filter((v) => v.id !== id)))
      })
    }
    after(2400, () => {
      setJoy(0)
      setMode((m) => (m === 'petting' ? 'idle' : m))
    })
  }, [after, speak])

  const takeWalk = useCallback(() => {
    bark(true)
    speak(pick(WALK_LINES), 1600)
    after(320, () => {
      setMode('walking')
      wanderSomewhereNew()
    })
  }, [after, bark, speak, wanderSomewhereNew])

  // ------------------------------------------------------------ the motion
  useEffect(() => {
    if (hidden) return
    let raf = 0
    let last = 0
    let resting = false

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      if (document.hidden) return
      const dt = last ? Math.min(48, now - last) : 16
      last = now

      const m = modeRef.current
      if (m !== 'walking' && m !== 'goinghome') return
      if (resting) return

      const speed = (m === 'goinghome' ? 0.2 : 0.12) * dt
      const delta = targetRef.current - xRef.current

      if (Math.abs(delta) <= speed) {
        place(targetRef.current)
        if (m === 'goinghome') {
          setMode('idle')
          setPose('sit')
          setFacing(-1)
          return
        }
        // Sit and sniff, then pick somewhere else.
        resting = true
        setPose('sit')
        after(700 + Math.random() * 1500, () => {
          resting = false
          if (modeRef.current !== 'walking') return
          wanderSomewhereNew()
        })
        return
      }

      place(xRef.current + Math.sign(delta) * speed)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [hidden, after, place, wanderSomewhereNew])

  // Keep him in the window when it changes size.
  useEffect(() => {
    const onResize = () => {
      if (modeRef.current === 'idle' || modeRef.current === 'menu') {
        place(homeX())
        targetRef.current = homeX()
        return
      }
      const limit = Math.max(10, window.innerWidth - size() - 10)
      if (xRef.current > limit) place(limit)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [place])

  // Blinking, on his own irregular schedule.
  useEffect(() => {
    if (hidden || reduced) return
    let t = window.setTimeout(function loop() {
      setBlinking(true)
      window.setTimeout(() => setBlinking(false), 130)
      t = window.setTimeout(loop, 2600 + Math.random() * 3800)
    }, 2400)
    return () => window.clearTimeout(t)
  }, [hidden, reduced])

  // A glance toward the cursor, throttled to one frame.
  useEffect(() => {
    if (hidden || reduced) return
    let raf = 0
    let pending = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      const host = hostRef.current
      if (!host) return
      const r = host.getBoundingClientRect()
      pending = {
        x: Math.max(-1, Math.min(1, (e.clientX - (r.x + r.width / 2)) / 300)),
        y: Math.max(-1, Math.min(1, (e.clientY - (r.y + r.height / 2)) / 240)),
      }
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0
          setLook(pending)
        })
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [hidden, reduced])

  if (hidden) {
    return (
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
        className="fixed bottom-4 right-4 z-30 rounded-full border border-line bg-bg/90 px-3 py-1.5 text-[12px] text-ink shadow-sm backdrop-blur transition-colors hover:bg-ink hover:text-bg"
      >
        Bring BYTE back
      </button>
    )
  }

  const menuOpen = mode === 'menu'

  return (
    <div
      ref={hostRef}
      className="pointer-events-none fixed bottom-1 left-0 z-30 h-[88px] w-[84px] sm:h-[120px] sm:w-[116px]"
      style={{ transform: 'translate3d(-300px, 0, 0)' }}
    >
      {say && (
        <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap">
          <span
            className="inline-block rounded-full border border-line bg-bg px-2.5 py-1 text-[11.5px] text-ink shadow-sm"
            style={{ fontFamily: 'var(--font-tech)', animation: 'mf-pop 220ms ease-out' }}
          >
            {say}
          </span>
        </div>
      )}

      {ring > 0 && (
        <span
          key={ring}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-6 h-9 w-9 -translate-x-1/2 rounded-full border-2 border-accent"
          style={{ animation: 'mf-ring 620ms ease-out forwards' }}
        />
      )}

      {hearts.map((h) => (
        <span
          key={h.id}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-7 text-[15px] text-accent2"
          style={{ ['--dx' as string]: `${h.dx}px`, animation: 'mf-heart-float 1.2s ease-out forwards' }}
        >
          ♥
        </span>
      ))}

      <button
        type="button"
        onClick={onDogClick}
        aria-label={menuOpen ? 'BYTE the dog, menu open' : 'BYTE the dog, click to say hello'}
        aria-expanded={menuOpen}
        className="pointer-events-auto block h-full w-full cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{ transform: `scaleX(${pose === 'walk' ? facing : 1})` }}
      >
        <DogArt
          pose={pose}
          joy={joy}
          barking={barking}
          blinking={blinking}
          lookX={pose === 'walk' ? 0 : look.x}
          lookY={pose === 'walk' ? 0 : look.y}
          className="h-full w-full"
        />
      </button>

      {/* Menu, flipped to whichever side has room. */}
      <div
        className={[
          'absolute bottom-full mb-7 w-max transition-all duration-200',
          edge === 'right' ? 'right-0' : edge === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2',
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-1 opacity-0',
        ].join(' ')}
        {...(menuOpen ? {} : { inert: true })}
      >
        <div className="flex gap-1 rounded-full border border-line bg-bg p-1.5 shadow-lg">
          <button
            type="button"
            onClick={petHim}
            className="rounded-full px-3 py-1.5 text-[12.5px] text-ink transition-colors hover:bg-accent hover:text-white"
          >
            Pet me
          </button>
          <button
            type="button"
            onClick={takeWalk}
            className="rounded-full px-3 py-1.5 text-[12.5px] text-ink transition-colors hover:bg-accent hover:text-white"
          >
            Take a walk
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
            className="rounded-full px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:text-ink"
          >
            ×
          </button>
        </div>
      </div>

      {!met && mode === 'idle' && (
        <span
          className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-line bg-bg px-2.5 py-1 text-[11.5px] text-ink shadow-sm"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          click me
        </span>
      )}
    </div>
  )
}
