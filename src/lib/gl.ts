/**
 * A very small WebGL helper layer.
 *
 * The site needs exactly two 3D scenes (the startup chamber and the cyber-dog),
 * both built from primitives, so a full engine would cost far more bytes than
 * the scenes are worth. Everything here is hand-written and tree-shakes well.
 *
 * Matrices are column-major Float32Array(16), matching the GL convention.
 */

export type Mat4 = Float32Array
export type Vec3 = [number, number, number]

export const m4 = {
  create(): Mat4 {
    const o = new Float32Array(16)
    o[0] = o[5] = o[10] = o[15] = 1
    return o
  },

  perspective(o: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan(fovy / 2)
    const nf = 1 / (near - far)
    o.fill(0)
    o[0] = f / aspect
    o[5] = f
    o[10] = (far + near) * nf
    o[11] = -1
    o[14] = 2 * far * near * nf
    return o
  },

  lookAt(o: Mat4, eye: Vec3, center: Vec3, up: Vec3): Mat4 {
    let zx = eye[0] - center[0]
    let zy = eye[1] - center[1]
    let zz = eye[2] - center[2]
    let len = Math.hypot(zx, zy, zz) || 1
    zx /= len
    zy /= len
    zz /= len

    let xx = up[1] * zz - up[2] * zy
    let xy = up[2] * zx - up[0] * zz
    let xz = up[0] * zy - up[1] * zx
    len = Math.hypot(xx, xy, xz)
    if (len === 0) {
      xx = 1
      xy = 0
      xz = 0
    } else {
      xx /= len
      xy /= len
      xz /= len
    }

    const yx = zy * xz - zz * xy
    const yy = zz * xx - zx * xz
    const yz = zx * xy - zy * xx

    o[0] = xx
    o[1] = yx
    o[2] = zx
    o[3] = 0
    o[4] = xy
    o[5] = yy
    o[6] = zy
    o[7] = 0
    o[8] = xz
    o[9] = yz
    o[10] = zz
    o[11] = 0
    o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2])
    o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2])
    o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2])
    o[15] = 1
    return o
  },

  multiply(o: Mat4, a: Mat4, b: Mat4): Mat4 {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3]
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7]
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]
    for (let i = 0; i < 4; i++) {
      const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3]
      o[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
      o[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
      o[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
      o[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
    }
    return o
  },

  /** Build translate * Ry * Rx * Rz * scale into `o`. */
  compose(
    o: Mat4,
    tx: number, ty: number, tz: number,
    rx: number, ry: number, rz: number,
    sx: number, sy: number, sz: number,
  ): Mat4 {
    const cx = Math.cos(rx), sxr = Math.sin(rx)
    const cy = Math.cos(ry), syr = Math.sin(ry)
    const cz = Math.cos(rz), szr = Math.sin(rz)

    const r00 = cy * cz + syr * sxr * szr
    const r01 = cx * szr
    const r02 = -syr * cz + cy * sxr * szr
    const r10 = -cy * szr + syr * sxr * cz
    const r11 = cx * cz
    const r12 = syr * szr + cy * sxr * cz
    const r20 = syr * cx
    const r21 = -sxr
    const r22 = cy * cx

    o[0] = r00 * sx
    o[1] = r01 * sx
    o[2] = r02 * sx
    o[3] = 0
    o[4] = r10 * sy
    o[5] = r11 * sy
    o[6] = r12 * sy
    o[7] = 0
    o[8] = r20 * sz
    o[9] = r21 * sz
    o[10] = r22 * sz
    o[11] = 0
    o[12] = tx
    o[13] = ty
    o[14] = tz
    o[15] = 1
    return o
  },

  /** Upper-left 3x3 of `m`, written into a mat3-shaped Float32Array(9). */
  normalFromModel(o: Float32Array, m: Mat4): Float32Array {
    o[0] = m[0]; o[1] = m[1]; o[2] = m[2]
    o[3] = m[4]; o[4] = m[5]; o[5] = m[6]
    o[6] = m[8]; o[7] = m[9]; o[8] = m[10]
    return o
  },
}

export type GLContext = {
  gl: WebGLRenderingContext | WebGL2RenderingContext
  isGL2: boolean
}

/** Returns null when WebGL is unavailable so callers can render a fallback. */
export function createGL(canvas: HTMLCanvasElement, antialias: boolean): GLContext | null {
  const attrs: WebGLContextAttributes = {
    alpha: true,
    antialias,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  }
  try {
    const gl2 = canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null
    if (gl2) return { gl: gl2, isGL2: true }
    const gl1 = canvas.getContext('webgl', attrs) as WebGLRenderingContext | null
    if (gl1) return { gl: gl1, isGL2: false }
  } catch {
    return null
  }
  return null
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (import.meta.env.DEV) console.warn('[gl] shader failed', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export type Program = {
  program: WebGLProgram
  attrib(name: string): number
  uniform(name: string): WebGLUniformLocation | null
  use(): void
  dispose(): void
}

export function createProgram(
  gl: WebGLRenderingContext,
  vsSrc: string,
  fsSrc: string,
): Program | null {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) console.warn('[gl] link failed', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  const aCache = new Map<string, number>()
  const uCache = new Map<string, WebGLUniformLocation | null>()
  return {
    program,
    attrib(name) {
      let loc = aCache.get(name)
      if (loc === undefined) {
        loc = gl.getAttribLocation(program, name)
        aCache.set(name, loc)
      }
      return loc
    },
    uniform(name) {
      if (!uCache.has(name)) uCache.set(name, gl.getUniformLocation(program, name))
      return uCache.get(name) ?? null
    },
    use() {
      gl.useProgram(program)
    },
    dispose() {
      gl.deleteProgram(program)
    },
  }
}

export type AttrSpec = { name: string; size: number; data: Float32Array }

export type Mesh = {
  mode: number
  count: number
  attrs: { name: string; size: number; buffer: WebGLBuffer }[]
  index: WebGLBuffer | null
  indexType: number
  dispose(): void
  /** Re-upload one attribute, for animated point clouds. */
  update(name: string, data: Float32Array): void
}

export function createMesh(
  gl: WebGLRenderingContext,
  mode: number,
  attrs: AttrSpec[],
  indices?: Uint16Array,
  dynamic = false,
): Mesh {
  const usage = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW
  const built = attrs.map((a) => {
    const buffer = gl.createBuffer() as WebGLBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, a.data, usage)
    return { name: a.name, size: a.size, buffer }
  })

  let index: WebGLBuffer | null = null
  if (indices) {
    index = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
  }

  const first = attrs[0]
  const count = indices ? indices.length : first ? first.data.length / first.size : 0

  return {
    mode,
    count,
    attrs: built,
    index,
    indexType: gl.UNSIGNED_SHORT,
    update(name, data) {
      const target = built.find((b) => b.name === name)
      if (!target) return
      gl.bindBuffer(gl.ARRAY_BUFFER, target.buffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
    },
    dispose() {
      for (const b of built) gl.deleteBuffer(b.buffer)
      if (index) gl.deleteBuffer(index)
    },
  }
}

export function drawMesh(gl: WebGLRenderingContext, prog: Program, mesh: Mesh): void {
  const enabled: number[] = []
  for (const a of mesh.attrs) {
    const loc = prog.attrib(a.name)
    if (loc < 0) continue
    gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, a.size, gl.FLOAT, false, 0, 0)
    enabled.push(loc)
  }
  if (mesh.index) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index)
    gl.drawElements(mesh.mode, mesh.count, mesh.indexType, 0)
  } else {
    gl.drawArrays(mesh.mode, 0, mesh.count)
  }
  for (const loc of enabled) gl.disableVertexAttribArray(loc)
}

/**
 * Sizes the drawing buffer to the element, capping device pixel ratio so a
 * high-DPI phone does not quietly render four times the pixels it needs.
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  maxDpr: number,
): boolean {
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
  const w = Math.max(1, Math.round(rect.width * dpr))
  const h = Math.max(1, Math.round(rect.height * dpr))
  if (canvas.width === w && canvas.height === h) return false
  canvas.width = w
  canvas.height = h
  gl.viewport(0, 0, w, h)
  return true
}

/** Deterministic pseudo-random, so every reload composes the same scene. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0 || 1), 0, 1)
  return t * t * (3 - 2 * t)
}
