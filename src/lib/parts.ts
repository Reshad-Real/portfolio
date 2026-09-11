/**
 * The device that assembles in the startup chamber: an asymmetric-spacer
 * tri-gate on a GaN channel, in roughly the proportions of the real stack.
 *
 * `at` is where the part starts assembling within the boot window, `label` is
 * the floating callout (blank means the part is drawn but not annotated, so the
 * screen never fills with overlapping text) and `labelDy` nudges the callout
 * clear of its neighbours.
 */
export type PartSpec = {
  tx: number; ty: number; tz: number
  sx: number; sy: number; sz: number
  ox: number; oy: number; oz: number
  color: [number, number, number]
  emissive: [number, number, number]
  at: number
  rim: number
  label: string
  labelDy: number
}

export const DEVICE_PARTS: PartSpec[] = [
  {
    tx: 0, ty: -0.62, tz: 0,
    sx: 5.4, sy: 0.34, sz: 3.0,
    ox: 0, oy: -3.2, oz: 0,
    color: [0.11, 0.12, 0.16], emissive: [0, 0, 0],
    at: 0.0, rim: 0.35, label: '', labelDy: 0,
  },
  {
    tx: 0, ty: -0.36, tz: 0,
    sx: 5.0, sy: 0.2, sz: 2.7,
    ox: 0, oy: -2.4, oz: 0,
    color: [0.13, 0.19, 0.23], emissive: [0, 0.01, 0.02],
    at: 0.06, rim: 0.4, label: 'GaN buffer', labelDy: 7,
  },
  {
    tx: 0, ty: -0.06, tz: 0,
    sx: 3.9, sy: 0.4, sz: 0.46,
    ox: 0, oy: 2.6, oz: 0,
    color: [0.1, 0.4, 0.4], emissive: [0.01, 0.1, 0.1],
    at: 0.16, rim: 1.0, label: '', labelDy: 0,
  },
  {
    tx: 0, ty: 0.06, tz: 0,
    sx: 3.9, sy: 0.12, sz: 0.62,
    ox: 0, oy: 3.0, oz: 0,
    color: [0.24, 0.46, 0.62], emissive: [0.02, 0.06, 0.12],
    at: 0.22, rim: 0.9, label: 'AlGaN / 2DEG', labelDy: -4,
  },
  {
    tx: 0, ty: 0.16, tz: 0,
    sx: 0.72, sy: 0.66, sz: 0.94,
    ox: 0, oy: 3.6, oz: 0,
    color: [0.62, 0.58, 0.3], emissive: [0.16, 0.13, 0.02],
    at: 0.3, rim: 1.4, label: 'wrapped gate · Lg 5 nm', labelDy: -13,
  },
  {
    tx: -0.62, ty: 0.06, tz: 0,
    sx: 0.4, sy: 0.44, sz: 0.8,
    ox: -3.4, oy: 0.8, oz: 0,
    color: [0.3, 0.27, 0.38], emissive: [0, 0, 0],
    at: 0.36, rim: 0.7, label: '', labelDy: 0,
  },
  {
    tx: 0.78, ty: 0.06, tz: 0,
    sx: 0.72, sy: 0.44, sz: 0.8,
    ox: 3.4, oy: 0.8, oz: 0,
    color: [0.3, 0.27, 0.38], emissive: [0, 0, 0],
    at: 0.4, rim: 0.7, label: 'asymmetric spacer', labelDy: 16,
  },
  {
    tx: -1.5, ty: 0.12, tz: 0,
    sx: 0.8, sy: 0.56, sz: 0.86,
    ox: -4.4, oy: 1.6, oz: 0,
    color: [0.56, 0.56, 0.6], emissive: [0.02, 0.02, 0.03],
    at: 0.46, rim: 1.1, label: 'source', labelDy: -7,
  },
  {
    tx: 1.66, ty: 0.12, tz: 0,
    sx: 0.8, sy: 0.56, sz: 0.86,
    ox: 4.4, oy: 1.6, oz: 0,
    color: [0.56, 0.56, 0.6], emissive: [0.02, 0.02, 0.03],
    at: 0.5, rim: 1.1, label: 'drain', labelDy: -7,
  },
]
