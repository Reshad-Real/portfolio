import { useEffect, useRef, useState } from 'react'
import { createGL, m4, resizeCanvas } from '../lib/gl'
import { createClay } from '../lib/clay'
import { ALL_MODELS } from '../lib/models'
import { P } from '../lib/palette'

/**
 * Development-only: renders every model on its own, in one context, so each
 * one can be checked for holes, inside-out faces and bad pivots before it goes
 * anywhere near the page. Reachable at `?inspect` while running `npm run dev`.
 */
export function ModelInspector() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [angle, setAngle] = useState(0.6)
  const [elev, setElev] = useState(0.18)
  const angleRef = useRef(angle)
  const elevRef = useRef(elev)
  angleRef.current = angle
  elevRef.current = elev

  const cols = 4
  const rows = Math.ceil(ALL_MODELS.length / cols)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = createGL(canvas, true)
    if (!ctx) return
    const gl = ctx.gl as WebGLRenderingContext
    const clay = createClay(gl, 2, [0.34, 0.36, 0.52])
    if (!clay) return

    const proj = m4.create()
    const view = m4.create()
    const world = m4.create()
    let raf = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      resizeCanvas(canvas, gl, 2)
      const t = now / 1000
      const W = canvas.width
      const H = canvas.height
      const cw = W / cols
      const ch = H / rows

      gl.disable(gl.SCISSOR_TEST)
      gl.clearColor(P.room[0] * 0.9, P.room[1] * 0.9, P.room[2] * 0.9, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.enable(gl.SCISSOR_TEST)

      ALL_MODELS.forEach((model, i) => {
        const cx = (i % cols) * cw
        // GL's origin is bottom-left, the grid reads top-left.
        const cy = H - (Math.floor(i / cols) + 1) * ch
        gl.viewport(cx, cy, cw, ch)
        gl.scissor(cx, cy, cw, ch)
        gl.clearColor(P.room[0], P.room[1], P.room[2], 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        const r = model.radius
        const [ox, oy, oz] = model.center
        const dist = r * 3.1
        const a = angleRef.current
        const e = elevRef.current
        const eye: [number, number, number] = [
          ox + Math.sin(a) * Math.cos(e) * dist,
          oy + Math.sin(e) * dist,
          oz + Math.cos(a) * Math.cos(e) * dist,
        ]
        m4.perspective(proj, (34 * Math.PI) / 180, cw / ch, 0.1, 100)
        m4.lookAt(view, eye, [ox, oy, oz], [0, 1, 0])
        clay.begin(proj, view, eye)

        gl.depthMask(false)
        if (model.shadow) {
          const [sx, sz, sr, ss] = model.shadow
          clay.shadow(sx, sz, sr, ss)
        }
        gl.depthMask(true)

        m4.compose(world, 0, 0, 0, 0, 0, 0, 1, 1, 1)
        model.draw(clay, world, t)
      })

      gl.disable(gl.SCISSOR_TEST)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      clay.dispose()
    }
  }, [cols, rows])

  return (
    <div style={{ padding: 16, background: '#111', minHeight: '100vh', color: '#fff' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontFamily: 'monospace' }}>model inspector</strong>
        {(
          [
            ['front', 0, 0.12],
            ['3/4', 0.6, 0.18],
            ['side', 1.57, 0.12],
            ['back', 3.14, 0.18],
            ['top', 0.6, 0.9],
            ['below', 0.6, -0.35],
          ] as const
        ).map(([label, a, e]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setAngle(a)
              setElev(e)
            }}
            style={{
              background: Math.abs(angle - a) < 0.01 && Math.abs(elev - e) < 0.01 ? '#fff' : 'transparent',
              color: Math.abs(angle - a) < 0.01 && Math.abs(elev - e) < 0.01 ? '#111' : '#fff',
              border: '1px solid #666',
              padding: '4px 10px',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${rows * 260}px`, display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            pointerEvents: 'none',
          }}
        >
          {ALL_MODELS.map((m) => (
            <div
              key={m.name}
              style={{
                border: '1px solid rgba(255,255,255,0.22)',
                fontFamily: 'monospace',
                fontSize: 12,
                padding: 6,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {m.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
