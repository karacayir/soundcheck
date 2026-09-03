import { useMemo } from 'react'
import type { Song } from '@/content/types'
import { Chip, Num, cx } from '@/design/primitives'
import { flattenBars, songToChart, type ChartSection } from '@/features/music/chart'
import { accidentalFor, transposeChord } from '@/features/music/transpose'
import { ChordSymbol } from './ChordSymbol'

/**
 * The bar grid. Four bars to a row on soft tiles. While the transport runs the
 * sounding bar fills with the accent, so you can find your place from across a
 * stage without hunting.
 */
export function ChartGrid({
  song,
  keyOffset,
  playingBar,
}: {
  song: Song
  keyOffset: number
  /** Index into the flattened (repeat-expanded) bar list, or null when stopped. */
  playingBar: number | null
}) {
  const sections = useMemo(() => {
    const accidental = accidentalFor(song.key, keyOffset)
    return songToChart(song).map((section) => ({
      ...section,
      bars: section.bars.map((bar) => ({
        ...bar,
        chords: bar.chords.map((c) => transposeChord(c, keyOffset, accidental)),
      })),
    }))
  }, [song, keyOffset])

  const flat = useMemo(() => flattenBars(sections), [sections])
  const active =
    playingBar === null || flat.length === 0
      ? null
      : flat[((playingBar % flat.length) + flat.length) % flat.length]

  if (sections.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          activeBar={active?.sectionId === section.id ? active.index : null}
        />
      ))}
    </div>
  )
}

function SectionBlock({ section, activeBar }: { section: ChartSection; activeBar: number | null }) {
  const live = activeBar !== null

  return (
    <section className="sc-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-4 pt-4 pb-3">
        <span
          className={cx(
            'sc-tight text-[15px] font-bold transition-colors',
            live ? 'text-accent' : 'text-ink',
          )}
        >
          {section.label}
        </span>
        <Num className="text-[12.5px] text-ink-3">{section.bars.length} bars</Num>
        {section.repeat > 1 && <Chip>×{section.repeat}</Chip>}
        {section.cue && (
          <span className="text-[13px] text-ink-2">{section.cue}</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
        {section.bars.map((bar) => {
          const isActive = activeBar === bar.index
          return (
            <div
              key={bar.index}
              className={cx(
                'flex min-h-[4rem] items-center justify-center gap-1.5 rounded-lg px-1 py-3',
                'transition-colors duration-100',
                isActive ? 'bg-accent text-on-accent' : 'bg-sunk',
              )}
            >
              {bar.chords.length === 0 ? (
                <span className={isActive ? 'text-on-accent/40' : 'text-ink-3/45'}>·</span>
              ) : (
                bar.chords.map((chord, index) => (
                  <ChordSymbol
                    key={`${chord}-${index}`}
                    symbol={chord}
                    muted={isActive ? 'text-on-accent/65' : 'text-ink-3'}
                    className={cx(
                      'sc-num sc-tight leading-none font-bold',
                      bar.chords.length > 2
                        ? 'text-[14px]'
                        : bar.chords.length > 1
                          ? 'text-[16px]'
                          : 'text-[21px]',
                    )}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
