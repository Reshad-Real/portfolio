import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { projects } from '../data/projects'
import { Reveal, Section, SectionHeading, Tag } from './ui'

const systems = projects.filter((p) => p.kind === 'systems' || p.kind === 'sensing')

/**
 * A rolling demand trace with a residual-based detector on top of it, in the
 * shape of the EV-charging anomaly work. The signal is synthetic: it is here to
 * show what the method looks like, not to report a result.
 */
function DemandMonitor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { ref, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0 })
  const reduced = usePrefersReducedMotion()
  const injectRef = useRef(0)
  const [flags, setFlags] = useState(0)
  const flagsRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !inView) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const N = 180
    const series: number[] = new Array(N).fill(0.45)
    const mean: number[] = new Array(N).fill(0.45)
    const alarms: boolean[] = new Array(N).fill(false)
    let t = 0
    let raf = 0
    let running = 0
    let last = 0

    const css = getComputedStyle(document.documentElement)
    const read = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      if (now - last < (reduced ? 240 : 55)) return
      last = now
      t += 1

      // Baseline demand: a daily shape plus a charging ripple plus noise.
      const daily = 0.42 + 0.2 * Math.sin(t / 42) + 0.07 * Math.sin(t / 11 + 1.2)
      let value = daily + (Math.random() - 0.5) * 0.045
      if (injectRef.current > 0) {
        value += 0.3 * Math.sin((1 - injectRef.current / 18) * Math.PI)
        injectRef.current -= 1
      }

      series.push(value)
      series.shift()

      // Exponentially weighted baseline, and a residual threshold on top of it.
      const prevMean = mean[mean.length - 1]
      const nextMean = prevMean * 0.92 + value * 0.08
      mean.push(nextMean)
      mean.shift()

      const residual = Math.abs(value - nextMean)
      const alarm = residual > 0.085
      alarms.push(alarm)
      alarms.shift()
      if (alarm) {
        running += 1
        if (running === 3) {
          flagsRef.current += 1
          setFlags(flagsRef.current)
        }
      } else {
        running = 0
      }

      // ------------------------------------------------------------- draw
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const ink = read('--ink', '#08090b')
      const line = read('--line', '#e4e4de')
      const accent = read('--accent', '#0b3cf0')
      const warn = read('--accent-2', '#b8420f')

      ctx.clearRect(0, 0, w, h)

      ctx.strokeStyle = line
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      const px = (i: number) => (i / (N - 1)) * w
      const py = (v: number) => h - v * h * 0.86 - h * 0.07

      // baseline
      ctx.strokeStyle = ink
      ctx.globalAlpha = 0.25
      ctx.lineWidth = 1.2
      ctx.beginPath()
      mean.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))))
      ctx.stroke()
      ctx.globalAlpha = 1

      // measured demand
      ctx.strokeStyle = accent
      ctx.lineWidth = 1.8
      ctx.lineJoin = 'round'
      ctx.beginPath()
      series.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))))
      ctx.stroke()

      // flagged samples
      ctx.fillStyle = warn
      alarms.forEach((a, i) => {
        if (!a) return
        ctx.beginPath()
        ctx.arc(px(i), py(series[i]), 2.4, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [inView, reduced])

  return (
    <div ref={ref} className="overflow-hidden rounded-sm border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p
          className="text-[11px] uppercase tracking-[0.24em] text-muted"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          Charging demand · residual detector
        </p>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] text-muted tabular-nums"
            style={{ fontFamily: 'var(--font-tech)' }}
          >
            events {String(flags).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => {
              injectRef.current = 18
            }}
            className="rounded-full border border-line px-3 py-1 text-[12px] text-ink transition-colors hover:bg-ink hover:text-bg"
          >
            Inject anomaly
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="block h-[200px] w-full"
        role="img"
        aria-label="Live plot of simulated charging demand against an exponentially weighted baseline, with residual excursions marked."
      />
      <p className="border-t border-line px-5 py-3 text-[12px] leading-relaxed text-muted">
        Synthetic signal. The published work runs the same idea against digital-twin models of real
        charging infrastructure.
      </p>
    </div>
  )
}

const NODES = [
  { id: 'gen', label: 'Generation', x: 12, y: 24 },
  { id: 'pv', label: 'PV array', x: 12, y: 74 },
  { id: 'bus', label: 'Bus / WAMS', x: 46, y: 50 },
  { id: 'ess', label: 'Storage', x: 78, y: 20 },
  { id: 'ev', label: 'EV charging', x: 82, y: 60 },
  { id: 'load', label: 'Load', x: 62, y: 88 },
]

const EDGES: [string, string][] = [
  ['gen', 'bus'],
  ['pv', 'bus'],
  ['bus', 'ess'],
  ['bus', 'ev'],
  ['bus', 'load'],
  ['ess', 'ev'],
]

function GridDiagram() {
  const [active, setActive] = useState<string | null>(null)
  const find = (id: string) => NODES.find((n) => n.id === id)!

  return (
    <div className="rounded-sm border border-line bg-surface p-5">
      <p
        className="mb-4 text-[11px] uppercase tracking-[0.24em] text-muted"
        style={{ fontFamily: 'var(--font-tech)' }}
      >
        Wide-area monitoring topology
      </p>
      <svg viewBox="0 0 100 100" className="w-full" role="img" aria-label="Smart-grid topology: generation and photovoltaic feeding a monitored bus, which serves storage, electric-vehicle charging and load.">
        {EDGES.map(([a, b]) => {
          const na = find(a)
          const nb = find(b)
          const on = active === a || active === b
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="var(--line-strong)"
                strokeWidth="0.7"
              />
              <line
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={on ? 'var(--accent-2)' : 'var(--accent)'}
                strokeWidth={on ? '1.2' : '0.8'}
                strokeDasharray="3 7"
                opacity={on ? 1 : 0.75}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="20;0"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          )
        })}
        {NODES.map((n) => (
          <g
            key={n.id}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive(null)}
            style={{ cursor: 'default' }}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={active === n.id ? 4 : 3}
              fill="var(--bg)"
              stroke="var(--ink)"
              strokeWidth="0.8"
              style={{ transition: 'r 160ms ease' }}
            />
            <circle cx={n.x} cy={n.y} r="1.3" fill="var(--accent)" />
            <text
              x={n.x}
              y={n.y - 5.5}
              textAnchor="middle"
              fontSize="3.4"
              fill="var(--muted)"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export function EnergyLab() {
  return (
    <Section id="energy">
      <SectionHeading
        index="03"
        kicker="Energy · EV · smart grid"
        title={
          <>
            Models worth trusting when
            <br className="hidden sm:block" /> the real thing is expensive to test.
          </>
        }
        lede="Six Q1 papers sit behind this section: wide-area monitoring, grid-scale storage, charging-opportunity detection, demand anomalies and the economics of wireless charging."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Reveal className="lg:col-span-3">
          <DemandMonitor />
        </Reveal>
        <Reveal delay={90} className="lg:col-span-2">
          <GridDiagram />
        </Reveal>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-2">
        {systems.map((p, i) => (
          <Reveal key={p.id} delay={i * 80} className="bg-bg">
            <article className="h-full p-6 md:p-8">
              <span
                className="text-[10px] uppercase tracking-[0.24em] text-accent"
                style={{ fontFamily: 'var(--font-tech)' }}
              >
                {p.context}
              </span>
              <h3 className="mt-4 text-[21px] font-medium leading-snug tracking-[-0.02em] text-ink">
                {p.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.blurb}</p>
              <p className="mt-4 text-[14px] leading-relaxed text-inksoft">{p.detail}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
