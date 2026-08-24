# Content — this is where you edit the songs and the setlist

Everything in the app comes from the `.yaml` files in this folder. You don't
need to know how to code: edit the files here (or straight on GitHub) and save.

If you get something wrong, the app doesn't break — **the build fails and tells
you exactly what's wrong.** To check on your own machine:

```
npm run content:check
```

That prints both any errors and **what's still missing on each song**.

---

## Three kinds of file

| File | What it holds |
|---|---|
| `band.yaml` | The roster — who's in the band and what they play |
| `concerts/february.yaml` | **The setlist** — song order and who plays on each one |
| `songs/<song>.yaml` | The song itself — key, tempo, sections, chords, lyrics |

The logic: **who plays belongs to the concert** (it changes show to show),
**key and chords belong to the song** (they stay the same between shows).

---

## 1. Changing the setlist — `concerts/february.yaml`

The order in the file is the order you play. To move a song up, move its block up.

```yaml
setlist:
  - song: bad-romance
    lineup: { vocals: [berfin, doga], guitar: [itri], keys: [seco], bass: [dogukan], drums: [burak] }
```

- `song:` is the filename in `songs/` without the `.yaml`.
- Names in `lineup` are ids from `band.yaml` — `doga`, not `Doğa`.
- **First name in the vocals list is the lead.**
- Add `segue: true` to mean "run straight into the next song, no gap".

To add a break:

```yaml
  - break: SHORT BREAK
    minutes: 15
```

To drop a song, delete its block. To add one, create the file in `songs/` first,
then add a line here.

---

## 2. Filling in a song — `songs/bad-romance.yaml`

```yaml
id: bad-romance
title: "Bad Romance"
artist: "Lady Gaga"
key: Am                # the written key. Everyone can transpose on their own phone.
tempo: 119             # BPM
meter: "4/4"
style: pop             # backing groove: pop, rock, funk, ballad, latin, disco
feel: swing            # optional: straight (default), swing, shuffle, halftime, double
duration: "4:54"
```

### Sections and chords

```yaml
structure:
  - id: intro
    label: "Intro"
    chords: "| F | G | Am E/Ab | C/A |"
    cue: "Synth intro"
  - id: verse
    label: "Verse"
    chords: "| Am | % | F | C |"
    repeat: 2
```

One rule for chords: **`|` separates bars.**

- Two chords in a bar → put a space between them: `| C F |`
- Same as the bar before → `%`: `| Am | % |`
- No chord → `N.C.`
- `repeat: 2` plays the section through twice.

Write chords normally: `Am`, `Bb`, `F#m7`, `Cmaj7`, `E/G#`. When someone
transposes, the app respells them to match the destination key — going up a
semitone from A gives `Bb`, not `A#`.

### Lyrics

```yaml
lyrics: |
  [Verse 1]
  First line
  Second line

  [Chorus]
  Chorus line
```

- Headings in `[square brackets]` name the section.
- You can put chords inline if you want: `I want your [Am]ugly`. Those only show
  in the **Chart** view — the **Lyrics** view strips them out.

### Cues and transitions

```yaml
cues:
  - { at: intro, text: "START - KEYS AND VOX" }
  - { text: "Free time, no click" }        # no `at:` means it applies to the whole song

transitions:
  in:  "Get Lucky ends and this starts, no gap"
  out: "Drum fill into Kandırdım"
```

---

## 3. Changing the roster — `band.yaml`

```yaml
members:
  - { id: doga, name: Doğa, roles: [vocals] }
```

- `id` must be lowercase, no spaces, no accented characters (`dogukan`, `ozan-a`).
- `name` can be written however you like (`Doğa`, `Ekin Berkyürek`).
- `roles` are the instruments that person can cover.

The `slots` number under `roles:` is how many columns a role gets on the
printable setlist — vocals had three on last year's sheet, guitar had two.

---

## Common errors

| Message | What it means |
|---|---|
| `unknown member "dogu"` | No such id in `band.yaml` — check the spelling |
| `references song "x", but content/songs/x.yaml does not exist` | The setlist points at a song file that isn't there |
| `role "vocals" has 4 people but only 3 slot(s)` | Raise `slots` in `band.yaml` |
| `must look like 4/4, 6/8, 3/4` | `meter` is written wrong |
| `invalid YAML` | Usually quotes or indentation — use two spaces, never tabs |
