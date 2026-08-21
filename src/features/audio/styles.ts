/**
 * Grooves, written as an eighth-note grid for one 4/4 bar.
 *
 * Each array holds a gain per eighth-note step (0 = silent). Odd meters index
 * into the same arrays with a modulo, which lands somewhere musical without
 * needing a pattern per time signature.
 */

export type StyleId = 'pop' | 'rock' | 'funk' | 'ballad' | 'latin' | 'disco'

export interface Groove {
  label: string
  kick: number[]
  snare: number[]
  hat: number[]
  /** Steps where the hat opens instead of closing. */
  hatOpen: number[]
  /** Keys comp hits. */
  keys: number[]
  /** Bass hits. */
  bass: number[]
}

const O = 0

export const GROOVES: Record<StyleId, Groove> = {
  pop: {
    label: 'Pop',
    kick: [1, O, O, O, 0.85, O, O, O],
    snare: [O, O, 0.8, O, O, O, 0.8, O],
    hat: [0.5, 0.3, 0.5, 0.3, 0.5, 0.3, 0.5, 0.3],
    hatOpen: [],
    keys: [0.9, O, O, O, 0.7, O, O, O],
    bass: [1, O, O, O, 0.8, O, O, O],
  },
  rock: {
    label: 'Rock',
    kick: [1, O, O, O, 0.9, O, 0.7, O],
    snare: [O, O, 0.9, O, O, O, 0.9, O],
    hat: [0.55, 0.4, 0.55, 0.4, 0.55, 0.4, 0.55, 0.4],
    hatOpen: [],
    keys: [0.8, O, O, O, O, O, O, O],
    bass: [1, O, 0.6, O, 0.9, O, 0.6, O],
  },
  funk: {
    label: 'Funk',
    kick: [1, O, O, 0.7, O, O, 0.85, O],
    snare: [O, O, 0.85, O, O, O, 0.85, O],
    hat: [0.5, 0.55, 0.35, 0.55, 0.5, 0.55, 0.35, 0.55],
    hatOpen: [3],
    keys: [0.7, O, 0.55, O, O, 0.6, O, 0.5],
    bass: [1, O, 0.6, 0.7, O, 0.6, 0.8, O],
  },
  ballad: {
    label: 'Ballad',
    kick: [1, O, O, O, O, O, O, O],
    snare: [O, O, 0.6, O, O, O, 0.6, O],
    hat: [0.35, O, 0.35, O, 0.35, O, 0.35, O],
    hatOpen: [],
    keys: [0.85, O, O, O, O, O, O, O],
    bass: [0.9, O, O, O, O, O, O, O],
  },
  latin: {
    label: 'Latin',
    kick: [1, O, O, 0.7, O, O, 0.8, O],
    snare: [O, O, O, O, 0.6, O, O, O],
    hat: [0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45],
    hatOpen: [],
    keys: [O, 0.7, O, 0.6, O, 0.7, O, 0.6],
    bass: [1, O, O, 0.7, O, O, 0.8, O],
  },
  disco: {
    label: 'Disco',
    kick: [1, O, 0.95, O, 1, O, 0.95, O],
    snare: [O, O, 0.75, O, O, O, 0.75, O],
    hat: [0.3, 0.6, 0.3, 0.6, 0.3, 0.6, 0.3, 0.6],
    hatOpen: [1, 3, 5, 7],
    keys: [O, 0.7, O, 0.7, O, 0.7, O, 0.7],
    bass: [1, O, 0.7, 0.8, 1, O, 0.7, 0.8],
  },
}

export const STYLE_IDS = Object.keys(GROOVES) as StyleId[]
