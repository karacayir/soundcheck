import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import { BandSchema, ConcertSchema, SongSchema } from '../src/content/schema.ts'
import type { Band, Concert, ContentTodo, Dataset, Song } from '../src/content/types.ts'

export const CONTENT_DIR = join(process.cwd(), 'content')

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`${problems.length} content problem(s):\n\n${problems.join('\n\n')}`)
    this.name = 'ContentError'
  }
}

function rel(file: string) {
  return relative(process.cwd(), file)
}

function formatIssues(file: string, error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)'
    return `    ${path}: ${issue.message}`
  })
  return `  ${rel(file)}\n${lines.join('\n')}`
}

function readOne<T>(file: string, schema: z.ZodType<T>, problems: string[]): T | null {
  let raw: unknown
  try {
    raw = parseYaml(readFileSync(file, 'utf8'))
  } catch (err) {
    problems.push(`  ${rel(file)}\n    invalid YAML: ${(err as Error).message}`)
    return null
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    problems.push(formatIssues(file, result.error))
    return null
  }
  return result.data
}

function yamlFilesIn(dir: string): string[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names
    .filter((n) => n.endsWith('.yaml') || n.endsWith('.yml'))
    .sort()
    .map((n) => join(dir, n))
}

/** Fields we nag about but never fail on — the app renders "—" for them. */
const TODO_FIELDS: Array<[keyof Song, string]> = [
  ['artist', 'artist'],
  ['key', 'key'],
  ['tempo', 'tempo'],
  ['lyrics', 'lyrics'],
]

function collectTodos(song: Song): string[] {
  const missing = TODO_FIELDS.filter(([field]) => song[field] === undefined).map(([, l]) => l)
  if (song.structure.length === 0) missing.push('structure')
  else if (!song.structure.some((s) => s.chords)) missing.push('chords')
  return missing
}

export function loadContent(dir = CONTENT_DIR): Dataset {
  const problems: string[] = []

  const band = readOne<Band>(join(dir, 'band.yaml'), BandSchema, problems)

  const songs: Record<string, Song> = {}
  for (const file of yamlFilesIn(join(dir, 'songs'))) {
    const song = readOne<Song>(file, SongSchema, problems)
    if (!song) continue
    if (songs[song.id]) problems.push(`  ${rel(file)}\n    duplicate song id "${song.id}"`)
    songs[song.id] = song
  }

  const concerts: Concert[] = []
  for (const file of yamlFilesIn(join(dir, 'concerts'))) {
    const concert = readOne<Concert>(file, ConcertSchema, problems)
    if (concert) concerts.push(concert)
  }

  // Cross-references: these are the mistakes that would otherwise show up as a
  // blank cell halfway through the second set.
  if (band) {
    const memberIds = new Set(band.members.map((m) => m.id))
    const roleIds = new Map(band.roles.map((r) => [r.id, r]))

    for (const member of band.members) {
      for (const role of member.roles) {
        if (!roleIds.has(role)) {
          problems.push(`  content/band.yaml\n    member "${member.id}" has unknown role "${role}"`)
        }
      }
    }

    for (const concert of concerts) {
      const where = `content/concerts/${concert.slug}.yaml`
      concert.setlist.forEach((entry, i) => {
        if (entry.kind !== 'song') return
        if (!songs[entry.song]) {
          problems.push(
            `  ${where}\n    setlist[${i}] references song "${entry.song}", ` +
              `but content/songs/${entry.song}.yaml does not exist`,
          )
        }
        for (const [roleId, people] of Object.entries(entry.lineup)) {
          const role = roleIds.get(roleId)
          if (!role) {
            problems.push(`  ${where}\n    setlist[${i}] "${entry.song}": unknown role "${roleId}"`)
            continue
          }
          if (people.length > role.slots) {
            problems.push(
              `  ${where}\n    setlist[${i}] "${entry.song}": role "${roleId}" has ` +
                `${people.length} people but only ${role.slots} slot(s)`,
            )
          }
          for (const person of people) {
            if (!memberIds.has(person)) {
              problems.push(
                `  ${where}\n    setlist[${i}] "${entry.song}": unknown member "${person}" ` +
                  `in role "${roleId}"`,
              )
            }
          }
        }
      })
    }
  }

  if (problems.length) throw new ContentError(problems)
  if (!band) throw new ContentError(['  content/band.yaml is missing'])

  const todos: ContentTodo[] = Object.values(songs)
    .map((song) => ({ song: song.id, title: song.title, missing: collectTodos(song) }))
    .filter((t) => t.missing.length > 0)
    .sort((a, b) => a.title.localeCompare(b.title, 'tr'))

  return { band, concerts, songs, todos }
}

/** Every file the loader reads, so the Vite plugin knows what to watch. */
export function contentFiles(dir = CONTENT_DIR): string[] {
  return [join(dir, 'band.yaml'), ...yamlFilesIn(join(dir, 'songs')), ...yamlFilesIn(join(dir, 'concerts'))]
}
