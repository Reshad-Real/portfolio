/**
 * BYTE, the cyber-dog: a cartoon retriever built entirely from primitives and
 * posed by a small hand-rolled scene graph. Half of him is fur, half is
 * chrome, and the optic in the metal side is the only light he emits.
 */

import {
  clamp,
  createGL,
  createMesh,
  createProgram,
  drawMesh,
  m4,
  resizeCanvas,
  type Mat4,
  type Mesh,
} from './gl'
import { box, cylinder, sphere, torus } from './geometry'

const VS = `
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

const FS = `
precision mediump float;
varying vec3 vN, vW;
uniform vec3 uColor, uEmissive;
uniform float uAlpha;
void main() {
  vec3 N = normalize(vN);
  vec3 L = normalize(vec3(0.5, 0.85, 0.75));
  float d = max(dot(N, L), 0.0);
  // two soft steps keep the shading cartoon-flat rather than photographic
  float band = d > 0.62 ? 1.0 : (d > 0.26 ? 0.76 : 0.55);
  vec3 V = normalize(vec3(0.0, 0.9, 5.0) - vW);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.55;
  vec3 col = uColor * band + uEmissive + rim * vec3(0.35, 0.8, 0.95);
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`

type Col = [number, number, number]

const FUR: Col = [0.93, 0.74, 0.44]
const FUR_DARK: Col = [0.8, 0.6, 0.33]
const CHROME: Col = [0.68, 0.72, 0.78]
const DARK: Col = [0.16, 0.17, 0.2]
const NOSE: Col = [0.2, 0.17, 0.18]

export type DogMood = 'idle' | 'alert' | 'happy'

export type DogScene = {
  render(nowMs: number): void
  /** Where to look, in dog-local units: +x is to his right, +y is up. */
  setLook(x: number, y: number): void
  setGait(speed: number): void
  setFacing(dir: 1 | -1): void
  setPet(v: number): void
  setMood(m: DogMood): void
  resize(): void
  dispose(): void
}

export function createDogScene(
  canvas: HTMLCanvasElement,
  quality: 'high' | 'medium' | 'low',
  reducedMotion: boolean,
): DogScene | null {
  const ctx = createGL(canvas, quality !== 'low')
  if (!ctx) return null
  const gl = ctx.gl as WebGLRenderingContext
  const prog = createProgram(gl, VS, FS)
  if (!prog) return null

  const seg = quality === 'high' ? 14 : 8
  const mk = (g: { positions: Float32Array; normals: Float32Array; indices: Uint16Array }) =>
    createMesh(
      gl,
      gl.TRIANGLES,
      [
        { name: 'position', size: 3, data: g.positions },
        { name: 'normal', size: 3, data: g.normals },
      ],
      g.indices,
    )

  const M = {
    cube: mk(box(1, 1, 1)),
    ball: mk(sphere(0.5, seg, Math.max(6, seg - 4))),
    cone: mk(cylinder(0.02, 0.5, 1, seg)),
    tube: mk(cylinder(0.5, 0.5, 1, seg)),
    ring: mk(torus(0.5, 0.12, seg + 4, 6)),
  }

  const proj = m4.create()
  const view = m4.create()
  const nrm = new Float32Array(9)
  const tmp = m4.create()
  const local = m4.create()

  const maxDpr = quality === 'high' ? 2 : 1.5
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

  // ---------------------------------------------------------------- state
  let lookX = 0
  let lookY = 0
  let sLookX = 0
  let sLookY = 0
  let gait = 0
  let sGait = 0
  let facing: 1 | -1 = -1
  let sFacing = -1
  let pet = 0
  let sPet = 0
  let mood: DogMood = 'idle'
  let sAlert = 0
  let blink = 0
  let blinkTimer = 2
  let last = 0

  function draw(world: Mat4, mesh: Mesh, color: Col, emissive: Col = [0, 0, 0], alpha = 1) {
    m4.normalFromModel(nrm, world)
    gl.uniformMatrix4fv(prog!.uniform('uModel'), false, world)
    gl.uniformMatrix3fv(prog!.uniform('uNormal'), false, nrm)
    gl.uniform3f(prog!.uniform('uColor'), color[0], color[1], color[2])
    gl.uniform3f(prog!.uniform('uEmissive'), emissive[0], emissive[1], emissive[2])
    gl.uniform1f(prog!.uniform('uAlpha'), alpha)
    drawMesh(gl, prog!, mesh)
  }

  /** world = parent * compose(...) */
  function node(
    out: Mat4,
    parent: Mat4,
    tx: number, ty: number, tz: number,
    rx: number, ry: number, rz: number,
    sx: number, sy: number, sz: number,
  ): Mat4 {
    m4.compose(local, tx, ty, tz, rx, ry, rz, sx, sy, sz)
    return m4.multiply(out, parent, local)
  }

  const root = m4.create()
  const headM = m4.create()
  const partM = m4.create()
  const legM = m4.create()

  function render(nowMs: number) {
    if (lost) return
    const dt = last ? Math.min(0.05, (nowMs - last) / 1000) : 0.016
    last = nowMs
    const t = nowMs / 1000

    const k = reducedMotion ? 1 : 0.12
    sLookX += (lookX - sLookX) * k
    sLookY += (lookY - sLookY) * k
    sGait += (gait - sGait) * 0.1
    sFacing += (facing - sFacing) * 0.12
    sPet += (pet - sPet) * 0.16
    sAlert += ((mood === 'alert' ? 1 : 0) - sAlert) * 0.1

    if (!reducedMotion) {
      blinkTimer -= dt
      if (blinkTimer <= 0) {
        blink = 1
        blinkTimer = 2.4 + Math.random() * 3.4
      }
      blink = Math.max(0, blink - dt * 6)
    }

    resizeCanvas(canvas, gl, maxDpr)
    const aspect = canvas.width / Math.max(1, canvas.height)
    m4.perspective(proj, (34 * Math.PI) / 180, aspect, 0.1, 40)
    m4.lookAt(view, [0, 1.15, 5.4], [0, 0.92, 0], [0, 1, 0])

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    prog!.use()
    gl.uniformMatrix4fv(prog!.uniform('uProj'), false, proj)
    gl.uniformMatrix4fv(prog!.uniform('uView'), false, view)

    // ------------------------------------------------------------- pose
    const walk = reducedMotion ? 0 : sGait
    const step = t * (6 + walk * 8)
    const breathe = reducedMotion ? 0 : Math.sin(t * 1.5) * 0.012
    const bob = reducedMotion ? 0 : Math.sin(step * 2) * 0.035 * walk + Math.sin(t * 2.6) * 0.01
    const happy = sPet
    const hop = reducedMotion ? 0 : Math.abs(Math.sin(t * 7)) * 0.06 * happy

    // Facing turns the whole dog; the neutral pose is a three-quarter view.
    const yaw = sFacing * 0.62 + sLookX * 0.22
    m4.compose(root, 0, bob + hop, 0, 0, yaw, 0, 1, 1, 1)

    // body -------------------------------------------------------------
    draw(node(partM, root, 0, 0.92, 0, 0, 0, 0, 1.22, 0.78 + breathe, 0.78), M.ball, FUR)
    draw(node(partM, root, 0.16, 0.86, 0, 0, 0, 0.06, 0.88, 0.62, 0.7), M.ball, FUR_DARK)
    // chrome flank plate, the cybernetic half
    draw(
      node(partM, root, 0.02, 0.94, -0.3, 0, 0, 0, 0.9, 0.58, 0.24),
      M.ball,
      CHROME,
      [0.02, 0.03, 0.04],
    )

    // collar ------------------------------------------------------------
    draw(node(partM, root, 0.5, 1.06, 0, 1.35, 0, 0.25, 0.62, 0.62, 0.62), M.ring, DARK)
    draw(node(partM, root, 0.6, 0.92, 0.16, 0, 0, 0, 0.12, 0.12, 0.06), M.cube, [0.9, 0.78, 0.3], [0.22, 0.18, 0.04])

    // legs --------------------------------------------------------------
    const legs: [number, number, number][] = [
      [0.42, 0, 0.3],
      [0.42, 0, -0.3],
      [-0.42, 1, 0.3],
      [-0.42, 1, -0.3],
    ]
    for (const [lx, phase, lz] of legs) {
      const swing = reducedMotion ? 0 : Math.sin(step + phase * Math.PI) * 0.5 * walk
      const lift = reducedMotion ? 0 : Math.max(0, Math.sin(step + phase * Math.PI)) * 0.06 * walk
      node(legM, root, lx, 0.56 + lift, lz, 0, 0, 0, 1, 1, 1)
      m4.compose(local, 0, 0, 0, swing, 0, 0, 0.2, 0.56, 0.2)
      m4.multiply(tmp, legM, local)
      // shift the cylinder so it hangs from the hip rather than centring on it
      tmp[13] -= 0.24 * Math.cos(swing)
      tmp[14] += 0.24 * Math.sin(swing)
      draw(tmp, M.tube, FUR_DARK)
      // paw
      m4.compose(local, 0, -0.5, 0, 0, 0, 0, 1.15, 0.34, 1.3)
      m4.multiply(partM, tmp, local)
      draw(partM, M.cube, [0.98, 0.92, 0.84])
    }

    // tail --------------------------------------------------------------
    const wag = reducedMotion ? 0 : Math.sin(t * (6 + happy * 16 + walk * 5)) * (0.3 + happy * 0.55)
    node(partM, root, -0.62, 1.12, 0, 0, 0, 0, 1, 1, 1)
    m4.compose(local, 0, 0, 0, -0.5, wag, 0, 0.16, 0.62, 0.16)
    m4.multiply(tmp, partM, local)
    tmp[12] -= 0.16
    tmp[13] += 0.2
    draw(tmp, M.tube, FUR)
    m4.compose(local, 0, 0.42, 0, 0, 0, 0, 1.5, 0.5, 1.5)
    m4.multiply(partM, tmp, local)
    draw(partM, M.ball, FUR)

    // head --------------------------------------------------------------
    const headYaw = sLookX * 0.5
    const headPitch = clamp(-sLookY * 0.42 + happy * 0.22 + sAlert * 0.1, -0.5, 0.5)
    const tilt = happy * 0.2 + sAlert * 0.12
    node(headM, root, 0.7, 1.5 + sAlert * 0.05, 0, headPitch, headYaw, tilt, 1, 1, 1)

    draw(node(partM, headM, 0, 0, 0, 0, 0, 0, 0.82, 0.76, 0.78), M.ball, FUR)
    // chrome half of the face, split down the middle
    draw(
      node(partM, headM, 0, 0.02, -0.2, 0, 0, 0, 0.74, 0.68, 0.42),
      M.ball,
      CHROME,
      [0.02, 0.03, 0.04],
    )
    // muzzle
    draw(node(partM, headM, 0.34, -0.16, 0, 0, 0, 0, 0.52, 0.38, 0.5), M.ball, [0.98, 0.93, 0.86])
    draw(node(partM, headM, 0.56, -0.11, 0, 0, 0, 0, 0.16, 0.14, 0.18), M.ball, NOSE)

    // eyes; petting closes them
    const open = Math.max(0.08, (1 - blink) * (1 - happy * 0.92))
    draw(
      node(partM, headM, 0.3, 0.14, 0.23, 0, 0, 0, 0.2, 0.2 * open + 0.03, 0.2),
      M.ball,
      DARK,
      [0.01, 0.01, 0.01],
    )
    // the optic set into the metal side
    draw(
      node(partM, headM, 0.28, 0.14, -0.24, 0, 0, 0, 0.22, 0.22 * open + 0.04, 0.22),
      M.ball,
      [0.05, 0.5, 0.5],
      [0.05 + sAlert * 0.35, 0.55 + sAlert * 0.4, 0.52 + sAlert * 0.3],
    )
    // catchlight
    if (open > 0.4) {
      draw(
        node(partM, headM, 0.38, 0.2, 0.28, 0, 0, 0, 0.07, 0.07, 0.07),
        M.ball,
        [1, 1, 1],
        [0.7, 0.7, 0.7],
      )
    }

    // ears; they fold back while he is being petted
    const earDrop = 0.35 + happy * 0.7 + sGait * 0.15
    for (const side of [1, -1] as const) {
      const flick = reducedMotion ? 0 : Math.sin(t * 3.1 + side) * 0.05
      draw(
        node(
          partM,
          headM,
          -0.1,
          0.3,
          side * 0.3,
          0,
          0,
          -side * (earDrop + flick),
          0.26,
          0.6,
          0.16,
        ),
        M.cone,
        side > 0 ? FUR_DARK : CHROME,
        side > 0 ? [0, 0, 0] : [0.02, 0.03, 0.03],
      )
    }

    // antenna, and its tip light
    draw(node(partM, headM, -0.16, 0.46, -0.16, 0, 0, 0.2, 0.04, 0.42, 0.04), M.tube, CHROME)
    const pulse = reducedMotion ? 0.5 : 0.4 + Math.sin(t * 3.4) * 0.3
    draw(
      node(partM, headM, -0.22, 0.68, -0.16, 0, 0, 0, 0.11, 0.11, 0.11),
      M.ball,
      [0.1, 0.7, 0.6],
      [0.1 + pulse * 0.5, 0.6 + pulse * 0.5, 0.55 + pulse * 0.4],
    )
  }

  return {
    render,
    setLook(x, y) {
      lookX = clamp(x, -1, 1)
      lookY = clamp(y, -1, 1)
    },
    setGait(speed) {
      gait = clamp(speed, 0, 1)
    },
    setFacing(dir) {
      facing = dir
    },
    setPet(v) {
      pet = clamp(v, 0, 1)
    },
    setMood(m) {
      mood = m
    },
    resize() {
      resizeCanvas(canvas, gl, maxDpr)
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost)
      for (const m of Object.values(M)) m.dispose()
      prog!.dispose()
      // Leave the context alive so a remount can reuse this canvas.
    },
  }
}
