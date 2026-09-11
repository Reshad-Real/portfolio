import { useCallback, useEffect, useRef, useState } from 'react'
import { blip } from '../../lib/audio'
import { ArcadeHud, Cabinet, ScreenOverlay, TouchPad, useHighScore, type GameState } from './arcadeUi'

const ACCENT = '#3ef0c0'
const W = 660
const H = 360
const LANES = [96, 180, 264]

type Kind = 'fault' | 'charge' | 'boost' | 'shield'
type Item = { x: number; lane: number; kind: Kind; dead: boolean; near: boolean }
type Bit = { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number }

type Runtime = {
  lane: number
  laneY: number
  items: Item[]
  bits: Bit[]
  speed: number
  dist: number
  charges: number
  combo: number
  comboTime: number
  best: number
  lives: number
  shield: boolean
  immune: number
  spawn: number
  shake: number
  flash: number
  score: number
  cause: string
}

function fresh(): Runtime {
  return {
    lane: 1,
    laneY: LANES[1],
    items: [],
    bits: [],
    speed: 230,
    dist: 0,
    charges: 0,
    combo: 1,
    comboTime: 0,
    best: 1,
    lives: 3,
    shield: false,
    immune: 0,
    spawn: 0,
    shake: 0,
    flash: 0,
    score: 0,
    cause: '',
  }
}

const CAUSES = ['a lattice defect', 'an open trace', 'a short to ground', 'gate oxide breakdown']

export default function CircuitRunner({ sound }: { sound: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rt = useRef<Runtime>(fresh())
  const stateRef = useRef<GameState>('ready')
  const [state, setState] = useState<GameState>('ready')
  const [hud, setHud] = useState({ score: 0, lives: 3, combo: 1, shield: false })
  const [over, setOver] = useState({ cause: '', score: 0, best: 1 })
  const { best, submit } = useHighScore('circuit-runner')
  const soundRef = useRef(sound)
  soundRef.current = sound

  const burst = useCallback((x: number, y: number, c: string, n: number, power = 1) => {
    const r = rt.current
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = (40 + Math.random() * 150) * power
      r.bits.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.35,
        c,
        r: 1.5 + Math.random() * 2.5,
      })
    }
  }, [])

  const move = useCallback((dir: -1 | 1) => {
    if (stateRef.current !== 'playing') return
    const r = rt.current
    const next = Math.max(0, Math.min(LANES.length - 1, r.lane + dir))
    if (next !== r.lane) {
      r.lane = next
      if (soundRef.current) blip('zap')
    }
  }, [])

  const start = useCallback(() => {
    rt.current = fresh()
    stateRef.current = 'playing'
    setState('playing')
    setHud({ score: 0, lives: 3, combo: 1, shield: false })
    if (soundRef.current) blip('level')
  }, [])

  useEffect(() => {
    const el = canvasRef.current?.parentElement
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        move(-1)
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        move(1)
      } else if ((e.key === 'Enter' || e.key === ' ') && stateRef.current !== 'playing') {
        if ((e.target as HTMLElement)?.tagName === 'BUTTON') return
        e.preventDefault()
        start()
      }
    }
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
        r.speed = 230 + Math.min(430, r.dist / 22)
        r.immune = Math.max(0, r.immune - dt)
        r.shake = Math.max(0, r.shake - dt * 3.4)
        r.flash = Math.max(0, r.flash - dt * 3)
        r.laneY += (LANES[r.lane] - r.laneY) * Math.min(1, dt * 18)

        // The combo decays if nothing is collected for a while.
        r.comboTime -= dt
        if (r.comboTime <= 0 && r.combo > 1) {
          r.combo = 1
          r.comboTime = 0
        }

        r.score = Math.floor(r.dist / 14) + r.charges * 12

        r.spawn -= dt
        if (r.spawn <= 0) {
          r.spawn = Math.max(0.26, 0.9 - r.dist / 13000)
          const lane = Math.floor(Math.random() * 3)
          const roll = Math.random()
          const kind: Kind =
            roll > 0.975 ? 'boost' : roll > 0.94 ? 'shield' : roll > 0.55 ? 'charge' : 'fault'
          r.items.push({ x: W + 30, lane, kind, dead: false, near: false })
          if (Math.random() > 0.66 && r.dist > 1100) {
            let other = Math.floor(Math.random() * 3)
            if (other === lane) other = (other + 1) % 3
            r.items.push({ x: W + 70, lane: other, kind: 'fault', dead: false, near: false })
          }
        }

        for (const it of r.items) it.x -= r.speed * dt
        r.items = r.items.filter((it) => it.x > -50)

        for (const it of r.items) {
          if (it.dead) continue
          const sameLane = Math.abs(LANES[it.lane] - r.laneY) < 28
          const inBox = it.x < 128 && it.x > 58

          // Sliding past a fault in a neighbouring lane is worth points.
          if (
            it.kind === 'fault' &&
            !it.near &&
            it.x < 140 &&
            it.x > 40 &&
            !sameLane &&
            Math.abs(LANES[it.lane] - r.laneY) < 100
          ) {
            it.near = true
            r.score += 4
            r.flash = 0.35
            burst(it.x, LANES[it.lane], '#9ad7ff', 6, 0.5)
          }

          if (!inBox || !sameLane) continue
          it.dead = true

          if (it.kind === 'charge') {
            r.charges += 1
            r.combo = Math.min(8, r.combo + 1)
            r.best = Math.max(r.best, r.combo)
            r.comboTime = 3.2
            r.score += 12 * r.combo
            burst(it.x, LANES[it.lane], '#ffd166', 12)
            if (soundRef.current) blip('coin')
          } else if (it.kind === 'boost') {
            r.immune = 5
            r.comboTime = 4
            burst(it.x, LANES[it.lane], ACCENT, 26, 1.6)
            if (soundRef.current) blip('level')
          } else if (it.kind === 'shield') {
            r.shield = true
            burst(it.x, LANES[it.lane], '#8ab6ff', 18)
            if (soundRef.current) blip('ok')
          } else if (r.immune <= 0) {
            if (r.shield) {
              r.shield = false
              r.shake = 0.5
              burst(it.x, LANES[it.lane], '#8ab6ff', 22, 1.3)
              if (soundRef.current) blip('hit')
            } else {
              r.lives -= 1
              r.shake = 1
              r.combo = 1
              r.cause = CAUSES[Math.floor(Math.random() * CAUSES.length)]
              burst(it.x, LANES[it.lane], '#ff5c5c', 26, 1.5)
              if (soundRef.current) blip('hit')
              if (r.lives <= 0) {
                stateRef.current = 'over'
                setState('over')
                setOver({ cause: r.cause, score: r.score, best: r.best })
                submit(r.score)
              }
            }
          }
        }

        for (const b of r.bits) {
          b.life -= dt
          b.x += b.vx * dt
          b.y += b.vy * dt
          b.vy += 260 * dt
        }
        r.bits = r.bits.filter((b) => b.life > 0)
      }

      // ------------------------------------------------------------- draw
      const cw = canvas.width
      const ch = canvas.height
      const scale = Math.min(cw / W, ch / H)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = '#05060a'
      ctx.fillRect(0, 0, cw, ch)
      const sx = r.shake > 0 ? (Math.random() - 0.5) * 11 * r.shake : 0
      const sy = r.shake > 0 ? (Math.random() - 0.5) * 8 * r.shake : 0
      ctx.setTransform(scale, 0, 0, scale, (cw - W * scale) / 2 + sx, (ch - H * scale) / 2 + sy)

      // parallax substrate
      for (let layer = 0; layer < 2; layer++) {
        const sp = layer === 0 ? 0.25 : 0.6
        ctx.strokeStyle = layer === 0 ? 'rgba(62,240,192,0.05)' : 'rgba(62,240,192,0.09)'
        ctx.lineWidth = 1
        const gap = layer === 0 ? 96 : 48
        const off = (r.dist * sp) % gap
        for (let x = -off; x < W; x += gap) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, H)
          ctx.stroke()
        }
      }

      // lanes
      for (let i = 0; i < LANES.length; i++) {
        ctx.strokeStyle = 'rgba(62,240,192,0.16)'
        ctx.lineWidth = 26
        ctx.beginPath()
        ctx.moveTo(0, LANES[i])
        ctx.lineTo(W, LANES[i])
        ctx.stroke()
        ctx.strokeStyle = 'rgba(62,240,192,0.55)'
        ctx.lineWidth = 2
        ctx.setLineDash([18, 16])
        ctx.lineDashOffset = -(r.dist * 1.4) % 34
        ctx.beginPath()
        ctx.moveTo(0, LANES[i])
        ctx.lineTo(W, LANES[i])
        ctx.stroke()
        ctx.setLineDash([])
      }

      for (const it of r.items) {
        if (it.dead) continue
        const y = LANES[it.lane]
        if (it.kind === 'fault') {
          ctx.strokeStyle = '#ff5c5c'
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(it.x - 13, y - 13)
          ctx.lineTo(it.x + 13, y + 13)
          ctx.moveTo(it.x + 13, y - 13)
          ctx.lineTo(it.x - 13, y + 13)
          ctx.stroke()
          ctx.strokeStyle = 'rgba(255,92,92,0.28)'
          ctx.lineWidth = 10
          ctx.stroke()
        } else if (it.kind === 'charge') {
          const p = 1 + Math.sin(now / 140 + it.x) * 0.12
          ctx.fillStyle = '#ffd166'
          ctx.beginPath()
          ctx.arc(it.x, y, 7 * p, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,209,102,0.4)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(it.x, y, 13 * p, 0, Math.PI * 2)
          ctx.stroke()
        } else if (it.kind === 'shield') {
          ctx.strokeStyle = '#8ab6ff'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(it.x, y - 12)
          ctx.lineTo(it.x + 11, y - 5)
          ctx.lineTo(it.x + 8, y + 11)
          ctx.lineTo(it.x - 8, y + 11)
          ctx.lineTo(it.x - 11, y - 5)
          ctx.closePath()
          ctx.stroke()
        } else {
          ctx.save()
          ctx.translate(it.x, y)
          ctx.rotate(now / 260)
          ctx.strokeStyle = ACCENT
          ctx.lineWidth = 3
          ctx.strokeRect(-10, -10, 20, 20)
          ctx.fillStyle = ACCENT
          ctx.fillRect(-3.5, -3.5, 7, 7)
          ctx.restore()
        }
      }

      // trail
      const py = r.laneY
      for (let i = 1; i < 7; i++) {
        ctx.globalAlpha = (0.34 / i) * (r.immune > 0 ? 2 : 1)
        ctx.fillStyle = r.immune > 0 ? '#ffd166' : ACCENT
        ctx.fillRect(70 - i * 16, py - 2.5, 11, 5)
      }
      ctx.globalAlpha = 1

      // the carrier
      ctx.save()
      ctx.translate(92, py)
      ctx.fillStyle = r.immune > 0 ? '#ffd166' : ACCENT
      ctx.beginPath()
      ctx.moveTo(16, 0)
      ctx.lineTo(-12, -15)
      ctx.lineTo(-5, 0)
      ctx.lineTo(-12, 15)
      ctx.closePath()
      ctx.fill()
      if (r.shield) {
        ctx.strokeStyle = `rgba(138,182,255,${0.5 + 0.3 * Math.sin(now / 110)})`
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(0, 0, 24, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (r.immune > 0) {
        ctx.strokeStyle = `rgba(255,209,102,${0.4 + 0.35 * Math.sin(now / 80)})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(0, 0, 30, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      for (const b of r.bits) {
        ctx.globalAlpha = Math.max(0, b.life * 2.4)
        ctx.fillStyle = b.c
        ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2)
      }
      ctx.globalAlpha = 1

      // combo meter
      if (r.combo > 1) {
        ctx.fillStyle = '#ffd166'
        ctx.font = 'bold 26px ui-monospace, monospace'
        ctx.textAlign = 'right'
        ctx.globalAlpha = Math.min(1, r.comboTime)
        ctx.fillText(`x${r.combo}`, W - 16, 40)
        ctx.fillRect(W - 16 - 70 * (r.comboTime / 3.2), 48, 70 * (r.comboTime / 3.2), 4)
        ctx.globalAlpha = 1
      }

      if (r.flash > 0) {
        ctx.fillStyle = `rgba(154,215,255,${r.flash * 0.16})`
        ctx.fillRect(0, 0, W, H)
      }

      if (playing && now - report > 110) {
        report = now
        setHud({ score: r.score, lives: r.lives, combo: r.combo, shield: r.shield })
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [burst, submit])

  return (
    <Cabinet accent={ACCENT}>
      <ArcadeHud
        accent={ACCENT}
        left={`${String(hud.score).padStart(6, '0')}${hud.combo > 1 ? ` ·x${hud.combo}` : ''}`}
        right={`${'▮'.repeat(Math.max(0, hud.lives))}${'▯'.repeat(Math.max(0, 3 - hud.lives))}${hud.shield ? ' ⛊' : ''} · best ${best}`}
      />
      <div
        tabIndex={0}
        role="application"
        aria-label="Circuit Runner. Up and down arrows change lane. Enter starts."
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#3ef0c0]"
        onPointerDown={(e) => {
          if (stateRef.current !== 'playing') return
          const rect = e.currentTarget.getBoundingClientRect()
          move(e.clientY - rect.top < rect.height / 2 ? -1 : 1)
        }}
      >
        <canvas ref={canvasRef} className="block h-[250px] w-full sm:h-[320px]" />

        <ScreenOverlay
          show={state === 'ready'}
          accent={ACCENT}
          title="Circuit Runner"
          lines={
            <>
              <p>You are a carrier in the channel. Three lanes, rising speed.</p>
              <p className="mt-2">
                Chain charges for a multiplier up to <b>x8</b>. Slip past a fault in the next lane
                for a near-miss bonus. Grab a shield, or a boost for five seconds of immunity.
              </p>
              <p className="mt-2 text-white/50">Arrows or W/S · tap top or bottom half on touch</p>
            </>
          }
          action="Insert coin"
          onAction={start}
          art={<RunArt />}
        />
        <ScreenOverlay
          show={state === 'over'}
          accent="#ff5c5c"
          title="Circuit open"
          lines={
            <>
              <p>Taken out by {over.cause}.</p>
              <p className="mt-2 text-[15px] text-white">
                {over.score} points · best chain x{over.best}
              </p>
              <p className="mt-1 text-white/60">Personal best {best}</p>
              {over.score >= best && over.score > 0 && (
                <p className="mt-1 text-[#ffd166]">New personal best.</p>
              )}
            </>
          }
          action="Run again"
          onAction={start}
          art={<FlatArt />}
        />
      </div>

      <TouchPad
        accent={ACCENT}
        buttons={[
          { label: '▲', aria: 'Move up a lane', onPress: () => move(-1) },
          { label: '▼', aria: 'Move down a lane', onPress: () => move(1) },
        ]}
      />
    </Cabinet>
  )
}

function RunArt() {
  return (
    <svg width="140" height="34" viewBox="0 0 140 34" aria-hidden="true">
      <line x1="0" y1="17" x2="140" y2="17" stroke="#3ef0c0" strokeWidth="3" opacity="0.25" />
      <line x1="0" y1="17" x2="140" y2="17" stroke="#3ef0c0" strokeWidth="2" strokeDasharray="12 9">
        <animate attributeName="stroke-dashoffset" values="42;0" dur="0.6s" repeatCount="indefinite" />
      </line>
      <polygon points="86,17 60,5 67,17 60,29" fill="#3ef0c0" />
      <circle cx="118" cy="17" r="5" fill="#ffd166" />
    </svg>
  )
}

function FlatArt() {
  return (
    <svg width="150" height="34" viewBox="0 0 150 34" aria-hidden="true">
      <path d="M0 17h48l6-12 7 24 6-12h83" fill="none" stroke="#ff5c5c" strokeWidth="2.4" />
    </svg>
  )
}
