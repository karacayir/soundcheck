import { describe, expect, it } from 'vitest'
import { parseLyrics, stripChords } from '@/features/music/lyrics'

describe('parseLyrics', () => {
  it('splits on [Section] headings', () => {
    const sections = parseLyrics('[Verse 1]\nbir\niki\n\n[Chorus]\nüç')
    expect(sections.map((s) => s.label)).toEqual(['Verse 1', 'Chorus'])
    expect(sections[0]!.lines).toHaveLength(2)
    expect(sections[1]!.lines).toHaveLength(1)
  })

  it('keeps lyrics with no heading in one unlabelled section', () => {
    const sections = parseLyrics('bir\niki')
    expect(sections).toHaveLength(1)
    expect(sections[0]!.label).toBeNull()
  })

  it('trims blank lines at section edges but keeps them inside', () => {
    const sections = parseLyrics('[A]\n\nbir\n\niki\n\n')
    expect(sections[0]!.lines).toHaveLength(3)
  })

  it('attaches inline chords to the words that follow', () => {
    const [section] = parseLyrics('I want your [Am]ugly')
    const chunks = section!.lines[0]!.chunks
    expect(chunks[0]).toEqual({ text: 'I want your ' })
    expect(chunks[1]).toEqual({ chord: 'Am', text: 'ugly' })
  })

  it('recognises a chord-only line', () => {
    const [section] = parseLyrics('[Am] [F] [C]')
    expect(section!.lines[0]!.chordsOnly).toBe(true)
  })

  it('does not treat a lyric line as chords-only when it has words', () => {
    const [section] = parseLyrics('[Am]ugly')
    expect(section!.lines[0]!.chordsOnly).toBe(false)
  })

  it('handles Windows line endings', () => {
    expect(parseLyrics('[A]\r\nbir\r\niki')[0]!.lines).toHaveLength(2)
  })

  it('returns nothing for empty input', () => {
    expect(parseLyrics(undefined)).toEqual([])
    expect(parseLyrics('  \n ')).toEqual([])
  })
})

describe('stripChords', () => {
  it('removes chord markers and keeps the words', () => {
    expect(stripChords('I want your [Am]ugly')).toBe('I want your ugly')
  })
})
