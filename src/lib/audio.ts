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

// ---------------------------------------------------- what the visitor wants

/**
 * Both channels are wanted on. A browser will not let anything make a sound
 * until the visitor has interacted with the page, so "on by default" can only
 * mean armed by default and brought up at the first real gesture.
 *
 * Anyone who switches one off is remembered, and arming leaves that one alone
 * on every later visit.
 */
const SFX_KEY = 'mf-sfx'
const MUSIC_KEY = 'mf-music'

function wanted(key: string): boolean {
  try {
    return localStorage.getItem(key) !== '0'
  } catch {
    return true
  }
}

function remember(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch {
    /* private mode: the choice just will not outlive the tab */
  }
}

export const prefersSfx = () => wanted(SFX_KEY)
export const prefersMusic = () => wanted(MUSIC_KEY)
export const rememberSfx = (on: boolean) => remember(SFX_KEY, on)
export const rememberMusic = (on: boolean) => remember(MUSIC_KEY, on)

let armed = false

/**
 * Starts whichever channels are wanted, at the first click, tap or keypress
 * anywhere on the page. Runs once, then takes its own listeners off again.
 */
export function armAudio(onStart?: (started: { sfx: boolean; music: boolean }) => void) {
  if (armed || typeof window === 'undefined') return
  armed = true

  const events = ['pointerdown', 'keydown', 'touchstart'] as const
  const fire = () => {
    for (const e of events) window.removeEventListener(e, fire)
    const sfx = prefersSfx() ? setSfx(true) : false
    const music = prefersMusic() ? setMusic(true) : false
    onStart?.({ sfx, music })
  }
  for (const e of events) window.addEventListener(e, fire, { passive: true })
}

// ------------------------------------------------------------------ lofi

/**
 * The background loop. Every sample of it is synthesised here, in the
 * browser, from oscillators and generated noise: there is no track file and
 * nothing is fetched, so there is nothing to licence.
 *
 * Eight bars at 68 BPM in F major, I-iii-vi-IV. A warm pad and a soft
 * electric-piano motif sit in a generated room reverb, over a muted kick, a
 * brushed snare and a swung shaker, with tape wow on the pad and a little
 * vinyl underneath. Scheduled a bar ahead so it never stutters.
 */
const BPM = 68
const BEAT = 60 / BPM
const BAR = BEAT * 4
/** How far the offbeats are pushed back, which is most of the feel. */
const SWING = 0.055

// Fmaj7, Am7, Dm9, Bbmaj7, as semitone offsets from C2.
const PROG: { chord: number[]; root: number }[] = [
  { chord: [17, 21, 24, 28], root: 5 },
  { chord: [21, 24, 28, 31], root: 9 },
  { chord: [14, 21, 24, 28], root: 2 },
  { chord: [22, 26, 29, 33], root: 10 },
]

/** A sparse motif per bar: [beat, semitone]. F major pentatonic, mostly. */
const MOTIF: number[][][] = [
  [[0.5, 36], [1.5, 33], [2.5, 31], [3.25, 33]],
  [[1, 36], [2.5, 40], [3.5, 38]],
  [[0.5, 33], [2, 31], [3, 28]],
  [[1.5, 38], [2.5, 36], [3.5, 33]],
]

const hz = (semi: number) => 65.41 * Math.pow(2, semi / 12)

let loopTimer: number | null = null
let nextBarAt = 0
let bar = 0
let vinyl: AudioBufferSourceNode | null = null
let wowDepth: GainNode | null = null
let verbIn: GainNode | null = null

/** A short room, built from decaying noise. No impulse file to ship. */
function buildReverb(c: AudioContext): ConvolverNode {
  const len = Math.floor(c.sampleRate * 2.4)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const t = i / len
      // A little pre-delay, then an exponential tail.
      const env = Math.pow(1 - t, 2.6) * (i < c.sampleRate * 0.012 ? 0 : 1)
      d[i] = (Math.random() * 2 - 1) * env
    }
  }
  const conv = c.createConvolver()
  conv.buffer = buf
  return conv
}

function ensureVerb(): GainNode | null {
  if (!ctx || !musicBus) return null
  if (verbIn) return verbIn
  const c = ctx
  const send = c.createGain()
  send.gain.value = 1
  const conv = buildReverb(c)
  const wet = c.createGain()
  wet.gain.value = 0.5
  // Roll the top off the tail, so the room is soft rather than glassy.
  const tame = c.createBiquadFilter()
  tame.type = 'lowpass'
  tame.frequency.value = 2600
  send.connect(conv).connect(tame).connect(wet).connect(musicBus)
  verbIn = send
  return send
}

/** One slow oscillator detuning the pad, the way tape does. */
function ensureWow(): GainNode | null {
  if (!ctx) return null
  if (wowDepth) return wowDepth
  const c = ctx
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 0.23
  const depth = c.createGain()
  depth.gain.value = 5.5
  osc.connect(depth)
  osc.start()

  wowDepth = depth
  return depth
}

function playPad(at: number, chord: number[], root: number) {
  if (!ctx || !musicBus) return
  const c = ctx
  const send = ensureVerb()
  const depth = ensureWow()

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(620, at)
  filter.frequency.linearRampToValueAtTime(1100, at + BAR * 0.55)
  filter.frequency.linearRampToValueAtTime(580, at + BAR)
  filter.Q.value = 0.5
  filter.connect(musicBus)
  if (send) filter.connect(send)

  for (const semi of chord) {
    // Two voices a few cents apart per note. That beating is the warmth.
    for (const off of [-4, 4]) {
      const osc = c.createOscillator()
      osc.type = off < 0 ? 'triangle' : 'sine'
      osc.frequency.value = hz(semi)
      osc.detune.value = off
      if (depth) depth.connect(osc.detune)
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, at)
      g.gain.linearRampToValueAtTime(0.028, at + 0.9)
      g.gain.setValueAtTime(0.028, at + BAR - 0.9)
      g.gain.linearRampToValueAtTime(0.0001, at + BAR - 0.02)
      osc.connect(g).connect(filter)
      osc.start(at)
      osc.stop(at + BAR)
    }
  }

  // the root, low and round
  const sub = c.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = hz(root)
  const sg = c.createGain()
  sg.gain.setValueAtTime(0.0001, at)
  sg.gain.linearRampToValueAtTime(0.085, at + 0.35)
  sg.gain.setValueAtTime(0.07, at + BAR * 0.7)
  sg.gain.linearRampToValueAtTime(0.0001, at + BAR - 0.02)
  sub.connect(sg).connect(musicBus)
  sub.start(at)
  sub.stop(at + BAR)
}

/** A soft electric-piano note: a sine, with a partial that dies away first. */
function playKey(at: number, semi: number) {
  if (!ctx || !musicBus) return
  const c = ctx
  const send = ensureVerb()
  const out = c.createGain()
  out.gain.value = 0.09
  out.connect(musicBus)
  if (send) out.connect(send)

  const body = c.createOscillator()
  body.type = 'sine'
  body.frequency.value = hz(semi)
  const bg = c.createGain()
  bg.gain.setValueAtTime(0.0001, at)
  bg.gain.linearRampToValueAtTime(1, at + 0.012)
  bg.gain.exponentialRampToValueAtTime(0.0001, at + 1.7)
  body.connect(bg).connect(out)
  body.start(at)
  body.stop(at + 1.8)

  const bell = c.createOscillator()
  bell.type = 'sine'
  bell.frequency.value = hz(semi) * 3.02
  const eg = c.createGain()
  eg.gain.setValueAtTime(0.0001, at)
  eg.gain.linearRampToValueAtTime(0.16, at + 0.006)
  eg.gain.exponentialRampToValueAtTime(0.0001, at + 0.34)
  bell.connect(eg).connect(out)
  bell.start(at)
  bell.stop(at + 0.36)
}

function playKick(at: number) {
  if (!ctx || !musicBus) return
  const c = ctx
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(104, at)
  osc.frequency.exponentialRampToValueAtTime(41, at + 0.16)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 220
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(0.2, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3)
  osc.connect(lp).connect(g).connect(musicBus)
  osc.start(at)
  osc.stop(at + 0.32)
}

/** Brushed rather than struck: noise with a slow edge on it. */
function playSnare(at: number) {
  if (!ctx || !musicBus) return
  const c = ctx
  const send = ensureVerb()
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.3)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1700
  bp.Q.value = 0.8
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(0.05, at + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
  src.connect(bp).connect(g).connect(musicBus)
  if (send) g.connect(send)
  src.start(at)
  src.stop(at + 0.3)
}

function playShaker(at: number, soft: boolean) {
  if (!ctx || !musicBus) return
  const c = ctx
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.06)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6200
  const g = c.createGain()
  g.gain.setValueAtTime(soft ? 0.012 : 0.024, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
  src.connect(hp).connect(g).connect(musicBus)
  src.start(at)
  src.stop(at + 0.07)
}

function scheduleBar() {
  if (!ctx || !musicOn) return
  const c = ctx
  // Keep roughly a bar of music queued ahead of the clock.
  while (nextBarAt < c.currentTime + BAR * 1.2) {
    const at = Math.max(nextBarAt, c.currentTime + 0.05)
    const i = bar % PROG.length
    const step = PROG[i]
    playPad(at, step.chord, step.root)

    playKick(at)
    playKick(at + BEAT * 2.5)
    playSnare(at + BEAT * 2)
    // The motif rests every fourth bar, so the loop can breathe.
    if (bar % 4 !== 3) {
      for (const note of MOTIF[i]) playKey(at + BEAT * note[0], note[1])
    }
    for (let k = 0; k < 8; k++) {
      const off = k % 2 === 1 ? SWING : 0
      playShaker(at + BEAT * (k / 2 + off), k % 2 === 1)
    }
    bar += 1
    nextBarAt = at + BAR
  }
}

function startVinyl() {
  if (!ctx || !musicBus || vinyl) return
  const c = ctx
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 3)
  src.loop = true
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2400
  bp.Q.value = 0.5
  const g = c.createGain()
  g.gain.value = 0.01
  src.connect(bp).connect(g).connect(musicBus)
  src.start()
  vinyl = src
}

export function setMusic(on: boolean): boolean {
  if (on) {
    if (!ensure() || !ctx || !musicBus) return false
    musicOn = true
    musicBus.gain.cancelScheduledValues(ctx.currentTime)
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime)
    // A long fade in, so it arrives rather than starts.
    musicBus.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 2.6)
    nextBarAt = ctx.currentTime + 0.15
    bar = 0
    ensureVerb()
    ensureWow()
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
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1)
  }
  if (vinyl) {
    try {
      vinyl.stop(ctx ? ctx.currentTime + 1.2 : 0)
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
