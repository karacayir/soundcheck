import type { z } from 'zod'
import type {
  BandSchema,
  ConcertSchema,
  CueSchema,
  MemberSchema,
  RoleSchema,
  SectionSchema,
  SetlistEntrySchema,
  SongSchema,
} from './schema'

export type Member = z.infer<typeof MemberSchema>
export type Role = z.infer<typeof RoleSchema>
export type Band = z.infer<typeof BandSchema>
export type Concert = z.infer<typeof ConcertSchema>
export type SetlistEntry = z.infer<typeof SetlistEntrySchema>
export type SongEntry = Extract<SetlistEntry, { kind: 'song' }>
export type BreakEntry = Extract<SetlistEntry, { kind: 'break' }>
export type Song = z.infer<typeof SongSchema>
export type Section = z.infer<typeof SectionSchema>
export type Cue = z.infer<typeof CueSchema>

/** A setlist entry with its running number and the song attached, ready to render. */
export type SetlistItem =
  | (SongEntry & { position: number; number: number; song_: Song })
  | (BreakEntry & { position: number })

/** The whole content set, shipped to the browser as one JSON blob. */
export interface Dataset {
  band: Band
  concerts: Concert[]
  songs: Record<string, Song>
  /** Fields the band still has to fill in, surfaced by `npm run content:check`. */
  todos: ContentTodo[]
}

export interface ContentTodo {
  song: string
  title: string
  missing: string[]
}
