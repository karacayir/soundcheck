import {
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Maximize2,
  Minimize2,
  MoveVertical,
  SlidersHorizontal,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { band, getConcert, rolesInSong, setlistItems } from '@/content'
import type { SetlistItem } from '@/content/types'
import { Chip, IconButton, Label, Num, SegmentedControl, Stepper, cx } from '@/design/primitives'
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

type SongItem = Extract<SetlistItem, { kind: 'song' }> & { number: number }

export function SongScreen() {
  const { concertSlug, songId } = useParams()
  const navigate = useNavigate()
  const concert = getConcert(concertSlug)
  const prefs = usePrefs()

  const items = useMemo(() => (concert ? setlistItems(concert) : []), [concert])
  const songs = useMemo(() => items.filter((i) => i.kind === 'song') as SongItem[], [items])
  const index = songs.findIndex((i) => i.song === songId)
  const item = index >= 0 ? songs[index]! : null

  if (!concert || !item) return <NotFound />

  return (
    <SongScreenBody
      key={item.song}
      concertSlug={concert.slug}
      item={item}
      total={songs.length}
      prev={index > 0 ? songs[index - 1]! : null}
      next={index < songs.length - 1 ? songs[index + 1]! : null}
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
  item: SongItem
  total: number
  prev: SongItem | null
  next: SongItem | null
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
    (target: SongItem | null) => {
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
  const tempoChanged = song.tempo !== null && songPrefs.tempo !== null

  return (
    <div className={cx('mx-auto w-full max-w-2xl px-5 pb-32', !stage && 'safe-t')}>
      {!stage && (
        <header className="flex items-center justify-between gap-3 pt-6 pb-5">
          <Link
            to={`/${band.slug}/${concertSlug}`}
            className="group -ml-1.5 flex items-center gap-1 rounded-md py-1 pr-2 pl-1 text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <ChevronLeft size={15} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="text-2xs font-medium tracking-[0.1em] uppercase">Setlist</span>
          </Link>
          <Num className="text-2xs text-dim">
            {String(item.number).padStart(2, '0')} <span className="text-line-2">/</span>{' '}
            {String(total).padStart(2, '0')}
          </Num>
        </header>
      )}

      <div className={cx(stage && 'pt-6')}>
        <h1 className={cx('sc-display', stage ? 'text-3xl' : 'text-2xl')}>{song.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {song.artist && <span className="text-sm text-muted">{song.artist}</span>}
          {myRoles.length > 0 && (
            <Chip tone="accent">
              You:{' '}
              {myRoles.map((r) => band.roles.find((role) => role.id === r)?.label ?? r).join(' + ')}
            </Chip>
          )}
        </div>
      </div>

      {!stage && (
        <section className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 rounded-xl border border-line bg-surface p-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Key</Label>
            <Stepper
              decreaseLabel="Down a semitone"
              increaseLabel="Up a semitone"
              highlight={transposed}
              canDecrease={songPrefs.keyOffset > -11}
              canIncrease={songPrefs.keyOffset < 11}
              onDecrease={() => setSongPrefs(song.id, { keyOffset: songPrefs.keyOffset - 1 })}
              onIncrease={() => setSongPrefs(song.id, { keyOffset: songPrefs.keyOffset + 1 })}
              onReset={transposed ? () => setSongPrefs(song.id, { keyOffset: 0 }) : undefined}
              value={transposedKey ?? song.key ?? '—'}
            />
            {transposed && (
              <span className="sc-num text-2xs text-muted">
                {song.key} → {transposedKey} ({offsetLabel(songPrefs.keyOffset)})
              </span>
            )}
          </div>

          <TempoControl songId={song.id} written={song.tempo ?? null} tempo={tempo} changed={tempoChanged} />

          <div className="flex flex-col gap-2">
            <Label>Meter</Label>
            <div className="flex h-10 items-center">
              <Num className="text-base font-medium">{song.meter}</Num>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Length</Label>
            <div className="flex h-10 items-center">
              <Num className="text-base font-medium">{song.duration ?? '—'}</Num>
            </div>
          </div>
        </section>
      )}

      {!stage && (
        <SegmentedControl
          className="mt-5"
          value={view}
          onChange={(next) => setPrefs({ view: next })}
          options={[
            { value: 'singer', label: 'Lyrics' },
            { value: 'musician', label: 'Chart' },
          ]}
        />
      )}

      <div className="mt-7">
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

      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl">
        {next && item.segue && (
          <div className="flex items-center justify-center gap-1.5 border-b border-line py-1.5">
            <CornerDownRight size={11} strokeWidth={2} className="text-dim" />
            <span className="text-2xs tracking-[0.1em] text-muted uppercase">
              segue into {next.song_.title}
            </span>
          </div>
        )}
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-2.5">
          <IconButton onClick={() => goto(prev)} disabled={!prev} aria-label="Previous song" title={prev?.song_.title}>
            <ChevronLeft size={17} strokeWidth={2} />
          </IconButton>

          <PlayButton disabled={!song.tempo && !songPrefs.tempo} />

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <BeatIndicator beatsPerBar={bpb} />
            <BarCounter totalBars={bars} />
          </div>

          <IconButton onClick={() => setMixerOpen(true)} aria-label="Sound" title="Sound">
            <SlidersHorizontal size={16} strokeWidth={1.75} />
          </IconButton>

          {view === 'singer' && (
            <IconButton
              onClick={() => setAutoScroll((s) => !s)}
              active={autoScroll}
              tone="accent"
              aria-label="Auto-scroll"
              title="Auto-scroll"
            >
              <MoveVertical size={16} strokeWidth={1.75} />
            </IconButton>
          )}

          <IconButton onClick={() => setStage((s) => !s)} active={stage} aria-label="Stage mode" title="Stage mode">
            {stage ? <Minimize2 size={16} strokeWidth={1.75} /> : <Maximize2 size={16} strokeWidth={1.75} />}
          </IconButton>

          <IconButton onClick={() => goto(next)} disabled={!next} aria-label="Next song" title={next?.song_.title}>
            <ChevronRight size={17} strokeWidth={2} />
          </IconButton>
        </div>
      </nav>

      <MixerSheet open={mixerOpen} onClose={() => setMixerOpen(false)} style={style} onStyleChange={setStyle} />
      <AudioWarning />
    </div>
  )
}

function TempoControl({
  songId,
  written,
  tempo,
  changed,
}: {
  songId: string
  written: number | null
  tempo: number
  changed: boolean
}) {
  const { tap, taps } = useTapTempo((bpm) => setSongPrefs(songId, { tempo: bpm }))
  const differs = changed && written !== null && tempo !== written

  return (
    <div className="flex flex-col gap-2">
      <Label>Tempo</Label>
      <Stepper
        decreaseLabel="Slower"
        increaseLabel="Faster"
        highlight={differs}
        canDecrease={tempo > 30}
        canIncrease={tempo < 300}
        onDecrease={() => setSongPrefs(songId, { tempo: tempo - 1 })}
        onIncrease={() => setSongPrefs(songId, { tempo: tempo + 1 })}
        onReset={differs ? () => setSongPrefs(songId, { tempo: null }) : undefined}
        value={written === null && !changed ? '—' : tempo}
        trailing={
          <button
            type="button"
            onClick={tap}
            aria-label="Tap tempo"
            className="border-l border-line px-2 text-2xs font-medium tracking-[0.09em] text-muted uppercase transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {taps > 0 && taps < 4 ? `tap ${taps}` : 'tap'}
          </button>
        }
      />
      {differs && written !== null && (
        <span className="sc-num text-2xs text-muted">written {written}</span>
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
      className="fixed inset-x-5 bottom-24 z-50 rounded-lg border border-accent bg-accent/15 px-4 py-3 text-xs text-accent backdrop-blur"
    >
      Audio was suspended — tap to resume.
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
