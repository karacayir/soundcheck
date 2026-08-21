import type { AudioEngine, BeatEvent } from './engine'
import { GROOVES, type StyleId } from './styles'
import { bassMidi, bassNote, beep, hat, keysChord, kick, snare, voiceChord } from './synth'

export type Channel = 'click' | 'drums' | 'bass' | 'keys'

export interface BandState {
  style: StyleId
  beatsPerBar: number
  /** Flattened, already-transposed bars. Empty = click only. */
  bars: Array<{ chords: string[] }>
  levels: Record<Channel, number>
  accentFirstBeat: boolean
}

/** The chord sounding at a fractional position inside a bar. */
function chordAt(state: BandState, bar: number, beatPosition: number): string | null {
  if (state.bars.length === 0 || bar < 0) return null
  const cell = state.bars[((bar % state.bars.length) + state.bars.length) % state.bars.length]
  if (!cell || cell.chords.length === 0) return null
  const share = state.beatsPerBar / cell.chords.length
  const index = Math.min(cell.chords.length - 1, Math.floor(beatPosition / share))
  return cell.chords[index] ?? null
}

/** The two eighth-note steps covered by one beat. */
function stepsForBeat(beatInBar: number): [number, number] {
  return [beatInBar * 2, beatInBar * 2 + 1]
}

/**
 * Registers click, drums, bass and keys on the engine. Each voice re-reads
 * `getState()` on every beat, so changing style, tempo, key or levels while
 * the transport is running just works.
 */
export function installBand(engine: AudioEngine, getState: () => BandState): () => void {
  engine.setVoice('click', (event, ctx, out) => {
    const state = getState()
    const level = state.levels.click
    if (level <= 0) return
    const accent = state.accentFirstBeat && event.beatInBar === 0
    // The count-in is the one thing you must not miss, so it is louder.
    const gain = level * (event.isCountIn ? 0.55 : 0.34) * (accent ? 1.35 : 1)
    beep(ctx, out, event.time, accent ? 1800 : 1200, gain, 0.045, 'square')
  })

  engine.setVoice('drums', (event, ctx, out) => {
    const state = getState()
    if (event.isCountIn || state.levels.drums <= 0) return
    const groove = GROOVES[state.style]
    const half = event.spb / 2

    for (const [i, step] of stepsForBeat(event.beatInBar).entries()) {
      const time = event.time + i * half
      const idx = step % groove.kick.length
      const level = state.levels.drums

      if (groove.kick[idx]) kick(ctx, out, time, groove.kick[idx]! * level * 0.8)
      if (groove.snare[idx]) snare(ctx, out, time, groove.snare[idx]! * level * 0.5)
      if (groove.hat[idx]) {
        hat(ctx, out, time, groove.hat[idx]! * level * 0.22, groove.hatOpen.includes(idx))
      }
    }
  })

  engine.setVoice('bass', (event, ctx, out) => {
    const state = getState()
    if (event.isCountIn || state.levels.bass <= 0) return
    const groove = GROOVES[state.style]
    const half = event.spb / 2

    for (const [i, step] of stepsForBeat(event.beatInBar).entries()) {
      const gain = groove.bass[step % groove.bass.length]
      if (!gain) continue
      const symbol = chordAt(state, event.bar, event.beatInBar + i * 0.5)
      if (!symbol) continue
      const midi = bassMidi(symbol, 2)
      if (midi === null) continue
      bassNote(ctx, out, event.time + i * half, midi, half * 0.9, gain * state.levels.bass * 0.5)
    }
  })

  engine.setVoice('keys', (event, ctx, out) => {
    const state = getState()
    if (event.isCountIn || state.levels.keys <= 0) return
    const groove = GROOVES[state.style]
    const half = event.spb / 2

    for (const [i, step] of stepsForBeat(event.beatInBar).entries()) {
      const gain = groove.keys[step % groove.keys.length]
      if (!gain) continue
      const symbol = chordAt(state, event.bar, event.beatInBar + i * 0.5)
      if (!symbol) continue
      const notes = voiceChord(symbol, 4)
      if (notes.length === 0) continue
      keysChord(ctx, out, event.time + i * half, notes, half * 1.6, gain * state.levels.keys * 0.14)
    }
  })

  return () => {
    for (const id of ['click', 'drums', 'bass', 'keys'] as const) engine.setVoice(id, null)
  }
}

export type { BeatEvent }
