import { useCallback, useEffect, useRef, useState } from 'react'
import { blip } from '../../lib/audio'
import { ArcadeHud, Cabinet, ScreenOverlay, TouchPad, useHighScore, type GameState } from './arcadeUi'

const ACCENT = '#ffd166'
const W = 640
const H = 360
const RAIL_Y = 322

type Kind = 'spike' | 'noise' | 'short'
type Foe = { x: number; y: number; vx: number; vy: number; kind: Kind; hp: number; t: number }
type Shot = { x: number; y: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string }

type Runtime = {
  px: number
  cool: number
  shots: Shot[]
  foes: Foe[]
  sparks: Spark[]
  rail: number
  wave: number
  waveTimer: number
  spawn: number
  score: number
  left: boolean
  right: boolean
  firing: boolean
  cause: string
}

function fresh(): Runtime {
  return {
    px: W / 2,
    cool: 0,
    shots: [],
    foes: [],
    sparks: [],
    rail: 100,
    wave: 1,
    waveTimer: 18,
    spawn: 0.9,
    score: 0,
    left: false,
    right: false,
    firing: false,
    cause: '',
  }
}

const HP: Record<Kind, number> = { spike: 1, noise: 1, short: 3 }
const POINTS: Record<Kind, number> = { spike: 15, noise: 25, short: 60 }
const DAMAGE: Record<Kind, number> = { spike: 12, noise: 9, short: 26 }
const LABEL: Record<Kind, string> = {
  spike: 'a voltage spike',
  noise: 'injected noise',
  short: 'a short to the rail',
}

export default function VoltageDefender({ sound }: { sound: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rt = useRef<Runtime>(fresh())
  const stateRef = useRef<GameState>('ready')
  const [state, setState] = useState<GameState>('ready')
  const [hud, setHud] = useState({ score: 0, rail: 100, wave: 1 })
  const [cause, setCause] = useState('')
  const { best, submit } = useHighScore('voltage-defender')
  const soundRef = useRef(sound)
  soundRef.current = sound

  const start = useCallback(() => {
    rt.current = fresh()
    stateRef.current = 'playing'
    setState('playing')
    setHud({ score: 0, rail: 100, wave: 1 })
    if (soundRef.current) blip('level')
  }, [])

  const fire = useCallback(() => {
    const r = rt.current
    if (stateRef.current !== 'playing' || r.cool > 0) return
    r.shots.push({ x: r.px, y: RAIL_Y - 34 })
    r.cool = 0.17
    if (soundRef.current) blip('zap')
  }, [])

  useEffect(() => {
    const el = canvasRef.current?.parentElement
    const down = (e: KeyboardEvent) => {
      const r = rt.current
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        r.left = true
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        r.right = true
      } else if (e.key === ' ') {
        e.preventDefault()
        if (stateRef.current === 'playing') {
          r.firing = true
          fire()
        } else start()
      } else if (e.key === 'Enter') {
        if (stateRef.current !== 'playing') {
          e.preventDefault()
          start()
        }
      }
    }
    const up = (e: KeyboardEvent) => {
      const r = rt.current
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') r.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') r.right = false
      if (e.key === ' ') r.firing = false
    }
    el?.addEventListener('keydown', down)
    el?.addEventListener('keyup', up)
    return () => {
      el?.removeEventListener('keydown', down)
      el?.removeEventListener('keyup', up)
    }
  }, [fire, start])

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

    const burst = (x: number, y: number, c: string, n: number) => {
      const r = rt.current
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const s = 40 + Math.random() * 150
        r.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, c })
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      const r = rt.current
      const playing = stateRef.current === 'playing'

      if (playing) {
        if (r.left) r.px -= 300 * dt
        if (r.right) r.px += 300 * dt
        r.px = Math.max(26, Math.min(W - 26, r.px))
        r.cool = Math.max(0, r.cool - dt)
        if (r.firing) fire()

        r.waveTimer -= dt
        if (r.waveTimer <= 0) {
          r.wave += 1
          r.waveTimer = 18
          if (soundRef.current) blip('level')
        }

        r.spawn -= dt
        if (r.spawn <= 0) {
          r.spawn = Math.max(0.24, 0.95 - r.wave * 0.07)
          const roll = Math.random()
          const kind: Kind = roll > 0.9 - Math.min(0.25, r.wave * 0.02) ? 'short' : roll > 0.5 ? 'noise' : 'spike'
          const x = 30 + Math.random() * (W - 60)
          r.foes.push({
            x,
            y: -20,
            vx: kind === 'noise' ? (Math.random() > 0.5 ? 70 : -70) : 0,
            vy: (kind === 'short' ? 32 : kind === 'spike' ? 82 : 54) + r.wave * 5,
            kind,
            hp: HP[kind],
            t: Math.random() * 6,
          })
        }

        for (const s of r.shots) s.y -= 560 * dt
        r.shots = r.shots.filter((s) => s.y > -12)

        for (const f of r.foes) {
          f.t += dt
          f.y += f.vy * dt
          if (f.kind === 'noise') {
            f.x += f.vx * dt
            if (f.x < 22 || f.x > W - 22) f.vx *= -1
          }
        }

        // shots against foes
        for (const s of r.shots) {
          for (const f of r.foes) {
            if (f.hp <= 0) continue
            const rad = f.kind === 'short' ? 20 : 13
            if (Math.abs(s.x - f.x) < rad && Math.abs(s.y - f.y) < rad) {
              f.hp -= 1
              s.y = -100
              burst(f.x, f.y, f.kind === 'short' ? '#ff7a7a' : ACCENT, f.hp <= 0 ? 14 : 5)
              if (f.hp <= 0) {
                r.score += POINTS[f.kind]
                if (soundRef.current) blip('coin')
              } else if (soundRef.current) blip('hit')
              break
            }
          }
        }
        r.shots = r.shots.filter((s) => s.y > -12)
        r.foes = r.foes.filter((f) => f.hp > 0)

        // foes reaching the rail
        for (const f of r.foes) {
          if (f.y < RAIL_Y - 8) continue
          r.rail -= DAMAGE[f.kind]
          r.cause = LABEL[f.kind]
          f.hp = 0
          burst(f.x, RAIL_Y, '#ff5c5c', 18)
          if (soundRef.current) blip('bad')
        }
        r.foes = r.foes.filter((f) => f.hp > 0)

        if (r.rail <= 0) {
          r.rail = 0
          stateRef.current = 'over'
          setState('over')
          setCause(r.cause || 'rail collapse')
          submit(r.score)
        }

        for (const s of r.sparks) {
          s.life -= dt
          s.x += s.vx * dt
          s.y += s.vy * dt
          s.vy += 220 * dt
        }
        r.sparks = r.sparks.filter((s) => s.life > 0)
      }

      // ------------------------------------------------------------- draw
      const cw = canvas.width
      const ch = canvas.height
      const scale = Math.min(cw / W, ch / H)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cw, ch)
      ctx.fillStyle = '#05060a'
      ctx.fillRect(0, 0, cw, ch)
      ctx.setTransform(scale, 0, 0, scale, (cw - W * scale) / 2, (ch - H * scale) / 2)

      // starfield of stray carriers
      ctx.fillStyle = 'rgba(255,209,102,0.18)'
      for (let i = 0; i < 26; i++) {
        const x = (i * 173 + now * 0.012 * ((i % 4) + 1)) % W
        const y = (i * 97) % (RAIL_Y - 20)
        ctx.fillRect(x, y, 2, 2)
      }

      // the rail being defended
      const railPct = Math.max(0, r.rail) / 100
      ctx.strokeStyle = `rgba(${Math.round(255 - railPct * 80)},${Math.round(90 + railPct * 120)},90,0.9)`
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(0, RAIL_Y)
      ctx.lineTo(W, RAIL_Y)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,209,102,0.1)'
      ctx.fillRect(0, RAIL_Y + 2, W, H - RAIL_Y)
      ctx.fillStyle = 'rgba(80,230,180,0.55)'
      ctx.fillRect(0, RAIL_Y + 4, W * railPct, 5)

      // foes
      for (const f of r.foes) {
        if (f.kind === 'spike') {
          ctx.strokeStyle = '#8ab6ff'
          ctx.lineWidth = 2.4
          ctx.beginPath()
          ctx.moveTo(f.x - 11, f.y + 9)
          ctx.lineTo(f.x - 3, f.y - 11)
          ctx.lineTo(f.x + 3, f.y + 4)
          ctx.lineTo(f.x + 11, f.y - 9)
          ctx.stroke()
        } else if (f.kind === 'noise') {
          ctx.strokeStyle = '#c78cff'
          ctx.lineWidth = 2
          ctx.beginPath()
          for (let i = -12; i <= 12; i += 3) {
            const y = f.y + Math.sin(i * 0.8 + f.t * 9) * 6
            if (i === -12) ctx.moveTo(f.x + i, y)
            else ctx.lineTo(f.x + i, y)
          }
          ctx.stroke()
        } else {
          ctx.strokeStyle = '#ff7a7a'
          ctx.lineWidth = 2.6
          ctx.strokeRect(f.x - 16, f.y - 14, 32, 28)
          ctx.beginPath()
          ctx.moveTo(f.x - 16, f.y - 14)
          ctx.lineTo(f.x + 16, f.y + 14)
          ctx.moveTo(f.x + 16, f.y - 14)
          ctx.lineTo(f.x - 16, f.y + 14)
          ctx.stroke()
          ctx.fillStyle = '#ff7a7a'
          for (let i = 0; i < f.hp; i++) ctx.fillRect(f.x - 9 + i * 8, f.y - 22, 5, 3)
        }
      }

      // shots
      ctx.fillStyle = ACCENT
      for (const s of r.shots) ctx.fillRect(s.x - 1.5, s.y - 10, 3, 12)

      // sparks
      for (const s of r.sparks) {
        ctx.globalAlpha = Math.max(0, s.life * 2)
        ctx.fillStyle = s.c
        ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3)
      }
      ctx.globalAlpha = 1

      // the regulator
      ctx.fillStyle = ACCENT
      ctx.beginPath()
      ctx.moveTo(r.px, RAIL_Y - 36)
      ctx.lineTo(r.px - 17, RAIL_Y - 12)
      ctx.lineTo(r.px - 8, RAIL_Y - 12)
      ctx.lineTo(r.px - 8, RAIL_Y - 4)
      ctx.lineTo(r.px + 8, RAIL_Y - 4)
      ctx.lineTo(r.px + 8, RAIL_Y - 12)
      ctx.lineTo(r.px + 17, RAIL_Y - 12)
      ctx.closePath()
      ctx.fill()

      if (playing && now - report > 120) {
        report = now
        setHud({ score: r.score, rail: Math.max(0, Math.round(r.rail)), wave: r.wave })
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [fire, submit])

  return (
    <Cabinet accent={ACCENT}>
      <ArcadeHud
        accent={ACCENT}
        left={`Score ${String(hud.score).padStart(5, '0')} · Wave ${hud.wave}`}
        right={`Rail ${hud.rail}% · Best ${best}`}
      />
      <div
        tabIndex={0}
        role="application"
        aria-label="Voltage Defender. Left and right arrow keys to move, space to fire. Press Enter to start."
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]"
        onPointerMove={(e) => {
          if (stateRef.current !== 'playing' || e.pointerType === 'mouse') return
          const rect = e.currentTarget.getBoundingClientRect()
          const scale = W / rect.width
          rt.current.px = Math.max(26, Math.min(W - 26, (e.clientX - rect.left) * scale))
        }}
        onPointerDown={(e) => {
          if (stateRef.current !== 'playing') return
          const rect = e.currentTarget.getBoundingClientRect()
          const scale = W / rect.width
          rt.current.px = Math.max(26, Math.min(W - 26, (e.clientX - rect.left) * scale))
          fire()
        }}
      >
        <canvas ref={canvasRef} className="block h-[250px] w-full sm:h-[320px]" />

        <ScreenOverlay
          show={state === 'ready'}
          accent={ACCENT}
          title="Voltage Defender"
          lines={
            <>
              <p>You are the regulator. Keep the power rail alive.</p>
              <p className="mt-2">
                Spikes come straight down, noise weaves, and a short takes three hits. Every wave
                sends them faster.
              </p>
              <p className="mt-2 text-white/50">
                Arrows or A/D to move · space to fire · drag and tap on touch
              </p>
            </>
          }
          action="Insert coin"
          onAction={start}
          art={<RailArt />}
        />
        <ScreenOverlay
          show={state === 'over'}
          accent="#ff5c5c"
          title="Rail collapsed"
          lines={
            <>
              <p>Brought down by {cause}.</p>
              <p className="mt-2 text-[15px] text-white">
                Score {hud.score} · Wave {hud.wave} · Best {best}
              </p>
              {hud.score >= best && hud.score > 0 && (
                <p className="mt-1 text-[#ffd166]">New personal best.</p>
              )}
            </>
          }
          action="Re-energise"
          onAction={start}
          art={<BrownoutArt />}
        />
      </div>

      <TouchPad
        accent={ACCENT}
        buttons={[
          {
            label: '◀',
            aria: 'Move left',
            onPress: () => {
              rt.current.left = true
            },
            onRelease: () => {
              rt.current.left = false
            },
          },
          { label: 'FIRE', aria: 'Fire', onPress: fire },
          {
            label: '▶',
            aria: 'Move right',
            onPress: () => {
              rt.current.right = true
            },
            onRelease: () => {
              rt.current.right = false
            },
          },
        ]}
      />
    </Cabinet>
  )
}

function RailArt() {
  return (
    <svg width="150" height="30" viewBox="0 0 150 30" aria-hidden="true">
      <line x1="0" y1="24" x2="150" y2="24" stroke="#ffd166" strokeWidth="3" />
      <polygon points="75,2 66,18 72,18 72,23 78,23 78,18 84,18" fill="#ffd166" />
    </svg>
  )
}

function BrownoutArt() {
  return (
    <svg width="150" height="30" viewBox="0 0 150 30" aria-hidden="true">
      <path d="M0 24 H60 l10 -16 l8 22 l8 -10 H150" fill="none" stroke="#ff5c5c" strokeWidth="2.4" />
    </svg>
  )
}
