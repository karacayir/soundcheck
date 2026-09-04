import { describe, expect, it } from 'vitest'
import { loadContent } from '../build/load-content.ts'

/**
 * The real content set, validated the same way the build validates it. This is
 * the test that fails when someone mistypes a name in the setlist.
 */
const dataset = loadContent()

describe('content', () => {
  it('loads the band', () => {
    expect(dataset.band.slug).toBe('funky-monkey')
    expect(dataset.band.members.length).toBeGreaterThan(0)
  })

  it('has the february concert with both sets and the break', () => {
    const february = dataset.concerts.find((c) => c.slug === 'february')
    expect(february).toBeDefined()

    const breaks = february!.setlist.filter((e) => e.kind === 'break')
    expect(breaks).toHaveLength(1)
    expect(breaks[0]).toMatchObject({ title: 'SHORT BREAK' })

    const songs = february!.setlist.filter((e) => e.kind === 'song')
    expect(songs).toHaveLength(25)
  })

  it('resolves every setlist song to a song file', () => {
    for (const concert of dataset.concerts) {
      for (const entry of concert.setlist) {
        if (entry.kind !== 'song') continue
        expect(dataset.songs[entry.song], `missing song "${entry.song}"`).toBeDefined()
      }
    }
  })

  it('resolves every lineup name to a band member', () => {
    const ids = new Set(dataset.band.members.map((m) => m.id))
    for (const concert of dataset.concerts) {
      for (const entry of concert.setlist) {
        if (entry.kind !== 'song') continue
        for (const [role, people] of Object.entries(entry.lineup)) {
          for (const person of people) {
            expect(ids.has(person), `"${person}" (${role}) is not in band.yaml`).toBe(true)
          }
        }
      }
    }
  })

  it('keeps section ids unique within a song', () => {
    for (const song of Object.values(dataset.songs)) {
      const ids = song.structure.map((s) => s.id)
      expect(new Set(ids).size, `duplicate section id in "${song.id}"`).toBe(ids.length)
    }
  })

  it('points every section-scoped cue at a section that exists', () => {
    for (const song of Object.values(dataset.songs)) {
      const ids = new Set(song.structure.map((s) => s.id))
      for (const cue of song.cues) {
        if (!cue.at) continue
        expect(ids.has(cue.at), `cue "${cue.text}" targets missing section "${cue.at}"`).toBe(true)
      }
    }
  })

  it('carries the charts transcribed from the band iReal book', () => {
    const badRomance = dataset.songs['bad-romance']
    expect(badRomance?.key).toBe('Am')
    expect(badRomance?.tempo).toBe(119)
    expect(badRomance?.structure.map((s) => s.label)).toEqual(['Intro', 'A', 'B', 'C', 'D'])

    // Keys the band actually plays, which differ from the recordings.
    expect(dataset.songs['you-give-love-a-bad-name']?.key).toBe('Cm')
    expect(dataset.songs['price-tag']?.key).toBe('F')
    expect(dataset.songs['cake-by-the-ocean']?.key).toBe('Em')
    expect(dataset.songs['i-want-it-that-way']?.key).toBe('F#m')
  })

  it('uses English role ids throughout', () => {
    expect(dataset.band.roles.map((r) => r.id)).toEqual([
      'vocals',
      'guitar',
      'keys',
      'bass',
      'drums',
    ])
  })
})
