import { Chord, Note } from 'tonal'

/** Small synthesis helpers. Everything the backing band is made of. */

let noiseBuffer: AudioBuffer | null = null

function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer
  const length = Math.floor(ctx.sampleRate * 0.5)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  noiseBuffer = buffer
  return buffer
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Percussive gain envelope: instant-ish attack, exponential tail. */
function pluckEnv(ctx: AudioContext, time: number, peak: number, decay: number): GainNode {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + decay)
  return gain
}

export function beep(
  ctx: AudioContext,
  out: AudioNode,
  time: number,
  freq: number,
  gainValue: number,
  decay = 0.05,
  type: OscillatorType = 'square',
): void {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, time)
  const gain = pluckEnv(ctx, time, gainValue, decay)
  osc.connect(gain).connect(out)
  osc.start(time)
  osc.stop(time + decay + 0.02)
}

export function kick(ctx: AudioContext, out: AudioNode, time: number, gainValue = 0.9): void {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.09)
  const gain = pluckEnv(ctx, time, gainValue, 0.24)
  osc.connect(gain).connect(out)
  osc.start(time)
  osc.stop(time + 0.3)
}

export function snare(ctx: AudioContext, out: AudioNode, time: number, gainValue = 0.6): void {
  const noise = ctx.createBufferSource()
  noise.buffer = getNoise(ctx)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1750
  band.Q.value = 0.7
  const noiseGain = pluckEnv(ctx, time, gainValue, 0.16)
  noise.connect(band).connect(noiseGain).connect(out)
  noise.start(time)
  noise.stop(time + 0.2)

  // A little body so it reads as a drum and not just a hiss.
  const body = ctx.createOscillator()
  body.type = 'triangle'
  body.frequency.setValueAtTime(190, time)
  const bodyGain = pluckEnv(ctx, time, gainValue * 0.45, 0.09)
  body.connect(bodyGain).connect(out)
  body.start(time)
  body.stop(time + 0.12)
}

export function hat(
  ctx: AudioContext,
  out: AudioNode,
  time: number,
  gainValue = 0.22,
  open = false,
): void {
  const noise = ctx.createBufferSource()
  noise.buffer = getNoise(ctx)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7800
  const decay = open ? 0.16 : 0.035
  const gain = pluckEnv(ctx, time, gainValue, decay)
  noise.connect(hp).connect(gain).connect(out)
  noise.start(time)
  noise.stop(time + decay + 0.05)
}

export function bassNote(
  ctx: AudioContext,
  out: AudioNode,
  time: number,
  midi: number,
  duration: number,
  gainValue = 0.5,
): void {
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(midiToFreq(midi), time)

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(1400, time)
  lp.frequency.exponentialRampToValueAtTime(320, time + duration * 0.8)
  lp.Q.value = 4

  const gain = pluckEnv(ctx, time, gainValue, Math.max(0.12, duration))
  osc.connect(lp).connect(gain).connect(out)
  osc.start(time)
  osc.stop(time + duration + 0.08)
}

export function keysChord(
  ctx: AudioContext,
  out: AudioNode,
  time: number,
  midiNotes: number[],
  duration: number,
  gainValue = 0.16,
): void {
  if (midiNotes.length === 0) return
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(2600, time)
  lp.Q.value = 0.6
  lp.connect(out)

  for (const midi of midiNotes) {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(midiToFreq(midi), time)
    const gain = pluckEnv(ctx, time, gainValue, Math.max(0.2, duration))
    osc.connect(gain).connect(lp)
    osc.start(time)
    osc.stop(time + duration + 0.1)
  }
}

/* ------------------------------------------------------ chord → pitches -- */

const QUALITY_FALLBACK: Array<[RegExp, number[]]> = [
  [/^(?:m|-|min)(?:aj)?7/i, [0, 3, 7, 11]],
  [/^(?:m|-|min)7/i, [0, 3, 7, 10]],
  [/^(?:m|-|min)6/i, [0, 3, 7, 9]],
  [/^(?:m|-|min)/i, [0, 3, 7]],
  [/^(?:maj|M|\^)7/, [0, 4, 7, 11]],
  [/^(?:dim|o)7/i, [0, 3, 6, 9]],
  [/^(?:dim|o)/i, [0, 3, 6]],
  [/^(?:aug|\+)/i, [0, 4, 8]],
  [/^sus2/i, [0, 2, 7]],
  [/^sus/i, [0, 5, 7]],
  [/^7/, [0, 4, 7, 10]],
  [/^6/, [0, 4, 7, 9]],
  [/^9/, [0, 4, 7, 10, 14]],
]

const CHORD_RE = /^([A-G][#b]{0,2})(.*?)(?:\/([A-G][#b]{0,2}))?$/

/**
 * Turns a chord symbol into an ascending voicing around `baseOctave`.
 * Falls back to interval guessing so oddities like `Am#5` still make a sound
 * rather than a hole in the arrangement.
 */
export function voiceChord(symbol: string, baseOctave = 4): number[] {
  const match = symbol.match(CHORD_RE)
  if (!match) return []
  const root = match[1]!
  const quality = match[2] ?? ''

  const rootChroma = Note.chroma(root)
  if (rootChroma === undefined) return []

  let intervals = intervalsFromTonal(symbol, rootChroma)
  if (!intervals) intervals = intervalsFromFallback(quality)

  const base = 12 * (baseOctave + 1) + rootChroma
  const voiced: number[] = []
  let previous = -Infinity
  for (const semitone of intervals) {
    let midi = base + semitone
    while (midi <= previous) midi += 12
    voiced.push(midi)
    previous = midi
  }
  return voiced.slice(0, 5)
}

function intervalsFromTonal(symbol: string, rootChroma: number): number[] | null {
  const chord = Chord.get(symbol)
  if (chord.empty || chord.notes.length === 0) return null
  const semis = chord.notes
    .map((note) => Note.chroma(note))
    .filter((c): c is number => c !== undefined)
    .map((c) => (((c - rootChroma) % 12) + 12) % 12)
  return semis.length ? semis : null
}

function intervalsFromFallback(quality: string): number[] {
  for (const [re, intervals] of QUALITY_FALLBACK) {
    if (re.test(quality)) return applyAlterations(intervals, quality)
  }
  return applyAlterations([0, 4, 7], quality)
}

function applyAlterations(intervals: number[], quality: string): number[] {
  let out = [...intervals]
  if (/#5|\+5/.test(quality)) out = out.map((i) => (i === 7 ? 8 : i))
  if (/b5/.test(quality)) out = out.map((i) => (i === 7 ? 6 : i))
  return out
}

/** Bass note for a symbol, honouring slash bass. */
export function bassMidi(symbol: string, octave = 2): number | null {
  const match = symbol.match(CHORD_RE)
  if (!match) return null
  const chroma = Note.chroma(match[3] ?? match[1]!)
  if (chroma === undefined) return null
  return 12 * (octave + 1) + chroma
}
