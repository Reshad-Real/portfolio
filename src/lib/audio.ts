/**
 * Tiny arcade sound. Synthesised, so there is nothing to download, and the
 * AudioContext is only created after a real click inside the arcade.
 */

let ctx: AudioContext | null = null
let muted = true

type Ctor = typeof AudioContext
function getCtor(): Ctor | null {
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/** Must be called from a user gesture. Returns false when audio is unavailable. */
export function enableAudio(): boolean {
  const Ctor = getCtor()
  if (!Ctor) return false
  try {
    if (!ctx) ctx = new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    muted = false
    return true
  } catch {
    return false
  }
}

export function disableAudio() {
  muted = true
}

export function isAudioOn() {
  return !muted && !!ctx
}

export type Blip = 'coin' | 'zap' | 'hit' | 'ok' | 'bad' | 'level' | 'bark'

const RECIPES: Record<Blip, { f0: number; f1: number; dur: number; type: OscillatorType; gain: number }> = {
  coin: { f0: 880, f1: 1760, dur: 0.09, type: 'square', gain: 0.05 },
  zap: { f0: 520, f1: 120, dur: 0.11, type: 'sawtooth', gain: 0.045 },
  hit: { f0: 180, f1: 55, dur: 0.18, type: 'square', gain: 0.06 },
  ok: { f0: 660, f1: 990, dur: 0.12, type: 'triangle', gain: 0.05 },
  bad: { f0: 220, f1: 110, dur: 0.22, type: 'sawtooth', gain: 0.05 },
  level: { f0: 440, f1: 1320, dur: 0.26, type: 'square', gain: 0.045 },
  bark: { f0: 300, f1: 620, dur: 0.1, type: 'triangle', gain: 0.05 },
}

export function blip(kind: Blip) {
  if (muted || !ctx) return
  try {
    const now = ctx.currentTime
    const r = RECIPES[kind]
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = r.type
    osc.frequency.setValueAtTime(r.f0, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, r.f1), now + r.dur)
    gain.gain.setValueAtTime(r.gain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + r.dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + r.dur + 0.02)
  } catch {
    /* an audio failure must never break a game */
  }
}
