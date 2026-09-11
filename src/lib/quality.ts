export type Quality = 'high' | 'medium' | 'low'

/**
 * A cheap, honest guess at how much 3D this device should be asked to do.
 * Nothing here blocks rendering; it only scales point counts and pixel ratio.
 */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'medium'

  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }

  if (nav.connection?.saveData) return 'low'

  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const narrow = window.innerWidth < 760
  const dpr = window.devicePixelRatio || 1

  if (cores <= 4 || memory <= 2) return 'low'
  if (narrow || coarse) return dpr > 2.5 ? 'low' : 'medium'
  if (cores <= 6 || memory <= 4) return 'medium'
  return 'high'
}

/** True when the browser can give us a WebGL context at all. */
export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
