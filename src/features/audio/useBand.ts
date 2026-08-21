import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { Song } from '@/content/types'
import { beatsPerBar, flattenBars, songToChart, totalBars } from '@/features/music/chart'
import { accidentalFor, transposeChord } from '@/features/music/transpose'
import { createStore, safeStorage, useStore } from '@/lib/store'
import { installBand, type BandState, type Channel } from './band'
import { engine } from './engine'
import type { StyleId } from './styles'

const MIXER_KEY = 'soundcheck:mixer:v1'

export interface MixerState {
  levels: Record<Channel, number>
  countInBars: number
  loop: boolean
  volume: number
}

const MIXER_DEFAULTS: MixerState = {
  // Click on, band off: on stage you want the click and nothing else.
  levels: { click: 1, drums: 0, bass: 0, keys: 0 },
  countInBars: 1,
  loop: true,
  volume: 0.8,
}

function loadMixer(): MixerState {
  const raw = safeStorage.read(MIXER_KEY)
  if (!raw) return MIXER_DEFAULTS
  try {
    const parsed = JSON.parse(raw) as Partial<MixerState>
    return { ...MIXER_DEFAULTS, ...parsed, levels: { ...MIXER_DEFAULTS.levels, ...parsed.levels } }
  } catch {
    return MIXER_DEFAULTS
  }
}

export const mixerStore = createStore<MixerState>(loadMixer(), (value) => {
  safeStorage.write(MIXER_KEY, JSON.stringify(value))
  engine.setVolume(value.volume)
})

export function useMixer(): MixerState {
  return useStore(mixerStore)
}

export function setChannel(channel: Channel, level: number): void {
  mixerStore.set((prev) => ({ ...prev, levels: { ...prev.levels, [channel]: level } }))
}

export function toggleChannel(channel: Channel): void {
  mixerStore.set((prev) => ({
    ...prev,
    levels: { ...prev.levels, [channel]: prev.levels[channel] > 0 ? 0 : 1 },
  }))
}

export function setMixer(patch: Partial<MixerState>): void {
  mixerStore.set((prev) => ({ ...prev, ...patch }))
}

/** Live transport position, re-rendered once per animation frame while playing. */
export function useTransport() {
  const snapshot = useSyncExternalStore(
    (listener) => engine.subscribe(listener),
    () => engine.position,
    () => null,
  )
  const playing = useSyncExternalStore(
    (listener) => engine.subscribe(listener),
    () => engine.playing,
    () => false,
  )

  useEffect(() => {
    if (!playing) return
    let raf = 0
    const loop = () => {
      engine.poll()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return { position: snapshot, playing }
}

/**
 * Wires a song into the transport: builds the transposed bar timeline, keeps
 * tempo/meter/style in sync, and installs the four voices.
 */
export function useSongBand(
  song: Song,
  style: StyleId,
  keyOffset: number,
  tempo: number,
): void {
  const mixer = useMixer()

  const bars = useMemo(() => {
    const accidental = accidentalFor(song.key, keyOffset)
    return flattenBars(songToChart(song)).map((bar) => ({
      chords: bar.chords.map((c) => transposeChord(c, keyOffset, accidental)),
    }))
  }, [song, keyOffset])

  const bpb = beatsPerBar(song.meter)
  const chartBars = useMemo(() => totalBars(songToChart(song)), [song])

  // A ref so the voices see fresh state without being re-registered each render.
  const stateRef = useRef<BandState>({
    style,
    beatsPerBar: bpb,
    bars,
    levels: mixer.levels,
    accentFirstBeat: true,
  })
  stateRef.current = { style, beatsPerBar: bpb, bars, levels: mixer.levels, accentFirstBeat: true }

  useEffect(() => installBand(engine, () => stateRef.current), [])

  useEffect(() => {
    engine.configure({
      bpm: tempo,
      beatsPerBar: bpb,
      countInBars: mixer.countInBars,
      totalBars: chartBars,
      loop: mixer.loop,
    })
  }, [tempo, bpb, chartBars, mixer.countInBars, mixer.loop])

  useEffect(() => engine.setVolume(mixer.volume), [mixer.volume])

  // Leaving a song should never leave a click running in someone's pocket.
  useEffect(() => () => engine.stop(), [song.id])
}
