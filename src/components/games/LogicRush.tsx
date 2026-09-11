import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { blip } from '../../lib/audio'
import { ArcadeHud, Cabinet, ScreenOverlay, useHighScore, type GameState } from './arcadeUi'

const ACCENT = '#8ab6ff'

type GateId = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR'

const GATES: Record<GateId, (a: boolean, b: boolean) => boolean> = {
  AND: (a, b) => a && b,
  OR: (a, b) => a || b,
  XOR: (a, b) => a !== b,
  NAND: (a, b) => !(a && b),
  NOR: (a, b) => !(a || b),
  XNOR: (a, b) => a === b,
}

const EASY: GateId[] = ['AND', 'OR', 'XOR']
const HARD: GateId[] = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR']

type Puzzle = {
  /** One entry per gate; the wiring is implied by the shape. */
  gates: { id: GateId }[]
  inputs: boolean[]
  answer: boolean
  shape: 1 | 2 | 3
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
const coin = () => Math.random() > 0.5

function build(level: number): Puzzle {
  const pool = level < 4 ? EASY : HARD
  const shape: 1 | 2 | 3 = level < 3 ? 1 : level < 8 ? 2 : 3
  const inputs = [coin(), coin(), coin(), coin()]

  if (shape === 1) {
    const g = pick(pool)
    return {
      gates: [{ id: g }],
      inputs: inputs.slice(0, 2),
      answer: GATES[g](inputs[0], inputs[1]),
      shape,
    }
  }
  if (shape === 2) {
    const g1 = pick(pool)
    const g2 = pick(pool)
    const mid = GATES[g1](inputs[0], inputs[1])
    return {
      gates: [{ id: g1 }, { id: g2 }],
      inputs: inputs.slice(0, 3),
      answer: GATES[g2](mid, inputs[2]),
      shape,
    }
  }
  const g1 = pick(pool)
  const g2 = pick(pool)
  const g3 = pick(pool)
  const m1 = GATES[g1](inputs[0], inputs[1])
  const m2 = GATES[g2](inputs[2], inputs[3])
  return {
    gates: [{ id: g1 }, { id: g2 }, { id: g3 }],
    inputs,
    answer: GATES[g3](m1, m2),
    shape,
  }
}

const startTime = 9
const maxTime = 12

/**
 * Logic Rush: the gate is drawn, the inputs are lit, you call the output. Right
 * answers chain into a multiplier and buy back time; wrong ones cost it.
 */
export default function LogicRush({ sound }: { sound: boolean }) {
  const [state, setState] = useState<GameState>('ready')
  const [puzzle, setPuzzle] = useState<Puzzle>(() => build(1))
  const levelRef = useRef(1)
  const [score, setScore] = useState(0)
  const [chain, setChain] = useState(0)
  const [time, setTime] = useState(startTime)
  const [flash, setFlash] = useState<'none' | 'good' | 'bad'>('none')
  const [solved, setSolved] = useState(0)
  const { best, submit } = useHighScore('logic-rush')

  const stateRef = useRef(state)
  stateRef.current = state
  const timeRef = useRef(time)
  timeRef.current = time
  const soundRef = useRef(sound)
  soundRef.current = sound
  const rootRef = useRef<HTMLDivElement | null>(null)
  const flashTimer = useRef<number | null>(null)

  const mult = Math.min(8, 1 + Math.floor(chain / 3))

  const start = useCallback(() => {
    setPuzzle(build(1))
    levelRef.current = 1
    setScore(0)
    setChain(0)
    setSolved(0)
    setTime(startTime)
    setState('playing')
    if (soundRef.current) blip('level')
  }, [])

  // The clock, and it speeds up as you go.
  useEffect(() => {
    if (state !== 'playing') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.06, (now - last) / 1000)
      last = now
      const drain = 0.85 + Math.min(1.1, solved * 0.035)
      const next = timeRef.current - dt * drain
      timeRef.current = next
      if (next <= 0) {
        setTime(0)
        setState('over')
        return
      }
      setTime(next)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state, solved])

  useEffect(() => {
    if (state === 'over') submit(score)
  }, [state, score, submit])

  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    },
    [],
  )

  const answer = useCallback(
    (value: boolean) => {
      if (stateRef.current !== 'playing') return
      if (value === puzzle.answer) {
        const gained = 40 * mult + puzzle.shape * 20
        setScore((s) => s + gained)
        setChain((c) => c + 1)
        setSolved((n) => n + 1)
        setTime((t) => Math.min(maxTime, t + 1.5))
        setFlash('good')
        if (soundRef.current) blip('coin')
        levelRef.current += 1
        setPuzzle(build(levelRef.current))
      } else {
        setChain(0)
        setTime((t) => Math.max(0.01, t - 2.2))
        setFlash('bad')
        if (soundRef.current) blip('bad')
      }
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => setFlash('none'), 260)
    },
    [mult, puzzle],
  )

  // 0 and 1 anywhere inside the cabinet.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onKey = (e: KeyboardEvent) => {
      if (stateRef.current !== 'playing') {
        if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
          e.preventDefault()
          start()
        }
        return
      }
      if (e.key === '0') {
        e.preventDefault()
        answer(false)
      } else if (e.key === '1') {
        e.preventDefault()
        answer(true)
      }
    }
    root.addEventListener('keydown', onKey)
    return () => root.removeEventListener('keydown', onKey)
  }, [answer, start])

  const border = flash === 'good' ? '#3ef0c0' : flash === 'bad' ? '#ff5c5c' : ACCENT
  const timePct = Math.max(0, Math.min(1, time / maxTime))

  return (
    <Cabinet accent={border} className="transition-colors duration-150">
      <ArcadeHud
        accent={ACCENT}
        left={`${String(score).padStart(6, '0')}${mult > 1 ? ` ·x${mult}` : ''}`}
        right={`solved ${solved} · best ${best}`}
      />

      <div
        ref={rootRef}
        tabIndex={0}
        role="application"
        aria-label="Logic Rush. Press 0 or 1 to call the output. Enter starts."
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#8ab6ff]"
        style={{ fontFamily: 'var(--font-tech)' }}
      >
        {/* the clock */}
        <div className="h-1.5 w-full bg-white/10">
          <div
            className="h-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${timePct * 100}%`,
              background: timePct < 0.25 ? '#ff5c5c' : timePct < 0.5 ? '#ffd166' : ACCENT,
            }}
          />
        </div>

        <div
          className="flex min-h-[250px] flex-col items-center justify-center gap-5 px-4 py-6 sm:min-h-[300px]"
          style={{
            background:
              flash === 'good'
                ? 'radial-gradient(60% 60% at 50% 50%, rgba(62,240,192,0.14), transparent)'
                : flash === 'bad'
                  ? 'radial-gradient(60% 60% at 50% 50%, rgba(255,92,92,0.16), transparent)'
                  : 'none',
            transform: flash === 'bad' ? 'translateX(3px)' : 'none',
            transition: 'transform 90ms ease',
          }}
        >
          <CircuitDiagram puzzle={puzzle} />

          <div className="flex items-center gap-3">
            {[false, true].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => answer(v)}
                disabled={state !== 'playing'}
                className="h-14 w-24 rounded-lg border-2 text-[24px] font-bold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                {v ? '1' : '0'}
              </button>
            ))}
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            what does the output read? · keys 0 and 1
          </p>
        </div>

        <ScreenOverlay
          show={state === 'ready'}
          accent={ACCENT}
          title="Logic Rush"
          lines={
            <>
              <p>A circuit, lit inputs, and a clock that never stops draining.</p>
              <p className="mt-2">
                Call the output. Three in a row starts a multiplier, up to <b>x8</b>. Right answers
                buy time back, wrong ones cost two seconds. Gates get nastier and the circuit grows.
              </p>
              <p className="mt-2 text-white/50">Press 0 or 1 · or tap the buttons</p>
            </>
          }
          action="Insert coin"
          onAction={start}
          art={<GateArt />}
        />
        <ScreenOverlay
          show={state === 'over'}
          accent="#ff5c5c"
          title="Timing violation"
          lines={
            <>
              <p>The clock ran out after {solved} circuits.</p>
              <p className="mt-2 text-[15px] text-white">{score} points</p>
              <p className="mt-1 text-white/60">Personal best {best}</p>
              {score >= best && score > 0 && <p className="mt-1 text-[#ffd166]">New personal best.</p>}
            </>
          }
          action="Retry"
          onAction={start}
          art={<CrackArt />}
        />
      </div>
    </Cabinet>
  )
}

/** The circuit, drawn to scale for however many gates the level has. */
function CircuitDiagram({ puzzle }: { puzzle: Puzzle }) {
  const { shape, inputs, gates } = puzzle
  const label = useMemo(() => ['A', 'B', 'C', 'D'], [])

  const Pin = ({ x, y, on, name }: { x: number; y: number; on: boolean; name: string }) => (
    <g>
      <text x={x - 18} y={y + 5} fontSize="13" fill="rgba(255,255,255,0.45)" textAnchor="middle">
        {name}
      </text>
      <rect
        x={x - 9}
        y={y - 11}
        width="22"
        height="22"
        rx="5"
        fill={on ? '#3ef0c0' : '#1d2740'}
        stroke={on ? '#3ef0c0' : '#3a4766'}
        strokeWidth="2"
      />
      <text
        x={x + 2}
        y={y + 6}
        fontSize="14"
        fontWeight="bold"
        fill={on ? '#05221b' : '#8ea2c8'}
        textAnchor="middle"
      >
        {on ? '1' : '0'}
      </text>
    </g>
  )

  const Gate = ({ x, y, id }: { x: number; y: number; id: GateId }) => (
    <g>
      <rect x={x} y={y - 26} width="74" height="52" rx="10" fill="#16203a" stroke={ACCENT} strokeWidth="2.5" />
      <text x={x + 37} y={y + 6} fontSize="16" fontWeight="bold" fill={ACCENT} textAnchor="middle">
        {id}
      </text>
    </g>
  )

  const wire = (d: string) => (
    <path d={d} fill="none" stroke="#4a5a80" strokeWidth="2.5" strokeLinecap="round" />
  )

  if (shape === 1) {
    return (
      <svg viewBox="0 0 360 140" className="w-full max-w-[360px]" role="img" aria-label={`A ${gates[0].id} gate with inputs ${inputs[0] ? 1 : 0} and ${inputs[1] ? 1 : 0}`}>
        {wire('M58 48h60M58 92h60M226 70h60')}
        <Pin x={40} y={48} on={inputs[0]} name={label[0]} />
        <Pin x={40} y={92} on={inputs[1]} name={label[1]} />
        {wire('M118 48v22h8M118 92v-22h8')}
        <Gate x={152} y={70} id={gates[0].id} />
        <circle cx="300" cy="70" r="15" fill="#241c38" stroke="#ffd166" strokeWidth="2.5" />
        <text x="300" y="76" fontSize="17" fontWeight="bold" fill="#ffd166" textAnchor="middle">?</text>
      </svg>
    )
  }

  if (shape === 2) {
    return (
      <svg viewBox="0 0 460 170" className="w-full max-w-[440px]" role="img" aria-label="A two-gate circuit">
        {wire('M58 40h40M58 80h40M172 60h34M58 128h148M320 94h40')}
        <Pin x={40} y={40} on={inputs[0]} name={label[0]} />
        <Pin x={40} y={80} on={inputs[1]} name={label[1]} />
        <Pin x={40} y={128} on={inputs[2]} name={label[2]} />
        {wire('M98 40v20h4M98 80v-20h4')}
        <Gate x={98} y={60} id={gates[0].id} />
        {wire('M206 60v24h8M206 128v-24h8')}
        <Gate x={246} y={94} id={gates[1].id} />
        <circle cx="378" cy="94" r="15" fill="#241c38" stroke="#ffd166" strokeWidth="2.5" />
        <text x="378" y="100" fontSize="17" fontWeight="bold" fill="#ffd166" textAnchor="middle">?</text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 480 210" className="w-full max-w-[460px]" role="img" aria-label="A three-gate circuit">
      {wire('M58 34h40M58 74h40M58 138h40M58 178h40M172 54h36M172 158h36M344 106h34')}
      <Pin x={40} y={34} on={inputs[0]} name={label[0]} />
      <Pin x={40} y={74} on={inputs[1]} name={label[1]} />
      <Pin x={40} y={138} on={inputs[2]} name={label[2]} />
      <Pin x={40} y={178} on={inputs[3]} name={label[3]} />
      {wire('M98 34v20h4M98 74v-20h4M98 138v20h4M98 178v-20h4')}
      <Gate x={98} y={54} id={gates[0].id} />
      <Gate x={98} y={158} id={gates[1].id} />
      {wire('M208 54v42h6M208 158v-42h6')}
      <Gate x={270} y={106} id={gates[2].id} />
      <circle cx="398" cy="106" r="15" fill="#241c38" stroke="#ffd166" strokeWidth="2.5" />
      <text x="398" y="112" fontSize="17" fontWeight="bold" fill="#ffd166" textAnchor="middle">?</text>
    </svg>
  )
}

function GateArt() {
  return (
    <svg width="130" height="46" viewBox="0 0 130 46" aria-hidden="true">
      <path d="M44 10h22a13 13 0 0 1 0 26H44Z" fill="none" stroke="#8ab6ff" strokeWidth="2.4" />
      <line x1="22" y1="18" x2="44" y2="18" stroke="#8ab6ff" strokeWidth="2.4" />
      <line x1="22" y1="28" x2="44" y2="28" stroke="#8ab6ff" strokeWidth="2.4" />
      <line x1="82" y1="23" x2="108" y2="23" stroke="#ffd166" strokeWidth="2.4">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.1s" repeatCount="indefinite" />
      </line>
    </svg>
  )
}

function CrackArt() {
  return (
    <svg width="130" height="46" viewBox="0 0 130 46" aria-hidden="true">
      <rect x="24" y="10" width="82" height="26" fill="none" stroke="#ff5c5c" strokeWidth="2.4" />
      <path d="M52 10l8 13-10 4 12 9" fill="none" stroke="#ff5c5c" strokeWidth="2.4" />
    </svg>
  )
}
