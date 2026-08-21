import { useMemo } from 'react'
import type { Song } from '@/content/types'
import { Label, Num } from '@/design/primitives'
import { flattenBars, songToChart, type ChartSection } from '@/features/music/chart'
import { accidentalFor, transposeChord } from '@/features/music/transpose'
import { ChordSymbol } from './ChordSymbol'

/**
 * The iReal-style bar grid. Four bars to a row, hairline cells, chord centred.
 * When the transport is running the sounding bar inverts, so you can find your
 * place from across the stage.
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
  const active = playingBar === null ? null : flat[((playingBar % flat.length) + flat.length) % flat.length]

  if (sections.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
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

function SectionBlock({
  section,
  activeBar,
}: {
  section: ChartSection
  activeBar: number | null
}) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Label className="!text-fg">{section.label}</Label>
        <Num className="text-2xs text-dim">{section.bars.length} bar</Num>
        {section.repeat > 1 && (
          <span className="text-2xs tracking-[0.09em] text-muted uppercase">
            ×{section.repeat}
          </span>
        )}
        {section.cue && <span className="text-2xs text-muted italic">{section.cue}</span>}
      </div>

      <div className="grid grid-cols-4 gap-px border border-line bg-line">
        {section.bars.map((bar) => {
          const isActive = activeBar === bar.index
          return (
            <div
              key={bar.index}
              className={
                'flex min-h-16 items-center justify-center gap-2 px-1 py-3 transition-colors ' +
                'duration-75 ' +
                (isActive ? 'bg-fg text-bg' : 'bg-bg')
              }
            >
              {bar.chords.length === 0 ? (
                <span className={isActive ? 'text-bg/40' : 'text-dim'}>·</span>
              ) : (
                bar.chords.map((chord, i) => (
                  <ChordSymbol
                    key={`${chord}-${i}`}
                    symbol={chord}
                    className={
                      'sc-num leading-none ' +
                      (bar.chords.length > 1 ? 'text-base' : 'text-lg') +
                      ' font-medium'
                    }
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
