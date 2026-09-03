import { AArrowDown, AArrowUp, Info } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type { Song } from '@/content/types'
import { Empty, IconButton, Num, SectionHead, cx } from '@/design/primitives'
import { parseLyrics } from '@/features/music/lyrics'
import { setPrefs, usePrefs } from '@/features/session/prefs'

const MIN_SIZE = 18
const MAX_SIZE = 64

/**
 * Lyrics set in the serif at whatever size reaches your eyes from the stand.
 * Sections are labelled so you can find the second chorus at a glance, and
 * cues sit inline where they happen rather than in a footnote nobody reads
 * mid-song.
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
          <SectionHead num="01" title="Lyrics" />
          <Empty>
            No lyrics for this song yet — add a{' '}
            <code className="font-mono text-[0.9em]">lyrics:</code> block to
            <br />
            <code className="mt-1.5 inline-block bg-sunk px-1.5 py-0.5 font-mono text-[13px] text-ink">
              content/songs/{song.id}.yaml
            </code>
          </Empty>
        </section>

        {song.structure.length > 0 && (
          <section>
            <SectionHead num="02" title="Form">
              What you have until the words go in.
            </SectionHead>
            <ol className="sc-grid m-0 list-none p-0" style={{ gridTemplateColumns: '1fr' }}>
              {song.structure.map((section) => (
                <li key={section.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-panel px-4 py-3">
                  <span className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                    {section.label}
                  </span>
                  {section.repeat > 1 && <Num className="text-[10px] text-muted">×{section.repeat}</Num>}
                  {section.cue && (
                    <span className="sc-prose !text-[14.5px] !text-muted italic">{section.cue}</span>
                  )}
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
        num="01"
        title="Lyrics"
        action={
          <div className="flex items-center gap-1.5">
            <Num className="mr-0.5 text-[10px] text-muted">{prefs.lyricSize}</Num>
            <IconButton
              aria-label="Smaller text"
              disabled={prefs.lyricSize <= MIN_SIZE}
              onClick={() => setPrefs({ lyricSize: Math.max(MIN_SIZE, prefs.lyricSize - 3) })}
            >
              <AArrowDown size={15} strokeWidth={1.75} />
            </IconButton>
            <IconButton
              aria-label="Bigger text"
              disabled={prefs.lyricSize >= MAX_SIZE}
              onClick={() => setPrefs({ lyricSize: Math.min(MAX_SIZE, prefs.lyricSize + 3) })}
            >
              <AArrowUp size={15} strokeWidth={1.75} />
            </IconButton>
          </div>
        }
      />

      <div className="flex flex-col gap-9">
        {sections.map((section, sectionIndex) => {
          const cues = section.label ? cuesBySection.get(slugish(section.label)) : undefined
          return (
            <div key={`${section.label}-${sectionIndex}`}>
              {section.label && (
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-accent uppercase">
                    {section.label}
                  </span>
                  {cues?.map((cue) => (
                    <span key={cue} className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] text-warm uppercase">
                      <Info size={11} strokeWidth={2} />
                      {cue}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{ fontSize: `${prefs.lyricSize}px`, lineHeight: 1.34 }}
                className="font-text tracking-[-0.008em] text-ink"
              >
                {section.lines.map((line, lineIndex) => (
                  <p key={lineIndex} className={cx('m-0', line.chordsOnly && 'text-muted')}>
                    {line.chunks.map((chunk, chunkIndex) => (
                      <span key={chunkIndex}>
                        {chunk.chord && (
                          <span
                            className="sc-num mr-1 align-super text-[0.44em] font-semibold text-accent"
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
