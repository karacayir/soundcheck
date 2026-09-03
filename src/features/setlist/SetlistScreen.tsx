import { ArrowRight, CornerDownRight, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { band, getConcert, memberName, roleById, rolesInSong, setlistItems } from '@/content'
import type { SetlistItem } from '@/content/types'
import { Dot, Page, PageHead, TopBar } from '@/app/Shell'
import { Chip, Empty, IconButton, Num, SectionHead, Stats, cx } from '@/design/primitives'
import { estimateSeconds } from '@/features/music/chart'
import { IdentityButton, IdentitySheet } from '@/features/session/IdentityPicker'
import { usePrefs } from '@/features/session/prefs'
import { NotFound } from '@/routes/NotFound'

export function SetlistScreen() {
  const { bandSlug, concertSlug } = useParams()
  const concert = getConcert(concertSlug)
  const prefs = usePrefs()
  const [identityOpen, setIdentityOpen] = useState(false)

  const items = useMemo(() => (concert ? setlistItems(concert) : []), [concert])

  const runtime = useMemo(() => {
    let seconds = 0
    let known = 0
    let unknown = 0
    for (const item of items) {
      if (item.kind === 'break') {
        seconds += (item.minutes ?? 0) * 60
        continue
      }
      const estimate = estimateSeconds(item.song_)
      if (estimate === null) unknown += 1
      else {
        seconds += estimate
        known += 1
      }
    }
    return { seconds, known, unknown }
  }, [items])

  if (!concert || bandSlug !== band.slug) return <NotFound />

  const songCount = items.filter((i) => i.kind === 'song').length
  const myCount = prefs.memberId
    ? items.filter((i) => rolesInSong(i, prefs.memberId).length > 0).length
    : 0
  const base = `/bands/${band.slug}/${concert.slug}`

  return (
    <>
      <TopBar back={`/bands/${band.slug}`} backLabel={band.name} title={concert.title} />

      <Page>
        <PageHead
          title={concert.title}
          kicker={
            concert.date || concert.venue ? (
              <>
                {concert.date && <span>{concert.date}</span>}
                {concert.date && concert.venue && <Dot />}
                {concert.venue && <span>{concert.venue}</span>}
              </>
            ) : undefined
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <IdentityButton onClick={() => setIdentityOpen(true)} />
            {prefs.memberId && (
              <span className="text-[14.5px] text-ink-2">
                You&rsquo;re on <span className="font-bold text-accent">{myCount}</span> of{' '}
                <span className="font-bold text-ink">{songCount}</span>
              </span>
            )}
            <Link to={`${base}/print`} className="ml-auto">
              <IconButton aria-label="Printable setlist" title="Printable setlist">
                <Printer size={16} strokeWidth={2} />
              </IconButton>
            </Link>
          </div>

          <div className="mt-4">
            <Stats
              items={[
                { label: 'Songs', value: songCount },
                { label: 'Sets', value: items.filter((i) => i.kind === 'break').length + 1 },
                {
                  label: 'Runtime',
                  value: runtime.known > runtime.unknown ? `≈${formatDuration(runtime.seconds)}` : '—',
                },
              ]}
            />
          </div>
        </PageHead>

        <SectionHead title="Running order">
          Top to bottom is the order you play. Tap a song for words, chords, key and tempo.
        </SectionHead>

        {items.length === 0 ? (
          <Empty>Nothing on this setlist yet.</Empty>
        ) : (
          <div className="sc-card divide-y divide-line overflow-hidden">
            {items.map((item, index) =>
              item.kind === 'break' ? (
                <BreakRow key={`break-${item.position}`} title={item.title} minutes={item.minutes} />
              ) : (
                <SongRow
                  key={item.song}
                  item={item}
                  base={base}
                  memberId={prefs.memberId}
                  segueFromPrevious={isSegue(items[index - 1])}
                />
              ),
            )}
          </div>
        )}
      </Page>

      <IdentitySheet open={identityOpen} onClose={() => setIdentityOpen(false)} />
    </>
  )
}

function isSegue(item: SetlistItem | undefined): boolean {
  return item?.kind === 'song' && item.segue
}

function SongRow({
  item,
  base,
  memberId,
  segueFromPrevious,
}: {
  item: Extract<SetlistItem, { kind: 'song' }>
  base: string
  memberId: string | null
  segueFromPrevious: boolean
}) {
  const song = item.song_
  const myRoles = rolesInSong(item, memberId)
  const iPlay = myRoles.length > 0
  const sittingOut = Boolean(memberId) && !iPlay

  const allOthers = band.roles
    .flatMap((role) => item.lineup[role.id] ?? [])
    .filter((id) => id !== memberId)
  // Three names plus a count reads faster than a line that trails off mid-word.
  const others = allOthers.slice(0, 3).map(memberName)
  if (allOthers.length > others.length) others.push(`+${allOthers.length - others.length}`)

  return (
    <Link
      to={`${base}/${song.id}`}
      className={cx(
        'group relative flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150',
        'hover:bg-sunk',
        sittingOut && 'opacity-45 hover:opacity-100',
      )}
    >
      {iPlay && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}
      {segueFromPrevious && (
        <span
          aria-hidden
          title="Runs straight on from the previous song"
          className="absolute top-0 left-9 text-ink-3"
        >
          <CornerDownRight size={11} strokeWidth={2.25} />
        </span>
      )}

      <Num
        className={cx(
          'w-6 shrink-0 text-right text-[13px] font-semibold',
          iPlay ? 'text-accent' : 'text-ink-3',
        )}
      >
        {item.number}
      </Num>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="sc-tight m-0 text-[16px] font-semibold">{song.title}</h3>
          {item.segue && <Chip tone="warm">segue</Chip>}
          {myRoles.length > 0 && (
            <Chip tone="accent">
              {myRoles.map((r) => roleById.get(r)?.label ?? r).join(' + ')}
            </Chip>
          )}
        </div>
        <p className="m-0 mt-0.5 truncate text-[13.5px] text-ink-3">
          {song.artist}
          {song.artist && others.length > 0 && ' · '}
          {others.join(', ')}
        </p>
      </div>

      <div className="flex shrink-0 items-baseline gap-2">
        <Num className="text-[14.5px] font-bold">{song.key ?? '—'}</Num>
        <Num className="w-7 text-right text-[12.5px] text-ink-3">{song.tempo ?? ''}</Num>
      </div>

      <ArrowRight
        size={15}
        strokeWidth={2}
        className="shrink-0 text-ink-3/60 transition-transform duration-200 ease-[var(--ease-smooth)] group-hover:translate-x-0.5"
      />
    </Link>
  )
}

function BreakRow({ title, minutes }: { title: string; minutes?: number }) {
  return (
    <div className="flex items-center justify-center gap-2 bg-sunk px-4 py-3">
      <span className="text-[12.5px] font-bold text-ink-2">{title}</span>
      {minutes && <span className="text-[12.5px] text-ink-3">{minutes} min</span>}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
