/**
 * BYTE again, this time on his own tiny canvas so he can follow the reader
 * down the page after the landing room has scrolled away.
 */

import { clamp, createGL, m4, resizeCanvas } from './gl'
import { createClay, type Clay } from './clay'
import { drawDog, type DogState } from './models'

export type Companion = {
  render(nowMs: number): void
  setLook(x: number, y: number): void
  setFacing(dir: 1 | -1): void
  setPet(v: number): void
  setAlert(v: number): void
  resize(): void
  dispose(): void
}

export function createCompanion(
  canvas: HTMLCanvasElement,
  detail: number,
  reducedMotion: boolean,
): Companion | null {
  const ctx = createGL(canvas, detail > 1)
  if (!ctx) return null
  const gl = ctx.gl as WebGLRenderingContext
  const maybeClay = createClay(gl, detail, [0.4, 0.42, 0.56])
  if (!maybeClay) return null
  const clay: Clay = maybeClay

  const proj = m4.create()
  const view = m4.create()
  const world = m4.create()
  const maxDpr = detail > 1 ? 2 : 1.4

  const s: DogState = { lookX: 0, lookY: 0, pet: 0, alert: 0, blink: 0 }
  let facing: 1 | -1 = -1
  let sFacing = -1
  let sLookX = 0
  let sLookY = 0
  let sPet = 0
  let sAlert = 0
  let blinkAt = 2.5
  let last = 0
  let lost = false

  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
  }
  canvas.addEventListener('webglcontextlost', onLost)

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  function render(now: number) {
    if (lost) return
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
    last = now
    const t = now / 1000

    const k = reducedMotion ? 1 : 0.12
    sLookX += (s.lookX - sLookX) * k
    sLookY += (s.lookY - sLookY) * k
    sPet += (s.pet - sPet) * 0.16
    sAlert += (s.alert - sAlert) * 0.1
    sFacing += (facing - sFacing) * 0.12

    if (!reducedMotion) {
      blinkAt -= dt
      if (blinkAt <= 0) {
        s.blink = 1
        blinkAt = 2.4 + Math.random() * 3.6
      }
      s.blink = Math.max(0, s.blink - dt * 7)
    }

    resizeCanvas(canvas, gl, maxDpr)
    const aspect = canvas.width / Math.max(1, canvas.height)
    m4.perspective(proj, (30 * Math.PI) / 180, aspect, 0.1, 40)
    m4.lookAt(view, [0, 1.15, 6.2], [0, 0.95, 0], [0, 1, 0])

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    clay.begin(proj, view, [0, 1.15, 6.2])

    gl.depthMask(false)
    clay.shadow(0, 0, 0.78, 0.26)
    gl.depthMask(true)

    // A gentle turn toward whichever way he last moved.
    m4.compose(world, 0, 0, 0, 0, sFacing * 0.34, 0, 1, 1, 1)
    drawDog(clay, world, t, {
      lookX: clamp(sLookX, -1, 1),
      lookY: clamp(sLookY, -1, 1),
      pet: sPet,
      alert: sAlert,
      blink: s.blink,
    })
  }

  return {
    render,
    setLook(x, y) {
      s.lookX = clamp(x, -1, 1)
      s.lookY = clamp(y, -1, 1)
    },
    setFacing(dir) {
      facing = dir
    },
    setPet(v) {
      s.pet = clamp(v, 0, 1)
    },
    setAlert(v) {
      s.alert = clamp(v, 0, 1)
    },
    resize() {
      resizeCanvas(canvas, gl, maxDpr)
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost)
      clay.dispose()
    },
  }
}
