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
    <div className="flex flex-col gap-8 pb-8">
      <Lineup item={item} memberId={memberId} />

      {(song.transitions.in || song.transitions.out) && (
        <section className="flex flex-col gap-3">
          <Label>Geçişler</Label>
          <div className="flex flex-col gap-px bg-line">
            {song.transitions.in && (
              <TransitionRow direction="Giriş" text={song.transitions.in} />
            )}
            {song.transitions.out && (
              <TransitionRow direction="Çıkış" text={song.transitions.out} />
            )}
          </div>
        </section>
      )}

      {generalCues.length > 0 && (
        <section className="flex flex-col gap-3">
          <Label>Notlar</Label>
          <ul className="flex flex-col gap-px bg-line">
            {generalCues.map((cue, i) => (
              <li key={i} className="bg-bg px-3 py-3 text-sm leading-snug">
                {cue.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <Label>Akorlar</Label>
        {hasChart ? (
          <ChartGrid song={song} keyOffset={keyOffset} playingBar={playingBar} />
        ) : (
          <Empty>
            Bu şarkının akorları henüz girilmedi.
            <br />
            <code className="mt-2 inline-block text-2xs text-dim">
              content/songs/{song.id}.yaml
            </code>
          </Empty>
        )}
      </section>

      {song.notes && (
        <section className="flex flex-col gap-3">
          <Label>Düzenleme</Label>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">{song.notes}</p>
        </section>
      )}
    </div>
  )
}

function TransitionRow({ direction, text }: { direction: string; text: string }) {
  return (
    <div className="flex items-start gap-3 bg-bg px-3 py-3">
      <span className="mt-0.5 w-12 shrink-0 text-2xs tracking-[0.09em] text-dim uppercase">
        {direction}
      </span>
      <span className="text-sm leading-snug">{text}</span>
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
      <Label>Kadro</Label>
      <div className="flex flex-col gap-px bg-line">
        {rows.map(({ role, people }) => (
          <div key={role.id} className="flex items-center gap-3 bg-bg px-3 py-2.5">
            <span className="w-16 shrink-0 text-2xs tracking-[0.09em] text-muted uppercase">
              {roleById.get(role.id)?.label ?? role.id}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {people.map((id, index) => (
                <Chip key={id} tone={id === memberId ? 'strong' : 'default'}>
                  {memberName(id)}
                  {role.id === 'vokal' && index === 0 && people.length > 1 && (
                    <span className="ml-1 opacity-60">solo</span>
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
