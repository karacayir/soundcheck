import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { band, memberName, roleById } from '@/content'
import type { SetlistItem, Song } from '@/content/types'
import { Callout, Empty, Label, SectionHead, cx } from '@/design/primitives'
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
        <SectionHead num="01" title="Chart">
          {hasChart
            ? 'Bars run left to right, four to a row. Repeats are marked on the section rule.'
            : undefined}
        </SectionHead>
        {hasChart ? (
          <ChartGrid song={song} keyOffset={keyOffset} playingBar={playingBar} />
        ) : (
          <Empty>
            No chart for this song yet — add a <code className="font-mono text-[0.9em]">structure:</code>{' '}
            block to
            <br />
            <code className="mt-1.5 inline-block bg-sunk px-1.5 py-0.5 font-mono text-[13px] text-ink">
              content/songs/{song.id}.yaml
            </code>
          </Empty>
        )}
      </section>

      {generalCues.length > 0 && (
        <section>
          <SectionHead num="02" tag="Do not miss" tagTone="accent" title="Cues" />
          <div className="flex flex-col gap-2.5">
            {generalCues.map((cue, i) => (
              <Callout key={i}>{cue.text}</Callout>
            ))}
          </div>
        </section>
      )}

      {(song.transitions.in || song.transitions.out) && (
        <section>
          <SectionHead num={generalCues.length > 0 ? '03' : '02'} title="Transitions">
            How this song is joined to the ones either side of it.
          </SectionHead>
          <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {song.transitions.in && (
              <TransitionCell icon="in" direction="Coming in" text={song.transitions.in} />
            )}
            {song.transitions.out && (
              <TransitionCell icon="out" direction="Going out" text={song.transitions.out} />
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHead num="—" title="Who's on this">
          The lineup for this song at this concert.
        </SectionHead>
        <Lineup item={item} memberId={memberId} />
      </section>

      {song.notes && (
        <section>
          <SectionHead num="—" title="Notes" />
          <p className="sc-prose m-0 whitespace-pre-wrap">{song.notes.trim()}</p>
        </section>
      )}
    </div>
  )
}

function TransitionCell({
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
    <div className="bg-panel px-4 py-3.5">
      <div className="sc-label mb-1.5 flex items-center gap-1.5">
        <Icon size={11} strokeWidth={2} /> {direction}
      </div>
      <p className="sc-prose m-0 !text-[16px] !leading-snug !text-ink">{text}</p>
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
      <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {rows.map(({ role, people }) => (
          <div key={role.id} className="bg-panel px-4 py-3.5">
            <Label className="mb-2">{roleById.get(role.id)?.label ?? role.id}</Label>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {people.map((id, index) => (
                <li
                  key={id}
                  className={cx(
                    'flex items-baseline gap-1.5 text-[15px] tracking-[-0.01em]',
                    id === memberId ? 'font-semibold text-accent' : 'font-medium',
                  )}
                >
                  {memberName(id)}
                  {role.id === 'vocals' && index === 0 && people.length > 1 && (
                    <span className="font-mono text-[9px] tracking-[0.1em] text-muted uppercase">
                      lead
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {item.notes && <p className="sc-prose mt-3 !text-[15px]">{item.notes}</p>}
    </>
  )
}
