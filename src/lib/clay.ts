/**
 * The soft-clay renderer.
 *
 * One matte material, two broad lights and a wrapped falloff, which is what
 * gives the room its moulded look rather than a shiny CG one. Meshes are
 * cached by their dimensions so a model can ask for a rounded box of an exact
 * size and keep its corners undistorted, instead of stretching one unit cube.
 */

import {
  createMesh,
  createProgram,
  drawMesh,
  m4,
  type Mat4,
  type Mesh,
  type Program,
} from './gl'
import {
  cylinder,
  disc,
  roundedBox,
  roundedPrism,
  sphere,
  torus,
  type Geometry,
} from './geometry'

const CLAY_VS = `
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

const CLAY_FS = `
precision mediump float;
varying vec3 vN, vW;
uniform vec3 uColor, uEmissive, uEye, uAmbient;
uniform float uAlpha, uShine;
void main() {
  vec3 N = normalize(vN);
  vec3 K = normalize(vec3(-0.42, 0.88, 0.62));
  vec3 F = normalize(vec3(0.80, 0.18, 0.42));

  // Wrapped diffuse: light bends a long way around the form, so edges stay
  // soft instead of falling to black the way a hard lambert term would.
  float k = pow(max(dot(N, K) * 0.5 + 0.5, 0.0), 1.75) * 0.95;
  float f = max(dot(N, F) * 0.5 + 0.5, 0.0) * 0.30;
  float up = max(N.y, 0.0) * 0.10;

  vec3 col = uColor * (uAmbient + k + f + up);

  vec3 V = normalize(uEye - vW);
  vec3 H = normalize(K + V);
  col += vec3(1.0) * pow(max(dot(N, H), 0.0), 26.0) * uShine;

  // A little of the room colour wraps the silhouette so nothing looks cut out.
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col = mix(col, uAmbient * 2.1 + col * 0.25, fres * 0.22);

  col += uEmissive;
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`

const SHADOW_VS = `
attribute vec3 position;
uniform mat4 uProj, uView, uModel;
varying float vR;
void main() {
  vR = length(position.xz);
  gl_Position = uProj * uView * uModel * vec4(position, 1.0);
}`

const SHADOW_FS = `
precision mediump float;
varying float vR;
uniform vec3 uColor;
uniform float uStrength;
void main() {
  float a = 1.0 - clamp(vR, 0.0, 1.0);
  a = a * a * a * uStrength;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * a, a);
}`

export type Rgb = [number, number, number]

export type DrawOpts = {
  emissive?: Rgb
  alpha?: number
  shine?: number
}

export type Clay = {
  gl: WebGLRenderingContext
  /** Detail level, so models can drop segments on weak devices. */
  detail: number
  /** Begin a frame: sets the camera and clears. */
  begin(proj: Mat4, view: Mat4, eye: Rgb): void
  /** `world` first, so a call reads as "draw this node, as this shape". */
  draw(world: Mat4, mesh: Mesh, color: Rgb, opts?: DrawOpts): void
  /** Soft contact shadow on the ground plane. */
  shadow(x: number, z: number, radius: number, strength?: number, squash?: number): void
  /** world = parent * TRS, written into `out`. */
  node(
    out: Mat4, parent: Mat4,
    tx: number, ty: number, tz: number,
    rx: number, ry: number, rz: number,
    sx?: number, sy?: number, sz?: number,
  ): Mat4
  rbox(w: number, h: number, d: number, r: number, seg?: number): Mesh
  ball(r: number, seg?: number): Mesh
  tube(rTop: number, rBottom: number, h: number, seg?: number): Mesh
  ring(r: number, tube: number, seg?: number, tubeSeg?: number): Mesh
  hex(radius: number, corner: number, height: number): Mesh
  setAmbient(c: Rgb): void
  dispose(): void
}

export function createClay(
  gl: WebGLRenderingContext,
  detail: number,
  ambient: Rgb,
): Clay | null {
  const prog = createProgram(gl, CLAY_VS, CLAY_FS)
  const shadowProg = createProgram(gl, SHADOW_VS, SHADOW_FS)
  if (!prog || !shadowProg) return null

  const cache = new Map<string, Mesh>()
  const nrm = new Float32Array(9)
  const local = m4.create()
  const shadowM = m4.create()
  let amb: Rgb = ambient
  let currentProg: Program | null = null

  const make = (key: string, g: () => Geometry): Mesh => {
    let mesh = cache.get(key)
    if (!mesh) {
      const geo = g()
      mesh = createMesh(
        gl,
        gl.TRIANGLES,
        [
          { name: 'position', size: 3, data: geo.positions },
          { name: 'normal', size: 3, data: geo.normals },
        ],
        geo.indices,
      )
      cache.set(key, mesh)
    }
    return mesh
  }

  const q = (n: number) => n.toFixed(3)
  const shadowMesh = make('disc', () => disc(1, detail > 1 ? 28 : 16))

  const clay: Clay = {
    gl,
    detail,

    setAmbient(c) {
      amb = c
    },

    begin(proj, view, eye) {
      prog.use()
      currentProg = prog
      gl.uniformMatrix4fv(prog.uniform('uProj'), false, proj)
      gl.uniformMatrix4fv(prog.uniform('uView'), false, view)
      gl.uniform3f(prog.uniform('uEye'), eye[0], eye[1], eye[2])
      gl.uniform3f(prog.uniform('uAmbient'), amb[0], amb[1], amb[2])
      // Kept for the shadow pass, which runs with the same camera.
      shadowProg.use()
      gl.uniformMatrix4fv(shadowProg.uniform('uProj'), false, proj)
      gl.uniformMatrix4fv(shadowProg.uniform('uView'), false, view)
      prog.use()
    },

    draw(world, mesh, color, opts) {
      if (currentProg !== prog) {
        prog.use()
        currentProg = prog
      }
      m4.normalFromModel(nrm, world)
      gl.uniformMatrix4fv(prog.uniform('uModel'), false, world)
      gl.uniformMatrix3fv(prog.uniform('uNormal'), false, nrm)
      gl.uniform3f(prog.uniform('uColor'), color[0], color[1], color[2])
      const e = opts?.emissive
      gl.uniform3f(prog.uniform('uEmissive'), e ? e[0] : 0, e ? e[1] : 0, e ? e[2] : 0)
      gl.uniform1f(prog.uniform('uAlpha'), opts?.alpha ?? 1)
      gl.uniform1f(prog.uniform('uShine'), opts?.shine ?? 0.06)
      drawMesh(gl, prog, mesh)
    },

    shadow(x, z, radius, strength = 0.3, squash = 0.62) {
      shadowProg.use()
      currentProg = shadowProg
      m4.compose(shadowM, x, 0.004, z, 0, 0, 0, radius, 1, radius * squash)
      gl.uniformMatrix4fv(shadowProg.uniform('uModel'), false, shadowM)
      gl.uniform3f(shadowProg.uniform('uColor'), 0.05, 0.06, 0.22)
      gl.uniform1f(shadowProg.uniform('uStrength'), strength)
      // The disc is built at radius 1, so the vertex shader's length() is
      // already the 0..1 falloff it needs.
      drawMesh(gl, shadowProg, shadowMesh)
    },

    node(out, parent, tx, ty, tz, rx, ry, rz, sx = 1, sy = 1, sz = 1) {
      m4.compose(local, tx, ty, tz, rx, ry, rz, sx, sy, sz)
      return m4.multiply(out, parent, local)
    },

    rbox(w, h, d, r, seg) {
      const s = seg ?? (detail > 1 ? 6 : 3)
      return make(`rb${q(w)},${q(h)},${q(d)},${q(r)},${s}`, () => roundedBox(w, h, d, r, s))
    },
    ball(r, seg) {
      const s = seg ?? (detail > 1 ? 20 : 12)
      return make(`sp${q(r)},${s}`, () => sphere(r, s, Math.max(6, Math.round(s * 0.7))))
    },
    tube(rTop, rBottom, h, seg) {
      const s = seg ?? (detail > 1 ? 20 : 10)
      return make(`cy${q(rTop)},${q(rBottom)},${q(h)},${s}`, () =>
        cylinder(rTop, rBottom, h, s),
      )
    },
    ring(r, tubeR, seg, tubeSeg) {
      const s = seg ?? (detail > 1 ? 24 : 12)
      const ts = tubeSeg ?? (detail > 1 ? 10 : 6)
      return make(`to${q(r)},${q(tubeR)},${s},${ts}`, () => torus(r, tubeR, s, ts))
    },
    hex(radius, corner, height) {
      return make(`hx${q(radius)},${q(corner)},${q(height)}`, () =>
        roundedPrism(6, radius, corner, height, detail > 1 ? 4 : 2),
      )
    },

    dispose() {
      for (const mesh of cache.values()) mesh.dispose()
      cache.clear()
      prog.dispose()
      shadowProg.dispose()
    },
  }

  return clay
}
