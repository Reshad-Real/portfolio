import { useCallback, useEffect, useRef, useState } from 'react'
import { blip } from '../../lib/audio'
import { ArcadeHud, Cabinet, ScreenOverlay, TouchPad, useHighScore, type GameState } from './arcadeUi'

const ACCENT = '#ffd166'
const W = 660
const H = 380
const RAIL_Y = 338

type Kind = 'spike' | 'noise' | 'short' | 'boss'
type Foe = { x: number; y: number; vx: number; vy: number; kind: Kind; hp: number; max: number; t: number }
type Shot = { x: number; y: number; vx: number }
type Drop = { x: number; y: number; kind: 'spread' | 'rapid' | 'shield' }
type Bit = { x: number; y: number; vx: number; vy: number; life: number; c: string }

type Runtime = {
  px: number
  cool: number
  fireRate: number
  spread: number
  shield: number
  shots: Shot[]
  foes: Foe[]
  drops: Drop[]
  bits: Bit[]
  rail: number
  wave: number
  waveTimer: number
  spawn: number
  score: number
  chain: number
  mult: number
  shake: number
  left: boolean
  right: boolean
  firing: boolean
  cause: string
  bossUp: boolean
}

function fresh(): Runtime {
  return {
    px: W / 2,
    cool: 0,
    fireRate: 0.17,
    spread: 1,
    shield: 0,
    shots: [],
    foes: [],
    drops: [],
    bits: [],
    rail: 100,
    wave: 1,
    waveTimer: 15,
    spawn: 0.8,
    score: 0,
    chain: 0,
    mult: 1,
    shake: 0,
    left: false,
    right: false,
    firing: false,
    cause: '',
    bossUp: false,
  }
}

const HP: Record<Kind, number> = { spike: 1, noise: 2, short: 4, boss: 40 }
const POINTS: Record<Kind, number> = { spike: 15, noise: 25, short: 60, boss: 500 }
const DAMAGE: Record<Kind, number> = { spike: 10, noise: 8, short: 22, boss: 40 }
const LABEL: Record<Kind, string> = {
  spike: 'a voltage spike',
  noise: 'injected noise',
  short: 'a short to the rail',
  boss: 'a cascading fault',
}

export default function VoltageDefender({ sound }: { sound: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rt = useRef<Runtime>(fresh())
  const stateRef = useRef<GameState>('ready')
  const [state, setState] = useState<GameState>('ready')
  const [hud, setHud] = useState({ score: 0, rail: 100, wave: 1, mult: 1, boss: false })
  const [over, setOver] = useState({ cause: '', score: 0, wave: 1 })
  const { best, submit } = useHighScore('voltage-defender')
  const soundRef = useRef(sound)
  soundRef.current = sound

  const burst = useCallback((x: number, y: number, c: string, n: number, p = 1) => {
    const r = rt.current
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = (50 + Math.random() * 180) * p
      r.bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.3, c })
    }
  }, [])

  const start = useCallback(() => {
    rt.current = fresh()
    stateRef.current = 'playing'
    setState('playing')
    setHud({ score: 0, rail: 100, wave: 1, mult: 1, boss: false })
    if (soundRef.current) blip('level')
  }, [])

  const fire = useCallback(() => {
    const r = rt.current
    if (stateRef.current !== 'playing' || r.cool > 0) return
    const y = RAIL_Y - 38
    if (r.spread === 1) r.shots.push({ x: r.px, y, vx: 0 })
    else if (r.spread === 2) {
      r.shots.push({ x: r.px - 8, y, vx: -40 }, { x: r.px + 8, y, vx: 40 })
    } else {
      r.shots.push({ x: r.px, y, vx: 0 }, { x: r.px - 10, y, vx: -110 }, { x: r.px + 10, y, vx: 110 })
    }
    r.cool = r.fireRate
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
        if ((e.target as HTMLElement)?.tagName === 'BUTTON') return
        e.preventDefault()
        if (stateRef.current === 'playing') {
          r.firing = true
          fire()
        } else start()
      } else if (e.key === 'Enter' && stateRef.current !== 'playing') {
        if ((e.target as HTMLElement)?.tagName === 'BUTTON') return
        e.preventDefault()
        start()
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

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      const r = rt.current
      const playing = stateRef.current === 'playing'

      if (playing) {
        if (r.left) r.px -= 340 * dt
        if (r.right) r.px += 340 * dt
        r.px = Math.max(26, Math.min(W - 26, r.px))
        r.cool = Math.max(0, r.cool - dt)
        r.shake = Math.max(0, r.shake - dt * 3)
        r.shield = Math.max(0, r.shield - dt)
        if (r.firing) fire()

        r.waveTimer -= dt
        if (r.waveTimer <= 0 && !r.bossUp) {
          r.wave += 1
          r.waveTimer = 15
          if (r.wave % 5 === 0) {
            // Boss wave: one big fault, nothing else until it dies.
            r.bossUp = true
            r.foes.push({
              x: W / 2, y: -60, vx: 90, vy: 18, kind: 'boss',
              hp: HP.boss + r.wave * 6, max: HP.boss + r.wave * 6, t: 0,
            })
            if (soundRef.current) blip('bad')
          } else if (soundRef.current) blip('level')
        }

        if (!r.bossUp) {
          r.spawn -= dt
          if (r.spawn <= 0) {
            r.spawn = Math.max(0.22, 0.9 - r.wave * 0.06)
            const roll = Math.random()
            const kind: Kind = roll > 0.9 ? 'short' : roll > 0.52 ? 'noise' : 'spike'
            r.foes.push({
              x: 30 + Math.random() * (W - 60),
              y: -20,
              vx: kind === 'noise' ? (Math.random() > 0.5 ? 90 : -90) : 0,
              vy: (kind === 'short' ? 34 : kind === 'spike' ? 88 : 58) + r.wave * 4,
              kind,
              hp: HP[kind],
              max: HP[kind],
              t: Math.random() * 6,
            })
          }
        }

        for (const s of r.shots) {
          s.y -= 620 * dt
          s.x += s.vx * dt
        }
        r.shots = r.shots.filter((s) => s.y > -14)

        for (const f of r.foes) {
          f.t += dt
          f.y += f.vy * dt
          if (f.kind === 'noise' || f.kind === 'boss') {
            f.x += f.vx * dt
            const pad = f.kind === 'boss' ? 60 : 22
            if (f.x < pad || f.x > W - pad) f.vx *= -1
          }
          if (f.kind === 'boss' && f.y > 110) f.vy = 0
        }

        for (const s of r.shots) {
          for (const f of r.foes) {
            if (f.hp <= 0) continue
            const rad = f.kind === 'boss' ? 52 : f.kind === 'short' ? 22 : 15
            if (Math.abs(s.x - f.x) < rad && Math.abs(s.y - f.y) < rad) {
              f.hp -= 1
              s.y = -100
              burst(f.x, f.y, f.kind === 'short' ? '#ff7a7a' : ACCENT, f.hp <= 0 ? 16 : 4)
              if (f.hp <= 0) {
                r.chain += 1
                r.mult = Math.min(6, 1 + Math.floor(r.chain / 6))
                r.score += POINTS[f.kind] * r.mult
                if (f.kind === 'boss') {
                  r.bossUp = false
                  r.shake = 1.2
                  burst(f.x, f.y, '#ffffff', 60, 2.2)
                  r.drops.push({ x: f.x, y: f.y, kind: 'spread' })
                }
                if (Math.random() > 0.86) {
                  const kinds = ['spread', 'rapid', 'shield'] as const
                  r.drops.push({ x: f.x, y: f.y, kind: kinds[Math.floor(Math.random() * 3)] })
                }
                if (soundRef.current) blip('coin')
              }
              break
            }
          }
        }
        r.shots = r.shots.filter((s) => s.y > -14)
        r.foes = r.foes.filter((f) => f.hp > 0)

        for (const d of r.drops) d.y += 110 * dt
        r.drops = r.drops.filter((d) => {
          if (d.y > RAIL_Y + 10) return false
          if (Math.abs(d.x - r.px) < 30 && Math.abs(d.y - (RAIL_Y - 20)) < 26) {
            if (d.kind === 'spread') r.spread = Math.min(3, r.spread + 1)
            if (d.kind === 'rapid') r.fireRate = Math.max(0.07, r.fireRate - 0.035)
            if (d.kind === 'shield') r.shield = 8
            burst(d.x, d.y, '#9ad7ff', 16)
            if (soundRef.current) blip('ok')
            return false
          }
          return true
        })

        for (const f of r.foes) {
          if (f.y < RAIL_Y - 10) continue
          if (r.shield > 0) {
            r.shield = 0
            burst(f.x, RAIL_Y, '#9ad7ff', 24, 1.4)
          } else {
            r.rail -= DAMAGE[f.kind]
            r.cause = LABEL[f.kind]
            r.chain = 0
            r.mult = 1
            r.shake = 1
            burst(f.x, RAIL_Y, '#ff5c5c', 22, 1.3)
            if (soundRef.current) blip('bad')
          }
          f.hp = 0
          if (f.kind === 'boss') r.bossUp = false
        }
        r.foes = r.foes.filter((f) => f.hp > 0)

        if (r.rail <= 0) {
          r.rail = 0
          stateRef.current = 'over'
          setState('over')
          setOver({ cause: r.cause || 'rail collapse', score: r.score, wave: r.wave })
          submit(r.score)
        }

        for (const b of r.bits) {
          b.life -= dt
          b.x += b.vx * dt
          b.y += b.vy * dt
          b.vy += 250 * dt
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
      const kx = r.shake > 0 ? (Math.random() - 0.5) * 12 * r.shake : 0
      const ky = r.shake > 0 ? (Math.random() - 0.5) * 9 * r.shake : 0
      ctx.setTransform(scale, 0, 0, scale, (cw - W * scale) / 2 + kx, (ch - H * scale) / 2 + ky)

      ctx.fillStyle = 'rgba(255,209,102,0.16)'
      for (let i = 0; i < 34; i++) {
        const x = (i * 173 + now * 0.014 * ((i % 4) + 1)) % W
        const y = (i * 97) % (RAIL_Y - 20)
        ctx.fillRect(x, y, 2, 2)
      }

      const pct = Math.max(0, r.rail) / 100
      ctx.strokeStyle = `rgb(${Math.round(255 - pct * 90)},${Math.round(90 + pct * 130)},100)`
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(0, RAIL_Y)
      ctx.lineTo(W, RAIL_Y)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,209,102,0.08)'
      ctx.fillRect(0, RAIL_Y + 3, W, H - RAIL_Y)
      ctx.fillStyle = 'rgba(80,230,180,0.6)'
      ctx.fillRect(0, RAIL_Y + 5, W * pct, 5)

      for (const f of r.foes) {
        if (f.kind === 'boss') {
          ctx.strokeStyle = '#ff7a7a'
          ctx.lineWidth = 4
          ctx.save()
          ctx.translate(f.x, f.y)
          ctx.rotate(Math.sin(f.t) * 0.08)
          ctx.strokeRect(-48, -34, 96, 68)
          ctx.strokeRect(-30, -18, 60, 36)
          ctx.beginPath()
          ctx.moveTo(-48, -34)
          ctx.lineTo(48, 34)
          ctx.moveTo(48, -34)
          ctx.lineTo(-48, 34)
          ctx.stroke()
          ctx.restore()
          ctx.fillStyle = '#2a1220'
          ctx.fillRect(f.x - 50, f.y - 50, 100, 7)
          ctx.fillStyle = '#ff5c5c'
          ctx.fillRect(f.x - 50, f.y - 50, 100 * (f.hp / f.max), 7)
        } else if (f.kind === 'spike') {
          ctx.strokeStyle = '#8ab6ff'
          ctx.lineWidth = 2.6
          ctx.beginPath()
          ctx.moveTo(f.x - 12, f.y + 10)
          ctx.lineTo(f.x - 3, f.y - 12)
          ctx.lineTo(f.x + 3, f.y + 4)
          ctx.lineTo(f.x + 12, f.y - 10)
          ctx.stroke()
        } else if (f.kind === 'noise') {
          ctx.strokeStyle = '#c78cff'
          ctx.lineWidth = 2.4
          ctx.beginPath()
          for (let i = -14; i <= 14; i += 3) {
            const y = f.y + Math.sin(i * 0.8 + f.t * 9) * 7
            if (i === -14) ctx.moveTo(f.x + i, y)
            else ctx.lineTo(f.x + i, y)
          }
          ctx.stroke()
        } else {
          ctx.strokeStyle = '#ff7a7a'
          ctx.lineWidth = 2.8
          ctx.strokeRect(f.x - 17, f.y - 15, 34, 30)
          ctx.beginPath()
          ctx.moveTo(f.x - 17, f.y - 15)
          ctx.lineTo(f.x + 17, f.y + 15)
          ctx.moveTo(f.x + 17, f.y - 15)
          ctx.lineTo(f.x - 17, f.y + 15)
          ctx.stroke()
          ctx.fillStyle = '#ff7a7a'
          for (let i = 0; i < f.hp; i++) ctx.fillRect(f.x - 12 + i * 7, f.y - 24, 5, 3)
        }
      }

      for (const d of r.drops) {
        const c = d.kind === 'spread' ? '#9ad7ff' : d.kind === 'rapid' ? '#ffd166' : '#68e8b0'
        ctx.strokeStyle = c
        ctx.lineWidth = 2.4
        ctx.beginPath()
        ctx.arc(d.x, d.y, 11, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = c
        ctx.font = 'bold 12px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(d.kind === 'spread' ? 'W' : d.kind === 'rapid' ? 'R' : 'S', d.x, d.y + 4)
      }

      ctx.fillStyle = ACCENT
      for (const s of r.shots) ctx.fillRect(s.x - 2, s.y - 11, 4, 13)

      for (const b of r.bits) {
        ctx.globalAlpha = Math.max(0, b.life * 2.4)
        ctx.fillStyle = b.c
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4)
      }
      ctx.globalAlpha = 1

      ctx.fillStyle = ACCENT
      ctx.beginPath()
      ctx.moveTo(r.px, RAIL_Y - 40)
      ctx.lineTo(r.px - 19, RAIL_Y - 13)
      ctx.lineTo(r.px - 9, RAIL_Y - 13)
      ctx.lineTo(r.px - 9, RAIL_Y - 4)
      ctx.lineTo(r.px + 9, RAIL_Y - 4)
      ctx.lineTo(r.px + 9, RAIL_Y - 13)
      ctx.lineTo(r.px + 19, RAIL_Y - 13)
      ctx.closePath()
      ctx.fill()
      if (r.shield > 0) {
        ctx.strokeStyle = `rgba(104,232,176,${0.4 + 0.3 * Math.sin(now / 100)})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(r.px, RAIL_Y - 20, 34, Math.PI, 0)
        ctx.stroke()
      }

      if (r.mult > 1) {
        ctx.fillStyle = '#ffd166'
        ctx.font = 'bold 24px ui-monospace, monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`x${r.mult}`, W - 16, 36)
      }

      if (playing && now - report > 110) {
        report = now
        setHud({
          score: r.score,
          rail: Math.max(0, Math.round(r.rail)),
          wave: r.wave,
          mult: r.mult,
          boss: r.bossUp,
        })
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [burst, fire, submit])

  return (
    <Cabinet accent={ACCENT}>
      <ArcadeHud
        accent={ACCENT}
        left={`${String(hud.score).padStart(6, '0')} · wave ${hud.wave}${hud.mult > 1 ? ` ·x${hud.mult}` : ''}`}
        right={`${hud.boss ? 'BOSS · ' : ''}rail ${hud.rail}% · best ${best}`}
      />
      <div
        tabIndex={0}
        role="application"
        aria-label="Voltage Defender. Left and right arrows move, space fires. Enter starts."
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]"
        onPointerMove={(e) => {
          if (stateRef.current !== 'playing' || e.pointerType === 'mouse') return
          const rect = e.currentTarget.getBoundingClientRect()
          rt.current.px = Math.max(26, Math.min(W - 26, ((e.clientX - rect.left) / rect.width) * W))
        }}
        onPointerDown={(e) => {
          if (stateRef.current !== 'playing') return
          const rect = e.currentTarget.getBoundingClientRect()
          rt.current.px = Math.max(26, Math.min(W - 26, ((e.clientX - rect.left) / rect.width) * W))
          fire()
        }}
      >
        <canvas ref={canvasRef} className="block h-[260px] w-full sm:h-[330px]" />

        <ScreenOverlay
          show={state === 'ready'}
          accent={ACCENT}
          title="Voltage Defender"
          lines={
            <>
              <p>You are the regulator. Keep the rail alive.</p>
              <p className="mt-2">
                Kills chain into a multiplier up to <b>x6</b>. Drops give a wider shot (W), a faster
                one (R) or a shield (S). Every fifth wave sends a boss.
              </p>
              <p className="mt-2 text-white/50">Arrows or A/D · space to fire · drag and tap on touch</p>
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
              <p>Brought down by {over.cause}.</p>
              <p className="mt-2 text-[15px] text-white">
                {over.score} points · wave {over.wave}
              </p>
              <p className="mt-1 text-white/60">Personal best {best}</p>
              {over.score >= best && over.score > 0 && (
                <p className="mt-1 text-[#ffd166]">New personal best.</p>
              )}
            </>
          }
          action="Re-energise"
          onAction={start}
          art={<BrownArt />}
        />
      </div>

      <TouchPad
        accent={ACCENT}
        buttons={[
          {
            label: '◀', aria: 'Move left',
            onPress: () => { rt.current.left = true },
            onRelease: () => { rt.current.left = false },
          },
          { label: 'FIRE', aria: 'Fire', onPress: fire },
          {
            label: '▶', aria: 'Move right',
            onPress: () => { rt.current.right = true },
            onRelease: () => { rt.current.right = false },
          },
        ]}
      />
    </Cabinet>
  )
}

function RailArt() {
  return (
    <svg width="150" height="32" viewBox="0 0 150 32" aria-hidden="true">
      <line x1="0" y1="26" x2="150" y2="26" stroke="#ffd166" strokeWidth="3" />
      <polygon points="75,2 65,19 71,19 71,25 79,25 79,19 85,19" fill="#ffd166" />
      <circle cx="30" cy="10" r="4" fill="#8ab6ff" />
      <circle cx="120" cy="8" r="4" fill="#c78cff" />
    </svg>
  )
}

function BrownArt() {
  return (
    <svg width="150" height="32" viewBox="0 0 150 32" aria-hidden="true">
      <path d="M0 26h58l10-18 8 24 8-11h66" fill="none" stroke="#ff5c5c" strokeWidth="2.4" />
    </svg>
  )
}
