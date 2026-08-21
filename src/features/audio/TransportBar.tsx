import { useCallback, useRef, useState } from 'react'
import { Button, IconButton, Label, Num, Sheet } from '@/design/primitives'
import type { Channel } from './band'
import { engine } from './engine'
import { GROOVES, STYLE_IDS, type StyleId } from './styles'
import { setChannel, setMixer, toggleChannel, useMixer, useTransport } from './useBand'

const CHANNELS: Array<{ id: Channel; label: string }> = [
  { id: 'click', label: 'Klik' },
  { id: 'drums', label: 'Davul' },
  { id: 'bass', label: 'Bas' },
  { id: 'keys', label: 'Klavye' },
]

export function PlayButton({ disabled }: { disabled?: boolean }) {
  const { playing } = useTransport()
  return (
    <IconButton
      onClick={() => void engine.toggle()}
      active={playing}
      disabled={disabled}
      aria-label={playing ? 'Durdur' : 'Çal'}
      title={playing ? 'Durdur' : 'Çal'}
    >
      {playing ? (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <rect width="12" height="12" fill="currentColor" />
        </svg>
      ) : (
        <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden>
          <path d="M0 0 L12 7 L0 14 Z" fill="currentColor" />
        </svg>
      )}
    </IconButton>
  )
}

/** Beat dots: the count-in reads differently from the bar so you can't confuse them. */
export function BeatIndicator({ beatsPerBar }: { beatsPerBar: number }) {
  const { position, playing } = useTransport()
  if (!playing || !position) {
    return <div className="flex h-11 items-center gap-1.5 px-1 opacity-25">{dots(beatsPerBar, -1, false)}</div>
  }
  return (
    <div className="flex h-11 items-center gap-1.5 px-1" aria-hidden>
      {dots(beatsPerBar, position.beatInBar, position.isCountIn)}
    </div>
  )
}

function dots(count: number, active: number, countIn: boolean) {
  return Array.from({ length: count }, (_, i) => (
    <span
      key={i}
      className={
        'block size-2 transition-opacity duration-75 ' +
        (i === active
          ? countIn
            ? 'bg-muted opacity-100'
            : 'bg-fg opacity-100'
          : 'bg-fg opacity-20')
      }
    />
  ))
}

export function BarCounter({ totalBars }: { totalBars: number }) {
  const { position, playing } = useTransport()
  if (!playing || !position) return null
  if (position.isCountIn) {
    return <Num className="text-2xs tracking-[0.09em] text-muted uppercase">giriş sayımı</Num>
  }
  return (
    <Num className="text-2xs text-muted">
      bar {(position.bar % Math.max(1, totalBars)) + 1}/{totalBars}
    </Num>
  )
}

export function MixerSheet({
  open,
  onClose,
  style,
  onStyleChange,
}: {
  open: boolean
  onClose: () => void
  style: StyleId
  onStyleChange: (style: StyleId) => void
}) {
  const mixer = useMixer()

  return (
    <Sheet open={open} onClose={onClose} title="Ses">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label>Kanallar</Label>
          <div className="flex flex-col gap-px bg-line">
            {CHANNELS.map((channel) => (
              <div key={channel.id} className="flex items-center gap-3 bg-bg px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleChannel(channel.id)}
                  className={
                    'flex h-8 w-20 shrink-0 items-center justify-center border text-2xs tracking-[0.09em] uppercase transition-colors ' +
                    (mixer.levels[channel.id] > 0
                      ? 'border-fg bg-fg text-bg'
                      : 'border-line text-muted hover:border-line-strong')
                  }
                >
                  {channel.label}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(mixer.levels[channel.id] * 100)}
                  onChange={(e) => setChannel(channel.id, Number(e.target.value) / 100)}
                  className="h-8 flex-1 accent-[var(--sc-fg)]"
                  aria-label={`${channel.label} seviyesi`}
                />
                <Num className="w-8 text-right text-2xs text-dim">
                  {Math.round(mixer.levels[channel.id] * 100)}
                </Num>
              </div>
            ))}
          </div>
          <p className="text-2xs text-dim">
            Sahnede genelde sadece klik açık kalır. Prova için davul, bas ve klavyeyi aç.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Label>Ritim</Label>
          <div className="flex flex-wrap gap-px">
            {STYLE_IDS.map((id) => (
              <Button key={id} size="sm" active={style === id} onClick={() => onStyleChange(id)}>
                {GROOVES[id].label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label>Giriş sayımı</Label>
          <div className="flex gap-px">
            {[0, 1, 2].map((bars) => (
              <Button
                key={bars}
                size="sm"
                active={mixer.countInBars === bars}
                onClick={() => setMixer({ countInBars: bars })}
              >
                {bars === 0 ? 'Yok' : `${bars} bar`}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label>Genel ses</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(mixer.volume * 100)}
            onChange={(e) => setMixer({ volume: Number(e.target.value) / 100 })}
            className="h-8 accent-[var(--sc-fg)]"
            aria-label="Genel ses"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <Button
            size="sm"
            active={mixer.loop}
            onClick={() => setMixer({ loop: !mixer.loop })}
          >
            {mixer.loop ? 'Döngü ✓' : 'Döngü'}
          </Button>
          <span className="text-2xs text-dim">Şarkı bitince baştan başlasın.</span>
        </div>
      </div>
    </Sheet>
  )
}

/** Tap four times to set the tempo, the way every drummer already expects. */
export function useTapTempo(onTempo: (bpm: number) => void) {
  const taps = useRef<number[]>([])
  const [pending, setPending] = useState(0)

  const tap = useCallback(() => {
    const now = performance.now()
    // A long gap means a new attempt, not a very slow song.
    if (taps.current.length && now - taps.current[taps.current.length - 1]! > 2500) {
      taps.current = []
    }
    taps.current.push(now)
    if (taps.current.length > 5) taps.current.shift()
    setPending(taps.current.length)

    if (taps.current.length >= 2) {
      const gaps = taps.current.slice(1).map((t, i) => t - taps.current[i]!)
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const bpm = Math.round(60000 / mean)
      if (bpm >= 30 && bpm <= 300) onTempo(bpm)
    }
  }, [onTempo])

  return { tap, taps: pending }
}
