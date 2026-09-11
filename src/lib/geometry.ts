/**
 * Indexed primitive builders, centred on the local origin.
 *
 * Everything in the room scene is made of these, so the set is deliberately
 * small: a rounded box does most of the work, and the rest fills in the shapes
 * a rounded box cannot fake.
 */

export type Geometry = {
  positions: Float32Array
  normals: Float32Array
  indices: Uint16Array
}

function build(pos: number[], nor: number[], idx: number[]): Geometry {
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    indices: new Uint16Array(idx),
  }
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

/**
 * A box whose edges and corners are rounded by `r`.
 *
 * Each face starts as a flat grid, then every vertex is pushed onto the
 * surface that sits exactly `r` away from the inner box. Vertices on a flat
 * face move straight out along the face normal, vertices near an edge or
 * corner sweep around it, so the whole thing is seamless without welding.
 */
export function roundedBox(w: number, h: number, d: number, r: number, seg = 6): Geometry {
  const hx = w / 2
  const hy = h / 2
  const hz = d / 2
  const rr = Math.min(r, hx, hy, hz)
  const ix = hx - rr
  const iy = hy - rr
  const iz = hz - rr

  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []

  // u and v span the face; `axis` is which coordinate is pinned to the face.
  const faces: [0 | 1 | 2, 1 | -1][] = [
    [2, 1], [2, -1],
    [0, 1], [0, -1],
    [1, 1], [1, -1],
  ]

  for (const [axis, sign] of faces) {
    const base = pos.length / 3
    for (let j = 0; j <= seg; j++) {
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * 2 - 1
        const b = (j / seg) * 2 - 1

        let x: number, y: number, z: number
        if (axis === 2) {
          x = a * hx
          y = b * hy
          z = sign * hz
        } else if (axis === 0) {
          z = -a * sign * hz
          y = b * hy
          x = sign * hx
        } else {
          x = a * hx
          z = -b * sign * hz
          y = sign * hy
        }

        // Nearest point on the inner box, then step out by the radius.
        const qx = clamp(x, -ix, ix)
        const qy = clamp(y, -iy, iy)
        const qz = clamp(z, -iz, iz)
        let nx = x - qx
        let ny = y - qy
        let nz = z - qz
        const len = Math.hypot(nx, ny, nz) || 1
        nx /= len
        ny /= len
        nz /= len

        pos.push(qx + nx * rr, qy + ny * rr, qz + nz * rr)
        nor.push(nx, ny, nz)
      }
    }
    for (let j = 0; j < seg; j++) {
      for (let i = 0; i < seg; i++) {
        const a = base + j * (seg + 1) + i
        const b = a + seg + 1
        idx.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }

  return build(pos, nor, idx)
}

/** A capsule standing on Y: a rounded box whose radius fills two of its axes. */
export function capsule(radius: number, length: number, seg = 8): Geometry {
  return roundedBox(radius * 2, length, radius * 2, radius, seg)
}

export function sphere(radius: number, seg = 18, rings = 14): Geometry {
  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  for (let r = 0; r <= rings; r++) {
    const phi = (r / rings) * Math.PI
    const sp = Math.sin(phi)
    const cp = Math.cos(phi)
    for (let s = 0; s <= seg; s++) {
      const theta = (s / seg) * Math.PI * 2
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
  return build(pos, nor, idx)
}

/** Y-axis cylinder. `rTop` of 0 gives a cone. */
export function cylinder(rTop: number, rBottom: number, height: number, seg = 20): Geometry {
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
      if (r === 0) idx.push(centre, centre + s + 2, centre + s + 1)
      else idx.push(centre, centre + s + 1, centre + s + 2)
    }
  }

  return build(pos, nor, idx)
}

export function torus(radius: number, tube: number, seg = 24, tubeSeg = 12): Geometry {
  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= tubeSeg; j++) {
    const v = (j / tubeSeg) * Math.PI * 2
    const cv = Math.cos(v)
    const sv = Math.sin(v)
    for (let i = 0; i <= seg; i++) {
      const u = (i / seg) * Math.PI * 2
      const cu = Math.cos(u)
      const su = Math.sin(u)
      pos.push((radius + tube * cv) * cu, tube * sv, (radius + tube * cv) * su)
      nor.push(cv * cu, sv, cv * su)
    }
  }
  for (let j = 0; j < tubeSeg; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i
      const b = a + seg + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return build(pos, nor, idx)
}

/**
 * A prism over a regular polygon with rounded corners, extruded along Y.
 * Used for the hexagonal wall panels.
 */
export function roundedPrism(
  sides: number,
  radius: number,
  corner: number,
  height: number,
  arcSteps = 4,
): Geometry {
  // Outline, walked corner by corner.
  const outline: [number, number][] = []
  const normals: [number, number][] = []
  const step = (Math.PI * 2) / sides
  // Distance from centre to the arc centre of each rounded corner.
  const apothem = radius * Math.cos(step / 2)
  const cornerR = Math.min(corner, apothem * 0.6)
  const inset = radius - cornerR / Math.cos(step / 2)

  for (let i = 0; i < sides; i++) {
    const a = i * step - Math.PI / 2
    const cx = Math.cos(a) * inset
    const cz = Math.sin(a) * inset
    // Sweep the arc between the two adjacent edge normals.
    const start = a - step / 2
    const end = a + step / 2
    for (let s = 0; s <= arcSteps; s++) {
      const t = start + ((end - start) * s) / arcSteps
      const nx = Math.cos(t)
      const nz = Math.sin(t)
      outline.push([cx + nx * cornerR, cz + nz * cornerR])
      normals.push([nx, nz])
    }
  }

  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  const hy = height / 2
  const n = outline.length

  // Side wall
  for (let i = 0; i < n; i++) {
    const [x, z] = outline[i]
    const [nx, nz] = normals[i]
    pos.push(x, -hy, z, x, hy, z)
    nor.push(nx, 0, nz, nx, 0, nz)
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2
    const b = ((i + 1) % n) * 2
    idx.push(a, b, a + 1, b, b + 1, a + 1)
  }

  // Caps
  for (let cap = 0; cap <= 1; cap++) {
    const y = cap === 0 ? -hy : hy
    const ny = cap === 0 ? -1 : 1
    const centre = pos.length / 3
    pos.push(0, y, 0)
    nor.push(0, ny, 0)
    for (let i = 0; i < n; i++) {
      pos.push(outline[i][0], y, outline[i][1])
      nor.push(0, ny, 0)
    }
    for (let i = 0; i < n; i++) {
      const a = centre + 1 + i
      const b = centre + 1 + ((i + 1) % n)
      if (cap === 0) idx.push(centre, b, a)
      else idx.push(centre, a, b)
    }
  }

  return build(pos, nor, idx)
}

/** A flat disc on the XZ plane, facing +Y. Used for contact shadows. */
export function disc(radius: number, seg = 28): Geometry {
  const pos: number[] = [0, 0, 0]
  const nor: number[] = [0, 1, 0]
  const idx: number[] = []
  for (let s = 0; s <= seg; s++) {
    const t = (s / seg) * Math.PI * 2
    pos.push(Math.cos(t) * radius, 0, Math.sin(t) * radius)
    nor.push(0, 1, 0)
  }
  for (let s = 0; s < seg; s++) idx.push(0, s + 1, s + 2)
  return build(pos, nor, idx)
}
