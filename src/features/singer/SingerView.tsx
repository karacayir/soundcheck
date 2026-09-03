import { AArrowDown, AArrowUp } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type { Song } from '@/content/types'
import { Chip, Empty, IconButton, Num, SectionHead, cx } from '@/design/primitives'
import { parseLyrics } from '@/features/music/lyrics'
import { setPrefs, usePrefs } from '@/features/session/prefs'

const MIN_SIZE = 18
const MAX_SIZE = 64

/**
 * Lyrics at whatever size reaches your eyes from the stand. Sections are
 * labelled so you can find the second chorus at a glance, and cues sit inline
 * where they happen rather than in a footnote nobody reads mid-song.
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
      <div className="flex flex-col gap-10">
        <section>
          <SectionHead title="Lyrics" />
          <Empty>Nobody has added the words for this one yet.</Empty>
        </section>

        {song.structure.length > 0 && (
          <section>
            <SectionHead title="How it goes">The shape of the song until the words go in.</SectionHead>
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {song.structure.map((section) => (
                <li
                  key={section.id}
                  className="sc-card flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-3"
                >
                  <span className="sc-tight text-[15px] font-bold">{section.label}</span>
                  {section.repeat > 1 && <Chip>×{section.repeat}</Chip>}
                  {section.cue && <span className="text-[13.5px] text-ink-2">{section.cue}</span>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    )
  }

  return (
    <section>
      <SectionHead
        title="Lyrics"
        action={
          <div className="flex items-center gap-1.5">
            <Num className="mr-1 text-[12.5px] text-ink-3">{prefs.lyricSize}</Num>
            <IconButton
              size="sm"
              aria-label="Smaller text"
              disabled={prefs.lyricSize <= MIN_SIZE}
              onClick={() => setPrefs({ lyricSize: Math.max(MIN_SIZE, prefs.lyricSize - 3) })}
            >
              <AArrowDown size={15} strokeWidth={2} />
            </IconButton>
            <IconButton
              size="sm"
              aria-label="Bigger text"
              disabled={prefs.lyricSize >= MAX_SIZE}
              onClick={() => setPrefs({ lyricSize: Math.min(MAX_SIZE, prefs.lyricSize + 3) })}
            >
              <AArrowUp size={15} strokeWidth={2} />
            </IconButton>
          </div>
        }
      />

      <div className="flex flex-col gap-8">
        {sections.map((section, sectionIndex) => {
          const cues = section.label ? cuesBySection.get(slugish(section.label)) : undefined
          return (
            <div key={`${section.label}-${sectionIndex}`}>
              {section.label && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-[13px] font-bold text-accent">
                    {section.label}
                  </span>
                  {cues?.map((cue) => (
                    <span key={cue} className="text-[13px] font-medium text-warm">
                      {cue}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{ fontSize: `${prefs.lyricSize}px`, lineHeight: 1.36 }}
                className="sc-tight font-medium"
              >
                {section.lines.map((line, lineIndex) => (
                  <p key={lineIndex} className={cx('m-0', line.chordsOnly && 'text-ink-3')}>
                    {line.chunks.map((chunk, chunkIndex) => (
                      <span key={chunkIndex}>
                        {chunk.chord && (
                          <span
                            className="sc-num mr-1 align-super text-[0.46em] font-bold text-accent"
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
            </div>
          )
        })}
      </div>
    </section>
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
