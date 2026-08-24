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
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full',
        'transition-all duration-150 ease-[var(--ease-out-quick)] active:scale-90',
        'disabled:pointer-events-none disabled:opacity-25',
        playing ? 'bg-accent text-accent-fg sc-live' : 'bg-fg text-bg hover:opacity-90',
      )}
    >
      {playing ? (
        <Pause size={16} strokeWidth={0} fill="currentColor" />
      ) : (
        <Play size={16} strokeWidth={0} fill="currentColor" className="ml-0.5" />
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
              !playing && 'bg-line-2',
              playing && !on && 'bg-line-2',
              on && (countIn ? 'bg-muted' : i === 0 ? 'bg-accent' : 'bg-fg'),
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
      <span className="sc-label !text-accent whitespace-nowrap">count in</span>
    )
  }
  return (
    <Num className="text-2xs whitespace-nowrap text-muted">
      bar {(position.bar % Math.max(1, totalBars)) + 1}
      <span className="text-dim">/{totalBars}</span>
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
          <div className="sc-panel divide-y divide-line overflow-hidden">
            {CHANNELS.map((channel) => {
              const on = mixer.levels[channel.id] > 0
              return (
                <div key={channel.id} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={cx(
                      'flex h-8 w-[4.5rem] shrink-0 items-center justify-center rounded-sm border',
                      'text-2xs font-medium tracking-[0.09em] uppercase transition-all duration-150',
                      on
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-line text-muted hover:border-line-2 hover:text-fg',
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
                  <Num className="w-7 text-right text-2xs text-dim">
                    {Math.round(mixer.levels[channel.id] * 100)}
                  </Num>
                </div>
              )
            })}
          </div>
          <p className="text-2xs text-dim">
            On stage you usually want click only. Turn the band up for rehearsal.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <Label>Groove</Label>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_IDS.map((id) => (
              <Button key={id} size="sm" active={style === id} onClick={() => onStyleChange(id)}>
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
                active={mixer.countInBars === bars}
                onClick={() => setMixer({ countInBars: bars })}
              >
                {bars === 0 ? 'None' : `${bars} bar${bars > 1 ? 's' : ''}`}
              </Button>
            ))}
            <Button
              size="sm"
              active={mixer.loop}
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
