import { describe, expect, it } from 'vitest'
import {
  accidentalFor,
  offsetLabel,
  parseKey,
  transposeChord,
  transposeKey,
} from '@/features/music/transpose'

describe('transposeKey', () => {
  it('moves major keys', () => {
    expect(transposeKey('C', 2)).toBe('D')
    expect(transposeKey('C', -1)).toBe('B')
  })

  it('moves minor keys and keeps them minor', () => {
    expect(transposeKey('Am', 2)).toBe('Bm')
    expect(transposeKey('Am', 1)).toBe('Bbm')
  })

  it('wraps around the octave', () => {
    expect(transposeKey('Am', 12)).toBe('Am')
    expect(transposeKey('Am', -12)).toBe('Am')
    expect(transposeKey('B', 1)).toBe('C')
  })

  it('returns null when there is no key on file', () => {
    expect(transposeKey(undefined, 3)).toBeNull()
    expect(transposeKey('H7', 3)).toBeNull()
  })
})

describe('parseKey', () => {
  it('understands the ways people write minor', () => {
    expect(parseKey('Am')).toEqual({ tonic: 'A', minor: true })
    expect(parseKey('A min')).toEqual({ tonic: 'A', minor: true })
    expect(parseKey('Bb')).toEqual({ tonic: 'Bb', minor: false })
  })
})

describe('transposeChord', () => {
  it('is a no-op at zero', () => {
    expect(transposeChord('Am7', 0, 'sharp')).toBe('Am7')
  })

  it('preserves the quality', () => {
    expect(transposeChord('Am7', 2, 'sharp')).toBe('Bm7')
    expect(transposeChord('Cmaj7#11', 2, 'sharp')).toBe('Dmaj7#11')
  })

  it('moves the slash bass too', () => {
    expect(transposeChord('E/G#', 1, 'flat')).toBe('F/A')
    expect(transposeChord('C/A', 2, 'sharp')).toBe('D/B')
  })

  it('spells with flats or sharps as asked', () => {
    expect(transposeChord('A', 1, 'flat')).toBe('Bb')
    expect(transposeChord('A', 1, 'sharp')).toBe('A#')
  })

  it('leaves non-chords alone', () => {
    expect(transposeChord('N.C.', 5, 'sharp')).toBe('N.C.')
    expect(transposeChord('', 5, 'sharp')).toBe('')
  })

  it('round-trips through every interval', () => {
    for (let n = -11; n <= 11; n++) {
      const accidental = accidentalFor('Am', n)
      const up = transposeChord('Am7', n, accidental)
      const back = transposeChord(up, -n, accidentalFor(transposeKey('Am', n)!, -n))
      expect(back).toBe('Am7')
    }
  })
})

describe('accidentalFor', () => {
  it('follows the destination key signature', () => {
    // Am + 1 = Bbm, which is written with flats.
    expect(accidentalFor('Am', 1)).toBe('flat')
    // Am + 2 = Bm, written with sharps.
    expect(accidentalFor('Am', 2)).toBe('sharp')
    // C + 3 = Eb.
    expect(accidentalFor('C', 3)).toBe('flat')
  })

  it('still picks something sensible with no key on file', () => {
    expect(accidentalFor(undefined, 1)).toBe('flat')
    expect(accidentalFor(undefined, 2)).toBe('sharp')
  })
})

describe('offsetLabel', () => {
  it('signs the number', () => {
    expect(offsetLabel(0)).toBe('±0')
    expect(offsetLabel(2)).toBe('+2')
    expect(offsetLabel(-3)).toBe('-3')
  })
})
