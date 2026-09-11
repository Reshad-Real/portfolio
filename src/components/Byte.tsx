import { useCallback, useEffect, useRef, useState } from 'react'
import { DogArt, type Pose } from './art/DogArt'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { blip, enableAudio, isAudioOn } from '../lib/audio'

const HIDE_KEY = 'mf-dog-hidden'
const MET_KEY = 'mf-dog-met'

type Mode = 'idle' | 'menu' | 'petting' | 'walking' | 'goinghome'

type Heart = { id: number; dx: number }

const BARKS = ['woof!', 'wf!', 'borf!', 'arf!']
const PET_LINES = ['good human', 'again, please', 'best day', '*happy noises*']
const WALK_LINES = ['off we go', 'exploring', 'brb, sniffing']

/**
 * BYTE lives in the bottom-right corner. Clicking him gets a bark and a small
 * menu; from there he can be petted, or sent wandering along the bottom of the
 * page. Three quick clicks and he trots back to his corner.
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

  // Position along the bottom of the window, and where home is.
  const size = () => (window.innerWidth < 640 ? 108 : 150)
  const homeX = () => Math.max(12, window.innerWidth - size() - 18)
  const [x, setX] = useState(() =>
    typeof window === 'undefined' ? 0 : Math.max(12, window.innerWidth - 168),
  )

  const modeRef = useRef(mode)
  modeRef.current = mode
  const xRef = useRef(x)
  xRef.current = x
  const targetRef = useRef(x)
  const clickTimes = useRef<number[]>([])
  const timers = useRef<number[]>([])
  const heartId = useRef(0)
  const lookRef = useRef({ x: 0, y: 0 })
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

  const speak = useCallback(
    (text: string, ms = 1800) => {
      setSay(text)
      after(ms, () => setSay((cur) => (cur === text ? null : cur)))
    },
    [after],
  )

  const bark = useCallback(() => {
    setBarking(true)
    setRing((r) => r + 1)
    if (isAudioOn()) blip('bark')
    speak(BARKS[Math.floor(Math.random() * BARKS.length)], 1100)
    after(340, () => setBarking(false))
  }, [after, speak])

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
    targetRef.current = homeX()
    setFacing(targetRef.current > xRef.current ? 1 : -1)
    speak('heading back', 1500)
  }, [speak])

  const onDogClick = useCallback(() => {
    // A real gesture, so the arcade blips are allowed to make noise later.
    if (!isAudioOn()) enableAudio()

    const now = performance.now()
    clickTimes.current = [...clickTimes.current.filter((t) => now - t < 1300), now]
    if (clickTimes.current.length >= 3) {
      clickTimes.current = []
      goHome()
      return
    }

    if (modeRef.current === 'menu') {
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
    speak(PET_LINES[Math.floor(Math.random() * PET_LINES.length)], 2200)
    if (isAudioOn()) blip('ok')
    for (let i = 0; i < 5; i++) {
      after(i * 170, () => {
        const id = heartId.current++
        setHearts((h) => [...h.slice(-5), { id, dx: (Math.random() - 0.5) * 46 }])
        after(1200, () => setHearts((h) => h.filter((v) => v.id !== id)))
      })
    }
    after(2400, () => {
      setJoy(0)
      setMode((m) => (m === 'petting' ? 'idle' : m))
    })
  }, [after, speak])

  const takeWalk = useCallback(() => {
    bark()
    speak(WALK_LINES[Math.floor(Math.random() * WALK_LINES.length)], 1600)
    after(320, () => {
      setPose('walk')
      setMode('walking')
      const s = size()
      targetRef.current = 16 + Math.random() * Math.max(40, window.innerWidth - s - 32)
      setFacing(targetRef.current > xRef.current ? 1 : -1)
    })
  }, [after, bark, speak])

  // ------------------------------------------------------------ the motion
  useEffect(() => {
    if (hidden) return
    let raf = 0
    let last = 0

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      if (document.hidden) return
      const dt = last ? Math.min(48, now - last) : 16
      last = now

      const m = modeRef.current
      if (m !== 'walking' && m !== 'goinghome') return

      const speed = (m === 'goinghome' ? 0.19 : 0.11) * dt
      const delta = targetRef.current - xRef.current

      if (Math.abs(delta) <= speed) {
        xRef.current = targetRef.current
        setX(targetRef.current)
        if (m === 'goinghome') {
          setMode('idle')
          setPose('sit')
          setFacing(-1)
        } else {
          // Pick somewhere else to sniff, after a short pause.
          setPose('sit')
          after(700 + Math.random() * 1400, () => {
            if (modeRef.current !== 'walking') return
            const s = size()
            targetRef.current = 16 + Math.random() * Math.max(40, window.innerWidth - s - 32)
            setFacing(targetRef.current > xRef.current ? 1 : -1)
            setPose('walk')
          })
        }
        return
      }

      xRef.current += Math.sign(delta) * speed
      setX(xRef.current)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [hidden, after])

  // Keep him on screen when the window changes size.
  useEffect(() => {
    const onResize = () => {
      const limit = Math.max(12, window.innerWidth - size() - 12)
      if (xRef.current > limit) {
        xRef.current = limit
        setX(limit)
      }
      if (modeRef.current === 'idle') {
        xRef.current = homeX()
        setX(homeX())
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Idle blinking, and a glance toward the cursor.
  useEffect(() => {
    if (hidden || reduced) return
    let t = 0
    const loop = () => {
      setBlinking(true)
      window.setTimeout(() => setBlinking(false), 130)
      t = window.setTimeout(loop, 2600 + Math.random() * 3800)
    }
    t = window.setTimeout(loop, 2400)
    return () => window.clearTimeout(t)
  }, [hidden, reduced])

  useEffect(() => {
    if (hidden || reduced) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const host = hostRef.current
      if (!host) return
      const r = host.getBoundingClientRect()
      lookRef.current = {
        x: Math.max(-1, Math.min(1, (e.clientX - (r.x + r.width / 2)) / 320)),
        y: Math.max(-1, Math.min(1, (e.clientY - (r.y + r.height / 2)) / 260)),
      }
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0
          setLook(lookRef.current)
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
  const vw = typeof window === 'undefined' ? 1024 : window.innerWidth
  const nearRight = x > vw - 260
  const nearLeft = x < 110

  return (
    <div
      ref={hostRef}
      className="pointer-events-none fixed bottom-2 left-0 z-30 h-[112px] w-[108px] sm:h-[152px] sm:w-[150px]"
      style={{
        transform: `translate3d(${x.toFixed(1)}px, 0, 0)`,
        transition: mode === 'idle' ? 'transform 220ms ease-out' : 'none',
      }}
    >
      {/* speech */}
      {say && (
        <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap">
          <span
            className="inline-block rounded-full border border-line bg-bg px-3 py-1 text-[12px] text-ink shadow-sm"
            style={{ fontFamily: 'var(--font-tech)', animation: 'mf-pop 220ms ease-out' }}
          >
            {say}
          </span>
        </div>
      )}

      {/* bark rings */}
      {ring > 0 && (
        <span
          key={ring}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-8 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-accent"
          style={{ animation: 'mf-ring 620ms ease-out forwards' }}
        />
      )}

      {/* hearts */}
      {hearts.map((h) => (
        <span
          key={h.id}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-10 text-[16px] text-accent2"
          style={{ ['--dx' as string]: `${h.dx}px`, animation: 'mf-heart-float 1.2s ease-out forwards' }}
        >
          ♥
        </span>
      ))}

      {/* the dog himself */}
      <button
        type="button"
        onClick={onDogClick}
        aria-label={menuOpen ? 'BYTE, the dog. Menu open.' : 'BYTE, the dog. Click to say hello.'}
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

      {/* Menu. It flips to whichever side has room, so it never runs off the
          edge of the window when he is parked in the corner. */}
      <div
        className={[
          'absolute bottom-full mb-9 w-max transition-all duration-200',
          nearRight ? 'right-0' : nearLeft ? 'left-0' : 'left-1/2 -translate-x-1/2',
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-1 opacity-0',
        ].join(' ')}
        // Hidden from assistive tech and from tabbing while closed.
        {...(menuOpen ? {} : { inert: true })}
      >
        <div className="flex gap-1.5 rounded-full border border-line bg-bg p-1.5 shadow-lg">
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

      {/* first-time nudge */}
      {!met && mode === 'idle' && (
        <span
          className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-line bg-bg px-3 py-1 text-[12px] text-ink shadow-sm"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          click me
        </span>
      )}
    </div>
  )
}
