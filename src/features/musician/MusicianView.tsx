import { ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react'
import { band, memberName, roleById } from '@/content'
import type { SetlistItem, Song } from '@/content/types'
import { Chip, Empty, Label } from '@/design/primitives'
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
    <div className="flex flex-col gap-9 pb-8">
      <section className="flex flex-col gap-3">
        <Label>Chart</Label>
        {hasChart ? (
          <ChartGrid song={song} keyOffset={keyOffset} playingBar={playingBar} />
        ) : (
          <Empty>
            No chart for this song yet.
            <br />
            <code className="sc-num mt-2 inline-block text-2xs text-dim">
              content/songs/{song.id}.yaml
            </code>
          </Empty>
        )}
      </section>

      {generalCues.length > 0 && (
        <section className="flex flex-col gap-3">
          <Label>Cues</Label>
          <ul className="flex flex-col gap-2">
            {generalCues.map((cue, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-lg border border-accent/25 bg-accent/8 px-3.5 py-3"
              >
                <Info size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-sm leading-snug">{cue.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(song.transitions.in || song.transitions.out) && (
        <section className="flex flex-col gap-3">
          <Label>Transitions</Label>
          <div className="sc-panel divide-y divide-line overflow-hidden">
            {song.transitions.in && (
              <TransitionRow icon="in" direction="Into this" text={song.transitions.in} />
            )}
            {song.transitions.out && (
              <TransitionRow icon="out" direction="Out of this" text={song.transitions.out} />
            )}
          </div>
        </section>
      )}

      <Lineup item={item} memberId={memberId} />

      {song.notes && (
        <section className="flex flex-col gap-3">
          <Label>Arrangement</Label>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">{song.notes}</p>
        </section>
      )}
    </div>
  )
}

function TransitionRow({
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
    <div className="flex items-start gap-3 px-3.5 py-3">
      <Icon size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-dim" />
      <div className="min-w-0">
        <div className="sc-label mb-1">{direction}</div>
        <div className="text-sm leading-snug">{text}</div>
      </div>
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
    <section className="flex flex-col gap-3">
      <Label>Who&rsquo;s on this</Label>
      <div className="sc-panel divide-y divide-line overflow-hidden">
        {rows.map(({ role, people }) => (
          <div key={role.id} className="flex items-center gap-3 px-3.5 py-2.5">
            <span className="sc-label w-16 shrink-0">
              {roleById.get(role.id)?.label ?? role.id}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {people.map((id, index) => (
                <Chip key={id} tone={id === memberId ? 'accent' : 'default'}>
                  {memberName(id)}
                  {role.id === 'vocals' && index === 0 && people.length > 1 && (
                    <span className="opacity-55">lead</span>
                  )}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
      {item.notes && <p className="text-xs leading-relaxed text-muted">{item.notes}</p>}
    </section>
  )
}
