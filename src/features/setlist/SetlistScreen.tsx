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
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-24 safe-t">
      <header className="pt-8 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Label>{band.name}</Label>
            <h1 className="mt-2 text-2xl leading-none font-semibold sc-tight">{concert.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {concert.date && <Num>{formatDate(concert.date)}</Num>}
              {concert.venue && <span>{concert.venue}</span>}
              <span>
                <Num>{songCount}</Num> şarkı
              </span>
              {/* An estimate built from three of twenty-eight songs is noise, not
                  information — only show it once most songs can be estimated. */}
              {runtime.known > runtime.unknown && (
                <span
                  title={
                    runtime.unknown > 0
                      ? `${runtime.unknown} şarkının süresi bilinmiyor`
                      : undefined
                  }
                >
                  ≈ <Num>{formatDuration(runtime.seconds)}</Num>
                  {runtime.unknown > 0 && <span className="text-dim"> +{runtime.unknown}</span>}
                </span>
              )}
            </div>
          </div>
          <IconButton onClick={() => setSheet('settings')} aria-label="Ayarlar" title="Ayarlar">
            <GearIcon />
          </IconButton>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <IdentityButton onClick={() => setSheet('identity')} />
          {prefs.memberId && (
            <span className="text-2xs text-muted">
              bu konserde <Num>{myCount}</Num> / <Num>{songCount}</Num> şarkıda çalıyorsun
            </span>
          )}
        </div>
      </header>

      <div className="border-t border-line">
        {items.length === 0 ? (
          <Empty>Bu konserde henüz şarkı yok.</Empty>
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

      <div className="flex justify-center pt-8">
        <Link
          to={`/${band.slug}/${concert.slug}/print`}
          className="text-2xs tracking-[0.09em] text-dim uppercase transition-colors hover:text-fg"
        >
          Yazdırılabilir liste
        </Link>
      </div>

      <IdentitySheet open={sheet === 'identity'} onClose={() => setSheet(null)} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} />
    </div>
  )
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

  return (
    <Link
      to={`/${band.slug}/${concertSlug}/${song.id}`}
      className={
        'group relative flex items-start gap-4 border-b border-line py-4 transition-colors ' +
        'hover:bg-surface ' +
        (sittingOut ? 'opacity-35 hover:opacity-100' : '')
      }
    >
      {segueFromPrevious && (
        <span
          aria-hidden
          className="absolute top-0 left-[0.6rem] h-4 w-px bg-line-strong"
          title="Önceki şarkıdan ara vermeden geçilir"
        />
      )}

      <div className="w-6 shrink-0 pt-0.5 text-right">
        <Num className="text-xs text-dim">{String(item.number).padStart(2, '0')}</Num>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h2 className="truncate text-base leading-snug font-medium sc-tight">{song.title}</h2>
          {item.segue && (
            <span className="shrink-0 text-2xs tracking-[0.09em] text-dim uppercase">segue</span>
          )}
        </div>
        {song.artist && <p className="truncate text-xs text-muted">{song.artist}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {myRoles.length > 0 && (
            <Chip tone="strong">
              {myRoles.map((r) => roleById.get(r)?.label ?? r).join(' + ')}
            </Chip>
          )}
          <LineupSummary item={item} memberId={memberId} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5 text-right">
        <Num className="text-sm">{song.key ?? '—'}</Num>
        <Num className="text-2xs text-dim">{song.tempo ? `${song.tempo}` : '—'}</Num>
      </div>
    </Link>
  )
}

function LineupSummary({
  item,
  memberId,
}: {
  item: Extract<SetlistItem, { kind: 'song' }>
  memberId: string | null
}) {
  const people = band.roles
    .flatMap((role) => (item.lineup[role.id] ?? []).map((id) => ({ id, role })))
    .filter((entry) => entry.id !== memberId)

  if (people.length === 0) return null

  return (
    <span className="truncate text-2xs text-dim">
      {people.map((p) => memberName(p.id)).join(' · ')}
    </span>
  )
}

function BreakRow({ title, minutes }: { title: string; minutes?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-line py-6">
      <div className="h-px flex-1 bg-line-strong" />
      <div className="flex items-center gap-2">
        <span className="text-2xs font-medium tracking-[0.14em] text-muted uppercase">{title}</span>
        {minutes && <Num className="text-2xs text-dim">{minutes}′</Num>}
      </div>
      <div className="h-px flex-1 bg-line-strong" />
    </div>
  )
}

/* ----------------------------------------------------------------- utils -- */

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    date,
  )
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect x="1" y="3" width="14" height="1" fill="currentColor" />
      <rect x="1" y="8" width="14" height="1" fill="currentColor" />
      <rect x="1" y="13" width="14" height="1" fill="currentColor" />
      <rect x="9" y="1" width="2" height="5" fill="currentColor" />
      <rect x="4" y="6" width="2" height="5" fill="currentColor" />
      <rect x="11" y="11" width="2" height="5" fill="currentColor" />
    </svg>
  )
}
