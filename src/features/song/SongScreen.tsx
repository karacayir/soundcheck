import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { band, getConcert, rolesInSong, setlistItems } from '@/content'
import type { SetlistItem } from '@/content/types'
import { Button, IconButton, Label, Num, Stepper } from '@/design/primitives'
import {
  BarCounter,
  BeatIndicator,
  MixerSheet,
  PlayButton,
  useTapTempo,
} from '@/features/audio/TransportBar'
import { engine } from '@/features/audio/engine'
import type { StyleId } from '@/features/audio/styles'
import { useSongBand, useTransport } from '@/features/audio/useBand'
import { MusicianView } from '@/features/musician/MusicianView'
import { beatsPerBar, songToChart, totalBars } from '@/features/music/chart'
import { offsetLabel, transposeKey } from '@/features/music/transpose'
import { resolveView, setPrefs, setSongPrefs, usePrefs, useSongPrefs } from '@/features/session/prefs'
import { SingerView } from '@/features/singer/SingerView'
import { useWakeLock } from '@/features/stage/useWakeLock'
import { NotFound } from '@/routes/NotFound'

export function SongScreen() {
  const { concertSlug, songId } = useParams()
  const navigate = useNavigate()
  const concert = getConcert(concertSlug)
  const prefs = usePrefs()

  const items = useMemo(() => (concert ? setlistItems(concert) : []), [concert])
  const songs = useMemo(() => items.filter((i) => i.kind === 'song'), [items])
  const index = songs.findIndex((i) => i.kind === 'song' && i.song === songId)
  const item = index >= 0 ? (songs[index] as Extract<SetlistItem, { kind: 'song' }> & { number: number }) : null

  if (!concert || !item) return <NotFound />

  return (
    <SongScreenBody
      key={item.song}
      concertSlug={concert.slug}
      item={item}
      total={songs.length}
      prev={index > 0 ? (songs[index - 1] as Extract<SetlistItem, { kind: 'song' }>) : null}
      next={index < songs.length - 1 ? (songs[index + 1] as Extract<SetlistItem, { kind: 'song' }>) : null}
      onNavigate={navigate}
      memberId={prefs.memberId}
    />
  )
}

function SongScreenBody({
  concertSlug,
  item,
  total,
  prev,
  next,
  onNavigate,
  memberId,
}: {
  concertSlug: string
  item: Extract<SetlistItem, { kind: 'song' }> & { number: number }
  total: number
  prev: Extract<SetlistItem, { kind: 'song' }> | null
  next: Extract<SetlistItem, { kind: 'song' }> | null
  onNavigate: (to: string) => void
  memberId: string | null
}) {
  const song = item.song_
  const prefs = usePrefs()
  const songPrefs = useSongPrefs(song.id)
  const [mixerOpen, setMixerOpen] = useState(false)
  const [stage, setStage] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)
  const [style, setStyle] = useState<StyleId>(song.style as StyleId)

  const myRoles = rolesInSong(item, memberId)
  const view = resolveView(prefs, myRoles)

  const tempo = songPrefs.tempo ?? song.tempo ?? 120
  const bpb = beatsPerBar(song.meter)
  const bars = useMemo(() => totalBars(songToChart(song)), [song])

  useSongBand(song, style, songPrefs.keyOffset, tempo)
  useWakeLock(prefs.keepAwake)

  const { position, playing } = useTransport()
  const playingBar = playing && position && !position.isCountIn ? position.bar : null

  const goto = useCallback(
    (target: Extract<SetlistItem, { kind: 'song' }> | null) => {
      if (!target) return
      engine.stop()
      onNavigate(`/${band.slug}/${concertSlug}/${target.song}`)
    },
    [concertSlug, onNavigate],
  )

  useKeyboardNav({
    onPrev: () => goto(prev),
    onNext: () => goto(next),
    onToggleAudio: () => void engine.toggle(),
    onToggleStage: () => setStage((s) => !s),
    pageScroll: view === 'singer',
  })

  const transposedKey = transposeKey(song.key, songPrefs.keyOffset)
  const transposed = songPrefs.keyOffset !== 0

  return (
    <div className={'mx-auto w-full max-w-3xl px-4 pb-32 ' + (stage ? '' : 'safe-t')}>
      {!stage && (
        <header className="flex items-center justify-between gap-3 pt-6 pb-4">
          <Link
            to={`/${band.slug}/${concertSlug}`}
            className="flex items-center gap-2 text-muted transition-colors hover:text-fg"
          >
            <span aria-hidden>←</span>
            <span className="text-2xs tracking-[0.09em] uppercase">Setlist</span>
          </Link>
          <Num className="text-2xs text-dim">
            {String(item.number).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </Num>
        </header>
      )}

      <div className={stage ? 'pt-4' : ''}>
        <h1 className={(stage ? 'text-2xl' : 'text-xl') + ' leading-none font-semibold sc-tight'}>
          {song.title}
        </h1>
        {song.artist && !stage && <p className="mt-1.5 text-sm text-muted">{song.artist}</p>}
        {myRoles.length > 0 && !stage && (
          <p className="mt-2 text-2xs tracking-[0.09em] text-fg uppercase">
            sen: {myRoles.map((r) => band.roles.find((role) => role.id === r)?.label ?? r).join(' + ')}
          </p>
        )}
      </div>

      {!stage && (
        <section className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>Ton</Label>
            <Stepper
              decreaseLabel="Bir ses aşağı"
              increaseLabel="Bir ses yukarı"
              canDecrease={songPrefs.keyOffset > -11}
              canIncrease={songPrefs.keyOffset < 11}
              onDecrease={() => setSongPrefs(song.id, { keyOffset: songPrefs.keyOffset - 1 })}
              onIncrease={() => setSongPrefs(song.id, { keyOffset: songPrefs.keyOffset + 1 })}
              onReset={transposed ? () => setSongPrefs(song.id, { keyOffset: 0 }) : undefined}
              value={transposedKey ?? song.key ?? '—'}
            />
            {transposed && (
              <span className="text-2xs text-muted">
                {song.key} → {transposedKey} ({offsetLabel(songPrefs.keyOffset)})
              </span>
            )}
          </div>

          <TempoControl songId={song.id} written={song.tempo ?? null} tempo={tempo} />

          <div className="flex flex-col gap-1.5">
            <Label>Ölçü</Label>
            <div className="flex h-11 items-center">
              <Num className="text-base">{song.meter}</Num>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Süre</Label>
            <div className="flex h-11 items-center">
              <Num className="text-base">{song.duration ?? '—'}</Num>
            </div>
          </div>
        </section>
      )}

      {!stage && (
        <div className="mt-6 flex gap-px">
          <Button
            className="flex-1"
            active={view === 'singer'}
            onClick={() => setPrefs({ view: 'singer' })}
          >
            Sözler
          </Button>
          <Button
            className="flex-1"
            active={view === 'musician'}
            onClick={() => setPrefs({ view: 'musician' })}
          >
            Akorlar
          </Button>
        </div>
      )}

      <div className="mt-6">
        {view === 'singer' ? (
          <SingerView song={song} autoScroll={autoScroll} />
        ) : (
          <MusicianView
            song={song}
            item={item}
            keyOffset={songPrefs.keyOffset}
            playingBar={playingBar}
            memberId={memberId}
          />
        )}
      </div>

      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-2">
          <IconButton
            onClick={() => goto(prev)}
            disabled={!prev}
            aria-label="Önceki şarkı"
            title={prev ? prev.song_.title : undefined}
          >
            ←
          </IconButton>

          <PlayButton disabled={!song.tempo && !songPrefs.tempo} />
          <BeatIndicator beatsPerBar={bpb} />

          <div className="flex min-w-0 flex-1 flex-col items-center">
            <BarCounter totalBars={bars} />
          </div>

          <IconButton
            onClick={() => setMixerOpen(true)}
            aria-label="Ses ayarları"
            title="Ses ayarları"
          >
            <SlidersIcon />
          </IconButton>

          {view === 'singer' && (
            <IconButton
              onClick={() => setAutoScroll((s) => !s)}
              active={autoScroll}
              aria-label="Otomatik kaydırma"
              title="Otomatik kaydırma"
            >
              ⇩
            </IconButton>
          )}

          <IconButton
            onClick={() => setStage((s) => !s)}
            active={stage}
            aria-label="Sahne modu"
            title="Sahne modu"
          >
            <StageIcon />
          </IconButton>

          <IconButton
            onClick={() => goto(next)}
            disabled={!next}
            aria-label="Sonraki şarkı"
            title={next ? next.song_.title : undefined}
          >
            →
          </IconButton>
        </div>
        {next && item.segue && (
          <div className="border-t border-line px-4 py-1.5 text-center">
            <span className="text-2xs tracking-[0.09em] text-muted uppercase">
              segue → {next.song_.title}
            </span>
          </div>
        )}
      </nav>

      <MixerSheet
        open={mixerOpen}
        onClose={() => setMixerOpen(false)}
        style={style}
        onStyleChange={setStyle}
      />
      <AudioWarning />
    </div>
  )
}

function TempoControl({
  songId,
  written,
  tempo,
}: {
  songId: string
  written: number | null
  tempo: number
}) {
  const { tap, taps } = useTapTempo((bpm) => setSongPrefs(songId, { tempo: bpm }))
  const changed = written !== null && tempo !== written

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Tempo</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Stepper
          decreaseLabel="Tempoyu düşür"
          increaseLabel="Tempoyu yükselt"
          canDecrease={tempo > 30}
          canIncrease={tempo < 300}
          onDecrease={() => setSongPrefs(songId, { tempo: tempo - 1 })}
          onIncrease={() => setSongPrefs(songId, { tempo: tempo + 1 })}
          onReset={changed ? () => setSongPrefs(songId, { tempo: null }) : undefined}
          value={written === null && !changed ? '—' : tempo}
        />
        <button
          type="button"
          onClick={tap}
          className="h-11 shrink-0 border border-line px-2.5 text-2xs tracking-[0.09em] text-muted uppercase transition-colors hover:border-line-strong hover:text-fg"
        >
          {taps > 0 && taps < 4 ? `tap ${taps}` : 'tap'}
        </button>
      </div>
      {changed && written !== null && (
        <span className="text-2xs text-muted">yazılı: {written} BPM</span>
      )}
    </div>
  )
}

/** A suspended AudioContext looks exactly like silence. Say so. */
function AudioWarning() {
  const { playing } = useTransport()
  const [suspended, setSuspended] = useState(false)

  useEffect(() => {
    if (!playing) {
      setSuspended(false)
      return
    }
    const id = setInterval(() => setSuspended(engine.state === 'suspended'), 500)
    return () => clearInterval(id)
  }, [playing])

  if (!suspended) return null
  return (
    <button
      type="button"
      onClick={() => void engine.unlock()}
      className="fixed inset-x-4 bottom-20 z-50 border border-fg bg-bg px-4 py-3 text-xs"
    >
      Ses askıya alındı — devam etmek için dokun.
    </button>
  )
}

/**
 * Arrow keys move through the setlist; PageUp/PageDown page the lyrics, which
 * is what most Bluetooth page-turner pedals send.
 */
function useKeyboardNav({
  onPrev,
  onNext,
  onToggleAudio,
  onToggleStage,
  pageScroll,
}: {
  onPrev: () => void
  onNext: () => void
  onToggleAudio: () => void
  onToggleStage: () => void
  pageScroll: boolean
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          onPrev()
          break
        case 'ArrowRight':
          event.preventDefault()
          onNext()
          break
        case 'PageUp':
          if (pageScroll) {
            event.preventDefault()
            window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' })
          } else onPrev()
          break
        case 'PageDown':
          if (pageScroll) {
            event.preventDefault()
            window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
          } else onNext()
          break
        case ' ':
          event.preventDefault()
          onToggleAudio()
          break
        case 'f':
        case 'F':
          onToggleStage()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPrev, onNext, onToggleAudio, onToggleStage, pageScroll])
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect x="1" y="3" width="14" height="1" fill="currentColor" />
      <rect x="1" y="8" width="14" height="1" fill="currentColor" />
      <rect x="1" y="13" width="14" height="1" fill="currentColor" />
      <rect x="4" y="1" width="2" height="5" fill="currentColor" />
      <rect x="10" y="6" width="2" height="5" fill="currentColor" />
      <rect x="6" y="11" width="2" height="5" fill="currentColor" />
    </svg>
  )
}

function StageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect x="1" y="1" width="14" height="14" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="4" y="4" width="8" height="8" fill="currentColor" />
    </svg>
  )
}
