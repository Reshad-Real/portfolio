import { useCallback, useEffect, useRef, useState } from 'react'
import { blip } from '../../lib/audio'
import { ArcadeHud, Cabinet, ScreenOverlay, TouchPad, useHighScore, type GameState } from './arcadeUi'

const ACCENT = '#3ef0c0'
const W = 640
const H = 340
const LANES = [90, 170, 250]

type Kind = 'fault' | 'charge' | 'boost'
type Item = { x: number; lane: number; kind: Kind; hit: boolean }

type Runtime = {
  lane: number
  laneY: number
  items: Item[]
  speed: number
  dist: number
  charges: number
  lives: number
  immune: number
  spawn: number
  shake: number
  cause: string
}

function fresh(): Runtime {
  return {
    lane: 1,
    laneY: LANES[1],
    items: [],
    speed: 200,
    dist: 0,
    charges: 0,
    lives: 3,
    immune: 0,
    spawn: 0,
    shake: 0,
    cause: '',
  }
}

const CAUSES = ['lattice defect', 'open trace', 'short to ground', 'gate oxide breakdown']

export default function CircuitRunner({ sound }: { sound: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rt = useRef<Runtime>(fresh())
  const stateRef = useRef<GameState>('ready')
  const [state, setState] = useState<GameState>('ready')
  const [hud, setHud] = useState({ score: 0, lives: 3 })
  const [cause, setCause] = useState('')
  const { best, submit } = useHighScore('circuit-runner')
  const soundRef = useRef(sound)
  soundRef.current = sound

  const score = useCallback(() => Math.floor(rt.current.dist / 12) + rt.current.charges * 10, [])

  const move = useCallback((dir: -1 | 1) => {
    if (stateRef.current !== 'playing') return
    const r = rt.current
    r.lane = Math.max(0, Math.min(LANES.length - 1, r.lane + dir))
  }, [])

  const start = useCallback(() => {
    rt.current = fresh()
    stateRef.current = 'playing'
    setState('playing')
    setHud({ score: 0, lives: 3 })
    if (soundRef.current) blip('level')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        move(-1)
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        move(1)
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (stateRef.current !== 'playing') {
          e.preventDefault()
          start()
        }
      }
    }
    const el = canvasRef.current?.parentElement
    el?.addEventListener('keydown', onKey)
    return () => el?.removeEventListener('keydown', onKey)
  }, [move, start])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let report = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
    }
    resize()
    window.addEventListener('resize', resize)

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      const r = rt.current
      const playing = stateRef.current === 'playing'

      if (playing) {
        r.dist += r.speed * dt
        r.speed = 200 + Math.min(340, r.dist / 26)
        r.immune = Math.max(0, r.immune - dt)
        r.shake = Math.max(0, r.shake - dt * 3)

        // lane easing
        const target = LANES[r.lane]
        r.laneY += (target - r.laneY) * Math.min(1, dt * 16)

        // spawning gets denser as the run goes on
        r.spawn -= dt
        if (r.spawn <= 0) {
          r.spawn = Math.max(0.3, 0.95 - r.dist / 14000)
          const lane = Math.floor(Math.random() * 3)
          const roll = Math.random()
          const kind: Kind = roll > 0.94 ? 'boost' : roll > 0.56 ? 'charge' : 'fault'
          r.items.push({ x: W + 30, lane, kind, hit: false })

          // occasionally a second fault, never blocking every lane at once
          if (Math.random() > 0.72 && r.dist > 900) {
            let other = Math.floor(Math.random() * 3)
            if (other === lane) other = (other + 1) % 3
            r.items.push({ x: W + 30 + 40, lane: other, kind: 'fault', hit: false })
          }
        }

        for (const it of r.items) it.x -= r.speed * dt
        r.items = r.items.filter((it) => it.x > -40)

        // collision against the player box
        for (const it of r.items) {
          if (it.hit) continue
          const py = r.laneY
          if (it.x < 118 && it.x > 56 && Math.abs(LANES[it.lane] - py) < 26) {
            it.hit = true
            if (it.kind === 'charge') {
              r.charges += 1
              if (soundRef.current) blip('coin')
            } else if (it.kind === 'boost') {
              r.immune = 4
              if (soundRef.current) blip('ok')
            } else if (r.immune <= 0) {
              r.lives -= 1
              r.shake = 1
              r.cause = CAUSES[Math.floor(Math.random() * CAUSES.length)]
              if (soundRef.current) blip('hit')
              if (r.lives <= 0) {
                stateRef.current = 'over'
                setState('over')
                setCause(r.cause)
                submit(score())
              }
            }
          }
        }
      }

      // ------------------------------------------------------------- draw
      const cw = canvas.width
      const ch = canvas.height
      const scale = Math.min(cw / W, ch / H)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cw, ch)
      ctx.fillStyle = '#05060a'
      ctx.fillRect(0, 0, cw, ch)
      const shakeX = r.shake > 0 ? (Math.random() - 0.5) * 8 * r.shake : 0
      ctx.setTransform(scale, 0, 0, scale, (cw - W * scale) / 2 + shakeX, (ch - H * scale) / 2)

      // substrate grid
      ctx.strokeStyle = 'rgba(62,240,192,0.08)'
      ctx.lineWidth = 1
      const off = (r.dist * 0.5) % 40
      for (let x = -off; x < W; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }

      // bus lanes
      for (let i = 0; i < LANES.length; i++) {
        ctx.strokeStyle = 'rgba(62,240,192,0.24)'
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.moveTo(0, LANES[i])
        ctx.lineTo(W, LANES[i])
        ctx.stroke()
        ctx.strokeStyle = 'rgba(62,240,192,0.5)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([16, 14])
        ctx.lineDashOffset = -(r.dist * 1.2) % 30
        ctx.beginPath()
        ctx.moveTo(0, LANES[i])
        ctx.lineTo(W, LANES[i])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // items
      for (const it of r.items) {
        if (it.hit && it.kind !== 'fault') continue
        const y = LANES[it.lane]
        if (it.kind === 'fault') {
          ctx.strokeStyle = it.hit ? 'rgba(255,90,90,0.3)' : '#ff5c5c'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(it.x - 11, y - 11)
          ctx.lineTo(it.x + 11, y + 11)
          ctx.moveTo(it.x + 11, y - 11)
          ctx.lineTo(it.x - 11, y + 11)
          ctx.stroke()
        } else if (it.kind === 'charge') {
          ctx.fillStyle = '#ffd166'
          ctx.beginPath()
          ctx.arc(it.x, y, 6, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,209,102,0.35)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(it.x, y, 11, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.strokeStyle = '#8ab6ff'
          ctx.lineWidth = 2.5
          ctx.strokeRect(it.x - 9, y - 9, 18, 18)
          ctx.fillStyle = '#8ab6ff'
          ctx.fillRect(it.x - 3, y - 3, 6, 6)
        }
      }

      // carrier
      const py = r.laneY
      const glow = r.immune > 0 ? 1 : 0.55
      ctx.fillStyle = ACCENT
      ctx.globalAlpha = glow
      ctx.beginPath()
      ctx.moveTo(96, py)
      ctx.lineTo(72, py - 13)
      ctx.lineTo(78, py)
      ctx.lineTo(72, py + 13)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
      if (r.immune > 0) {
        ctx.strokeStyle = `rgba(62,240,192,${0.35 + 0.3 * Math.sin(now / 90)})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(84, py, 20, 0, Math.PI * 2)
        ctx.stroke()
      }

      // trailing charge
      ctx.fillStyle = 'rgba(62,240,192,0.5)'
      for (let i = 1; i < 5; i++) {
        ctx.globalAlpha = 0.4 / i
        ctx.fillRect(70 - i * 12, py - 2, 8, 4)
      }
      ctx.globalAlpha = 1

      if (playing && now - report > 120) {
        report = now
        setHud({ score: score(), lives: r.lives })
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [score, submit])

  return (
    <Cabinet accent={ACCENT}>
      <ArcadeHud
        accent={ACCENT}
        left={`Score ${String(hud.score).padStart(5, '0')}`}
        right={`Lives ${'▮'.repeat(Math.max(0, hud.lives))}${'▯'.repeat(Math.max(0, 3 - hud.lives))} · Best ${best}`}
      />
      <div
        tabIndex={0}
        role="application"
        aria-label="Circuit Runner. Use the up and down arrow keys to change lane. Press Enter to start."
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#3ef0c0]"
        onPointerDown={(e) => {
          if (stateRef.current !== 'playing') return
          const rect = e.currentTarget.getBoundingClientRect()
          move(e.clientY - rect.top < rect.height / 2 ? -1 : 1)
        }}
      >
        <canvas ref={canvasRef} className="block h-[240px] w-full sm:h-[300px]" />

        <ScreenOverlay
          show={state === 'ready'}
          accent={ACCENT}
          title="Circuit Runner"
          lines={
            <>
              <p>You are a carrier in the channel. Three lanes, rising speed.</p>
              <p className="mt-2">
                Dodge defects, collect charge, grab the rare boost for temporary immunity.
              </p>
              <p className="mt-2 text-white/50">
                Arrow keys or W/S · tap the top or bottom half on touch
              </p>
            </>
          }
          action="Insert coin"
          onAction={start}
          art={<RunnerArt />}
        />
        <ScreenOverlay
          show={state === 'over'}
          accent="#ff5c5c"
          title="Circuit open"
          lines={
            <>
              <p>Killed by {cause}.</p>
              <p className="mt-2 text-[15px] text-white">
                Score {score()} · Best {best}
              </p>
              {score() >= best && score() > 0 && (
                <p className="mt-1 text-[#ffd166]">New personal best.</p>
              )}
            </>
          }
          action="Run again"
          onAction={start}
          art={<FlatlineArt />}
        />
      </div>

      <TouchPad
        accent={ACCENT}
        buttons={[
          { label: '▲ up', aria: 'Move up a lane', onPress: () => move(-1) },
          { label: '▼ down', aria: 'Move down a lane', onPress: () => move(1) },
        ]}
      />
    </Cabinet>
  )
}

function RunnerArt() {
  return (
    <svg width="120" height="34" viewBox="0 0 120 34" aria-hidden="true">
      <line x1="0" y1="17" x2="120" y2="17" stroke="#3ef0c0" strokeWidth="2" opacity="0.3" />
      <line
        x1="0"
        y1="17"
        x2="120"
        y2="17"
        stroke="#3ef0c0"
        strokeWidth="2"
        strokeDasharray="10 8"
      >
        <animate attributeName="stroke-dashoffset" values="36;0" dur="0.7s" repeatCount="indefinite" />
      </line>
      <polygon points="74,17 52,7 58,17 52,27" fill="#3ef0c0" />
    </svg>
  )
}

function FlatlineArt() {
  return (
    <svg width="140" height="34" viewBox="0 0 140 34" aria-hidden="true">
      <path
        d="M0 17 H46 l6 -12 l7 24 l6 -12 H140"
        fill="none"
        stroke="#ff5c5c"
        strokeWidth="2"
        opacity="0.85"
      />
    </svg>
  )
}
