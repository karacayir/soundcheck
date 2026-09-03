import { ArrowRight, CornerDownRight, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { band, getConcert, memberName, roleById, rolesInSong, setlistItems } from '@/content'
import type { SetlistItem } from '@/content/types'
import { CrumbBar, Foot, Masthead, Page } from '@/app/Shell'
import { Button, Empty, Eyebrow, Facts, Num, SectionHead, Tag, cx } from '@/design/primitives'
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
      <Masthead>
        <Eyebrow>
          <span>{band.name}</span>
          {concert.date && <span>{concert.date}</span>}
          {concert.venue && <span>{concert.venue}</span>}
          <span>{songCount} songs</span>
        </Eyebrow>

        <h1 className="sc-display m-0 text-[clamp(30px,5.4vw,46px)]">{concert.title}</h1>

        {concert.notes && (
          <p className="sc-prose m-0 max-w-[52ch] !text-[18px]">{concert.notes.trim()}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <IdentityButton onClick={() => setIdentityOpen(true)} />
          {prefs.memberId && (
            <span className="sc-prose !text-[15px]">
              You&rsquo;re on <Num className="font-semibold text-accent">{myCount}</Num> of{' '}
              <Num className="font-semibold text-ink">{songCount}</Num>
            </span>
          )}
          <Link to={`${base}/print`} className="ml-auto">
            <Button size="sm">
              <Printer size={11} strokeWidth={2} /> Print
            </Button>
          </Link>
        </div>

        <div className="mt-2">
          <Facts
            items={[
              { label: 'Songs', value: songCount },
              { label: 'Sets', value: items.filter((i) => i.kind === 'break').length + 1 },
              {
                label: 'Runtime',
                value:
                  runtime.known > runtime.unknown ? `≈${formatDuration(runtime.seconds)}` : '—',
              },
              { label: 'Charts', value: items.filter((i) => i.kind === 'song' && i.song_.structure.length > 0).length },
            ]}
          />
        </div>
      </Masthead>

      <CrumbBar
        crumbs={[
          { label: 'Soundcheck', to: '/' },
          { label: 'Bands', to: '/bands' },
          { label: band.name, to: `/bands/${band.slug}` },
          { label: concert.title },
        ]}
      />

      <Page className="pt-12">
        <SectionHead
          num="01"
          tag="Running order"
          tagTone="accent"
          title="Setlist"
        >
          Top to bottom is the order you play. Tap a song for words, chart, key and tempo.
        </SectionHead>

        {items.length === 0 ? (
          <Empty>No songs in this set yet.</Empty>
        ) : (
          <div className="border-t border-line-soft">
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
      <Foot />
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
        'group relative flex items-baseline gap-3.5 border-b border-line-soft py-3.5 pr-1 pl-1',
        'transition-colors hover:bg-panel',
        sittingOut && 'opacity-45 hover:opacity-100',
      )}
    >
      {iPlay && <span aria-hidden className="absolute inset-y-1 left-0 w-0.5 bg-accent" />}
      {segueFromPrevious && (
        <CornerDownRight
          size={10}
          strokeWidth={2}
          aria-hidden
          className="absolute top-0.5 left-8 text-muted"
        />
      )}

      <Num
        className={cx(
          'w-6 shrink-0 pt-0.5 text-right text-[11px]',
          iPlay ? 'text-accent' : 'text-muted',
        )}
      >
        {String(item.number).padStart(2, '0')}
      </Num>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="m-0 text-[16.5px] font-medium tracking-[-0.012em] group-hover:text-accent">
            {song.title}
          </h3>
          {item.segue && (
            <span className="font-mono text-[9.5px] tracking-[0.1em] text-muted uppercase">
              segue
            </span>
          )}
          {myRoles.length > 0 && (
            <Tag tone="accent">
              {myRoles.map((r) => roleById.get(r)?.label ?? r).join(' + ')}
            </Tag>
          )}
        </div>
        <p className="sc-prose m-0 mt-0.5 truncate !text-[14.5px] !leading-snug">
          {song.artist && <span className="text-ink-soft">{song.artist}</span>}
          {song.artist && others.length > 0 && <span className="text-line"> · </span>}
          {others.length > 0 && <span className="text-muted">{others.join(', ')}</span>}
        </p>
      </div>

      <div className="flex w-16 shrink-0 items-baseline justify-end gap-2">
        <Num className="text-[14px] font-semibold text-ink">{song.key ?? '—'}</Num>
        <Num className="text-[11px] text-muted">{song.tempo ?? ''}</Num>
      </div>

      <ArrowRight
        size={13}
        strokeWidth={1.75}
        className="shrink-0 self-center text-line transition-all group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </Link>
  )
}

function BreakRow({ title, minutes }: { title: string; minutes?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-line-soft py-5">
      <div className="h-px flex-1 bg-line" />
      <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-warm uppercase">
        {title}
        {minutes ? ` · ${minutes} min` : ''}
      </span>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
