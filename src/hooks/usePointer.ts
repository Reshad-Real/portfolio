import { useEffect, useRef } from 'react'

export type PointerState = {
  /** Viewport pixels. */
  x: number
  y: number
  /** -1..1 relative to the viewport centre. */
  nx: number
  ny: number
  /** Smoothed copies, safe to drive animation with. */
  sx: number
  sy: number
  down: boolean
  /** True once a real pointer has moved; false on touch-only first paint. */
  active: boolean
  /** Device tilt in -1..1, when the device reports orientation. */
  tiltX: number
  tiltY: number
}

/**
 * A single shared pointer tracker written into a ref rather than state, so
 * animation frames can read it without re-rendering the React tree.
 */
export function usePointer(enabled = true) {
  const ref = useRef<PointerState>({
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    sx: 0,
    sy: 0,
    down: false,
    active: false,
    tiltX: 0,
    tiltY: 0,
  })

  useEffect(() => {
    if (!enabled) return
    const s = ref.current

    const setFrom = (cx: number, cy: number) => {
      s.x = cx
      s.y = cy
      s.nx = (cx / window.innerWidth) * 2 - 1
      s.ny = (cy / window.innerHeight) * 2 - 1
      s.active = true
    }

    const onMove = (e: PointerEvent) => setFrom(e.clientX, e.clientY)
    const onDown = (e: PointerEvent) => {
      s.down = true
      setFrom(e.clientX, e.clientY)
    }
    const onUp = () => {
      s.down = false
    }
    const onLeave = () => {
      s.active = false
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      s.tiltX = Math.max(-1, Math.min(1, e.gamma / 45))
      s.tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 45))
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('deviceorientation', onOrient)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('deviceorientation', onOrient)
    }
  }, [enabled])

  return ref
}

/** Advances the smoothed pointer values; call once per animation frame. */
export function easePointer(s: PointerState, factor = 0.08) {
  s.sx += (s.nx - s.sx) * factor
  s.sy += (s.ny - s.sy) * factor
}
