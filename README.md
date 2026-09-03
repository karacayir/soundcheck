# Soundcheck

A live-performance companion for bands. One URL — `/bands/funky-monkey/february` —
that every member opens on stage.

Tap a song and you get the lineup for *that* song plus two purpose-built
reading modes: **Singer view** (lyrics, large, section-labelled) and **Musician
view** (chart, key, tempo, cues, transitions). Key and tempo are adjustable per
person like iReal Pro, with a click track and a chord-driven backing band.

It replaces the spreadsheet the band used to run concerts from, and it keeps
working when the venue wifi dies.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server, with hot reload on content edits |
| `npm run build` | Validates content, then builds to `dist/` |
| `npm run content:check` | Validates every YAML file and reports what is still empty |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (chart parsing, transposition, lyrics, content) |
| `npm run test:e2e` | Browser tests, including offline and the transport |
| `npm run icons` | Regenerates the PWA icons from `public/favicon.svg`'s motif |

## Routes

```
/                                          landing
/bands                                     every band
/bands/funky-monkey                        concerts + roster
/bands/funky-monkey/february               the setlist
/bands/funky-monkey/february/bad-romance   one song: lyrics or chart
/bands/funky-monkey/february/print         printable running order
```

Old flat URLs (`/funky-monkey/february/...`) redirect to the `/bands` ones.

## Editing the setlist

**All content lives in [`content/`](content/) — never in components.**
See [`content/README.md`](content/README.md) for the band-facing guide (in
Turkish). The short version:

```
content/
  band.yaml                # roster + the roles that become lineup columns
  concerts/february.yaml   # the setlist: order, per-song lineup, breaks
  songs/*.yaml             # key, tempo, structure, chords, lyrics, cues
```

Everything is validated by Zod at build time, so a mistyped name fails the
build with a file and field name instead of showing a blank cell during the
second set. CI runs the same check on every pull request.

## Architecture

| Concern | Where | Notes |
|---|---|---|
| Content loading | [`build/load-content.ts`](build/load-content.ts) | Node-only. Reads YAML, validates, cross-references. |
| Content → app | [`build/content-plugin.ts`](build/content-plugin.ts) | Exposes it as `virtual:soundcheck-content`. |
| Schemas | [`src/content/schema.ts`](src/content/schema.ts) | Build-time only; zod never reaches the browser bundle. |
| Chart parsing | [`src/features/music/chart.ts`](src/features/music/chart.ts) | `"\| Am \| C F \|"` → bars. |
| Transposition | [`src/features/music/transpose.ts`](src/features/music/transpose.ts) | Spells chords to the destination key's accidental. |
| Transport | [`src/features/audio/engine.ts`](src/features/audio/engine.ts) | One AudioContext, one lookahead scheduler. |
| Voices | [`src/features/audio/synth.ts`](src/features/audio/synth.ts) | Everything is synthesised — no samples to precache. |
| Grooves | [`src/features/audio/styles.ts`](src/features/audio/styles.ts) | Eighth-note grid per style. |
| Design tokens | [`src/design/tokens.css`](src/design/tokens.css) | Paper/panel/ink editorial palette, one blue accent. |
| Type | [`src/design/fonts.css`](src/design/fonts.css) | Archivo + Newsreader + JetBrains Mono, self-hosted. |
| Shell | [`src/app/Shell.tsx`](src/app/Shell.tsx) | Masthead, sticky breadcrumb rail, footer. |

### Some decisions worth knowing about

**Audio is synthesised, not sampled.** The click is a lookahead-scheduled
oscillator with no dependencies and no assets: it works on a dead connection
the first time the app is opened. The backing band (keys, bass, drums) is built
from the same clock. That keeps the entire offline precache at ~530 KB and
means there is only ever one clock to go out of sync.

**Chord charts are one-line bar strings.** `"| Am | C F | Am | C G |"` parses in
about thirty lines, transposes, renders as a grid, and feeds playback. There is
no second notation system for the band to learn.

**Service worker claims the first load, but never swaps mid-set.**
`clientsClaim: true` protects someone opening the app for the first time at the
venue; `skipWaiting: false` plus a "Güncelle" prompt means a new version never
reloads the page in front of an audience.

**Charts come from the band's own iReal Pro book.** Fourteen songs carry real
charts transcribed from it, so the keys are the ones the band actually plays
rather than the ones on the records — You Give Love A Bad Name in Cm, Price Tag
in F, Cake By The Ocean in Em, I Want It That Way in F#m. Bad Romance was
decoded straight from the band's `.html` export (`irealb://` payloads
de-obfuscate with a 50-character block permutation: swap `i ↔ 49-i` for
`i ∈ [0,5) ∪ [10,24)`, leaving a trailing block shorter than 50 characters
untouched). An importer is a small script away if it earns its place.

**The design is editorial, not app chrome.** Paper and panel rather than
background and card, ink rather than foreground, hairline rules doing the work
borders and shadows usually do. Three faces with three jobs: Archivo sets
headlines, Newsreader carries prose and lyrics, JetBrains Mono handles anything
that has to line up in a column — keys, tempos, bar counts, chord grids. The
single blue accent is spent only on things that are live or selected: the
sounding bar, the songs you personally play, the current breadcrumb.

**Light by default, dark when the room is.** No `data-theme` attribute is set
until someone picks one, so the stylesheet falls through to
`prefers-color-scheme`. A setlist is a document in daylight and a stage tool at
night; both palettes are first-class.

**No sync layer yet.** When follow-along sync is added, it plugs in at the
transport: `engine.start()`/`engine.stop()` and the current song id are the only
state that has to travel. Nothing else in the app needs to know.

## Deploying

Static build, so anything works. `vercel.json` and `public/_redirects` already
route all paths to `index.html` for Vercel and Cloudflare/Netlify respectively.

```bash
npm run build   # → dist/
```

## Status

Working today: setlist with per-song lineup, the "who are you" identity picker,
lyrics and chart views, transposition, tempo override and tap tempo, click with
count-in, chord-driven backing band, offline/PWA, screen wake lock, stage mode,
keyboard and pedal navigation, and a printable setlist.

The interface is in English throughout; song titles, artists and lyrics stay in
whatever language they belong to.

Not built yet: follow-along sync between devices, and score upload. Lyrics are
the band's to add — see [`content/README.md`](content/README.md).
