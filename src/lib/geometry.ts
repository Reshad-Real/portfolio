/** Indexed primitive builders. Positions are centred on the local origin. */

export type Geometry = {
  positions: Float32Array
  normals: Float32Array
  indices: Uint16Array
}

export function box(w: number, h: number, d: number): Geometry {
  const x = w / 2
  const y = h / 2
  const z = d / 2
  // six faces, four verts each, so each face keeps its own flat normal
  const faces: [number[], number[]][] = [
    [[-x, -y, z, x, -y, z, x, y, z, -x, y, z], [0, 0, 1]],
    [[x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z], [0, 0, -1]],
    [[x, -y, z, x, -y, -z, x, y, -z, x, y, z], [1, 0, 0]],
    [[-x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z], [-1, 0, 0]],
    [[-x, y, z, x, y, z, x, y, -z, -x, y, -z], [0, 1, 0]],
    [[-x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z], [0, -1, 0]],
  ]

  const positions = new Float32Array(72)
  const normals = new Float32Array(72)
  const indices = new Uint16Array(36)
  let p = 0
  let n = 0
  let i = 0
  let base = 0
  for (const [verts, nrm] of faces) {
    for (let v = 0; v < 12; v++) positions[p++] = verts[v]
    for (let v = 0; v < 4; v++) {
      normals[n++] = nrm[0]
      normals[n++] = nrm[1]
      normals[n++] = nrm[2]
    }
    indices[i++] = base
    indices[i++] = base + 1
    indices[i++] = base + 2
    indices[i++] = base
    indices[i++] = base + 2
    indices[i++] = base + 3
    base += 4
  }
  return { positions, normals, indices }
}

export function sphere(radius: number, seg = 16, rings = 12): Geometry {
  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  for (let r = 0; r <= rings; r++) {
    const v = r / rings
    const phi = v * Math.PI
    const sp = Math.sin(phi)
    const cp = Math.cos(phi)
    for (let s = 0; s <= seg; s++) {
      const u = s / seg
      const theta = u * Math.PI * 2
      const nx = sp * Math.cos(theta)
      const ny = cp
      const nz = sp * Math.sin(theta)
      nor.push(nx, ny, nz)
      pos.push(nx * radius, ny * radius, nz * radius)
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < seg; s++) {
      const a = r * (seg + 1) + s
      const b = a + seg + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    indices: new Uint16Array(idx),
  }
}

/** Y-axis cylinder. `rTop` of 0 gives a cone. */
export function cylinder(rTop: number, rBottom: number, height: number, seg = 16): Geometry {
  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  const hy = height / 2
  const slope = Math.atan2(rBottom - rTop, height)
  const cs = Math.cos(slope)
  const sn = Math.sin(slope)

  for (let r = 0; r <= 1; r++) {
    const radius = r === 0 ? rBottom : rTop
    const y = r === 0 ? -hy : hy
    for (let s = 0; s <= seg; s++) {
      const t = (s / seg) * Math.PI * 2
      const cx = Math.cos(t)
      const cz = Math.sin(t)
      pos.push(cx * radius, y, cz * radius)
      nor.push(cx * cs, sn, cz * cs)
    }
  }
  for (let s = 0; s < seg; s++) {
    const a = s
    const b = s + seg + 1
    idx.push(a, b, a + 1, b, b + 1, a + 1)
  }

  // caps
  for (let r = 0; r <= 1; r++) {
    const radius = r === 0 ? rBottom : rTop
    if (radius <= 0) continue
    const y = r === 0 ? -hy : hy
    const ny = r === 0 ? -1 : 1
    const centre = pos.length / 3
    pos.push(0, y, 0)
    nor.push(0, ny, 0)
    for (let s = 0; s <= seg; s++) {
      const t = (s / seg) * Math.PI * 2
      pos.push(Math.cos(t) * radius, y, Math.sin(t) * radius)
      nor.push(0, ny, 0)
    }
    for (let s = 0; s < seg; s++) {
      if (r === 0) idx.push(centre, centre + 1 + s + 1, centre + 1 + s)
      else idx.push(centre, centre + 1 + s, centre + 1 + s + 1)
    }
  }

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    indices: new Uint16Array(idx),
  }
}

export function torus(radius: number, tube: number, seg = 18, tubeSeg = 10): Geometry {
  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= tubeSeg; j++) {
    const v = (j / tubeSeg) * Math.PI * 2
    for (let i = 0; i <= seg; i++) {
      const u = (i / seg) * Math.PI * 2
      const cx = Math.cos(u)
      const cz = Math.sin(u)
      const nx = Math.cos(v) * cx
      const ny = Math.sin(v)
      const nz = Math.cos(v) * cz
      pos.push((radius + tube * Math.cos(v)) * cx, tube * Math.sin(v), (radius + tube * Math.cos(v)) * cz)
      nor.push(nx, ny, nz)
    }
  }
  for (let j = 0; j < tubeSeg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i
      const b = a + seg + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    indices: new Uint16Array(idx),
  }
}

/** A flat XZ plane facing +Y, subdivided so a vertex shader can displace it. */
export function planeXZ(size: number, divisions: number): Geometry {
  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  const half = size / 2
  const step = size / divisions
  for (let z = 0; z <= divisions; z++) {
    for (let x = 0; x <= divisions; x++) {
      pos.push(-half + x * step, 0, -half + z * step)
      nor.push(0, 1, 0)
    }
  }
  for (let z = 0; z < divisions; z++) {
    for (let x = 0; x < divisions; x++) {
      const a = z * (divisions + 1) + x
      const b = a + divisions + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    indices: new Uint16Array(idx),
  }
}

/** Line-list grid on the XZ plane, for the wireframe floor. */
export function gridLines(size: number, divisions: number): Float32Array {
  const out: number[] = []
  const half = size / 2
  const step = size / divisions
  for (let i = 0; i <= divisions; i++) {
    const p = -half + i * step
    out.push(p, 0, -half, p, 0, half)
    out.push(-half, 0, p, half, 0, p)
  }
  return new Float32Array(out)
}

/** Wireframe edges of an axis-aligned box, as a line list. */
export function boxEdges(w: number, h: number, d: number): Float32Array {
  const x = w / 2
  const y = h / 2
  const z = d / 2
  const c: [number, number, number][] = [
    [-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z],
    [-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z],
  ]
  const pairs = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ]
  const out: number[] = []
  for (const [a, b] of pairs) out.push(...c[a], ...c[b])
  return new Float32Array(out)
}
