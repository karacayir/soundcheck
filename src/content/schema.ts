import { z } from 'zod'

/**
 * Zod schemas for everything under `content/`.
 *
 * These run at build time only (see `build/load-content.ts`). The app imports
 * *types* from `./types.ts`, never these values, so zod never reaches the
 * browser bundle.
 */

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase-kebab-case (a-z, 0-9, dashes)')

/* ------------------------------------------------------------------ band -- */

export const MemberSchema = z.strictObject({
  id: slug,
  /** Display name, as the band writes it. Turkish characters welcome. */
  name: z.string().min(1),
  /** Roles this person can cover. Used to sanity-check lineups and to pick a default view. */
  roles: z.array(slug).min(1),
})

export const RoleSchema = z.strictObject({
  id: slug,
  label: z.string().min(1),
  /** How many columns this role gets in the lineup grid (Vokal had 3 last year). */
  slots: z.number().int().min(1).default(1),
  /** Vocal roles default to the singer view; everything else to the musician view. */
  view: z.enum(['singer', 'musician']).default('musician'),
})

export const BandSchema = z.strictObject({
  slug,
  name: z.string().min(1),
  tagline: z.string().optional(),
  roles: z.array(RoleSchema).min(1),
  members: z.array(MemberSchema).min(1),
})

/* --------------------------------------------------------------- concert -- */

/** `{ vokal: [doga, berfin], gitar: [itri] }` */
export const LineupSchema = z.record(slug, z.array(slug))

const SongEntrySchema = z
  .strictObject({
    song: slug,
    lineup: LineupSchema.default({}),
    /** Anything specific to playing this song *at this concert*. */
    notes: z.string().optional(),
    /** True when this song runs straight into the next one with no gap. */
    segue: z.boolean().default(false),
  })
  .transform((v) => ({ kind: 'song' as const, ...v }))

const BreakEntrySchema = z
  .strictObject({
    break: z.string().min(1),
    minutes: z.number().int().positive().optional(),
  })
  .transform((v) => ({ kind: 'break' as const, title: v.break, minutes: v.minutes }))

export const SetlistEntrySchema = z.union([SongEntrySchema, BreakEntrySchema])

export const ConcertSchema = z.strictObject({
  slug,
  title: z.string().min(1),
  /** ISO date, or omitted while it is still being decided. */
  date: z.string().optional(),
  venue: z.string().optional(),
  doors: z.string().optional(),
  notes: z.string().optional(),
  setlist: z.array(SetlistEntrySchema).min(1),
})

/* ------------------------------------------------------------------ song -- */

export const SectionSchema = z.strictObject({
  id: slug,
  label: z.string().min(1),
  /** Bar count. Derived from `chords` when omitted. */
  bars: z.number().int().positive().optional(),
  /** One-line bar string: "| Am | Am#5 | Am6 | F |". `%` repeats the previous bar. */
  chords: z.string().optional(),
  /** How many times the section is played back-to-back. */
  repeat: z.number().int().min(1).default(1),
  /** Short instruction shown inline on the chart. */
  cue: z.string().optional(),
})

export const CueSchema = z.strictObject({
  /** Section id this cue belongs to. Omit for a whole-song cue. */
  at: slug.optional(),
  text: z.string().min(1),
})

export const SongSchema = z.strictObject({
  id: slug,
  title: z.string().min(1),
  artist: z.string().optional(),
  /** Written key, e.g. `Am`, `Bb`, `F#m`. Per-user transposition applies on top. */
  key: z.string().optional(),
  meter: z
    .string()
    .regex(/^\d{1,2}\/\d{1,2}$/, 'must look like 4/4, 6/8, 3/4')
    .default('4/4'),
  tempo: z.number().int().min(20).max(400).optional(),
  feel: z.enum(['straight', 'swing', 'shuffle', 'halftime', 'double']).default('straight'),
  /** Backing-band groove. See `src/features/audio/styles.ts`. */
  style: z.enum(['pop', 'rock', 'funk', 'ballad', 'latin', 'disco']).default('pop'),
  /** "4:54" */
  duration: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/, 'must look like 3:45')
    .optional(),
  notes: z.string().optional(),
  structure: z.array(SectionSchema).default([]),
  cues: z.array(CueSchema).default([]),
  transitions: z
    .strictObject({ in: z.string().optional(), out: z.string().optional() })
    .default({}),
  /** Plain text with `[Section]` headers. Inline `[Am]` chords are optional. */
  lyrics: z.string().optional(),
  links: z
    .strictObject({
      spotify: z.string().url().optional(),
      youtube: z.string().url().optional(),
      ireal: z.string().optional(),
    })
    .default({}),
  tags: z.array(z.string()).default([]),
})
