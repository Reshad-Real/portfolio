import { useId, useMemo, useState } from 'react'

/**
 * An interactive short-channel model of the tri-gate device.
 *
 * The numbers come from the standard analytic expressions taught in device
 * engineering — natural length, subthreshold swing, DIBL — evaluated live as
 * the geometry changes. They illustrate the trade-offs; they are not, and are
 * not presented as, output from the TCAD decks.
 */

type Arch = 'trigate' | 'planar'

const EPS_CH = 9.0 // GaN
const EPS_OX = 9.0 // Al2O3 gate dielectric

type Params = {
  lg: number // gate length, nm
  wfin: number // fin / body width, nm
  tox: number // equivalent oxide thickness, nm
  vds: number // drain bias, V
  arch: Arch
}

function model(p: Params) {
  // Natural length: how far drain field reaches into the channel.
  // Gating from three sides shortens it relative to a planar body.
  const gateFactor = p.arch === 'trigate' ? 1 / Math.sqrt(3) : 1
  const lambda = Math.sqrt((EPS_CH / EPS_OX) * p.wfin * p.tox * 0.5) * gateFactor

  const ratio = p.lg / lambda
  const scale = Math.exp(-ratio / 1.9)

  // Drain-induced barrier lowering, mV per volt of drain bias.
  const dibl = 1000 * 1.35 * scale

  // Subthreshold swing floors at the 60 mV/dec room-temperature limit and
  // degrades as the drain takes control of the channel.
  const ss = (60 * 1.06) / Math.max(0.16, 1 - 0.94 * scale)

  const vth0 = p.arch === 'trigate' ? 0.34 : 0.3
  const vth = vth0 - (dibl / 1000) * p.vds

  const ssv = ss / 1000
  const i0 = 1e-11 // A/um reference leakage at threshold

  const current = (vgs: number) => {
    const sub = i0 * Math.pow(10, (vgs - vth) / ssv)
    const over = vgs > vth ? 1.1e-4 * Math.pow(vgs - vth, 1.35) * (p.arch === 'trigate' ? 1.35 : 1) : 0
    if (over <= 0) return sub
    return 1 / (1 / sub + 1 / over)
  }

  const ion = current(0.8)
  const ioff = current(0)
  const decades = Math.log10(ion / ioff)

  return { lambda, dibl, ss, vth, ion, ioff, decades, current }
}

const VG_MIN = -0.25
const VG_MAX = 1.0

export function DeviceExplorer() {
  const [p, setP] = useState<Params>({ lg: 5, wfin: 6, tox: 1.2, vds: 0.7, arch: 'trigate' })
  const m = useMemo(() => model(p), [p])
  const uid = useId()

  const curve = useMemo(() => {
    const pts: string[] = []
    const steps = 90
    for (let i = 0; i <= steps; i++) {
      const vgs = VG_MIN + ((VG_MAX - VG_MIN) * i) / steps
      const id = Math.log10(Math.max(1e-16, m.current(vgs)))
      const x = 46 + ((vgs - VG_MIN) / (VG_MAX - VG_MIN)) * 300
      // plot window: 1e-13 to 1e-3 A/um
      const y = 150 - ((id + 13) / 10) * 126
      pts.push(`${x.toFixed(1)},${Math.max(12, Math.min(152, y)).toFixed(1)}`)
    }
    return `M${pts.join(' L')}`
  }, [m])

  const set = <K extends keyof Params>(key: K, value: Params[K]) =>
    setP((prev) => ({ ...prev, [key]: value }))

  // Drawing geometry, in the SVG coordinate space.
  const gateW = 16 + p.lg * 5.2
  const finH = 24 + p.wfin * 2.2
  const srcSpacer = 30
  const drnSpacer = 46 // the asymmetry the AS in AS3-FinFET refers to

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p
          className="text-[11px] uppercase tracking-[0.24em] text-muted"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          Device explorer · analytic short-channel model
        </p>
        <div
          className="flex items-center gap-1 rounded-full border border-line p-1"
          role="radiogroup"
          aria-label="Device architecture"
        >
          {(
            [
              ['trigate', 'Tri-gate'],
              ['planar', 'Planar'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={p.arch === value}
              onClick={() => set('arch', value)}
              className={[
                'rounded-full px-3 py-1 text-[12px] transition-colors',
                p.arch === value ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        {/* ------------------------------------------------ cross-section */}
        <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
          <svg
            viewBox="0 0 400 220"
            className="w-full"
            role="img"
            aria-label={`Cross-section along the channel. Gate length ${p.lg} nanometres, fin width ${p.wfin} nanometres, equivalent oxide thickness ${p.tox} nanometres.`}
          >
            <rect x="0" y="0" width="400" height="220" fill="transparent" />

            {/* substrate stack */}
            <rect x="30" y="168" width="340" height="26" fill="var(--line)" opacity="0.85" />
            <rect x="30" y="150" width="340" height="18" fill="var(--line-strong)" opacity="0.7" />

            {/* channel */}
            <rect
              x="30"
              y={150 - finH}
              width="340"
              height={finH}
              fill="var(--phosphor)"
              opacity="0.16"
            />
            <rect
              x="30"
              y={150 - finH}
              width="340"
              height="3"
              fill="var(--phosphor)"
              opacity="0.75"
            />

            {/* contacts */}
            <rect x="30" y={150 - finH - 26} width="70" height={finH + 26} fill="var(--line-strong)" />
            <rect x="300" y={150 - finH - 26} width="70" height={finH + 26} fill="var(--line-strong)" />

            {/* spacers */}
            <rect
              x={200 - gateW / 2 - srcSpacer}
              y={150 - finH - 18}
              width={srcSpacer}
              height={finH + 18}
              fill="var(--muted)"
              opacity="0.28"
            />
            <rect
              x={200 + gateW / 2}
              y={150 - finH - 18}
              width={drnSpacer}
              height={finH + 18}
              fill="var(--muted)"
              opacity="0.45"
            />

            {/* gate stack */}
            <rect
              x={200 - gateW / 2}
              y={150 - finH - 6 - p.tox * 5}
              width={gateW}
              height={p.tox * 5}
              fill="var(--accent)"
              opacity="0.35"
            />
            <rect
              x={200 - gateW / 2}
              y={150 - finH - 44 - p.tox * 5}
              width={gateW}
              height="38"
              fill="var(--accent-2)"
              opacity="0.9"
              rx="1"
            />

            {/* dimension line for Lg */}
            <g stroke="var(--ink)" strokeWidth="1" opacity="0.55">
              <line x1={200 - gateW / 2} y1="30" x2={200 - gateW / 2} y2={150 - finH - 48} />
              <line x1={200 + gateW / 2} y1="30" x2={200 + gateW / 2} y2={150 - finH - 48} />
              <line x1={200 - gateW / 2} y1="36" x2={200 + gateW / 2} y2="36" />
            </g>
            <text
              x="200"
              y="26"
              textAnchor="middle"
              fontSize="11"
              fill="var(--ink)"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              Lg = {p.lg} nm
            </text>

            <g
              fontSize="9.5"
              fill="var(--muted)"
              style={{ fontFamily: 'var(--font-tech)' }}
              letterSpacing="0.5"
            >
              <text x="65" y={150 - finH - 32} textAnchor="middle">SOURCE</text>
              <text x="335" y={150 - finH - 32} textAnchor="middle">DRAIN</text>
              <text x="34" y="186">Si substrate</text>
              <text x="34" y="164">GaN buffer</text>
              <text x={200 + gateW / 2 + drnSpacer + 6} y={150 - finH + 14}>
                2DEG
              </text>
            </g>

            {/* carriers in the channel */}
            <g fill="var(--phosphor)">
              {[110, 140, 170, 200, 230, 260, 290].map((x, i) => (
                <circle key={x} cx={x} cy={150 - finH / 2} r="2.4" opacity={0.5 + (i % 3) * 0.2}>
                  <animate
                    attributeName="cx"
                    values={`${x};${x + 30};${x}`}
                    dur="2.4s"
                    repeatCount="indefinite"
                    begin={`${i * 0.18}s`}
                  />
                </circle>
              ))}
            </g>
          </svg>

          {/* across-channel inset showing the three-sided wrap */}
          <div className="mt-2 flex items-center gap-4 border-t border-line pt-4">
            <svg viewBox="0 0 90 70" className="h-[70px] w-[90px] shrink-0" aria-hidden="true">
              <rect x="10" y="52" width="70" height="12" fill="var(--line-strong)" />
              <rect
                x={45 - p.wfin * 1.4}
                y={52 - p.wfin * 3}
                width={p.wfin * 2.8}
                height={p.wfin * 3}
                fill="var(--phosphor)"
                opacity="0.22"
              />
              <path
                d={`M${45 - p.wfin * 1.4 - 7} 52 L${45 - p.wfin * 1.4 - 7} ${52 - p.wfin * 3 - 7} L${45 + p.wfin * 1.4 + 7} ${52 - p.wfin * 3 - 7} L${45 + p.wfin * 1.4 + 7} 52`}
                fill="none"
                stroke="var(--accent-2)"
                strokeWidth="6"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[12.5px] leading-relaxed text-muted">
              {p.arch === 'trigate'
                ? 'The gate wraps the fin on three sides, so the channel stays under gate control at a length where a planar body would not.'
                : 'A planar body is gated from one side only. The drain field reaches further in, and the subthreshold behaviour shows it.'}
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------- readouts */}
        <div className="p-5">
          <svg
            viewBox="0 0 380 175"
            className="w-full"
            role="img"
            aria-label={`Transfer characteristic. On current ${m.ion.toExponential(1)} amps per micron, off current ${m.ioff.toExponential(1)} amps per micron.`}
          >
            <g stroke="var(--line)" strokeWidth="1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line key={i} x1="46" y1={24 + i * 25.2} x2="346" y2={24 + i * 25.2} />
              ))}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line key={i} x1={46 + i * 60} y1="24" x2={46 + i * 60} y2="150" />
              ))}
            </g>
            <g
              fontSize="9"
              fill="var(--muted)"
              style={{ fontFamily: 'var(--font-tech)' }}
            >
              <text x="40" y="28" textAnchor="end">-3</text>
              <text x="40" y="153" textAnchor="end">-13</text>
              <text x="8" y="90" textAnchor="middle" transform="rotate(-90 8 90)">
                log Id
              </text>
              <text x="196" y="170" textAnchor="middle">Vgs (V)</text>
            </g>
            <path
              d={curve}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ transition: 'd 220ms ease' }}
            />
            <line
              x1={46 + ((m.vth - VG_MIN) / (VG_MAX - VG_MIN)) * 300}
              y1="24"
              x2={46 + ((m.vth - VG_MIN) / (VG_MAX - VG_MIN)) * 300}
              y2="150"
              stroke="var(--accent-2)"
              strokeWidth="1.4"
              strokeDasharray="4 3"
            />
          </svg>

          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-4">
            <Metric label="SS" value={m.ss.toFixed(0)} unit="mV/dec" />
            <Metric label="DIBL" value={m.dibl.toFixed(0)} unit="mV/V" />
            <Metric label="λ" value={m.lambda.toFixed(2)} unit="nm" />
            <Metric label="Ion/Ioff" value={m.decades.toFixed(1)} unit="decades" />
          </dl>

          <div className="mt-5 space-y-4">
            <Slider
              id={`${uid}-lg`}
              label="Gate length"
              unit="nm"
              min={3}
              max={20}
              step={1}
              value={p.lg}
              onChange={(v) => set('lg', v)}
            />
            <Slider
              id={`${uid}-wfin`}
              label="Fin width"
              unit="nm"
              min={4}
              max={14}
              step={1}
              value={p.wfin}
              onChange={(v) => set('wfin', v)}
            />
            <Slider
              id={`${uid}-tox`}
              label="Oxide EOT"
              unit="nm"
              min={0.8}
              max={3}
              step={0.1}
              value={p.tox}
              onChange={(v) => set('tox', v)}
            />
            <Slider
              id={`${uid}-vds`}
              label="Drain bias"
              unit="V"
              min={0.05}
              max={1}
              step={0.05}
              value={p.vds}
              onChange={(v) => set('vds', v)}
            />
          </div>

          <p className="mt-5 text-[12px] leading-relaxed text-muted">
            Analytic model for illustration. Real device numbers come from the Silvaco Atlas and
            DEVSIM decks, not from this page.
          </p>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-bg px-3 py-3">
      <dt
        className="text-[10px] uppercase tracking-[0.18em] text-muted"
        style={{ fontFamily: 'var(--font-tech)' }}
      >
        {label}
      </dt>
      <dd className="mt-1 text-[19px] font-medium leading-none tracking-tight text-ink tabular-nums">
        {value}
        <span className="ml-1 text-[10px] font-normal text-muted">{unit}</span>
      </dd>
    </div>
  )
}

function Slider({
  id,
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] text-ink">
          {label}
        </label>
        <span
          className="text-[12px] text-muted tabular-nums"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mf-range h-4 w-full cursor-pointer appearance-none bg-transparent"
        style={
          {
            '--pct': `${pct}%`,
          } as React.CSSProperties
        }
      />
    </div>
  )
}
