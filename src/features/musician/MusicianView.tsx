import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { band, memberName, roleById } from '@/content'
import type { SetlistItem, Song } from '@/content/types'
import { Callout, Chip, Empty, SectionHead, cx } from '@/design/primitives'
import { ChartGrid } from './ChartGrid'

export function MusicianView({
  song,
  item,
  keyOffset,
  playingBar,
  memberId,
}: {
  song: Song
  item: Extract<SetlistItem, { kind: 'song' }>
  keyOffset: number
  playingBar: number | null
  memberId: string | null
}) {
  const hasChart = song.structure.length > 0
  const generalCues = song.cues.filter((c) => !c.at)

  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHead title="Chords">
          {hasChart ? 'Four bars to a row, top to bottom.' : undefined}
        </SectionHead>
        {hasChart ? (
          <ChartGrid song={song} keyOffset={keyOffset} playingBar={playingBar} />
        ) : (
          <Empty>Nobody has added chords for this one yet.</Empty>
        )}
      </section>

      {generalCues.length > 0 && (
        <section>
          <SectionHead title="Don't miss" />
          <div className="flex flex-col gap-2.5">
            {generalCues.map((cue, i) => (
              <Callout key={i}>{cue.text}</Callout>
            ))}
          </div>
        </section>
      )}

      {(song.transitions.in || song.transitions.out) && (
        <section>
          <SectionHead title="Transitions">
            How this song joins the ones either side of it.
          </SectionHead>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
          >
            {song.transitions.in && (
              <TransitionCard icon="in" direction="Coming in" text={song.transitions.in} />
            )}
            {song.transitions.out && (
              <TransitionCard icon="out" direction="Going out" text={song.transitions.out} />
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHead title="Who's on this">The lineup for this song at this show.</SectionHead>
        <Lineup item={item} memberId={memberId} />
      </section>

      {song.notes && (
        <section>
          <SectionHead title="Notes" />
          <p className="m-0 text-[15px] leading-relaxed whitespace-pre-wrap text-ink-2">
            {song.notes.trim()}
          </p>
        </section>
      )}
    </div>
  )
}

function TransitionCard({
  icon,
  direction,
  text,
}: {
  icon: 'in' | 'out'
  direction: string
  text: string
}) {
  const Icon = icon === 'in' ? ArrowDownLeft : ArrowUpRight
  return (
    <div className="sc-card p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
        <Icon size={13} strokeWidth={2.25} /> {direction}
      </div>
      <p className="m-0 text-[15px] leading-snug">{text}</p>
    </div>
  )
}

function Lineup({
  item,
  memberId,
}: {
  item: Extract<SetlistItem, { kind: 'song' }>
  memberId: string | null
}) {
  const rows = band.roles
    .map((role) => ({ role, people: item.lineup[role.id] ?? [] }))
    .filter((row) => row.people.length > 0)

  if (rows.length === 0) return null

  return (
    <>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))' }}
      >
        {rows.map(({ role, people }) => (
          <div key={role.id} className="sc-card p-4">
            <div className="mb-2 text-[12.5px] font-bold text-accent">
              {roleById.get(role.id)?.label ?? role.id}
            </div>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {people.map((id, index) => (
                <li
                  key={id}
                  className={cx(
                    'sc-tight flex items-center gap-2 text-[15px]',
                    id === memberId ? 'font-bold text-accent' : 'font-medium',
                  )}
                >
                  {memberName(id)}
                  {role.id === 'vocals' && index === 0 && people.length > 1 && (
                    <Chip>lead</Chip>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {item.notes && <p className="mt-3 text-[14.5px] text-ink-2">{item.notes}</p>}
    </>
  )
}
