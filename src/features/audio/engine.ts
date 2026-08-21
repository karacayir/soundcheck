/**
 * The transport.
 *
 * One AudioContext, one lookahead scheduler, one clock. A `setTimeout` loop
 * wakes every 25ms and schedules everything that falls inside the next 120ms
 * against the AudioContext's own clock — the "Tale of Two Clocks" pattern.
 * `setTimeout` jitter therefore never reaches the audio: it only decides *when
 * we think about* scheduling, never when a sound actually happens.
 *
 * Everything is synthesised, so there are no samples to download, decode, or
 * precache. The click works on a dead wifi connection the first time you open
 * the app.
 */

export interface BeatEvent {
  /** AudioContext time this beat lands on. */
  time: number
  /** Beat index from the start of the chart. Negative during the count-in. */
  absBeat: number
  /** Bar index from the start of the chart. Negative during the count-in. */
  bar: number
  /** 0-based position within the bar. */
  beatInBar: number
  isCountIn: boolean
  /** Seconds per beat at this beat — voices use it to size their envelopes. */
  spb: number
}

export type Voice = (event: BeatEvent, ctx: AudioContext, out: GainNode) => void

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.12

export interface TransportOptions {
  bpm: number
  beatsPerBar: number
  /** Bars of click before bar 1. */
  countInBars: number
  /** Total bars in the chart; playback loops after this. 0 = run forever. */
  totalBars: number
  loop: boolean
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null

  private nextBeatTime = 0
  private absBeat = 0
  private voices = new Map<string, Voice>()
  /** Scheduled-but-not-yet-heard beats, so the UI playhead can lag correctly. */
  private queue: BeatEvent[] = []
  private listeners = new Set<() => void>()

  playing = false
  position: BeatEvent | null = null

  options: TransportOptions = {
    bpm: 120,
    beatsPerBar: 4,
    countInBars: 1,
    totalBars: 0,
    loop: true,
  }

  volume = 0.8

  /* ------------------------------------------------------------ lifecycle -- */

  /** Must be called from a user gesture the first time. */
  async unlock(): Promise<AudioContext> {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor({ latencyHint: 'interactive' })
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state !== 'running') await this.ctx.resume()
    return this.ctx
  }

  get state(): AudioContextState | 'uninitialised' {
    return this.ctx?.state ?? 'uninitialised'
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.01)
    }
  }

  setVoice(id: string, voice: Voice | null): void {
    if (voice) this.voices.set(id, voice)
    else this.voices.delete(id)
  }

  configure(patch: Partial<TransportOptions>): void {
    this.options = { ...this.options, ...patch }
    this.emit()
  }

  /* ------------------------------------------------------------- playback -- */

  async start(): Promise<void> {
    const ctx = await this.unlock()
    if (this.playing) return

    this.absBeat = -this.options.countInBars * this.options.beatsPerBar
    this.queue = []
    this.position = null
    // A beat of headroom so the very first hit is never clipped by scheduling.
    this.nextBeatTime = ctx.currentTime + 0.06
    this.playing = true
    this.timer = setInterval(() => this.tick(), LOOKAHEAD_MS)
    this.tick()
    this.emit()
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.playing = false
    this.queue = []
    this.position = null
    this.emit()
  }

  async toggle(): Promise<void> {
    if (this.playing) this.stop()
    else await this.start()
  }

  private tick(): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || !this.playing) return

    const { beatsPerBar, totalBars, loop } = this.options

    while (this.nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const spb = 60 / Math.max(20, this.options.bpm)
      const isCountIn = this.absBeat < 0
      const bar = Math.floor(this.absBeat / beatsPerBar)
      const beatInBar = ((this.absBeat % beatsPerBar) + beatsPerBar) % beatsPerBar

      const event: BeatEvent = {
        time: this.nextBeatTime,
        absBeat: this.absBeat,
        bar,
        beatInBar,
        isCountIn,
        spb,
      }

      for (const voice of this.voices.values()) {
        try {
          voice(event, ctx, master)
        } catch {
          /* one broken voice must never take the click down */
        }
      }
      this.queue.push(event)

      this.absBeat += 1
      this.nextBeatTime += spb

      if (totalBars > 0 && this.absBeat >= totalBars * beatsPerBar) {
        if (loop) this.absBeat = 0
        else {
          // Let the tail ring out, then stop.
          const stopAt = (this.nextBeatTime - ctx.currentTime) * 1000 + 200
          setTimeout(() => this.stop(), stopAt)
          break
        }
      }
    }

    this.advancePlayhead(ctx.currentTime)
  }

  /** Moves `position` to the most recent beat that has actually been heard. */
  private advancePlayhead(now: number): void {
    let changed = false
    while (this.queue.length && this.queue[0]!.time <= now) {
      this.position = this.queue.shift()!
      changed = true
    }
    if (changed) this.emit()
  }

  /** Called from rAF so the playhead tracks smoothly between scheduler ticks. */
  poll(): void {
    if (this.playing && this.ctx) this.advancePlayhead(this.ctx.currentTime)
  }

  /* -------------------------------------------------------- subscriptions -- */

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

export const engine = new AudioEngine()

// iOS suspends the context when the screen locks or the tab goes away. Come
// back to a live context rather than a silent one that looks like it is playing.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && engine.playing) void engine.unlock()
  })
}
