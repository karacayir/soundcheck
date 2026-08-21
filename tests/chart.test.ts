import { describe, expect, it } from 'vitest'
import { beatsPerBar, flattenBars, parseChords, sectionToChart, totalBars } from '@/features/music/chart'
import type { Section } from '@/content/types'

const section = (patch: Partial<Section>): Section => ({
  id: 'a',
  label: 'A',
  repeat: 1,
  ...patch,
})

describe('parseChords', () => {
  it('splits a bar string into bars', () => {
    expect(parseChords('| Am | C | F | G |').map((b) => b.chords)).toEqual([
      ['Am'],
      ['C'],
      ['F'],
      ['G'],
    ])
  })

  it('keeps multiple chords inside one bar', () => {
    expect(parseChords('| Am | C F |').map((b) => b.chords)).toEqual([['Am'], ['C', 'F']])
  })

  it('expands % to the previous bar', () => {
    expect(parseChords('| Am | % | F |').map((b) => b.chords)).toEqual([['Am'], ['Am'], ['F']])
  })

  it('does not alias repeated bars to the same array', () => {
    const bars = parseChords('| Am | % |')
    bars[0]!.chords.push('X')
    expect(bars[1]!.chords).toEqual(['Am'])
  })

  it('normalises no-chord spellings', () => {
    expect(parseChords('| N.C. | nc |').map((b) => b.chords)).toEqual([['N.C.'], ['N.C.']])
  })

  it('tolerates missing outer pipes and stray whitespace', () => {
    expect(parseChords('  Am |   C   ').map((b) => b.chords)).toEqual([['Am'], ['C']])
  })

  it('returns nothing for empty input', () => {
    expect(parseChords(undefined)).toEqual([])
    expect(parseChords('   ')).toEqual([])
  })
})

describe('beatsPerBar', () => {
  it('reads the numerator', () => {
    expect(beatsPerBar('4/4')).toBe(4)
    expect(beatsPerBar('3/4')).toBe(3)
    expect(beatsPerBar('6/8')).toBe(6)
  })

  it('falls back to 4 for nonsense', () => {
    expect(beatsPerBar('nope')).toBe(4)
  })
})

describe('sections', () => {
  it('draws an empty grid when bars are declared without chords', () => {
    expect(sectionToChart(section({ bars: 4 })).bars).toHaveLength(4)
  })

  it('counts repeats towards the total', () => {
    const chart = [sectionToChart(section({ chords: '| Am | C |', repeat: 3 }))]
    expect(totalBars(chart)).toBe(6)
  })

  it('flattens repeats into the played sequence', () => {
    const chart = [sectionToChart(section({ chords: '| Am | C |', repeat: 2 }))]
    expect(flattenBars(chart).map((b) => b.chords[0])).toEqual(['Am', 'C', 'Am', 'C'])
  })
})
