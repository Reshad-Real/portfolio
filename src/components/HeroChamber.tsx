import { useCallback, useEffect, useRef, useState } from 'react'
import { createChamber, type Chamber } from '../lib/chamberScene'
import { detectQuality, hasWebGL } from '../lib/quality'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { StartupOverlay } from './StartupOverlay'
import { Hero } from './Hero'
import { ChamberFallback } from './ChamberFallback'

export type Phase = 'boot' | 'entering' | 'live'

type Props = {
  phase: Phase
  onEnter: () => void
  onLive: () => void
}

/**
 * Owns the single WebGL context shared by the startup sequence and the hero.
 * The element is never unmounted between the two, so the scene survives the
 * transition and the camera move reads as one continuous shot.
 */
export function HeroChamber({ phase, onEnter, onLive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const chamberRef = useRef<Chamber | null>(null)
  const reduced = usePrefersReducedMotion()

  const [webgl] = useState(() => hasWebGL())
  /** Set when the context exists but the scene could not be built. */
  const [sceneFailed, setSceneFailed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [labels, setLabels] = useState<string[]>([])
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  // ------------------------------------------------------------ scene setup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !webgl) {
      setProgress(1)
      return
    }

    const chamber = createChamber(canvas, {
      quality: detectQuality(),
      reducedMotion: reduced,
    })
    if (!chamber) {
      setProgress(1)
      setSceneFailed(true)
      return
    }
    setSceneFailed(false)
    chamberRef.current = chamber
    // A visitor who already saw the startup this session lands settled.
    if (phaseRef.current === 'live') chamber.setEntered(true, true)
    setLabels(chamber.labels().map((l) => l.text))

    let raf = 0
    let visible = true
    let lastProgress = -1

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      chamber.render(now)

      const p = chamber.progress()
      if (Math.abs(p - lastProgress) > 0.01 || (p === 1 && lastProgress !== 1)) {
        lastProgress = p
        setProgress(p)
      }

      // Labels are written straight to the DOM: they move every frame and must
      // not drag a React render along with them.
      const ls = chamber.labels()
      for (let i = 0; i < ls.length; i++) {
        const el = labelRefs.current[i]
        if (!el) continue
        const l = ls[i]
        const on = l.on && phaseRef.current === 'boot'
        el.style.opacity = on ? '1' : '0'
        if (on) el.style.transform = `translate3d(calc(${l.x}vw - 50%), calc(${l.y}vh - 50%), 0)`
      }
    }
    raf = requestAnimationFrame(frame)

    const onPointer = (e: PointerEvent) => {
      chamber.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
        e.buttons > 0,
      )
    }
    const onDown = () => chamber.setPointer(0, 0, true)
    const onUp = () => chamber.setPointer(0, 0, false)
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      chamber.setPointer(
        Math.max(-1, Math.min(1, e.gamma / 40)),
        Math.max(-1, Math.min(1, (e.beta - 50) / 40)),
        false,
      )
    }
    const onScroll = () => chamber.setScroll(window.scrollY / Math.max(1, window.innerHeight))
    const onResize = () => chamber.resize()

    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('deviceorientation', onOrient)

    // Park the loop entirely once the hero is scrolled past.
    let io: IntersectionObserver | null = null
    if (sectionRef.current && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((e) => e.isIntersecting)
        },
        { threshold: 0 },
      )
      io.observe(sectionRef.current)
    }

    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('deviceorientation', onOrient)
      chamber.dispose()
      chamberRef.current = null
    }
  }, [webgl, reduced])

  // ----------------------------------------------------------- phase wiring
  useEffect(() => {
    if (phase === 'boot') return
    chamberRef.current?.setEntered(true)
    if (phase !== 'entering') return
    const t = window.setTimeout(onLive, reduced ? 120 : 1150)
    return () => window.clearTimeout(t)
  }, [phase, onLive, reduced])

  const enter = useCallback(() => {
    chamberRef.current?.finishBoot()
    onEnter()
  }, [onEnter])

  const booting = phase === 'boot'

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      className={[
        'chamber overflow-hidden bg-[#08090b]',
        // Below the navbar (z-10) so the logo stays visible through the boot.
        booting ? 'fixed inset-0 z-[5]' : 'relative z-0 h-[100svh] w-full',
      ].join(' ')}
      style={booting ? undefined : { height: '100svh' }}
    >
      {webgl && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{ touchAction: 'pan-y', visibility: sceneFailed ? 'hidden' : 'visible' }}
        />
      )}
      {(!webgl || sceneFailed) && <ChamberFallback />}

      {/* Vignette and floor gradient keep the hero copy readable over the scene. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 70% 35%, transparent 30%, rgba(4,5,7,0.72) 100%), linear-gradient(to top, rgba(4,5,7,0.96) 0%, rgba(4,5,7,0.8) 26%, rgba(4,5,7,0.2) 52%, transparent 74%)',
        }}
      />

      {/* Floating technical labels, positioned by the render loop. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
        {labels.map((text, i) =>
          !text ? null : (
          <span
            key={text}
            ref={(el) => {
              labelRefs.current[i] = el
            }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/75 opacity-0 backdrop-blur-[2px] transition-opacity duration-500"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            {text}
          </span>
          ),
        )}
      </div>

      <StartupOverlay
        phase={phase}
        progress={progress}
        onEnter={enter}
        webgl={webgl && !sceneFailed}
      />
      <Hero phase={phase} />
    </section>
  )
}
