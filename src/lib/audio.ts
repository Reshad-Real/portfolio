/**
 * All sound on this site is synthesised in the browser: chiptune blips for the
 * arcade, a two-syllable bark for BYTE, and a lofi loop for the portfolio.
 * Nothing is downloaded and nothing is sampled, so there is no licence to
 * honour and no audio asset to ship.
 *
 * The context is only created from a real user gesture, and both channels are
 * off until they are switched on.
 */

type Ctor = typeof AudioContext

let ctx: AudioContext | null = null
let sfxBus: GainNode | null = null
let musicBus: GainNode | null = null
let sfxOn = false
let musicOn = false

function getCtor(): Ctor | null {
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/** Must be called from a user gesture. Returns false when audio is unavailable. */
function ensure(): boolean {
  const Ctor = getCtor()
  if (!Ctor) return false
  try {
    if (!ctx) {
      ctx = new Ctor()
      sfxBus = ctx.createGain()
      sfxBus.gain.value = 0.5
      sfxBus.connect(ctx.destination)
      musicBus = ctx.createGain()
      musicBus.gain.value = 0
      musicBus.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return true
  } catch {
    return false
  }
}

// --------------------------------------------------------------- chiptune

export type Blip =
  | 'coin' | 'zap' | 'hit' | 'ok' | 'bad' | 'level' | 'select'
  | 'power' | 'boss' | 'combo'

/** Stepped pitch, hard edges, short decay: the 8-bit way. */
type Recipe = {
  steps: number[]
  step: number
  dur: number
  type: OscillatorType
  gain: number
  noise?: number
}

const RECIPES: Record<Blip, Recipe> = {
  coin: { steps: [988, 1319], step: 0.055, dur: 0.13, type: 'square', gain: 0.16 },
  zap: { steps: [660, 440, 294], step: 0.022, dur: 0.08, type: 'square', gain: 0.1 },
  hit: { steps: [196, 131], step: 0.04, dur: 0.16, type: 'square', gain: 0.16, noise: 0.5 },
  ok: { steps: [523, 659, 784], step: 0.05, dur: 0.17, type: 'square', gain: 0.13 },
  bad: { steps: [233, 175, 117], step: 0.07, dur: 0.26, type: 'sawtooth', gain: 0.15, noise: 0.25 },
  level: { steps: [523, 659, 784, 1047], step: 0.06, dur: 0.28, type: 'square', gain: 0.14 },
  select: { steps: [784], step: 0.03, dur: 0.05, type: 'square', gain: 0.09 },
  power: { steps: [392, 523, 659, 880, 1047], step: 0.045, dur: 0.25, type: 'square', gain: 0.13 },
  boss: { steps: [147, 110, 147, 110], step: 0.13, dur: 0.55, type: 'sawtooth', gain: 0.16, noise: 0.2 },
  combo: { steps: [880, 1109, 1319], step: 0.04, dur: 0.14, type: 'triangle', gain: 0.12 },
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const n = Math.max(1, Math.floor(c.sampleRate * seconds))
  const buf = c.createBuffer(1, n, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
  return buf
}

export function blip(kind: Blip) {
  if (!sfxOn || !ctx || !sfxBus) return
  try {
    const c = ctx
    const now = c.currentTime
    const r = RECIPES[kind]

    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = r.type
    osc.frequency.setValueAtTime(r.steps[0], now)
    // Hold each step, then jump: no glide, which is what makes it read as 8-bit.
    r.steps.forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * r.step))
    gain.gain.setValueAtTime(r.gain, now)
    gain.gain.setValueAtTime(r.gain, now + r.dur * 0.6)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + r.dur)
    osc.connect(gain).connect(sfxBus)
    osc.start(now)
    osc.stop(now + r.dur + 0.02)

    if (r.noise) {
      const src = c.createBufferSource()
      src.buffer = noiseBuffer(c, r.dur)
      const ng = c.createGain()
      ng.gain.setValueAtTime(r.gain * r.noise, now)
      ng.gain.exponentialRampToValueAtTime(0.0001, now + r.dur)
      const hp = c.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 700
      src.connect(hp).connect(ng).connect(sfxBus)
      src.start(now)
      src.stop(now + r.dur)
    }
  } catch {
    /* a sound failure must never break a game */
  }
}

/** Two short syllables with a falling pitch: a small, pleased dog. */
export function bark(happy = false) {
  if (!sfxOn || !ctx || !sfxBus) return
  try {
    const c = ctx
    const base = happy ? 420 : 330
    for (let i = 0; i < 2; i++) {
      const t = c.currentTime + i * 0.15
      const dur = 0.12

      const osc = c.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(base * (i ? 0.82 : 1), t)
      osc.frequency.exponentialRampToValueAtTime(base * (i ? 0.5 : 0.62), t + dur)

      const band = c.createBiquadFilter()
      band.type = 'bandpass'
      band.frequency.setValueAtTime(1100, t)
      band.frequency.exponentialRampToValueAtTime(600, t + dur)
      band.Q.value = 2.4

      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)

      osc.connect(band).connect(g).connect(sfxBus)
      osc.start(t)
      osc.stop(t + dur + 0.02)

      // a breath of noise on the attack, so it sounds like an animal
      const src = c.createBufferSource()
      src.buffer = noiseBuffer(c, 0.05)
      const ng = c.createGain()
      ng.gain.setValueAtTime(0.09, t)
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
      const hp = c.createBiquadFilter()
      hp.type = 'bandpass'
      hp.frequency.value = 1400
      src.connect(hp).connect(ng).connect(sfxBus)
      src.start(t)
      src.stop(t + 0.05)
    }
  } catch {
    /* ignore */
  }
}

export function setSfx(on: boolean): boolean {
  if (on && !ensure()) return false
  sfxOn = on
  return sfxOn
}

export function isSfxOn() {
  return sfxOn
}

// ------------------------------------------------------------------ lofi

/**
 * Four bars at 72 BPM: a soft pad through a low-pass, a muted kick, an offbeat
 * hat, and a little vinyl noise. Scheduled a bar ahead so it never stutters.
 */
const BPM = 72
const BEAT = 60 / BPM
const BAR = BEAT * 4

// Dm9 · G7 · Cmaj7 · Am7, as semitone offsets from C2.
const PROG: number[][] = [
  [2, 9, 14, 17],
  [7, 11, 14, 18],
  [0, 7, 11, 16],
  [9, 12, 16, 19],
]

const hz = (semi: number) => 65.41 * Math.pow(2, semi / 12)

let loopTimer: number | null = null
let nextBarAt = 0
let bar = 0
let vinyl: AudioBufferSourceNode | null = null

function playPad(at: number, chord: number[]) {
  if (!ctx || !musicBus) return
  const c = ctx
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(700, at)
  filter.frequency.linearRampToValueAtTime(1250, at + BAR * 0.5)
  filter.frequency.linearRampToValueAtTime(650, at + BAR)
  filter.Q.value = 0.7
  filter.connect(musicBus)

  for (const semi of chord) {
    const osc = c.createOscillator()
    osc.type = 'triangle'
    // A touch of detune keeps it from sounding like a test tone.
    osc.detune.value = (Math.random() - 0.5) * 9
    osc.frequency.value = hz(semi + 12)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.linearRampToValueAtTime(0.05, at + 0.5)
    g.gain.setValueAtTime(0.05, at + BAR - 0.7)
    g.gain.linearRampToValueAtTime(0.0001, at + BAR - 0.05)
    osc.connect(g).connect(filter)
    osc.start(at)
    osc.stop(at + BAR)
  }

  // the root, an octave down
  const sub = c.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = hz(chord[0])
  const sg = c.createGain()
  sg.gain.setValueAtTime(0.0001, at)
  sg.gain.linearRampToValueAtTime(0.075, at + 0.3)
  sg.gain.linearRampToValueAtTime(0.0001, at + BAR - 0.05)
  sub.connect(sg).connect(musicBus)
  sub.start(at)
  sub.stop(at + BAR)
}

function playKick(at: number) {
  if (!ctx || !musicBus) return
  const c = ctx
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, at)
  osc.frequency.exponentialRampToValueAtTime(44, at + 0.13)
  const g = c.createGain()
  g.gain.setValueAtTime(0.22, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.24)
  osc.connect(g).connect(musicBus)
  osc.start(at)
  osc.stop(at + 0.26)
}

function playHat(at: number) {
  if (!ctx || !musicBus) return
  const c = ctx
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.05)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000
  const g = c.createGain()
  g.gain.setValueAtTime(0.035, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.045)
  src.connect(hp).connect(g).connect(musicBus)
  src.start(at)
  src.stop(at + 0.05)
}

function scheduleBar() {
  if (!ctx || !musicOn) return
  const c = ctx
  // Keep roughly a bar of music queued ahead of the clock.
  while (nextBarAt < c.currentTime + BAR * 1.2) {
    const at = Math.max(nextBarAt, c.currentTime + 0.05)
    playPad(at, PROG[bar % PROG.length])
    playKick(at)
    playKick(at + BEAT * 2)
    playKick(at + BEAT * 2.75)
    for (let i = 0; i < 4; i++) playHat(at + BEAT * (i + 0.5))
    bar += 1
    nextBarAt = at + BAR
  }
}

function startVinyl() {
  if (!ctx || !musicBus || vinyl) return
  const c = ctx
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 2)
  src.loop = true
  const lp = c.createBiquadFilter()
  lp.type = 'bandpass'
  lp.frequency.value = 3200
  lp.Q.value = 0.6
  const g = c.createGain()
  g.gain.value = 0.012
  src.connect(lp).connect(g).connect(musicBus)
  src.start()
  vinyl = src
}

export function setMusic(on: boolean): boolean {
  if (on) {
    if (!ensure() || !ctx || !musicBus) return false
    musicOn = true
    musicBus.gain.cancelScheduledValues(ctx.currentTime)
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime)
    musicBus.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 1.4)
    nextBarAt = ctx.currentTime + 0.15
    bar = 0
    startVinyl()
    scheduleBar()
    if (loopTimer) window.clearInterval(loopTimer)
    loopTimer = window.setInterval(scheduleBar, 500)
    return true
  }

  musicOn = false
  if (loopTimer) {
    window.clearInterval(loopTimer)
    loopTimer = null
  }
  if (ctx && musicBus) {
    musicBus.gain.cancelScheduledValues(ctx.currentTime)
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime)
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
  }
  if (vinyl) {
    try {
      vinyl.stop(ctx ? ctx.currentTime + 0.7 : 0)
    } catch {
      /* ignore */
    }
    vinyl = null
  }
  return false
}

export function isMusicOn() {
  return musicOn
}
