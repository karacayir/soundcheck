import { useMemo } from 'react'
import type { Song } from '@/content/types'
import { Num, cx } from '@/design/primitives'
import { flattenBars, songToChart, type ChartSection } from '@/features/music/chart'
import { accidentalFor, transposeChord } from '@/features/music/transpose'
import { ChordSymbol } from './ChordSymbol'

/**
 * The bar grid. Four bars to a row, hairline cells, chord centred. While the
 * transport runs, the sounding bar lights up in the accent so you can find
 * your place from across a stage.
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
      <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={cx(
            'rounded-sm px-2 py-1 text-2xs font-semibold tracking-[0.11em] uppercase transition-colors',
            live ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-fg',
          )}
        >
          {section.label}
        </span>
        <Num className="text-2xs text-dim">{section.bars.length} bars</Num>
        {section.repeat > 1 && (
          <span className="sc-num rounded-sm border border-line px-1.5 py-0.5 text-2xs text-muted">
            ×{section.repeat}
          </span>
        )}
        {section.cue && <span className="text-xs text-muted italic">{section.cue}</span>}
      </div>

      <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-line">
        {section.bars.map((bar, i) => {
          const isActive = activeBar === bar.index
          return (
            <div
              key={bar.index}
              className={cx(
                'relative flex min-h-[4.5rem] items-center justify-center gap-2 px-1 py-4',
                'transition-colors duration-100',
                // Internal hairlines drawn as borders keeps the outer radius clean.
                i % 4 !== 3 && 'border-r border-line',
                i >= 4 && 'border-t border-line',
                isActive ? 'bg-accent text-accent-fg' : 'bg-surface',
              )}
            >
              {bar.chords.length === 0 ? (
                <span className={isActive ? 'text-accent-fg/40' : 'text-dim'}>·</span>
              ) : (
                bar.chords.map((chord, index) => (
                  <ChordSymbol
                    key={`${chord}-${index}`}
                    symbol={chord}
                    muted={isActive ? 'text-accent-fg/60' : 'text-muted'}
                    className={cx(
                      'sc-num leading-none font-medium',
                      bar.chords.length > 1 ? 'text-base' : 'text-xl',
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
