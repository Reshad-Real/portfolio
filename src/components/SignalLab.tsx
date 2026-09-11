import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Reveal, Section, SectionHeading } from './ui'

type TraceId = 'sine' | 'square' | 'step' | 'xy' | 'eye'

const TRACES: { id: TraceId; label: string; note: string }[] = [
  { id: 'sine', label: 'Sine', note: 'A clean tone from the function generator.' },
  { id: 'square', label: 'Square', note: 'Fast edges, with the overshoot a real driver gives you.' },
  { id: 'step', label: 'Step', note: 'Second-order step response, ringing as damping falls.' },
  { id: 'xy', label: 'X-Y', note: 'Lissajous figure. The shape is the phase difference.' },
  { id: 'eye', label: 'Eye', note: 'Bit transitions folded onto one another. The opening is the margin.' },
]

const TIME_DIV = [0.2, 0.5, 1, 2, 5]
const VOLT_DIV = [0.2, 0.5, 1, 2]

export function SignalLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { ref, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0 })
  const reduced = usePrefersReducedMotion()

  const [trace, setTrace] = useState<TraceId>('sine')
  const [timeIdx, setTimeIdx] = useState(2)
  const [voltIdx, setVoltIdx] = useState(1)
  const [running, setRunning] = useState(true)
  const [damping, setDamping] = useState(0.18)
  const [phase, setPhase] = useState(0.5)
  const [measure, setMeasure] = useState({ vpp: 0, freq: 0, duty: 0 })

  const state = useRef({ trace, timeIdx, voltIdx, running, damping, phase })
  state.current = { trace, timeIdx, voltIdx, running, damping, phase }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !inView) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t = 0
    let last = 0
    let lastReport = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const sample = (x: number, time: number, s: typeof state.current): number => {
      const f = 1 / TIME_DIV[s.timeIdx]
      switch (s.trace) {
        case 'sine':
          return Math.sin((x * f + time) * Math.PI * 2)
        case 'square': {
          const u = (x * f + time) % 1
          const base = u < 0.5 ? 1 : -1
          // overshoot and settle at each edge
          const edge = Math.min(u, Math.abs(u - 0.5), 1 - u)
          const ring = Math.exp(-edge * 60) * Math.sin(edge * 150) * 0.42
          return base * 0.82 + ring * base
        }
        case 'step': {
          const u = (x * f * 0.5 + time) % 1
          if (u < 0.08) return -0.8
          const tt = (u - 0.08) * 22
          const wd = Math.sqrt(Math.max(0.0001, 1 - s.damping * s.damping))
          const y =
            1 -
            (Math.exp(-s.damping * tt) / wd) *
              Math.sin(wd * tt + Math.acos(Math.min(1, s.damping)))
          return y * 0.8 - 0.8 + 0.8
        }
        default:
          return Math.sin((x * f + time) * Math.PI * 2)
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const s = state.current
      const dt = last ? Math.min(50, now - last) : 16
      last = now
      if (s.running && !reduced) t += dt / 1000

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const css = getComputedStyle(document.documentElement)
      const phosphor = css.getPropertyValue('--phosphor').trim() || '#2fe6c4'

      ctx.clearRect(0, 0, w, h)

      // screen
      ctx.fillStyle = '#05100f'
      ctx.fillRect(0, 0, w, h)

      // graticule
      ctx.strokeStyle = 'rgba(120,200,190,0.16)'
      ctx.lineWidth = 1
      for (let i = 1; i < 10; i++) {
        const x = (w / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let i = 1; i < 8; i++) {
        const y = (h / 8) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(120,200,190,0.34)'
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w / 2, h)
      ctx.stroke()

      const gain = h / 2 / (VOLT_DIV[s.voltIdx] * 4)
      const mid = h / 2

      const drawPath = (build: () => void, alpha: number, width: number) => {
        ctx.globalAlpha = alpha
        ctx.lineWidth = width
        ctx.strokeStyle = phosphor
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        build()
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      let vmin = Infinity
      let vmax = -Infinity

      if (s.trace === 'xy') {
        const a = 3
        const b = 2
        const build = () => {
          const N = 400
          for (let i = 0; i <= N; i++) {
            const u = (i / N) * Math.PI * 2
            const x = w / 2 + Math.sin(a * u + t * 0.6) * (w / 2 - 18) * 0.7
            const y = mid + Math.sin(b * u + s.phase * Math.PI * 2) * (h / 2 - 14) * 0.7
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
        }
        drawPath(build, 0.18, 7)
        drawPath(build, 1, 1.8)
        vmin = -1
        vmax = 1
      } else if (s.trace === 'eye') {
        const seedBits = 26
        for (let k = 0; k < seedBits; k++) {
          const build = () => {
            const N = 60
            const a0 = ((k * 2654435761) % 1000) / 1000 > 0.5 ? 1 : -1
            const a1 = ((k * 40503) % 997) / 997 > 0.5 ? 1 : -1
            for (let i = 0; i <= N; i++) {
              const u = i / N
              const x = u * w
              // raised-cosine transition between the two symbols
              const blend = 0.5 - 0.5 * Math.cos(Math.PI * u)
              const jitter = Math.sin(k * 1.7 + t * 2) * 0.03
              const v = (a0 + (a1 - a0) * blend) * 0.85 + jitter
              const y = mid - v * gain * 0.9
              if (i === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
          }
          drawPath(build, 0.09, 5)
          drawPath(build, 0.5, 1.1)
        }
        // mark the opening
        ctx.strokeStyle = 'rgba(255,190,80,0.85)'
        ctx.lineWidth = 1.2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(w * 0.38, mid - gain * 0.6, w * 0.24, gain * 1.2)
        ctx.setLineDash([])
        vmin = -0.85
        vmax = 0.85
      } else {
        const N = Math.min(520, Math.round(w))
        const build = () => {
          for (let i = 0; i <= N; i++) {
            const x = (i / N) * w
            const v = sample(i / N, t, s)
            if (v < vmin) vmin = v
            if (v > vmax) vmax = v
            const y = mid - v * gain
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
        }
        drawPath(build, 0.16, 8)
        drawPath(build, 1, 2)
      }

      // trigger marker
      ctx.fillStyle = 'rgba(255,190,80,0.9)'
      ctx.fillRect(0, mid - 1, 8, 2)

      if (now - lastReport > 240) {
        lastReport = now
        const vpp = (vmax - vmin) * VOLT_DIV[s.voltIdx]
        setMeasure({
          vpp: Number.isFinite(vpp) ? vpp : 0,
          freq: 1 / TIME_DIV[s.timeIdx],
          duty: s.trace === 'square' ? 50 : s.trace === 'eye' ? 0 : 0,
        })
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [inView, reduced])

  const active = TRACES.find((x) => x.id === trace)!

  return (
    <Section id="bench">
      <SectionHeading
        index="07"
        kicker="Bench · signal lab"
        title={
          <>
            A bench instrument
            <br className="hidden sm:block" /> you can actually turn.
          </>
        }
        lede="Five traces, real controls, live measurements. Every pixel on the screen is computed from the waveform, not drawn as artwork."
      />

      <Reveal>
        <div ref={ref} className="overflow-hidden rounded-sm border border-line bg-surface">
          <div className="grid lg:grid-cols-[1fr_280px]">
            <div className="relative border-b border-line lg:border-b-0 lg:border-r">
              <canvas
                ref={canvasRef}
                className="block h-[280px] w-full sm:h-[360px]"
                role="img"
                aria-label={`Oscilloscope screen showing the ${active.label} trace. ${active.note}`}
              />
              <div
                className="pointer-events-none absolute left-4 top-3 flex items-center gap-3 text-[11px] text-[#7fe8d4]"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                <span>CH1</span>
                <span>{VOLT_DIV[voltIdx].toFixed(1)} V/div</span>
                <span>{TIME_DIV[timeIdx].toFixed(1)} ms/div</span>
                <span className={running ? 'text-[#ffbe50]' : 'text-white/50'}>
                  {running ? 'RUN' : 'STOP'}
                </span>
              </div>
            </div>

            <div className="p-5">
              <fieldset>
                <legend
                  className="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted"
                  style={{ fontFamily: 'var(--font-tech)' }}
                >
                  Trace
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {TRACES.map((tr) => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => setTrace(tr.id)}
                      aria-pressed={trace === tr.id}
                      className={[
                        'rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                        trace === tr.id
                          ? 'border-ink bg-ink text-bg'
                          : 'border-line text-muted hover:border-linestrong hover:text-ink',
                      ].join(' ')}
                    >
                      {tr.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <p className="mt-3 min-h-[42px] text-[13px] leading-relaxed text-muted">
                {active.note}
              </p>

              <Stepper
                label="Time / div"
                value={`${TIME_DIV[timeIdx].toFixed(1)} ms`}
                onPrev={() => setTimeIdx((i) => Math.max(0, i - 1))}
                onNext={() => setTimeIdx((i) => Math.min(TIME_DIV.length - 1, i + 1))}
              />
              <Stepper
                label="Volts / div"
                value={`${VOLT_DIV[voltIdx].toFixed(1)} V`}
                onPrev={() => setVoltIdx((i) => Math.max(0, i - 1))}
                onNext={() => setVoltIdx((i) => Math.min(VOLT_DIV.length - 1, i + 1))}
              />

              {trace === 'step' && (
                <label className="mt-4 block">
                  <span className="mb-1.5 flex items-baseline justify-between text-[13px] text-ink">
                    Damping ratio
                    <span
                      className="text-[12px] text-muted tabular-nums"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {damping.toFixed(2)}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={0.03}
                    max={0.9}
                    step={0.01}
                    value={damping}
                    onChange={(e) => setDamping(Number(e.target.value))}
                    className="mf-range h-4 w-full cursor-pointer appearance-none bg-transparent"
                    style={{ '--pct': `${((damping - 0.03) / 0.87) * 100}%` } as React.CSSProperties}
                  />
                </label>
              )}

              {trace === 'xy' && (
                <label className="mt-4 block">
                  <span className="mb-1.5 flex items-baseline justify-between text-[13px] text-ink">
                    Phase
                    <span
                      className="text-[12px] text-muted tabular-nums"
                      style={{ fontFamily: 'var(--font-tech)' }}
                    >
                      {(phase * 360).toFixed(0)}°
                    </span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={phase}
                    onChange={(e) => setPhase(Number(e.target.value))}
                    className="mf-range h-4 w-full cursor-pointer appearance-none bg-transparent"
                    style={{ '--pct': `${phase * 100}%` } as React.CSSProperties}
                  />
                </label>
              )}

              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                aria-pressed={running}
                className="mt-5 w-full rounded-sm border border-ink bg-ink px-4 py-2 text-[14px] text-bg transition-colors hover:bg-transparent hover:text-ink"
              >
                {running ? 'Stop acquisition' : 'Run acquisition'}
              </button>

              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line">
                <div className="bg-bg px-3 py-2.5">
                  <dt
                    className="text-[10px] uppercase tracking-[0.18em] text-muted"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    Vpp
                  </dt>
                  <dd className="text-[16px] text-ink tabular-nums">
                    {measure.vpp.toFixed(2)} V
                  </dd>
                </div>
                <div className="bg-bg px-3 py-2.5">
                  <dt
                    className="text-[10px] uppercase tracking-[0.18em] text-muted"
                    style={{ fontFamily: 'var(--font-tech)' }}
                  >
                    Freq
                  </dt>
                  <dd className="text-[16px] text-ink tabular-nums">
                    {measure.freq.toFixed(2)} kHz
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

function Stepper({
  label,
  value,
  onPrev,
  onNext,
}: {
  label: string
  value: string
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
      <span className="text-[13px] text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label={`Decrease ${label}`}
          className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-ink hover:text-bg"
        >
          –
        </button>
        <span
          className="w-[64px] text-center text-[12.5px] text-muted tabular-nums"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onNext}
          aria-label={`Increase ${label}`}
          className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-ink hover:text-bg"
        >
          +
        </button>
      </div>
    </div>
  )
}
