import { useMemo } from 'react'
import type { Song } from '@/content/types'
import { Num, Tag, cx } from '@/design/primitives'
import { flattenBars, songToChart, type ChartSection } from '@/features/music/chart'
import { accidentalFor, transposeChord } from '@/features/music/transpose'
import { ChordSymbol } from './ChordSymbol'

/**
 * The bar grid. Four bars to a row, hairline cells over a rule-coloured ground.
 * While the transport runs the sounding bar washes accent, so you can find your
 * place from across a stage.
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
    <div className="flex flex-col gap-7">
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
    <section>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line pb-2">
        <span
          className={cx(
            'font-mono text-[11px] font-bold tracking-[0.12em] uppercase transition-colors',
            live ? 'text-accent' : 'text-ink',
          )}
        >
          {section.label}
        </span>
        <Num className="text-[10px] text-muted">{section.bars.length} bars</Num>
        {section.repeat > 1 && <Tag>×{section.repeat}</Tag>}
        {section.cue && (
          <span className="sc-prose !text-[14.5px] !text-muted italic">{section.cue}</span>
        )}
      </div>

      <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {section.bars.map((bar) => {
          const isActive = activeBar === bar.index
          return (
            <div
              key={bar.index}
              className={cx(
                'flex min-h-[4.25rem] items-center justify-center gap-2 px-1 py-3.5 transition-colors',
                'duration-100',
                isActive ? 'bg-accent text-white' : 'bg-panel',
              )}
            >
              {bar.chords.length === 0 ? (
                <span className={isActive ? 'text-white/45' : 'text-line'}>·</span>
              ) : (
                bar.chords.map((chord, index) => (
                  <ChordSymbol
                    key={`${chord}-${index}`}
                    symbol={chord}
                    muted={isActive ? 'text-white/65' : 'text-muted'}
                    className={cx(
                      'sc-num leading-none font-semibold',
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
