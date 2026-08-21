import type { Section, Song } from '@/content/types'

/**
 * Chart format: one line per section.
 *
 *   "| Am | C F | Am | C G |"
 *
 * Bars are separated by `|`. Multiple chords in a bar are separated by spaces
 * and split the bar evenly. `%` repeats the previous bar. `N.C.` means no chord.
 *
 * Deliberately the simplest thing a band member can type correctly at 2am.
 */

export interface Bar {
  /** Chord symbols in this bar, in order. Empty means "same as it was". */
  chords: string[]
  /** 1-based bar number within the section, before repeats are expanded. */
  index: number
}

export interface ChartSection {
  id: string
  label: string
  cue?: string
  repeat: number
  bars: Bar[]
}

export const NO_CHORD = 'N.C.'

const REPEAT_TOKENS = new Set(['%', '/', '-'])
const NO_CHORD_TOKENS = new Set(['n.c.', 'nc', 'n.c', 'nochord'])

/** Splits a bar string into bars. Returns `[]` for empty or missing input. */
export function parseChords(input: string | undefined): Bar[] {
  if (!input) return []

  const cells = input
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)

  const bars: Bar[] = []
  for (const cell of cells) {
    const tokens = cell.split(/\s+/).filter(Boolean)

    if (tokens.length === 1 && REPEAT_TOKENS.has(tokens[0]!)) {
      bars.push({ chords: [...(bars.at(-1)?.chords ?? [])], index: bars.length + 1 })
      continue
    }

    const chords = tokens.map((t) => (NO_CHORD_TOKENS.has(t.toLowerCase()) ? NO_CHORD : t))
    bars.push({ chords, index: bars.length + 1 })
  }
  return bars
}

/** Beats per bar from a meter string like `4/4` or `6/8`. */
export function beatsPerBar(meter: string): number {
  const [top] = meter.split('/')
  const n = Number(top)
  return Number.isFinite(n) && n > 0 ? n : 4
}

export function sectionToChart(section: Section): ChartSection {
  const bars = parseChords(section.chords)
  return {
    id: section.id,
    label: section.label,
    ...(section.cue ? { cue: section.cue } : {}),
    repeat: section.repeat,
    // An explicit `bars:` with no chords still deserves a grid to look at.
    bars: bars.length > 0 ? bars : emptyBars(section.bars ?? 0),
  }
}

function emptyBars(count: number): Bar[] {
  return Array.from({ length: count }, (_, i) => ({ chords: [], index: i + 1 }))
}

export function songToChart(song: Song): ChartSection[] {
  return song.structure.map(sectionToChart)
}

/** Total bars in the song with repeats expanded — used for the playback timeline. */
export function totalBars(sections: ChartSection[]): number {
  return sections.reduce((sum, s) => sum + s.bars.length * s.repeat, 0)
}

/** Flattens sections + repeats into the exact bar sequence that gets played. */
export function flattenBars(sections: ChartSection[]): Array<Bar & { sectionId: string }> {
  const out: Array<Bar & { sectionId: string }> = []
  for (const section of sections) {
    for (let pass = 0; pass < section.repeat; pass++) {
      for (const bar of section.bars) out.push({ ...bar, sectionId: section.id })
    }
  }
  return out
}

/** Rough runtime in seconds, for the setlist's running total. */
export function estimateSeconds(song: Song): number | null {
  if (song.duration) {
    const [m, s] = song.duration.split(':').map(Number)
    if (Number.isFinite(m) && Number.isFinite(s)) return m! * 60 + s!
  }
  if (!song.tempo || song.structure.length === 0) return null
  const bars = totalBars(songToChart(song))
  if (bars === 0) return null
  return Math.round((bars * beatsPerBar(song.meter) * 60) / song.tempo)
}
