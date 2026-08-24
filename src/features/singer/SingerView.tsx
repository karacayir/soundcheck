import { AArrowDown, AArrowUp, Info } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type { Song } from '@/content/types'
import { Empty, IconButton, Label, Num, cx } from '@/design/primitives'
import { parseLyrics } from '@/features/music/lyrics'
import { setPrefs, usePrefs } from '@/features/session/prefs'

const MIN_SIZE = 18
const MAX_SIZE = 64

/**
 * Lyrics sized for a music stand rather than a desk. Sections are labelled so
 * you can find the second chorus at a glance, and cues sit inline where they
 * happen instead of in a footnote nobody reads mid-song.
 */
export function SingerView({ song, autoScroll }: { song: Song; autoScroll: boolean }) {
  const prefs = usePrefs()
  const sections = useMemo(() => parseLyrics(song.lyrics), [song.lyrics])

  useAutoScroll(autoScroll)

  const cuesBySection = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const cue of song.cues) {
      if (!cue.at) continue
      map.set(cue.at, [...(map.get(cue.at) ?? []), cue.text])
    }
    return map
  }, [song.cues])

  if (sections.length === 0) {
    return (
      <div className="flex flex-col gap-7 pb-8">
        <Empty>
          No lyrics for this song yet.
          <br />
          <code className="sc-num mt-2 inline-block text-2xs text-dim">
            content/songs/{song.id}.yaml → lyrics:
          </code>
        </Empty>
        {song.structure.length > 0 && (
          <section className="flex flex-col gap-3">
            <Label>Form</Label>
            <ol className="sc-panel divide-y divide-line overflow-hidden">
              {song.structure.map((section) => (
                <li key={section.id} className="flex items-baseline gap-3 px-3.5 py-2.5">
                  <span className="text-sm font-medium">{section.label}</span>
                  {section.repeat > 1 && (
                    <Num className="text-2xs text-dim">×{section.repeat}</Num>
                  )}
                  {section.cue && <span className="text-xs text-muted italic">{section.cue}</span>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Label>Lyrics</Label>
        <div className="flex items-center gap-1.5">
          <Num className="mr-1 text-2xs text-dim">{prefs.lyricSize}px</Num>
          <IconButton
            aria-label="Smaller text"
            disabled={prefs.lyricSize <= MIN_SIZE}
            onClick={() => setPrefs({ lyricSize: Math.max(MIN_SIZE, prefs.lyricSize - 3) })}
          >
            <AArrowDown size={16} strokeWidth={1.75} />
          </IconButton>
          <IconButton
            aria-label="Bigger text"
            disabled={prefs.lyricSize >= MAX_SIZE}
            onClick={() => setPrefs({ lyricSize: Math.min(MAX_SIZE, prefs.lyricSize + 3) })}
          >
            <AArrowUp size={16} strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-9">
        {sections.map((section, sectionIndex) => {
          const cues = section.label ? cuesBySection.get(slugish(section.label)) : undefined
          return (
            <section key={`${section.label}-${sectionIndex}`}>
              {section.label && (
                <div className="mb-3 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-sm bg-surface-2 px-2 py-1 text-2xs font-semibold tracking-[0.11em] text-fg uppercase">
                    {section.label}
                  </span>
                  {cues?.map((cue) => (
                    <span key={cue} className="flex items-center gap-1.5 text-xs text-accent">
                      <Info size={12} strokeWidth={2} />
                      {cue}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{ fontSize: `${prefs.lyricSize}px`, lineHeight: 1.32 }}
                className="sc-tight font-medium"
              >
                {section.lines.map((line, lineIndex) => (
                  <p key={lineIndex} className={cx(line.chordsOnly && 'text-muted')}>
                    {line.chunks.map((chunk, chunkIndex) => (
                      <span key={chunkIndex}>
                        {chunk.chord && (
                          <span
                            className="sc-num mr-1 align-super text-[0.46em] font-medium text-accent"
                            aria-hidden
                          >
                            {chunk.chord}
                          </span>
                        )}
                        {chunk.text || ' '}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function slugish(label: string): string {
  return label
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Slow, steady scroll that stops once the page bottoms out. */
function useAutoScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return

    let raf = 0
    let last = performance.now()
    let stopped = false
    const PIXELS_PER_SECOND = 14

    const step = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      if (!stopped) {
        window.scrollBy(0, PIXELS_PER_SECOND * delta)
        if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 2) stopped = true
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    return () => cancelAnimationFrame(raf)
  }, [active])
}
