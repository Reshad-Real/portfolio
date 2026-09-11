/**
 * The startup chamber: a semiconductor inspection volume that assembles a
 * tri-gate device out of the dark, then settles into a live idle state that
 * the hero sits on top of.
 *
 * One WebGL context, roughly fifteen draw calls, no textures and no assets.
 */

import {
  clamp,
  createGL,
  createMesh,
  createProgram,
  drawMesh,
  lerp,
  m4,
  mulberry32,
  resizeCanvas,
  smoothstep,
  type Mesh,
  type Program,
} from './gl'
import { box, boxEdges, gridLines } from './geometry'
import { DEVICE_PARTS, type PartSpec } from './parts'

const SOLID_VS = `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 uProj, uView, uModel;
uniform mat3 uNormal;
varying vec3 vN, vW;
void main() {
  vec4 w = uModel * vec4(position, 1.0);
  vW = w.xyz;
  vN = uNormal * normal;
  gl_Position = uProj * uView * w;
}`

const SOLID_FS = `
precision mediump float;
varying vec3 vN, vW;
uniform vec3 uColor, uEmissive, uEye, uRimColor;
uniform float uAlpha, uRim;
void main() {
  vec3 N = normalize(vN);
  vec3 L1 = normalize(vec3(0.45, 0.92, 0.55));
  vec3 L2 = normalize(vec3(-0.7, 0.35, -0.45));
  float d = max(dot(N, L1), 0.0) * 0.9 + max(dot(N, L2), 0.0) * 0.3;
  vec3 V = normalize(uEye - vW);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6) * uRim;
  vec3 col = uColor * (0.14 + d) + uEmissive + rim * uRimColor;
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`

const LINE_VS = `
attribute vec3 position;
attribute float aT;
uniform mat4 uProj, uView, uModel;
uniform float uTime, uReveal, uPulseWidth, uFade;
varying float vGlow;
varying float vDist;
void main() {
  vec4 w = uModel * vec4(position, 1.0);
  vDist = length(w.xz);
  float head = fract(uTime * 0.22);
  float d = abs(fract(aT - head + 0.5) - 0.5);
  float pulse = smoothstep(uPulseWidth, 0.0, d);
  float shown = step(aT, uReveal);
  vGlow = (0.28 + pulse * 1.5) * shown * uFade;
  gl_Position = uProj * uView * w;
}`

const LINE_FS = `
precision mediump float;
varying float vGlow;
varying float vDist;
uniform vec3 uColor;
uniform float uFalloff;
void main() {
  float a = vGlow * exp(-vDist * uFalloff);
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * a, a);
}`

const POINT_VS = `
attribute vec3 position;
attribute vec3 aSeed; // x: phase, y: size, z: group
uniform mat4 uProj, uView;
uniform float uTime, uReveal, uScale, uDrift;
varying float vA;
varying float vHot;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.6 + aSeed.x * 6.283) * uDrift * aSeed.y;
  p.x += cos(uTime * 0.42 + aSeed.x * 4.1) * uDrift * 0.6;
  vec4 mv = uView * vec4(p, 1.0);
  float appear = smoothstep(aSeed.x - 0.85, aSeed.x, uReveal);
  float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed.x * 12.0);
  vA = appear * twinkle;
  vHot = aSeed.z;
  gl_PointSize = max(1.0, (aSeed.y * uScale) / max(0.4, -mv.z));
  gl_Position = uProj * mv;
}`

const POINT_FS = `
precision mediump float;
varying float vA;
varying float vHot;
uniform vec3 uColor;
uniform vec3 uHotColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  float a = (1.0 - r * 4.0);
  a *= a * vA;
  vec3 c = mix(uColor, uHotColor, vHot);
  gl_FragColor = vec4(c * a, a);
}`

type Part = PartSpec & { mesh: Mesh }

export type ChamberOptions = {
  /** Fewer points and a lower pixel cap on constrained devices. */
  quality: 'high' | 'medium' | 'low'
  reducedMotion: boolean
}

export type Chamber = {
  /**
   * Ramps the camera to its settled pose. `instant` snaps straight there, for
   * a visitor who has already seen the startup in this session.
   */
  setEntered(v: boolean, instant?: boolean): void
  setPointer(nx: number, ny: number, down: boolean): void
  setScroll(v: number): void
  /** 0..1 boot progress, driven by the component so the UI can mirror it. */
  progress(): number
  /** Skip straight to the settled scene. */
  finishBoot(): void
  render(nowMs: number): void
  resize(): void
  dispose(): void
  labels(): { text: string; x: number; y: number; on: boolean }[]
}

const BOOT_MS = 3400

export function createChamber(canvas: HTMLCanvasElement, opts: ChamberOptions): Chamber | null {
  const ctx = createGL(canvas, opts.quality === 'high')
  if (!ctx) return null
  const gl = ctx.gl as WebGLRenderingContext

  const solidOrNull = createProgram(gl, SOLID_VS, SOLID_FS)
  const lineOrNull = createProgram(gl, LINE_VS, LINE_FS)
  const pointOrNull = createProgram(gl, POINT_VS, POINT_FS)
  if (!solidOrNull || !lineOrNull || !pointOrNull) return null
  // Re-bind as non-nullable so the render loop below does not need guards.
  const solid: Program = solidOrNull
  const line: Program = lineOrNull
  const point: Program = pointOrNull

  const maxDpr = opts.quality === 'high' ? 2 : opts.quality === 'medium' ? 1.5 : 1
  const rnd = mulberry32(20260911)

  // ---------------------------------------------------------------- geometry
  const unit = box(1, 1, 1)
  const cube = createMesh(
    gl,
    gl.TRIANGLES,
    [
      { name: 'position', size: 3, data: unit.positions },
      { name: 'normal', size: 3, data: unit.normals },
    ],
    unit.indices,
  )

  const parts: Part[] = DEVICE_PARTS.map((p) => ({ ...p, mesh: cube }))

  // Wireframe inspection volume
  const cage = createMesh(gl, gl.LINES, [
    { name: 'position', size: 3, data: boxEdges(6.4, 3.0, 3.8) },
    { name: 'aT', size: 1, data: buildT(boxEdges(6.4, 3.0, 3.8).length / 3) },
  ])

  // Floor grid
  const gridData = gridLines(60, 40)
  const grid = createMesh(gl, gl.LINES, [
    { name: 'position', size: 3, data: gridData },
    { name: 'aT', size: 1, data: buildT(gridData.length / 3) },
  ])

  // PCB-style traces leaving the device
  const traceData = buildTraces(rnd)
  const traces = createMesh(gl, gl.LINES, [
    { name: 'position', size: 3, data: traceData.pos },
    { name: 'aT', size: 1, data: traceData.t },
  ])

  // Crystal lattice cloud
  const latticeCount = opts.quality === 'high' ? 1400 : opts.quality === 'medium' ? 700 : 320
  const lattice = buildLattice(latticeCount, rnd)
  const latticeMesh = createMesh(gl, gl.POINTS, [
    { name: 'position', size: 3, data: lattice.pos },
    { name: 'aSeed', size: 3, data: lattice.seed },
  ])

  // Carriers travelling through the channel
  const carrierCount = opts.quality === 'high' ? 220 : opts.quality === 'medium' ? 130 : 60
  const carriers = buildCarriers(carrierCount, rnd)
  const carrierPos = carriers.pos
  const carrierMesh = createMesh(
    gl,
    gl.POINTS,
    [
      { name: 'position', size: 3, data: carrierPos },
      { name: 'aSeed', size: 3, data: carriers.seed },
    ],
    undefined,
    true,
  )

  // ------------------------------------------------------------------ state
  const proj = m4.create()
  const view = m4.create()
  const model = m4.create()
  const identity = m4.create()
  const nrm = new Float32Array(9)

  let entered = false
  let enterT = 0
  let bootMs = 0
  let scroll = 0
  let px = 0
  let py = 0
  let pressed = 0
  let sx = 0
  let sy = 0
  let lastNow = 0
  let lost = false
  const labelOut: { text: string; x: number; y: number; on: boolean }[] = parts.map((p) => ({
    text: p.label,
    x: 0,
    y: 0,
    on: false,
  }))

  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
  }
  canvas.addEventListener('webglcontextlost', onLost)

  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  function setU3(p: Program, name: string, v: readonly [number, number, number]) {
    gl.uniform3f(p.uniform(name), v[0], v[1], v[2])
  }

  function render(nowMs: number) {
    if (lost) return
    const dt = lastNow ? Math.min(64, nowMs - lastNow) : 16
    lastNow = nowMs
    const t = nowMs / 1000

    if (!entered) bootMs = Math.min(BOOT_MS, bootMs + dt)
    enterT = clamp(enterT + (entered ? dt / 1100 : 0), 0, 1)

    const boot = opts.reducedMotion ? 1 : bootMs / BOOT_MS
    const eased = smoothstep(0, 1, boot)
    const settle = smoothstep(0, 1, enterT)

    sx += (px - sx) * 0.055
    sy += (py - sy) * 0.055

    resizeCanvas(canvas, gl, maxDpr)
    const aspect = canvas.width / Math.max(1, canvas.height)

    // Camera: pushes in through the boot, then draws back and lifts as the
    // visitor enters, so the hero copy has clear space on the left.
    const idle = opts.reducedMotion ? 0 : Math.sin(t * 0.24) * 0.12
    // A narrow frame needs more distance for the device to read whole.
    const frameFit = aspect < 1 ? 1.5 : aspect < 1.4 ? 1.22 : 1
    const dist = (lerp(11.5, 7.4, eased) + settle * 4.6) * frameFit + scroll * 5.5
    const height = lerp(0.2, 1.9, eased) + settle * 1.5 + scroll * 1.6
    const yaw = (-sx * 0.42 + idle) * (0.35 + 0.65 * eased) + settle * 0.34
    const pitch = clamp(-sy * 0.2 + 0.06, -0.35, 0.5)

    // Once the visitor is in, the camera pans left so the device clears the
    // hero copy. On a portrait screen it lifts instead, because the copy sits
    // along the bottom there rather than down the left.
    // Panning the camera one way pushes the subject the other, so a negative
    // panY lifts the device clear of the copy that sits along the bottom.
    const portrait = aspect < 1
    const panX = portrait ? 0 : -settle * 3.2
    const panY = portrait ? -settle * 1.7 : 0

    const eyeX = Math.sin(yaw) * dist + panX
    const eyeZ = Math.cos(yaw) * dist
    const eyeY = height + pitch * 2.4 + panY
    m4.perspective(proj, (42 * Math.PI) / 180, aspect, 0.1, 140)
    m4.lookAt(view, [eyeX, eyeY, eyeZ], [panX, 0.12 + panY, 0], [0, 1, 0])

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // ---------------------------------------------------------- lines: grid
    gl.depthMask(false)
    line.use()
    gl.uniformMatrix4fv(line.uniform('uProj'), false, proj)
    gl.uniformMatrix4fv(line.uniform('uView'), false, view)

    m4.compose(model, 0, -1.05, 0, 0, 0, 0, 1, 1, 1)
    gl.uniformMatrix4fv(line.uniform('uModel'), false, model)
    gl.uniform1f(line.uniform('uTime'), t * 0.4)
    gl.uniform1f(line.uniform('uReveal'), 1)
    gl.uniform1f(line.uniform('uPulseWidth'), 0.06)
    gl.uniform1f(line.uniform('uFade'), smoothstep(0.02, 0.3, boot) * (1 - scroll * 0.7))
    gl.uniform1f(line.uniform('uFalloff'), 0.075)
    setU3(line, 'uColor', [0.32, 0.62, 0.82])
    drawMesh(gl, line, grid)

    // ------------------------------------------------------- lines: traces
    gl.uniformMatrix4fv(line.uniform('uModel'), false, identity)
    gl.uniform1f(line.uniform('uTime'), t)
    gl.uniform1f(line.uniform('uReveal'), smoothstep(0.5, 0.92, boot))
    gl.uniform1f(line.uniform('uPulseWidth'), 0.1)
    gl.uniform1f(line.uniform('uFade'), 0.9 * (1 - scroll * 0.6))
    gl.uniform1f(line.uniform('uFalloff'), 0.04)
    setU3(line, 'uColor', [0.25, 0.95, 0.78])
    drawMesh(gl, line, traces)

    // ------------------------------------------------------- lines: cage
    m4.compose(model, 0, 0.15, 0, 0, 0, 0, 1, 1, 1)
    gl.uniformMatrix4fv(line.uniform('uModel'), false, model)
    gl.uniform1f(line.uniform('uReveal'), smoothstep(0.08, 0.4, boot))
    gl.uniform1f(line.uniform('uPulseWidth'), 0.14)
    gl.uniform1f(line.uniform('uFade'), (0.55 + pressed * 0.5) * (1 - settle * 0.45))
    gl.uniform1f(line.uniform('uFalloff'), 0.0)
    setU3(line, 'uColor', [0.55, 0.68, 0.95])
    drawMesh(gl, line, cage)

    // ------------------------------------------------------ points: lattice
    point.use()
    gl.uniformMatrix4fv(point.uniform('uProj'), false, proj)
    gl.uniformMatrix4fv(point.uniform('uView'), false, view)
    gl.uniform1f(point.uniform('uTime'), t)
    gl.uniform1f(point.uniform('uReveal'), smoothstep(0, 0.55, boot))
    gl.uniform1f(point.uniform('uScale'), canvas.height * 0.0016)
    gl.uniform1f(point.uniform('uDrift'), opts.reducedMotion ? 0 : 0.16)
    setU3(point, 'uColor', [0.48, 0.7, 1.0])
    setU3(point, 'uHotColor', [0.3, 1.0, 0.82])
    drawMesh(gl, point, latticeMesh)

    // ----------------------------------------------------- points: carriers
    if (boot > 0.6) {
      const speed = opts.reducedMotion ? 0 : (0.9 + pressed * 2.4) * (dt / 16)
      for (let i = 0; i < carrierCount; i++) {
        const k = i * 3
        carrierPos[k] += 0.022 * speed * (1 + carriers.seed[k + 1])
        if (carrierPos[k] > 2.1) carrierPos[k] = -2.1
      }
      carrierMesh.update('position', carrierPos)
      gl.uniform1f(point.uniform('uReveal'), 1)
      gl.uniform1f(point.uniform('uDrift'), 0)
      gl.uniform1f(point.uniform('uScale'), canvas.height * 0.0022)
      setU3(point, 'uColor', [0.4, 1.0, 0.85])
      setU3(point, 'uHotColor', [1.0, 0.85, 0.35])
      drawMesh(gl, point, carrierMesh)
    }

    // --------------------------------------------------------- solid device
    gl.depthMask(true)
    solid.use()
    gl.uniformMatrix4fv(solid.uniform('uProj'), false, proj)
    gl.uniformMatrix4fv(solid.uniform('uView'), false, view)
    gl.uniform3f(solid.uniform('uEye'), eyeX, eyeY, eyeZ)

    const spin = settle * 0.0 + (opts.reducedMotion ? 0 : Math.sin(t * 0.18) * 0.05)
    const scanY = ((boot * 2.2) % 1) * 3 - 1.2

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      const local = clamp((boot - p.at) / 0.34, 0, 1)
      const a = smoothstep(0, 1, local)
      if (a <= 0.001) {
        labelOut[i].on = false
        continue
      }
      const x = lerp(p.ox, p.tx, a)
      const y = lerp(p.oy, p.ty, a)
      const z = lerp(p.oz, p.tz, a)
      const s = lerp(0.4, 1, a)

      m4.compose(model, x, y + 0.15, z, 0, spin, 0, p.sx * s, p.sy * s, p.sz * s)
      m4.normalFromModel(nrm, model)
      gl.uniformMatrix4fv(solid.uniform('uModel'), false, model)
      gl.uniformMatrix3fv(solid.uniform('uNormal'), false, nrm)
      setU3(solid, 'uColor', p.color)

      // the scan plane brightens whichever slab it is passing through
      const scanHit = Math.exp(-Math.abs(y - scanY) * 6) * (1 - settle) * 0.8
      const gateGlow = i === 4 ? 0.1 + pressed * 0.35 + Math.sin(t * 2.2) * 0.03 : 0
      gl.uniform3f(
        solid.uniform('uEmissive'),
        p.emissive[0] + scanHit * 0.35 + gateGlow,
        p.emissive[1] + scanHit * 0.6 + gateGlow * 0.8,
        p.emissive[2] + scanHit * 0.7 + gateGlow * 0.2,
      )
      setU3(solid, 'uRimColor', [0.35, 0.85, 0.98])
      gl.uniform1f(solid.uniform('uRim'), p.rim)
      gl.uniform1f(solid.uniform('uAlpha'), a)
      drawMesh(gl, solid, p.mesh)

      // Project the part into screen space for the floating HTML labels.
      const cx = x
      const cy = y + 0.15 + p.sy * 0.5
      const cz = z
      const vx = view[0] * cx + view[4] * cy + view[8] * cz + view[12]
      const vy = view[1] * cx + view[5] * cy + view[9] * cz + view[13]
      const vz = view[2] * cx + view[6] * cy + view[10] * cz + view[14]
      const cw = -vz
      if (cw > 0.2 && p.label) {
        const ndcX = (proj[0] * vx) / cw
        const ndcY = (proj[5] * vy) / cw
        labelOut[i].x = (ndcX * 0.5 + 0.5) * 100
        labelOut[i].y = (0.5 - ndcY * 0.5) * 100 + p.labelDy
        labelOut[i].on = a > 0.85
      } else {
        labelOut[i].on = false
      }
    }
  }

  return {
    setEntered(v, instant = false) {
      entered = v
      if (v) bootMs = BOOT_MS
      if (v && instant) enterT = 1
    },
    setPointer(nx, ny, down) {
      px = nx
      py = ny
      pressed += ((down ? 1 : 0) - pressed) * 0.2
    },
    setScroll(v) {
      scroll = clamp(v, 0, 1)
    },
    progress() {
      return opts.reducedMotion ? 1 : bootMs / BOOT_MS
    },
    finishBoot() {
      bootMs = BOOT_MS
    },
    labels() {
      return labelOut
    },
    render,
    resize() {
      resizeCanvas(canvas, gl, maxDpr)
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost)
      cube.dispose()
      cage.dispose()
      grid.dispose()
      traces.dispose()
      latticeMesh.dispose()
      carrierMesh.dispose()
      solid.dispose()
      line.dispose()
      point.dispose()
      // The context itself is deliberately left alone: forcing it lost would
      // poison the canvas for any later remount of this component.
    },
  }
}

/** Per-vertex parameter along each line segment, used for the travelling pulse. */
function buildT(vertexCount: number): Float32Array {
  const out = new Float32Array(vertexCount)
  for (let i = 0; i < vertexCount; i += 2) {
    const base = (i / vertexCount) * 0.9
    out[i] = base
    out[i + 1] = base + 0.06
  }
  return out
}

function buildTraces(rnd: () => number) {
  const pos: number[] = []
  const t: number[] = []
  const y = -1.0

  // Traces leave the source and drain contacts and step away in right angles,
  // the way copper actually routes on a board.
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k < 7; k++) {
      let x = side * 2.0
      let z = -1.4 + k * 0.46
      let param = 0
      const segments = 3 + Math.floor(rnd() * 3)
      for (let s = 0; s < segments; s++) {
        const horizontal = s % 2 === 0
        const len = 1.2 + rnd() * 3.4
        const nx = horizontal ? x + side * len : x
        const nz = horizontal ? z : z + (rnd() > 0.5 ? len : -len)
        pos.push(x, y, z, nx, y, nz)
        t.push(param, param + 0.12)
        param += 0.12
        x = nx
        z = nz
      }
      // a pad at the end of the run
      pos.push(x - 0.12, y, z - 0.12, x + 0.12, y, z + 0.12)
      t.push(param, param + 0.05)
    }
  }
  return { pos: new Float32Array(pos), t: new Float32Array(t) }
}

/** A wurtzite-ish stacked lattice, thinned out toward the edges of the volume. */
function buildLattice(count: number, rnd: () => number) {
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count * 3)
  const spacing = 0.72
  let i = 0
  let guard = 0
  while (i < count && guard < count * 40) {
    guard++
    const gx = Math.round((rnd() - 0.5) * 16)
    const gy = Math.round(rnd() * 7)
    const gz = Math.round((rnd() - 0.5) * 10)
    // alternate rows offset by half a cell, so it reads as a crystal not a box
    const ox = (gy % 2) * spacing * 0.5
    const x = gx * spacing + ox
    const yy = 0.6 + gy * spacing * 0.62
    const z = gz * spacing
    const radial = Math.hypot(x, z)
    if (radial > 7.4) continue
    if (rnd() > 1 - radial / 11) continue
    const k = i * 3
    pos[k] = x
    pos[k + 1] = yy
    pos[k + 2] = z
    seed[k] = rnd()
    seed[k + 1] = 5 + rnd() * 9
    seed[k + 2] = rnd() > 0.86 ? 1 : 0
    i++
  }
  return { pos: pos.subarray(0, i * 3), seed: seed.subarray(0, i * 3) }
}

/** Carriers confined to the channel under the gate. */
function buildCarriers(count: number, rnd: () => number) {
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const k = i * 3
    pos[k] = (rnd() - 0.5) * 4.2
    pos[k + 1] = 0.06 + (rnd() - 0.5) * 0.22
    pos[k + 2] = (rnd() - 0.5) * 0.3
    seed[k] = rnd()
    seed[k + 1] = 4 + rnd() * 6
    seed[k + 2] = rnd() > 0.7 ? 1 : 0
  }
  return { pos, seed }
}
