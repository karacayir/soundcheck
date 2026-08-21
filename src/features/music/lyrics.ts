/**
 * Lyrics are plain text with `[Section]` headings:
 *
 *   [Verse 1]
 *   I want your ugly
 *
 * Chords may be embedded ChordPro-style — `I want your [Am]ugly` — in which
 * case the musician view shows them above the words and the singer view
 * strips them out.
 */

export interface LyricChunk {
  chord?: string
  text: string
}

export interface LyricLine {
  chunks: LyricChunk[]
  /** True when the line carries chords and no words (a chord-only line). */
  chordsOnly: boolean
}

export interface LyricSection {
  label: string | null
  lines: LyricLine[]
}

const HEADING_RE = /^\s*\[([^\]]{1,60})\]\s*$/
const INLINE_CHORD_RE = /\[([^\]]+)\]/g

export function parseLyrics(raw: string | undefined): LyricSection[] {
  if (!raw?.trim()) return []

  const sections: LyricSection[] = []
  let current: LyricSection = { label: null, lines: [] }

  for (const rawLine of raw.replace(/\r\n/g, '\n').split('\n')) {
    const heading = rawLine.match(HEADING_RE)
    if (heading) {
      if (current.lines.length || current.label) sections.push(current)
      current = { label: heading[1]!.trim(), lines: [] }
      continue
    }
    current.lines.push(parseLine(rawLine))
  }
  if (current.lines.length || current.label) sections.push(current)

  return sections.map((section) => ({ ...section, lines: trimBlankEdges(section.lines) }))
}

function parseLine(line: string): LyricLine {
  const chunks: LyricChunk[] = []
  let cursor = 0
  let sawChord = false

  INLINE_CHORD_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = INLINE_CHORD_RE.exec(line)) !== null) {
    sawChord = true
    const before = line.slice(cursor, match.index)
    if (before) chunks.push({ text: before })
    chunks.push({ chord: match[1]!.trim(), text: '' })
    cursor = match.index + match[0].length
  }
  const tail = line.slice(cursor)
  if (tail) {
    const last = chunks.at(-1)
    if (last && last.chord !== undefined && last.text === '') last.text = tail
    else chunks.push({ text: tail })
  }
  if (chunks.length === 0) chunks.push({ text: '' })

  const words = chunks.map((c) => c.text).join('').trim()
  return { chunks, chordsOnly: sawChord && words.length === 0 }
}

function trimBlankEdges(lines: LyricLine[]): LyricLine[] {
  const isBlank = (l: LyricLine) => l.chunks.every((c) => !c.chord && !c.text.trim())
  let start = 0
  let end = lines.length
  while (start < end && isBlank(lines[start]!)) start++
  while (end > start && isBlank(lines[end - 1]!)) end--
  return lines.slice(start, end)
}

/** The plain words, with any chord markers removed. */
export function stripChords(raw: string | undefined): string {
  return (raw ?? '').replace(INLINE_CHORD_RE, '')
}
