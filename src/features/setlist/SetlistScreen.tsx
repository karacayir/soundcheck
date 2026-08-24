import { ArrowRight, CornerDownRight, Printer, Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { band, getConcert, memberName, roleById, rolesInSong, setlistItems } from '@/content'
import type { SetlistItem } from '@/content/types'
import { Chip, Empty, IconButton, Label, Num } from '@/design/primitives'
import { estimateSeconds } from '@/features/music/chart'
import { IdentityButton, IdentitySheet, SettingsSheet } from '@/features/session/IdentityPicker'
import { usePrefs } from '@/features/session/prefs'
import { NotFound } from '@/routes/NotFound'

export function SetlistScreen() {
  const { concertSlug } = useParams()
  const concert = getConcert(concertSlug)
  const prefs = usePrefs()
  const [sheet, setSheet] = useState<'identity' | 'settings' | null>(null)

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

  if (!concert) return <NotFound />

  const songCount = items.filter((i) => i.kind === 'song').length
  const myCount = prefs.memberId
    ? items.filter((i) => rolesInSong(i, prefs.memberId).length > 0).length
    : 0

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-5 pb-24 safe-t">
      <header className="pt-10 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Label>{band.name}</Label>
            </div>
            <h1 className="sc-display mt-3 text-3xl">{concert.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted">
              {concert.date && (
                <>
                  <Num>{formatDate(concert.date)}</Num>
                  <Dot />
                </>
              )}
              {concert.venue && (
                <>
                  <span>{concert.venue}</span>
                  <Dot />
                </>
              )}
              <span>
                <Num className="text-fg">{songCount}</Num> songs
              </span>
              {runtime.known > runtime.unknown && (
                <>
                  <Dot />
                  <span>
                    ≈<Num className="text-fg">{formatDuration(runtime.seconds)}</Num>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Link to={`/${band.slug}/${concert.slug}/print`}>
              <IconButton aria-label="Printable setlist" title="Printable setlist">
                <Printer size={16} strokeWidth={1.75} />
              </IconButton>
            </Link>
            <IconButton onClick={() => setSheet('settings')} aria-label="Settings" title="Settings">
              <Settings2 size={16} strokeWidth={1.75} />
            </IconButton>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <IdentityButton onClick={() => setSheet('identity')} />
          {prefs.memberId && (
            <span className="text-xs text-muted">
              You&rsquo;re on <Num className="text-accent">{myCount}</Num> of{' '}
              <Num className="text-fg">{songCount}</Num>
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-1">
        {items.length === 0 ? (
          <Empty>No songs in this set yet.</Empty>
        ) : (
          items.map((item, index) =>
            item.kind === 'break' ? (
              <BreakRow key={`break-${item.position}`} title={item.title} minutes={item.minutes} />
            ) : (
              <SongRow
                key={item.song}
                item={item}
                concertSlug={concert.slug}
                memberId={prefs.memberId}
                segueFromPrevious={isSegue(items[index - 1])}
              />
            ),
          )
        )}
      </div>

      <IdentitySheet open={sheet === 'identity'} onClose={() => setSheet(null)} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} />
    </div>
  )
}

function Dot() {
  return <span className="text-dim">·</span>
}

function isSegue(item: SetlistItem | undefined): boolean {
  return item?.kind === 'song' && item.segue
}

function SongRow({
  item,
  concertSlug,
  memberId,
  segueFromPrevious,
}: {
  item: Extract<SetlistItem, { kind: 'song' }>
  concertSlug: string
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
      to={`/${band.slug}/${concertSlug}/${song.id}`}
      className={[
        'group relative flex items-center gap-3.5 rounded-lg border px-3.5 py-2.5',
        'transition-all duration-150 ease-[var(--ease-out-quick)]',
        iPlay
          ? 'border-line bg-surface hover:border-line-2 hover:bg-surface-2'
          : 'border-transparent hover:border-line hover:bg-surface',
        sittingOut ? 'opacity-40 hover:opacity-100' : '',
      ].join(' ')}
    >
      {/* A left rail marks the songs you are actually on. */}
      {iPlay && (
        <span
          aria-hidden
          className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-accent"
        />
      )}
      {segueFromPrevious && (
        <span
          aria-hidden
          title="Runs straight on from the previous song"
          className="absolute -top-2 left-8 text-dim"
        >
          <CornerDownRight size={11} strokeWidth={2} />
        </span>
      )}

      <Num className={'w-6 shrink-0 text-right text-xs ' + (iPlay ? 'text-muted' : 'text-dim')}>
        {String(item.number).padStart(2, '0')}
      </Num>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h2 className="sc-tight truncate text-base font-medium">{song.title}</h2>
          {item.segue && (
            <span className="shrink-0 text-2xs tracking-[0.1em] text-dim uppercase">segue</span>
          )}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2">
          {song.artist && <span className="shrink-0 truncate text-xs text-muted">{song.artist}</span>}
          {song.artist && others.length > 0 && <Dot />}
          {others.length > 0 && (
            <span className="truncate text-xs text-dim">{others.join(', ')}</span>
          )}
        </div>
      </div>

      {myRoles.length > 0 && (
        <Chip tone="accent" className="shrink-0">
          {myRoles.map((r) => roleById.get(r)?.label ?? r).join(' + ')}
        </Chip>
      )}

      <div className="flex w-11 shrink-0 flex-col items-end gap-0.5">
        {song.key || song.tempo ? (
          <>
            <Num className="text-sm font-medium">{song.key ?? '·'}</Num>
            <Num className="text-2xs text-dim">{song.tempo ?? '·'}</Num>
          </>
        ) : (
          <Num className="text-sm text-dim">—</Num>
        )}
      </div>

      <ArrowRight
        size={13}
        strokeWidth={1.75}
        className="shrink-0 text-line-2 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-fg"
      />
    </Link>
  )
}

function BreakRow({ title, minutes }: { title: string; minutes?: number }) {
  return (
    <div className="my-3 flex items-center gap-4">
      <div className="h-px flex-1 bg-line" />
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5">
        <span className="text-2xs font-medium tracking-[0.14em] text-muted uppercase">{title}</span>
        {minutes && <Num className="text-2xs text-dim">{minutes}m</Num>}
      </div>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}

/* ----------------------------------------------------------------- utils -- */

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
