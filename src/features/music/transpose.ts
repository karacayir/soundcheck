import { Note } from 'tonal'
import { NO_CHORD } from './chart'

/**
 * Transposition that spells chords the way a musician would write them.
 *
 * Rather than blindly transposing note names (which produces things like B#
 * and Fb), we work out the destination key first, take its accidental
 * preference, and spell every chord in the song to match.
 */

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

/**
 * How musicians actually name each key. Both arrays are indexed by the tonic's
 * chroma, so index 0 is C / Cm — not by alphabetical order.
 */
const MAJOR_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const
const MINOR_KEYS = [
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm',
] as const

export type Accidental = 'sharp' | 'flat'

const CHORD_RE = /^([A-G][#b]{0,2})(.*?)(?:\/([A-G][#b]{0,2}))?$/

export function mod12(n: number): number {
  return ((n % 12) + 12) % 12
}

/** `Am` → `{ tonic: 'A', minor: true }`. Returns null for anything unparseable. */
export function parseKey(key: string | undefined): { tonic: string; minor: boolean } | null {
  if (!key) return null
  const match = key.trim().match(/^([A-G][#b]{0,2})\s*(m|min|minor|-)?$/i)
  if (!match) return null
  return { tonic: match[1]!, minor: Boolean(match[2]) }
}

/** The key you land in after moving `semitones`, spelled conventionally. */
export function transposeKey(key: string | undefined, semitones: number): string | null {
  const parsed = parseKey(key)
  if (!parsed) return null
  const chroma = Note.chroma(parsed.tonic)
  if (chroma === undefined) return null
  const next = mod12(chroma + semitones)
  return parsed.minor ? MINOR_KEYS[next]! : MAJOR_KEYS[next]!
}

/** Whether a key signature is written with flats. Drives every chord spelling. */
export function accidentalFor(key: string | undefined, semitones: number): Accidental {
  const target = transposeKey(key, semitones)
  if (target) return target.includes('b') ? 'flat' : 'sharp'
  // No key on file: default to sharps, except for the flat-side transpositions
  // where flats read better.
  return [1, 3, 5, 8, 10].includes(mod12(semitones)) ? 'flat' : 'sharp'
}

function transposeRoot(root: string, semitones: number, accidental: Accidental): string {
  const chroma = Note.chroma(root)
  if (chroma === undefined) return root
  const next = mod12(chroma + semitones)
  return accidental === 'flat' ? FLAT_NAMES[next]! : SHARP_NAMES[next]!
}

/**
 * Transposes one chord symbol, preserving its quality and slash bass.
 * Unrecognised tokens (`N.C.`, `%`, rehearsal text) come back untouched.
 */
export function transposeChord(
  symbol: string,
  semitones: number,
  accidental: Accidental,
): string {
  if (!symbol || symbol === NO_CHORD) return symbol
  if (semitones === 0) return symbol

  const match = symbol.match(CHORD_RE)
  if (!match) return symbol

  const [, root, quality = '', bass] = match
  const newRoot = transposeRoot(root!, semitones, accidental)
  const newBass = bass ? transposeRoot(bass, semitones, accidental) : undefined
  return newBass ? `${newRoot}${quality}/${newBass}` : `${newRoot}${quality}`
}

/** Semitone offset as a signed label: `+2`, `-3`, `±0`. */
export function offsetLabel(semitones: number): string {
  if (semitones === 0) return '±0'
  return semitones > 0 ? `+${semitones}` : String(semitones)
}

/** Root note as a MIDI number in a sensible octave — used by the backing band. */
export function chordRootMidi(symbol: string, octave = 3): number | null {
  const match = symbol.match(CHORD_RE)
  if (!match) return null
  const chroma = Note.chroma(match[1]!)
  if (chroma === undefined) return null
  return 12 * (octave + 1) + chroma
}
