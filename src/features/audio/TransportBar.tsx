import { Pause, Play } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Button, Label, Num, Sheet, cx } from '@/design/primitives'
import type { Channel } from './band'
import { engine } from './engine'
import { GROOVES, STYLE_IDS, type StyleId } from './styles'
import { setChannel, setMixer, toggleChannel, useMixer, useTransport } from './useBand'

const CHANNELS: Array<{ id: Channel; label: string }> = [
  { id: 'click', label: 'Click' },
  { id: 'drums', label: 'Drums' },
  { id: 'bass', label: 'Bass' },
  { id: 'keys', label: 'Keys' },
]

export function PlayButton({ disabled }: { disabled?: boolean }) {
  const { playing } = useTransport()
  return (
    <button
      type="button"
      onClick={() => void engine.toggle()}
      disabled={disabled}
      aria-label={playing ? 'Stop' : 'Play'}
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-all',
        'duration-200 ease-[var(--ease-smooth)] active:scale-90',
        'disabled:pointer-events-none disabled:opacity-30',
        playing ? 'bg-accent text-on-accent' : 'bg-ink text-bg hover:opacity-90',
      )}
    >
      {playing ? (
        <Pause size={15} strokeWidth={0} fill="currentColor" />
      ) : (
        <Play size={15} strokeWidth={0} fill="currentColor" className="ml-0.5" />
      )}
    </button>
  )
}

/** Beat dots. The count-in reads differently from the bar so you can't confuse them. */
export function BeatIndicator({ beatsPerBar }: { beatsPerBar: number }) {
  const { position, playing } = useTransport()
  const active = playing && position ? position.beatInBar : -1
  const countIn = Boolean(playing && position?.isCountIn)

  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const on = i === active
        return (
          <span
            key={i}
            className={cx(
              'block rounded-full transition-all duration-100',
              on ? 'size-2' : 'size-1.5',
              on ? (countIn ? 'bg-warm' : i === 0 ? 'bg-accent' : 'bg-ink') : 'bg-ink-3/30',
            )}
          />
        )
      })}
    </div>
  )
}

export function BarCounter({ totalBars }: { totalBars: number }) {
  const { position, playing } = useTransport()
  if (!playing || !position) return null
  if (position.isCountIn) {
    return (
      <span className="text-[11.5px] font-semibold whitespace-nowrap text-warm">count in</span>
    )
  }
  return (
    <Num className="text-[11.5px] font-medium whitespace-nowrap text-ink-3">
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
    <Sheet open={open} onClose={onClose} title="Sound">
      <div className="flex flex-col gap-7">
        <section className="flex flex-col gap-3">
          <Label>Channels</Label>
          <div className="flex flex-col gap-2">
            {CHANNELS.map((channel) => {
              const on = mixer.levels[channel.id] > 0
              return (
                <div key={channel.id} className="flex items-center gap-3 rounded-xl bg-sunk px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={cx(
                      'flex h-8 w-[4.5rem] shrink-0 items-center justify-center rounded-full',
                      'text-[13px] font-semibold transition-all duration-200 ease-[var(--ease-smooth)]',
                      'active:scale-95',
                      on ? 'bg-accent text-on-accent' : 'bg-card text-ink-3 hover:text-ink',
                    )}
                  >
                    {channel.label}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(mixer.levels[channel.id] * 100)}
                    onChange={(e) => setChannel(channel.id, Number(e.target.value) / 100)}
                    className="h-8 flex-1"
                    aria-label={`${channel.label} level`}
                  />
                  <Num className="w-7 text-right text-[12px] text-ink-3">
                    {Math.round(mixer.levels[channel.id] * 100)}
                  </Num>
                </div>
              )
            })}
          </div>
          <p className="m-0 text-[13.5px] text-ink-3">
            On stage you usually want click only. Turn the band up for rehearsal.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <Label>Groove</Label>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_IDS.map((id) => (
              <Button key={id} size="sm" variant={style === id ? 'solid' : 'soft'} onClick={() => onStyleChange(id)}>
                {GROOVES[id].label}
              </Button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <Label>Count-in</Label>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2].map((bars) => (
              <Button
                key={bars}
                size="sm"
                variant={mixer.countInBars === bars ? 'solid' : 'soft'}
                onClick={() => setMixer({ countInBars: bars })}
              >
                {bars === 0 ? 'None' : `${bars} bar${bars > 1 ? 's' : ''}`}
              </Button>
            ))}
            <Button
              size="sm"
              variant={mixer.loop ? 'solid' : 'soft'}
              onClick={() => setMixer({ loop: !mixer.loop })}
              className="ml-auto"
            >
              Loop
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <Label>Master</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(mixer.volume * 100)}
            onChange={(e) => setMixer({ volume: Number(e.target.value) / 100 })}
            className="h-8"
            aria-label="Master volume"
          />
        </section>
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
