import { useEffect, useMemo, useRef } from 'react'
import type { Song } from '@/content/types'
import { Empty, IconButton, Label } from '@/design/primitives'
import { parseLyrics } from '@/features/music/lyrics'
import { setPrefs, usePrefs } from '@/features/session/prefs'

const MIN_SIZE = 18
const MAX_SIZE = 64

/**
 * Lyrics, sized for a music stand rather than a desk. Sections are labelled so
 * you can find the second chorus at a glance, and cues sit inline where they
 * happen instead of in a footnote nobody reads mid-song.
 */
export function SingerView({
  song,
  autoScroll,
}: {
  song: Song
  autoScroll: boolean
}) {
  const prefs = usePrefs()
  const sections = useMemo(() => parseLyrics(song.lyrics), [song.lyrics])
  const containerRef = useRef<HTMLDivElement>(null)

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
      <div className="flex flex-col gap-6 pb-8">
        <Empty>
          Bu şarkının sözleri henüz girilmedi.
          <br />
          <code className="mt-2 inline-block text-2xs text-dim">
            content/songs/{song.id}.yaml → lyrics:
          </code>
        </Empty>
        {song.structure.length > 0 && (
          <section className="flex flex-col gap-3">
            <Label>Bölümler</Label>
            <ol className="flex flex-col gap-px bg-line">
              {song.structure.map((section) => (
                <li key={section.id} className="flex items-baseline gap-3 bg-bg px-3 py-2.5">
                  <span className="text-sm font-medium">{section.label}</span>
                  {section.repeat > 1 && <span className="text-2xs text-dim">×{section.repeat}</span>}
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
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Label>Sözler</Label>
        <div className="flex items-center gap-px">
          <IconButton
            aria-label="Yazıyı küçült"
            disabled={prefs.lyricSize <= MIN_SIZE}
            onClick={() => setPrefs({ lyricSize: Math.max(MIN_SIZE, prefs.lyricSize - 3) })}
          >
            <span className="text-xs">A</span>
          </IconButton>
          <IconButton
            aria-label="Yazıyı büyült"
            disabled={prefs.lyricSize >= MAX_SIZE}
            onClick={() => setPrefs({ lyricSize: Math.min(MAX_SIZE, prefs.lyricSize + 3) })}
          >
            <span className="text-lg leading-none">A</span>
          </IconButton>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-col gap-8">
        {sections.map((section, sectionIndex) => (
          <section key={`${section.label}-${sectionIndex}`}>
            {section.label && (
              <div className="mb-2 flex flex-wrap items-baseline gap-3">
                <Label className="!text-fg">{section.label}</Label>
                {cuesBySection.get(slugish(section.label))?.map((cue) => (
                  <span key={cue} className="text-2xs text-muted italic">
                    {cue}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{ fontSize: `${prefs.lyricSize}px`, lineHeight: 1.34 }}
              className="font-medium sc-tight"
            >
              {section.lines.map((line, lineIndex) => (
                <p key={lineIndex} className={line.chordsOnly ? 'text-muted' : undefined}>
                  {line.chunks.map((chunk, chunkIndex) => (
                    <span key={chunkIndex} className={chunk.chord ? 'relative' : undefined}>
                      {chunk.chord && (
                        <span
                          className="sc-num mr-1 align-super text-[0.5em] font-normal text-muted"
                          aria-hidden
                        >
                          {chunk.chord}
                        </span>
                      )}
                      {chunk.text || ' '}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function slugish(label: string): string {
  return label
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Slow, steady scroll. Any touch or wheel input hands control straight back. */
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
        const atBottom =
          window.scrollY + window.innerHeight >= document.body.scrollHeight - 2
        if (atBottom) stopped = true
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    return () => cancelAnimationFrame(raf)
  }, [active])
}
