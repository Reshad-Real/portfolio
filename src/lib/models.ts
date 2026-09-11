/**
 * Every object in the room, built from clay primitives.
 *
 * Each model draws itself relative to a parent matrix and reports the radius
 * it occupies, so the same code can be dropped into the room or framed on its
 * own in the inspector.
 */

import { m4, type Mat4 } from './gl'
import type { Clay, Rgb } from './clay'
import { P } from './palette'

export type Model = {
  name: string
  /** Framing hints for the inspector. */
  radius: number
  center: [number, number, number]
  /** Ground shadows, drawn by the room rather than the model. */
  shadow?: [x: number, z: number, r: number, strength?: number]
  draw(c: Clay, parent: Mat4, t: number): void
}

// Scratch matrices. Rendering is single-threaded and each is consumed
// immediately after it is written, so a shared pool is safe.
const A = m4.create()
const B = m4.create()
const C = m4.create()
const D = m4.create()

// ---------------------------------------------------------------- armchair

export const chair: Model = {
  name: 'Armchair',
  radius: 2.1,
  center: [0, 1.05, 0],
  shadow: [0, 0.1, 1.9, 0.34],
  draw(c, parent) {
    // legs
    for (const [x, z] of [
      [-0.95, 0.72], [0.95, 0.72], [-0.95, -0.72], [0.95, -0.72],
    ] as const) {
      c.draw(c.node(A, parent, x, 0.16, z, 0, 0, 0), c.tube(0.085, 0.07, 0.32, 10), P.chairLeg)
    }
    // seat block and cushion
    c.draw(c.node(A, parent, 0, 0.62, 0, 0, 0, 0), c.rbox(2.5, 0.62, 2.0, 0.22), P.chair)
    c.draw(c.node(A, parent, 0, 1.0, 0.06, 0, 0, 0), c.rbox(1.94, 0.34, 1.76, 0.16), P.chairLight)
    // back
    c.draw(c.node(A, parent, 0, 1.62, -0.86, 0.06, 0, 0), c.rbox(2.5, 1.72, 0.5, 0.24), P.chair)
    c.draw(c.node(A, parent, 0, 1.6, -0.6, 0.06, 0, 0), c.rbox(1.9, 1.4, 0.24, 0.12), P.chairLight)
    // arms
    for (const s of [-1, 1]) {
      c.draw(
        c.node(A, parent, s * 1.14, 1.1, 0.04, 0, 0, 0),
        c.rbox(0.46, 0.62, 2.0, 0.22),
        P.chairDark,
      )
    }
  },
}

// ------------------------------------------------------------------ person

export const person: Model = {
  name: 'Person',
  radius: 1.5,
  center: [0, 1.9, 0],
  draw(c, parent, t) {
    const breathe = Math.sin(t * 1.4) * 0.012
    const tap = Math.sin(t * 7) * 0.02

    // ---- lower body: cross-legged, shoes forward
    for (const s of [-1, 1]) {
      c.draw(
        c.node(A, parent, s * 0.36, 1.24, 0.34, -0.35, s * 0.5, 0),
        c.rbox(0.34, 0.86, 0.34, 0.16),
        P.denim,
      )
      c.draw(
        c.node(A, parent, s * 0.3, 1.06, 0.74, -0.2, s * 0.28, 0),
        c.rbox(0.3, 0.22, 0.52, 0.1),
        P.shirt,
      )
      c.draw(
        c.node(A, parent, s * 0.3, 1.0, 0.82, -0.2, s * 0.28, 0),
        c.rbox(0.32, 0.14, 0.3, 0.07),
        P.glass,
      )
    }

    // ---- torso
    c.draw(
      c.node(A, parent, 0, 1.86 + breathe, 0.02, 0, 0, 0),
      c.rbox(1.02, 1.0, 0.66, 0.3),
      P.shirt,
    )
    // neck
    c.draw(c.node(A, parent, 0, 2.36, 0.02, 0, 0, 0), c.tube(0.16, 0.19, 0.26, 12), P.skinDark)

    // ---- arms: shoulder down to an elbow, then forward to the keyboard
    for (const s of [-1, 1]) {
      const shoulder = c.node(C, parent, s * 0.55, 2.14, 0.02, 0, 0, s * 0.22)
      c.draw(c.node(A, shoulder, 0, -0.26, 0, 0, 0, 0), c.rbox(0.26, 0.6, 0.26, 0.13), P.shirt)
      const elbow = c.node(D, shoulder, 0, -0.5, 0, -1.25, 0, s * -0.16)
      c.draw(c.node(A, elbow, 0, -0.26, 0, 0, 0, 0), c.rbox(0.23, 0.56, 0.23, 0.115), P.shirt)
      c.draw(
        c.node(A, elbow, 0, -0.56, tap * s, 0, 0, 0),
        c.ball(0.13),
        P.skin,
      )
    }

    // ---- head
    const head = c.node(B, parent, 0, 2.76, 0.04, 0, 0, 0)
    c.draw(c.node(A, head, 0, 0, 0, 0, 0, 0, 1, 1.06, 0.95), c.ball(0.52), P.skin)
    // ears
    for (const s of [-1, 1]) {
      c.draw(c.node(A, head, s * 0.5, -0.04, -0.02, 0, 0, 0, 0.5, 1, 0.8), c.ball(0.16), P.skinDark)
    }
    // hair: a bowl cut, plus a fringe across the brow
    c.draw(c.node(A, head, 0, 0.12, -0.05, 0, 0, 0, 1.04, 0.9, 1.0), c.ball(0.52), P.hair)
    // Fringe sits above the brow so it does not swallow the glasses.
    c.draw(c.node(A, head, 0, 0.29, 0.22, 0.36, 0, 0), c.rbox(0.84, 0.24, 0.4, 0.11), P.hair)
    // glasses
    for (const s of [-1, 1]) {
      c.draw(
        c.node(A, head, s * 0.2, 0.0, 0.45, Math.PI / 2, 0, 0),
        c.ring(0.14, 0.028, 16, 7),
        P.glass,
      )
      c.draw(
        c.node(A, head, s * 0.4, -0.02, 0.2, 0, 0, 0),
        c.rbox(0.04, 0.04, 0.36, 0.02),
        P.glass,
      )
    }
    c.draw(c.node(A, head, 0, -0.02, 0.46, 0, 0, 0), c.rbox(0.14, 0.03, 0.03, 0.015), P.glass)

    // headphones
    c.draw(c.node(A, head, 0, 0.06, -0.02, Math.PI / 2, 0, 0), c.ring(0.56, 0.075, 20, 8), P.cans)
    for (const s of [-1, 1]) {
      c.draw(
        c.node(A, head, s * 0.56, -0.02, 0, 0, 0, Math.PI / 2),
        c.tube(0.2, 0.2, 0.16, 14),
        P.cansDark,
      )
      c.draw(
        c.node(A, head, s * 0.645, -0.02, 0, 0, 0, Math.PI / 2),
        c.tube(0.13, 0.13, 0.03, 12),
        P.pink,
      )
    }
  },
}

// ------------------------------------------------------------------ laptop

export const laptop: Model = {
  name: 'Laptop',
  radius: 0.9,
  center: [0, 0.4, 0],
  draw(c, parent, t) {
    const glow = 0.5 + Math.sin(t * 2.2) * 0.06
    // base resting on the lap
    c.draw(c.node(A, parent, 0, 0.04, 0.1, -0.1, 0, 0), c.rbox(1.34, 0.08, 0.88, 0.04), P.laptopEdge)
    // lid, tipped back toward the viewer
    const lid = c.node(B, parent, 0, 0.48, 0.34, 0.16, 0, 0)
    c.draw(c.node(A, lid, 0, 0, 0, 0, 0, 0), c.rbox(1.34, 0.92, 0.07, 0.05), P.laptop)
    // stickers on the back of the lid
    const sticker = (x: number, y: number, col: Rgb, r = 0.13) => {
      c.draw(c.node(A, lid, x, y, 0.05, Math.PI / 2, 0, 0), c.tube(r, r, 0.02, 14), col)
    }
    sticker(-0.36, 0.14, P.pink)
    sticker(0, 0.14, P.leaf)
    sticker(0.36, 0.14, P.wood, 0.11)
    c.draw(
      c.node(A, lid, 0, -0.22, 0.05, 0, 0, 0),
      c.rbox(0.72, 0.2, 0.03, 0.09),
      P.lamp,
      { emissive: [glow * 0.08, glow * 0.04, glow * 0.12] },
    )
  },
}

// ------------------------------------------------------------- hex panel

export function hexPanel(c: Clay, parent: Mat4, color: Rgb, lift: number) {
  const n = c.node(A, parent, 0, 0, lift * 0.18, Math.PI / 2, 0, 0)
  c.draw(n, c.hex(0.52, 0.16, 0.2), color, { shine: 0.12 })
  c.draw(c.node(B, parent, 0, 0, 0.1 + lift * 0.18, Math.PI / 2, 0, 0), c.hex(0.4, 0.12, 0.06), [
    color[0] * 0.82 + 0.18,
    color[1] * 0.82 + 0.18,
    color[2] * 0.82 + 0.18,
  ])
}

export const hexTile: Model = {
  name: 'Hex panel',
  radius: 0.75,
  center: [0, 0, 0],
  draw(c, parent) {
    hexPanel(c, parent, P.hex[0], 0)
  },
}

// ------------------------------------------------------------------- plant

export const plant: Model = {
  name: 'Plant',
  radius: 1.0,
  center: [0, 0.85, 0],
  shadow: [0, 0, 0.6, 0.3],
  draw(c, parent, t) {
    // stand
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4
      c.draw(
        c.node(A, parent, Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3, 0.16, -a, 0),
        c.tube(0.035, 0.035, 0.64, 8),
        P.wood,
      )
    }
    c.draw(c.node(A, parent, 0, 0.62, 0, 0, 0, 0), c.tube(0.34, 0.34, 0.04, 16), P.woodDark)
    // pot
    c.draw(c.node(A, parent, 0, 0.86, 0, 0, 0, 0), c.tube(0.36, 0.27, 0.46, 18), P.pot)
    c.draw(c.node(A, parent, 0, 1.1, 0, 0, 0, 0), c.tube(0.39, 0.39, 0.08, 18), P.potRim)
    c.draw(c.node(A, parent, 0, 1.13, 0, 0, 0, 0), c.tube(0.33, 0.33, 0.03, 16), P.potSoil)
    // Leaves pivot from the soil, not from their own centre, so they fan out
    // as blades instead of collapsing into one blob.
    const n = 9
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3
      const sway = Math.sin(t * 0.9 + i * 1.3) * 0.05
      const lean = 0.2 + (i % 3) * 0.16
      const len = 0.62 + (i % 4) * 0.12
      // The pivot carries the tilt; the leaf then runs along its local up.
      const root = c.node(B, parent, 0, 1.12, 0, lean + sway, -a, 0)
      c.draw(
        c.node(A, root, 0, len * 0.95, 0, 0, 0, 0, 0.07, len, 0.2),
        c.ball(1),
        i % 2 ? P.leaf : P.leafDark,
      )
    }
  },
}

// -------------------------------------------------------------- side table

export const sideTable: Model = {
  name: 'Side table',
  radius: 0.95,
  center: [0, 0.6, 0],
  shadow: [0, 0, 0.62, 0.26],
  draw(c, parent) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      c.draw(
        c.node(A, parent, Math.cos(a) * 0.34, 0.52, Math.sin(a) * 0.34, 0.2, -a, 0),
        c.tube(0.035, 0.035, 1.06, 8),
        P.metal,
      )
    }
    c.draw(c.node(A, parent, 0, 1.06, 0, 0, 0, 0), c.tube(0.66, 0.66, 0.09, 22), P.wood)
    c.draw(c.node(A, parent, 0, 1.0, 0, 0, 0, 0), c.tube(0.6, 0.6, 0.05, 20), P.woodDark)
  },
}

export const cup: Model = {
  name: 'Cup',
  radius: 0.3,
  center: [0, 0.12, 0],
  draw(c, parent) {
    c.draw(c.node(A, parent, 0, 0.11, 0, 0, 0, 0), c.tube(0.12, 0.1, 0.22, 14), P.cup)
    c.draw(c.node(A, parent, 0, 0.22, 0, 0, 0, 0), c.tube(0.13, 0.13, 0.03, 14), P.cupDark)
    c.draw(c.node(A, parent, 0.13, 0.13, 0, 0, 0, Math.PI / 2), c.ring(0.05, 0.017, 12, 6), P.cupDark)
  },
}

// -------------------------------------------------------------------- lamp

export const lamp: Model = {
  name: 'Desk lamp',
  radius: 1.0,
  center: [0, 0.9, 0],
  shadow: [0, 0, 0.42, 0.24],
  draw(c, parent, t) {
    const glow = 0.55 + Math.sin(t * 1.7) * 0.05
    c.draw(c.node(A, parent, 0, 0.05, 0, 0, 0, 0), c.tube(0.26, 0.3, 0.1, 18), P.lampDark)
    c.draw(c.node(A, parent, 0, 0.62, 0, 0, 0, 0), c.tube(0.05, 0.05, 1.1, 10), P.lamp)
    // elbow and arm
    c.draw(c.node(A, parent, 0, 1.16, 0, 0, 0, 0), c.ball(0.09), P.lampDark)
    // Arm reaches out to the left and forward over the desk.
    const arm = c.node(B, parent, 0, 1.16, 0, 0, 0, 0.85)
    c.draw(c.node(A, arm, 0, 0.3, 0.06, -0.25, 0, 0), c.tube(0.045, 0.045, 0.62, 8), P.lamp)
    // The cone is already widest at its base, so the shade only needs a tilt
    // to point down and forward at the desk.
    const shade = c.node(C, arm, -0.02, 0.6, 0.2, 0.45, 0, -0.5)
    c.draw(c.node(A, shade, 0, 0.2, 0, 0, 0, 0), c.tube(0.13, 0.33, 0.44, 20), P.lamp)
    c.draw(c.node(A, shade, 0, 0.42, 0, 0, 0, 0), c.ball(0.075), P.lampDark)
    c.draw(
      c.node(A, shade, 0, 0.02, 0, 0, 0, 0),
      c.tube(0.29, 0.29, 0.05, 18),
      P.bulb,
      { emissive: [glow * 0.55, glow * 0.46, glow * 0.22] },
    )
  },
}

// ---------------------------------------------------------------- backpack

export const backpack: Model = {
  name: 'Backpack',
  radius: 0.8,
  center: [0, 0.55, 0],
  shadow: [0, 0.05, 0.55, 0.3],
  draw(c, parent) {
    c.draw(c.node(A, parent, 0, 0.58, 0, 0, 0, 0), c.rbox(0.8, 1.0, 0.56, 0.26), P.bag)
    // flap
    c.draw(c.node(A, parent, 0, 0.86, 0.06, -0.08, 0, 0), c.rbox(0.78, 0.46, 0.58, 0.22), P.bagDark)
    // front pocket
    c.draw(c.node(A, parent, 0, 0.4, 0.26, 0, 0, 0), c.rbox(0.54, 0.36, 0.18, 0.1), P.bagDark)
    // straps
    for (const s of [-1, 1]) {
      c.draw(
        c.node(A, parent, s * 0.2, 0.62, -0.3, 0.1, 0, 0),
        c.rbox(0.14, 0.86, 0.1, 0.05),
        P.bagStrap,
      )
    }
    c.draw(c.node(A, parent, 0, 1.12, -0.06, Math.PI / 2, 0, 0), c.ring(0.1, 0.028, 12, 6), P.bagStrap)
  },
}

// ------------------------------------------------------------------- books

export const books: Model = {
  name: 'Books',
  radius: 0.7,
  center: [0, 0.2, 0],
  shadow: [0, 0, 0.5, 0.24],
  draw(c, parent) {
    const cols = [P.book2, P.book1, P.book3]
    for (let i = 0; i < 3; i++) {
      c.draw(
        c.node(A, parent, i * 0.03, 0.08 + i * 0.14, i * 0.02, 0, i * 0.12 - 0.1, 0),
        c.rbox(0.78, 0.13, 0.56, 0.035),
        cols[i],
      )
    }
  },
}

// --------------------------------------------------------------------- dog

export type DogState = {
  /** -1..1, where the head turns. */
  lookX: number
  lookY: number
  /** 0..1, how hard he is being petted. */
  pet: number
  /** 0..1, alertness. Lifts the ears and brightens the optic. */
  alert: number
  /** 0..1, eyelid closed. */
  blink: number
}

const DOG_IDLE: DogState = { lookX: 0, lookY: 0, pet: 0, alert: 0, blink: 0 }

/**
 * BYTE: a golden retriever puppy sitting up, with the left side of his face
 * replaced by a chrome plate and a lit optic where that eye used to be.
 * Sitting height is about 1.9 units, head centred near y = 1.3.
 */
export function drawDog(c: Clay, parent: Mat4, t: number, s: DogState = DOG_IDLE) {
  const breathe = Math.sin(t * 1.9) * 0.014
  const wag = Math.sin(t * (4.5 + s.pet * 13)) * (0.3 + s.pet * 0.6)
  const bounce = s.pet * Math.abs(Math.sin(t * 7.5)) * 0.045
  const open = 1 - s.blink * 0.88

  const root = c.node(C, parent, 0, bounce, 0, 0, 0, 0)

  // ---- hindquarters, splayed the way a sitting dog's are
  for (const side of [-1, 1] as const) {
    c.draw(
      c.node(A, root, side * 0.42, 0.15, 0.02, 0, side * -0.2, 0, 0.5, 0.34, 0.8),
      c.ball(0.5),
      P.furDark,
    )
  }
  c.draw(c.node(A, root, 0, 0.44, -0.3, 0, 0, 0, 1.06, 0.95, 1.0), c.ball(0.5), P.fur)

  // ---- chest, upright
  c.draw(
    c.node(A, root, 0, 0.72 + breathe, 0.06, 0.1, 0, 0, 0.94, 1.08, 0.9),
    c.ball(0.5),
    P.fur,
  )
  c.draw(c.node(A, root, 0, 0.64, 0.3, 0, 0, 0, 0.6, 0.78, 0.42), c.ball(0.5), P.furLight)

  // ---- front legs
  for (const side of [-1, 1] as const) {
    c.draw(c.node(A, root, side * 0.24, 0.36, 0.3, 0, 0, 0), c.rbox(0.25, 0.62, 0.26, 0.12), P.fur)
    c.draw(
      c.node(A, root, side * 0.24, 0.1, 0.4, 0, 0, 0),
      c.rbox(0.29, 0.18, 0.38, 0.085),
      P.furLight,
    )
  }

  // ---- tail: pivots at the rump so the wag swings the whole curve
  const tail = c.node(D, root, 0.16, 0.6, -0.6, -0.7, wag, 0.3)
  c.draw(c.node(A, tail, 0, 0.24, 0, 0, 0, 0, 0.5, 0.58, 0.5), c.ball(0.5), P.fur)
  c.draw(c.node(A, tail, 0, 0.54, -0.06, 0.5, 0, 0, 0.44, 0.5, 0.44), c.ball(0.5), P.furLight)

  // ---- head
  const head = c.node(B, root, 0, 1.3, 0.12, -s.lookY * 0.28 + s.pet * 0.18, s.lookX * 0.42, s.pet * 0.14)

  c.draw(c.node(A, head, 0, 0, 0, 0, 0, 0, 1.06, 1.0, 0.98), c.ball(0.5), P.fur)
  // crown and cheek fluff
  c.draw(c.node(A, head, -0.04, 0.3, -0.02, 0, 0, 0.15, 0.78, 0.44, 0.78), c.ball(0.5), P.furLight)
  for (const side of [-1, 1] as const) {
    c.draw(
      c.node(A, head, side * 0.36, -0.12, 0.04, 0, 0, 0, 0.44, 0.6, 0.54),
      c.ball(0.5),
      P.furLight,
    )
  }

  // ---- muzzle, nose, open mouth and tongue
  c.draw(c.node(A, head, 0, -0.16, 0.32, 0, 0, 0, 0.62, 0.46, 0.6), c.ball(0.5), P.furLight)
  c.draw(c.node(A, head, 0, -0.07, 0.5, 0, 0, 0, 0.3, 0.24, 0.26), c.ball(0.5), P.nose)
  c.draw(c.node(A, head, 0, -0.3, 0.34, 0.15, 0, 0, 0.44, 0.24, 0.32), c.ball(0.5), P.nose)
  c.draw(
    c.node(A, head, 0, -0.42, 0.36, 0.3 + Math.sin(t * 3.1) * 0.06, 0, 0, 0.24, 0.32, 0.14),
    c.ball(0.5),
    P.tongue,
  )

  // ---- the fur half keeps the eye
  c.draw(
    c.node(A, head, -0.22, 0.07, 0.36, 0, -0.2, 0, 0.2, 0.24 * open + 0.02, 0.14),
    c.ball(0.5),
    P.eye,
  )
  if (open > 0.55) {
    c.draw(c.node(A, head, -0.27, 0.14, 0.42, 0, 0, 0, 0.06, 0.07, 0.05), c.ball(0.5), [1, 1, 1])
  }

  // ---- the chrome half. A half-width ellipsoid a shade proud of the skull,
  // so the seam down the middle of the face is exact rather than blended.
  const plate = c.node(D, head, 0.27, 0.0, 0.0, 0, 0, 0)
  c.draw(c.node(A, plate, 0, 0, 0, 0, 0, 0, 0.48, 0.95, 0.93), c.ball(0.51), P.chrome)
  // panel seams
  c.draw(c.node(A, plate, 0.02, 0.3, 0.06, 0, 0, 0.18, 0.44, 0.1, 0.72), c.ball(0.51), P.chromeDark)
  c.draw(c.node(A, plate, 0.06, -0.3, 0.12, 0, 0, -0.2, 0.4, 0.09, 0.6), c.ball(0.51), P.chromeDark)
  // jaw piece reaching toward the muzzle
  c.draw(
    c.node(A, plate, -0.06, -0.28, 0.26, 0.2, 0, 0.3, 0.34, 0.3, 0.44),
    c.ball(0.51),
    P.chromeDark,
  )

  // ---- optic: housing, lit iris, hot core. The plate already stands 0.52
  // proud of its own origin, so the stack has to start beyond that to be seen.
  const lit = 0.5 + s.alert * 0.55 + Math.sin(t * 2.4) * 0.08
  c.draw(c.node(A, plate, -0.02, 0.05, 0.4, Math.PI / 2, 0, 0), c.tube(0.21, 0.23, 0.18, 18), P.chromeDark)
  c.draw(
    c.node(A, plate, -0.02, 0.05, 0.5, Math.PI / 2, 0, 0, 1, 1, open),
    c.tube(0.16, 0.16, 0.06, 18),
    P.optic,
    { emissive: [0.05 * lit, 0.45 * lit, 0.85 * lit], shine: 0.2 },
  )
  c.draw(
    c.node(A, plate, -0.02, 0.05, 0.55, Math.PI / 2, 0, 0, 1, 1, open),
    c.tube(0.075, 0.075, 0.05, 14),
    [0.9, 0.99, 1],
    { emissive: [0.7 * lit, 0.95 * lit, 1.1 * lit] },
  )

  // ---- big floppy ears, set wide so the chrome plate cannot swallow them
  for (const side of [-1, 1] as const) {
    const flap = Math.sin(t * 2.3 + side) * 0.05 + s.pet * 0.3 - s.alert * 0.18
    const ear = c.node(D, head, side * 0.47, 0.14, 0.06, 0.1, 0, side * (0.34 + flap))
    c.draw(
      c.node(A, ear, side * 0.1, -0.46, 0, 0, 0, 0, 0.17, 0.52, 0.38),
      c.ball(0.5),
      side > 0 ? P.furDark : P.fur,
    )
  }
}

export const dog: Model = {
  name: 'BYTE',
  radius: 1.3,
  center: [0, 0.9, 0],
  shadow: [0, -0.05, 0.8, 0.3],
  draw(c, parent, t) {
    drawDog(c, parent, t)
  },
}

// ------------------------------------------------------------------ export

export const ALL_MODELS: Model[] = [
  chair,
  person,
  laptop,
  hexTile,
  plant,
  sideTable,
  cup,
  lamp,
  backpack,
  books,
  dog,
]
