import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { blip } from '../../lib/audio'
import { ArcadeHud, Cabinet, ScreenOverlay, useHighScore, type GameState } from './arcadeUi'

const ACCENT = '#8ab6ff'

type GateId = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR'

const GATES: { id: GateId; fn: (a: boolean, b: boolean) => boolean }[] = [
  { id: 'AND', fn: (a, b) => a && b },
  { id: 'OR', fn: (a, b) => a || b },
  { id: 'XOR', fn: (a, b) => a !== b },
  { id: 'NAND', fn: (a, b) => !(a && b) },
  { id: 'NOR', fn: (a, b) => !(a || b) },
  { id: 'XNOR', fn: (a, b) => a === b },
]

const GATE_FN = Object.fromEntries(GATES.map((g) => [g.id, g.fn])) as Record<
  GateId,
  (a: boolean, b: boolean) => boolean
>

type Node = { id: string; inputs: [string, string] }
type Topology = { inputs: string[]; nodes: Node[]; out: string }

const TOPOLOGIES: Topology[] = [
  { inputs: ['A', 'B'], nodes: [{ id: 'G1', inputs: ['A', 'B'] }], out: 'G1' },
  {
    inputs: ['A', 'B', 'C'],
    nodes: [
      { id: 'G1', inputs: ['A', 'B'] },
      { id: 'G2', inputs: ['G1', 'C'] },
    ],
    out: 'G2',
  },
  {
    inputs: ['A', 'B', 'C'],
    nodes: [
      { id: 'G1', inputs: ['A', 'B'] },
      { id: 'G2', inputs: ['B', 'C'] },
      { id: 'G3', inputs: ['G1', 'G2'] },
    ],
    out: 'G3',
  },
]

function topologyForLevel(level: number): Topology {
  if (level <= 2) return TOPOLOGIES[0]
  if (level <= 5) return TOPOLOGIES[1]
  return TOPOLOGIES[2]
}

function rows(inputCount: number): boolean[][] {
  const out: boolean[][] = []
  for (let i = 0; i < 1 << inputCount; i++) {
    const r: boolean[] = []
    for (let b = inputCount - 1; b >= 0; b--) r.push(Boolean((i >> b) & 1))
    out.push(r)
  }
  return out
}

function evaluate(topo: Topology, gates: Record<string, GateId | null>, input: boolean[]) {
  const env: Record<string, boolean> = {}
  topo.inputs.forEach((name, i) => (env[name] = input[i]))
  for (const node of topo.nodes) {
    const g = gates[node.id]
    if (!g) return null
    const a = env[node.inputs[0]]
    const b = env[node.inputs[1]]
    if (a === undefined || b === undefined) return null
    env[node.id] = GATE_FN[g](a, b)
  }
  return env[topo.out]
}

function randomTarget(topo: Topology): boolean[] {
  const table = rows(topo.inputs.length)
  for (let attempt = 0; attempt < 40; attempt++) {
    const pick: Record<string, GateId> = {}
    for (const n of topo.nodes) pick[n.id] = GATES[Math.floor(Math.random() * GATES.length)].id
    const out = table.map((r) => evaluate(topo, pick, r) as boolean)
    // reject constant functions: they are not a puzzle
    if (out.some((v) => v) && out.some((v) => !v)) return out
  }
  return table.map((_, i) => i % 2 === 0)
}

function timeForLevel(level: number) {
  return Math.max(22, 52 - level * 4)
}

export default function LogicLab({ sound }: { sound: boolean }) {
  const [state, setState] = useState<GameState>('ready')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(timeForLevel(1))
  const [gates, setGates] = useState<Record<string, GateId | null>>({})
  const [target, setTarget] = useState<boolean[]>([])
  const [topo, setTopo] = useState<Topology>(TOPOLOGIES[0])
  const [flash, setFlash] = useState<'none' | 'good' | 'bad'>('none')
  const { best, submit } = useHighScore('logic-lab')
  const soundRef = useRef(sound)
  soundRef.current = sound

  const table = useMemo(() => rows(topo.inputs.length), [topo])

  const current = useMemo(
    () => table.map((r) => evaluate(topo, gates, r)),
    [table, topo, gates],
  )

  const solved = useMemo(
    () => current.every((v, i) => v !== null && v === target[i]) && target.length > 0,
    [current, target],
  )

  const loadLevel = useCallback((lv: number) => {
    const t = topologyForLevel(lv)
    setTopo(t)
    setTarget(randomTarget(t))
    setGates(Object.fromEntries(t.nodes.map((n) => [n.id, null])))
    setSeconds(timeForLevel(lv))
  }, [])

  const start = useCallback(() => {
    setLevel(1)
    setScore(0)
    loadLevel(1)
    setState('playing')
    if (soundRef.current) blip('level')
  }, [loadLevel])

  // Countdown
  useEffect(() => {
    if (state !== 'playing') return
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id)
          setState('over')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [state, level])

  useEffect(() => {
    if (state === 'over') submit(score)
  }, [state, score, submit])

  const advance = useCallback(() => {
    setFlash('good')
    if (soundRef.current) blip('ok')
    const gained = 100 * level + seconds * 5
    setScore((s) => s + gained)
    window.setTimeout(() => {
      setFlash('none')
      setLevel((lv) => {
        const next = lv + 1
        loadLevel(next)
        return next
      })
    }, 600)
  }, [level, seconds, loadLevel])

  const check = useCallback(() => {
    if (state !== 'playing') return
    if (solved) {
      advance()
    } else {
      setFlash('bad')
      if (soundRef.current) blip('bad')
      setSeconds((s) => Math.max(0, s - 3))
      window.setTimeout(() => setFlash('none'), 400)
    }
  }, [state, solved, advance])

  const setGate = (nodeId: string, gate: GateId) => {
    setGates((g) => ({ ...g, [nodeId]: gate }))
    if (soundRef.current) blip('coin')
  }

  // Number keys assign a gate to the focused slot; Enter checks the circuit.
  // The listener lives on the cabinet, not the window, so Enter keeps working
  // normally everywhere else on the page.
  const focused = useRef<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const checkRef = useRef(check)
  checkRef.current = check
  const setGateRef = useRef(setGate)
  setGateRef.current = setGate

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onKey = (e: KeyboardEvent) => {
      if (state !== 'playing') return
      if (e.key === 'Enter') {
        // Let a focused button do its own thing.
        if ((e.target as HTMLElement)?.tagName === 'BUTTON') return
        e.preventDefault()
        checkRef.current()
        return
      }
      const n = Number(e.key)
      if (n >= 1 && n <= GATES.length && focused.current) {
        e.preventDefault()
        setGateRef.current(focused.current, GATES[n - 1].id)
      }
    }
    root.addEventListener('keydown', onKey)
    return () => root.removeEventListener('keydown', onKey)
  }, [state])

  const border =
    flash === 'good' ? '#3ef0c0' : flash === 'bad' ? '#ff5c5c' : ACCENT

  return (
    <Cabinet accent={border} className="transition-colors duration-200">
      <ArcadeHud
        accent={ACCENT}
        left={`Level ${level} · Score ${score}`}
        right={`${String(seconds).padStart(2, '0')}s · Best ${best}`}
      />

      <div ref={rootRef} className="relative" style={{ fontFamily: 'var(--font-tech)' }}>
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_190px] sm:p-5">
          {/* ------------------------------------------------- the circuit */}
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white/45">
              Fill every gate so the output matches the target
            </p>

            <ol className="space-y-2">
              {topo.nodes.map((node) => (
                <li
                  key={node.id}
                  className="flex flex-wrap items-center gap-2 rounded-sm border px-3 py-2"
                  style={{ borderColor: `${ACCENT}33` }}
                >
                  <span className="text-[12px] text-white/50">{node.id}</span>
                  <span className="text-[13px] text-white/80">
                    {node.inputs[0]} , {node.inputs[1]}
                  </span>
                  <span aria-hidden="true" className="text-white/30">
                    →
                  </span>
                  <select
                    value={gates[node.id] ?? ''}
                    onFocus={() => (focused.current = node.id)}
                    onBlur={() => (focused.current = null)}
                    onChange={(e) => setGate(node.id, e.target.value as GateId)}
                    aria-label={`Gate for ${node.id}, inputs ${node.inputs[0]} and ${node.inputs[1]}`}
                    disabled={state !== 'playing'}
                    className="rounded-sm border bg-transparent px-2 py-1 text-[13px] text-white outline-none disabled:opacity-50"
                    style={{ borderColor: `${ACCENT}66` }}
                  >
                    <option value="" disabled style={{ color: '#000' }}>
                      pick
                    </option>
                    {GATES.map((g, i) => (
                      <option key={g.id} value={g.id} style={{ color: '#000' }}>
                        {i + 1}. {g.id}
                      </option>
                    ))}
                  </select>
                  {node.id === topo.out && (
                    <span className="text-[12px]" style={{ color: ACCENT }}>
                      = OUT
                    </span>
                  )}
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={check}
              disabled={state !== 'playing'}
              className="mt-4 w-full rounded-sm border px-4 py-2 text-[13px] uppercase tracking-[0.18em] transition-colors disabled:opacity-40"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              Verify circuit
            </button>
            <p className="mt-2 text-[11px] text-white/35">
              Keys 1–6 set the focused gate · Enter verifies
            </p>
          </div>

          {/* -------------------------------------------------- truth table */}
          <div className="rounded-sm border p-3" style={{ borderColor: `${ACCENT}33` }}>
            <table className="w-full text-[12px] text-white/75">
              <caption className="mb-2 text-left text-[10px] uppercase tracking-[0.2em] text-white/45">
                Truth table
              </caption>
              <thead>
                <tr className="text-white/45">
                  {topo.inputs.map((i) => (
                    <th key={i} scope="col" className="pb-1 text-left font-normal">
                      {i}
                    </th>
                  ))}
                  <th scope="col" className="pb-1 text-right font-normal">
                    target
                  </th>
                  <th scope="col" className="pb-1 text-right font-normal">
                    yours
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => {
                  const mine = current[i]
                  const ok = mine !== null && mine === target[i]
                  return (
                    <tr key={i} className="tabular-nums">
                      {r.map((v, j) => (
                        <td key={j} className="py-[2px]">
                          {v ? 1 : 0}
                        </td>
                      ))}
                      <td className="py-[2px] text-right">{target[i] ? 1 : 0}</td>
                      <td
                        className="py-[2px] text-right"
                        style={{ color: mine === null ? '#ffffff40' : ok ? '#3ef0c0' : '#ff5c5c' }}
                      >
                        {mine === null ? '·' : mine ? 1 : 0}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <ScreenOverlay
          show={state === 'ready'}
          accent={ACCENT}
          title="Logic Lab"
          lines={
            <>
              <p>A circuit with empty gates and a truth table it has to satisfy.</p>
              <p className="mt-2">
                Fill each gate until your column matches the target. The circuit grows and the clock
                shortens every level. A wrong verify costs three seconds.
              </p>
              <p className="mt-2 text-white/50">Keys 1–6 to set a gate · Enter to verify</p>
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
              <p>The clock ran out on level {level}.</p>
              <p className="mt-2 text-[15px] text-white">
                Score {score} · Best {best}
              </p>
              {score >= best && score > 0 && (
                <p className="mt-1 text-[#ffd166]">New personal best.</p>
              )}
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

function GateArt() {
  return (
    <svg width="120" height="44" viewBox="0 0 120 44" aria-hidden="true">
      <path
        d="M40 8 H62 a14 14 0 0 1 0 28 H40 Z"
        fill="none"
        stroke="#8ab6ff"
        strokeWidth="2"
      />
      <line x1="20" y1="16" x2="40" y2="16" stroke="#8ab6ff" strokeWidth="2" />
      <line x1="20" y1="28" x2="40" y2="28" stroke="#8ab6ff" strokeWidth="2" />
      <line x1="76" y1="22" x2="100" y2="22" stroke="#8ab6ff" strokeWidth="2">
        <animate attributeName="opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite" />
      </line>
    </svg>
  )
}

function CrackArt() {
  return (
    <svg width="120" height="44" viewBox="0 0 120 44" aria-hidden="true">
      <rect x="20" y="10" width="80" height="24" fill="none" stroke="#ff5c5c" strokeWidth="2" />
      <path d="M48 10 L56 22 L46 26 L58 34" fill="none" stroke="#ff5c5c" strokeWidth="2" />
    </svg>
  )
}
