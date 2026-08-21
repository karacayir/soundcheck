# Soundcheck

A live-performance companion for bands. One URL — `/funky-monkey/february` —
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
| Design tokens | [`src/design/tokens.css`](src/design/tokens.css) | Two colours, a neutral ramp, zero radii. |

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

**The iReal Pro decoder is proven but not wired in.** The chart in
`content/songs/bad-romance.yaml` was decoded from the band's own `.html` export
(`irealb://` payloads de-obfuscate with a 50-character block permutation:
swap `i ↔ 49-i` for `i ∈ [0,5) ∪ [10,24)`, leaving a trailing block shorter than
50 characters untouched). Charts are hand-authored for now; an importer is a
small script away if it earns its place.

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

Working today: setlist with per-song lineup, the "I am ___" identity picker,
singer and musician views, transposition, tempo override and tap tempo, click
with count-in, chord-driven backing band, offline/PWA, screen wake lock, stage
mode, keyboard and pedal navigation, and a printable setlist.

Not built yet: follow-along sync between devices, and score upload.
