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
import { useNavigate, useParams } from 'react-router-dom'
import { band, getConcert, rolesInSong, setlistItems } from '@/content'
import type { SetlistItem } from '@/content/types'
import { CrumbBar, Foot, Masthead, Page } from '@/app/Shell'
import { Eyebrow, IconButton, Label, Segmented, Stepper, Tag, cx } from '@/design/primitives'
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
  const { bandSlug, concertSlug, songId } = useParams()
  const navigate = useNavigate()
  const concert = getConcert(concertSlug)

  const items = useMemo(() => (concert ? setlistItems(concert) : []), [concert])
  const songs = useMemo(() => items.filter((i) => i.kind === 'song') as SongItem[], [items])
  const index = songs.findIndex((i) => i.song === songId)
  const item = index >= 0 ? songs[index]! : null

  if (!concert || !item || bandSlug !== band.slug) return <NotFound />

  return (
    <SongScreenBody
      key={item.song}
      concertSlug={concert.slug}
      concertTitle={concert.title}
      item={item}
      total={songs.length}
      prev={index > 0 ? songs[index - 1]! : null}
      next={index < songs.length - 1 ? songs[index + 1]! : null}
      onNavigate={navigate}
    />
  )
}

function SongScreenBody({
  concertSlug,
  concertTitle,
  item,
  total,
  prev,
  next,
  onNavigate,
}: {
  concertSlug: string
  concertTitle: string
  item: SongItem
  total: number
  prev: SongItem | null
  next: SongItem | null
  onNavigate: (to: string) => void
}) {
  const song = item.song_
  const prefs = usePrefs()
  const memberId = prefs.memberId
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

  const base = `/bands/${band.slug}/${concertSlug}`

  const goto = useCallback(
    (target: SongItem | null) => {
      if (!target) return
      engine.stop()
      onNavigate(`${base}/${target.song}`)
    },
    [base, onNavigate],
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
  const tempoDiffers = song.tempo !== null && songPrefs.tempo !== null && songPrefs.tempo !== song.tempo

  return (
    <>
      {!stage && (
        <Masthead>
          <Eyebrow>
            <span>
              {String(item.number).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <span>{concertTitle}</span>
            {song.artist && <span>{song.artist}</span>}
          </Eyebrow>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="sc-display m-0 text-[clamp(28px,5vw,42px)]">{song.title}</h1>
            {myRoles.length > 0 && (
              <Tag tone="accent">
                You:{' '}
                {myRoles
                  .map((r) => band.roles.find((role) => role.id === r)?.label ?? r)
                  .join(' + ')}
              </Tag>
            )}
          </div>

          <div className="sc-grid mt-1" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div className="bg-panel px-3.5 py-3">
              <Label className="mb-2">Key</Label>
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
                <div className="sc-num mt-1.5 text-[10px] text-accent">
                  {song.key} → {transposedKey} ({offsetLabel(songPrefs.keyOffset)})
                </div>
              )}
            </div>

            <div className="bg-panel px-3.5 py-3">
              <Label className="mb-2">Tempo</Label>
              <TempoControl songId={song.id} written={song.tempo ?? null} tempo={tempo} differs={tempoDiffers} />
              {tempoDiffers && song.tempo && (
                <div className="sc-num mt-1.5 text-[10px] text-muted">written {song.tempo}</div>
              )}
            </div>

            <div className="bg-panel px-3.5 py-3">
              <Label className="mb-2">Meter</Label>
              <div className="sc-num flex h-9 items-center text-[15px] font-semibold">{song.meter}</div>
            </div>

            <div className="bg-panel px-3.5 py-3">
              <Label className="mb-2">Length</Label>
              <div className="sc-num flex h-9 items-center text-[15px] font-semibold">
                {song.duration ?? '—'}
              </div>
            </div>
          </div>

          <Segmented
            className="mt-1"
            value={view}
            onChange={(nextView) => setPrefs({ view: nextView })}
            options={[
              { value: 'singer', label: 'Lyrics' },
              { value: 'musician', label: 'Chart' },
            ]}
          />
        </Masthead>
      )}

      {!stage && (
        <CrumbBar
          crumbs={[
            { label: 'Soundcheck', to: '/' },
            { label: 'Bands', to: '/bands' },
            { label: band.name, to: `/bands/${band.slug}` },
            { label: concertTitle, to: base },
            { label: song.title },
          ]}
        />
      )}

      <Page className={stage ? 'pt-8' : 'pt-12'}>
        {stage && (
          <h1 className="sc-display mb-8 text-[clamp(28px,5vw,42px)]">{song.title}</h1>
        )}
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
      </Page>

      {!stage && <Foot />}

      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 backdrop-blur-[10px]">
        {next && item.segue && (
          <div className="flex items-center justify-center gap-1.5 border-b border-line-soft py-1.5">
            <CornerDownRight size={10} strokeWidth={2} className="text-muted" />
            <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
              segue into {next.song_.title}
            </span>
          </div>
        )}
        <div className="mx-auto flex w-full max-w-[880px] items-center gap-2 px-5 py-2.5">
          <IconButton onClick={() => goto(prev)} disabled={!prev} aria-label="Previous song" title={prev?.song_.title}>
            <ChevronLeft size={16} strokeWidth={2} />
          </IconButton>

          <PlayButton disabled={!song.tempo && !songPrefs.tempo} />

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <BeatIndicator beatsPerBar={bpb} />
            <BarCounter totalBars={bars} />
          </div>

          <IconButton onClick={() => setMixerOpen(true)} aria-label="Sound" title="Sound">
            <SlidersHorizontal size={15} strokeWidth={1.75} />
          </IconButton>

          {view === 'singer' && (
            <IconButton
              onClick={() => setAutoScroll((s) => !s)}
              active={autoScroll}
              aria-label="Auto-scroll"
              title="Auto-scroll"
            >
              <MoveVertical size={15} strokeWidth={1.75} />
            </IconButton>
          )}

          <IconButton onClick={() => setStage((s) => !s)} active={stage} aria-label="Stage mode" title="Stage mode">
            {stage ? <Minimize2 size={15} strokeWidth={1.75} /> : <Maximize2 size={15} strokeWidth={1.75} />}
          </IconButton>

          <IconButton onClick={() => goto(next)} disabled={!next} aria-label="Next song" title={next?.song_.title}>
            <ChevronRight size={16} strokeWidth={2} />
          </IconButton>
        </div>
      </nav>

      <MixerSheet open={mixerOpen} onClose={() => setMixerOpen(false)} style={style} onStyleChange={setStyle} />
      <AudioWarning />
    </>
  )
}

function TempoControl({
  songId,
  written,
  tempo,
  differs,
}: {
  songId: string
  written: number | null
  tempo: number
  differs: boolean
}) {
  const { tap, taps } = useTapTempo((bpm) => setSongPrefs(songId, { tempo: bpm }))

  return (
    <Stepper
      decreaseLabel="Slower"
      increaseLabel="Faster"
      highlight={differs}
      canDecrease={tempo > 30}
      canIncrease={tempo < 300}
      onDecrease={() => setSongPrefs(songId, { tempo: tempo - 1 })}
      onIncrease={() => setSongPrefs(songId, { tempo: tempo + 1 })}
      onReset={differs ? () => setSongPrefs(songId, { tempo: null }) : undefined}
      value={written === null && tempo === 120 ? '—' : tempo}
      trailing={
        <button
          type="button"
          onClick={tap}
          aria-label="Tap tempo"
          className="border-l border-line px-2 font-mono text-[10px] font-medium tracking-[0.09em] text-muted uppercase transition-colors hover:bg-sunk hover:text-ink"
        >
          {taps > 0 && taps < 4 ? `tap ${taps}` : 'tap'}
        </button>
      }
    />
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
      className={cx(
        'fixed inset-x-5 bottom-24 z-50 border border-accent bg-accent-wash px-4 py-3',
        'font-mono text-[11px] tracking-[0.04em] text-accent-ink',
      )}
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
