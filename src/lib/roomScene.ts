/**
 * The landing room: a workspace built out of clay models, with a honeycomb of
 * wall panels that the page turns into real links by projecting their centres
 * back into screen space each frame.
 */

import { clamp, createGL, m4, resizeCanvas, smoothstep, type Mat4 } from './gl'
import { createClay, type Clay } from './clay'
import { P } from './palette'
import {
  backpack,
  books,
  chair,
  cup,
  drawDog,
  hexPanel,
  lamp,
  laptop,
  person,
  plant,
  sideTable,
  type DogState,
} from './models'

export type HexSpot = {
  id: string
  /** Percent of the canvas box. */
  x: number
  y: number
  /** On-screen panel radius, as a percentage of the canvas height. */
  radius: number
  visible: boolean
}

export type Layout = 'wide' | 'compact'

export type Room = {
  render(nowMs: number): void
  setPointer(nx: number, ny: number): void
  setLayout(l: Layout): void
  setHover(id: string | null): void
  setDog(state: Partial<DogState>): void
  /** Screen positions for the wall panels, refreshed every frame. */
  spots(): HexSpot[]
  resize(): void
  dispose(): void
}

/** Wall panels, in the order they are laid out in the honeycomb. */
export const HEX_LINKS = [
  { id: 'about', label: 'About', href: '#about' },
  { id: 'labs', label: 'Research', href: '#labs' },
  { id: 'papers', label: 'Papers', href: '#papers' },
  { id: 'openings', label: 'Teaching', href: '#openings' },
  { id: 'arcade', label: 'Arcade', href: '#arcade' },
  { id: 'contact', label: 'Contact', href: '#contact' },
] as const

// Honeycomb, two columns of three, hung on the wall to the left of the chair.
const HEX_R = 0.52
const HEX_DX = 0.9
const HEX_DY = 0.76
const HEX_ORIGIN: [number, number, number] = [-2.55, 4.15, -1.5]

const HEX_POS = HEX_LINKS.map((_, i) => {
  const col = i % 2
  const row = Math.floor(i / 2)
  return [
    HEX_ORIGIN[0] + col * HEX_DX,
    HEX_ORIGIN[1] - row * HEX_DY - col * HEX_DY * 0.5,
    HEX_ORIGIN[2],
  ] as [number, number, number]
})

type Prop = {
  id: string
  pos: [number, number, number]
  rotY?: number
  at: number
  draw(c: Clay, m: Mat4, t: number): void
  shadow?: [number, number, number, number?]
}

const PROPS: Prop[] = [
  { id: 'chair', pos: [0, 0, 0], at: 0.0, draw: (c, m, t) => chair.draw(c, m, t), shadow: [0, 0.1, 1.95, 0.32] },
  { id: 'person', pos: [0, 0, 0], at: 0.12, draw: (c, m, t) => person.draw(c, m, t) },
  { id: 'laptop', pos: [0, 1.6, 0.66], at: 0.2, draw: (c, m, t) => laptop.draw(c, m, t) },
  { id: 'plant', pos: [-3.05, 0, 0.95], at: 0.3, draw: (c, m, t) => plant.draw(c, m, t), shadow: [-3.05, 0.95, 0.62, 0.3] },
  { id: 'books', pos: [-2.95, 0, 2.05], rotY: 0.4, at: 0.38, draw: (c, m, t) => books.draw(c, m, t), shadow: [-2.95, 2.05, 0.55, 0.26] },
  { id: 'table', pos: [2.55, 0, 0.1], at: 0.34, draw: (c, m, t) => sideTable.draw(c, m, t), shadow: [2.55, 0.1, 0.68, 0.26] },
  { id: 'lamp', pos: [2.42, 1.1, -0.1], at: 0.46, draw: (c, m, t) => lamp.draw(c, m, t) },
  { id: 'cup', pos: [2.86, 1.1, 0.3], at: 0.52, draw: (c, m, t) => cup.draw(c, m, t) },
  { id: 'bag', pos: [1.82, 0, 1.45], rotY: -0.35, at: 0.44, draw: (c, m, t) => backpack.draw(c, m, t), shadow: [1.82, 1.5, 0.55, 0.3] },
]

export function createRoom(
  canvas: HTMLCanvasElement,
  detail: number,
  reducedMotion: boolean,
): Room | null {
  const ctx = createGL(canvas, detail > 1)
  if (!ctx) return null
  const gl = ctx.gl as WebGLRenderingContext
  const maybeClay = createClay(gl, detail, [0.36, 0.38, 0.56])
  if (!maybeClay) return null
  // Rebound so the render loop below needs no null guards.
  const clay: Clay = maybeClay

  const maxDpr = detail > 1 ? 2 : 1.4
  const proj = m4.create()
  const view = m4.create()
  const world = m4.create()

  let layout: Layout = 'wide'
  let px = 0
  let py = 0
  let sx = 0
  let sy = 0
  let hover: string | null = null
  let lost = false
  let start = 0
  const dogState: DogState = { lookX: 0, lookY: 0, pet: 0, alert: 0, blink: 0 }
  let blinkAt = 2.5

  const out: HexSpot[] = HEX_LINKS.map((h) => ({
    id: h.id,
    x: 0,
    y: 0,
    radius: 6,
    visible: false,
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
  // No back-face culling: the primitives are closed solids and the scene is
  // far too small for it to matter, so winding never has to be audited.
  gl.clearColor(0, 0, 0, 0)

  /** Projects a world point into 0..100 percent of the canvas. */
  function project(x: number, y: number, z: number): [number, number, number] {
    const vx = view[0] * x + view[4] * y + view[8] * z + view[12]
    const vy = view[1] * x + view[5] * y + view[9] * z + view[13]
    const vz = view[2] * x + view[6] * y + view[10] * z + view[14]
    const w = -vz
    if (w <= 0.001) return [0, 0, -1]
    return [((proj[0] * vx) / w) * 50 + 50, 50 - ((proj[5] * vy) / w) * 50, w]
  }

  function render(nowMs: number) {
    if (lost) return
    if (!start) start = nowMs
    const t = nowMs / 1000
    const elapsed = (nowMs - start) / 1000
    const intro = reducedMotion ? 1 : smoothstep(0, 1, clamp(elapsed / 1.5, 0, 1))

    sx += (px - sx) * 0.06
    sy += (py - sy) * 0.06

    resizeCanvas(canvas, gl, maxDpr)
    const aspect = canvas.width / Math.max(1, canvas.height)
    const compact = layout === 'compact'

    // A compact frame pulls back and centres on the chair; a wide one sits
    // lower and lets the props spread out.
    const dist = compact ? 11.3 : 10.6
    const targetY = compact ? 1.5 : 2.0
    const eye: [number, number, number] = [
      sx * 0.7,
      2.35 + -sy * 0.45 + (compact ? -0.35 : 0),
      dist,
    ]
    m4.perspective(proj, ((compact ? 34 : 31) * Math.PI) / 180, aspect, 0.5, 60)
    m4.lookAt(view, eye, [sx * 0.25, targetY, 0], [0, 1, 0])

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    clay.begin(proj, view, eye)

    // Contact shadows first, with depth writes off so they can overlap.
    gl.depthMask(false)
    for (const p of PROPS) {
      if (!p.shadow) continue
      const k = smoothstep(p.at, p.at + 0.35, intro)
      if (k <= 0.01) continue
      const [x, z, r, s] = p.shadow
      clay.shadow(x, z, r * k, (s ?? 0.3) * k)
    }
    clay.shadow(-1.85, 2.1, 0.58 * smoothstep(0.5, 0.85, intro), 0.3)
    gl.depthMask(true)

    // Props, each popping in on its own beat.
    for (const p of PROPS) {
      const k = smoothstep(p.at, p.at + 0.35, intro)
      if (k <= 0.01) continue
      const ease = 1 - Math.pow(1 - k, 3)
      m4.compose(
        world,
        p.pos[0], p.pos[1] + (1 - ease) * -0.5, p.pos[2],
        0, p.rotY ?? 0, 0,
        ease, ease, ease,
      )
      p.draw(clay, world, t)
    }

    // BYTE, sitting beside the chair.
    const dk = smoothstep(0.5, 0.9, intro)
    if (dk > 0.01) {
      if (!reducedMotion) {
        blinkAt -= 1 / 60
        if (blinkAt <= 0) {
          dogState.blink = 1
          blinkAt = 2.5 + Math.random() * 3.5
        }
        dogState.blink = Math.max(0, dogState.blink - 0.06)
      }
      dogState.lookX = clamp(sx * 1.3, -1, 1)
      dogState.lookY = clamp(sy * 0.8, -1, 1)
      const ds = dk * 0.72
      m4.compose(world, -1.85, (1 - dk) * -0.4, 2.1, 0, 0.5, 0, ds, ds, ds)
      drawDog(clay, world, t, dogState)
    }

    // Wall panels, and their screen positions for the links on top.
    for (let i = 0; i < HEX_POS.length; i++) {
      const [hx, hy, hz] = HEX_POS[i]
      // The last panel must reach 1 before intro runs out, or its link would
      // never cross the visibility threshold below.
      const k = smoothstep(0.45 + i * 0.05, 0.68 + i * 0.05, intro)
      const spot = out[i]
      if (compact || k <= 0.01) {
        spot.visible = false
        continue
      }
      const lift = hover === HEX_LINKS[i].id ? 1 : 0
      const float = reducedMotion ? 0 : Math.sin(t * 1.1 + i * 0.9) * 0.045
      const ease = 1 - Math.pow(1 - k, 3)
      m4.compose(world, hx, hy + float + (1 - ease) * 0.4, hz + lift * 0.22, 0, 0, 0, ease, ease, ease)
      hexPanel(clay, world, P.hex[i % P.hex.length], 0)

      const [sxp, syp, w] = project(hx, hy + float, hz + lift * 0.22 + 0.2)
      // Measure the panel on screen rather than guessing from depth, so the
      // link box tracks it through any camera or viewport change.
      const [, syTop] = project(hx, hy + float + HEX_R, hz + lift * 0.22 + 0.2)
      spot.x = sxp
      spot.y = syp
      spot.radius = Math.abs(syTop - syp)
      spot.visible = w > 0 && k > 0.85
    }
  }

  return {
    render,
    setPointer(nx, ny) {
      px = clamp(nx, -1, 1)
      py = clamp(ny, -1, 1)
    },
    setLayout(l) {
      layout = l
    },
    setHover(id) {
      hover = id
      dogState.alert = id ? 1 : 0
    },
    setDog(state) {
      Object.assign(dogState, state)
    },
    spots() {
      return out
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
