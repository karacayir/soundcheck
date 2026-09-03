import { band, memberById } from '@/content'
import { createStore, safeStorage, useStore } from '@/lib/store'

const KEY = 'soundcheck:prefs:v1'

export type ViewMode = 'singer' | 'musician'
/** 'system' follows the OS; the other two pin it. */
export type Theme = 'system' | 'dark' | 'light'

export interface SongPrefs {
  /** Semitones away from the written key. */
  keyOffset: number
  /** Absolute BPM override, or null to use the written tempo. */
  tempo: number | null
}

export interface Prefs {
  /** Who is holding this device. Drives highlighting and the default view. */
  memberId: string | null
  theme: Theme
  /** Explicit view choice; null means "decide from my instrument". */
  view: ViewMode | null
  /** Lyric font size in px. */
  lyricSize: number
  /** Keep the screen awake while a song is open. */
  keepAwake: boolean
  songs: Record<string, SongPrefs>
}

const DEFAULTS: Prefs = {
  memberId: null,
  theme: 'system',
  view: null,
  lyricSize: 30,
  keepAwake: true,
  songs: {},
}

function load(): Prefs {
  const raw = safeStorage.read(KEY)
  if (!raw) return DEFAULTS
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return {
      ...DEFAULTS,
      ...parsed,
      songs: parsed.songs ?? {},
      // A member who left the band shouldn't leave the app in a broken state.
      memberId: parsed.memberId && memberById.has(parsed.memberId) ? parsed.memberId : null,
    }
  } catch {
    return DEFAULTS
  }
}

/**
 * Only stamp `data-theme` when the user has actually chosen one. Leaving the
 * attribute off is what lets the stylesheet fall through to
 * `prefers-color-scheme`, which is the default we want.
 */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  if (theme === 'system') delete document.documentElement.dataset['theme']
  else document.documentElement.dataset['theme'] = theme
}

export const prefsStore = createStore<Prefs>(load(), (value) => {
  safeStorage.write(KEY, JSON.stringify(value))
  applyTheme(value.theme)
})

applyTheme(prefsStore.get().theme)

/** What the user is actually looking at right now. */
export function effectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function usePrefs(): Prefs {
  return useStore(prefsStore)
}

export function setPrefs(patch: Partial<Prefs>): void {
  prefsStore.set((prev) => ({ ...prev, ...patch }))
}

export const NO_SONG_PREFS: SongPrefs = { keyOffset: 0, tempo: null }

export function useSongPrefs(songId: string): SongPrefs {
  return useStore(prefsStore, (p) => p.songs[songId] ?? NO_SONG_PREFS)
}

export function setSongPrefs(songId: string, patch: Partial<SongPrefs>): void {
  prefsStore.set((prev) => ({
    ...prev,
    songs: {
      ...prev.songs,
      [songId]: { ...NO_SONG_PREFS, ...prev.songs[songId], ...patch },
    },
  }))
}

export function resetSongPrefs(songId: string): void {
  prefsStore.set((prev) => {
    const { [songId]: _removed, ...rest } = prev.songs
    return { ...prev, songs: rest }
  })
}

/**
 * The view this device should open songs in: an explicit choice if one was
 * made, otherwise whatever suits the instrument the user plays.
 */
export function resolveView(prefs: Prefs, rolesHere: string[] = []): ViewMode {
  if (prefs.view) return prefs.view

  const member = prefs.memberId ? memberById.get(prefs.memberId) : undefined
  if (!member) return 'musician'

  // What they are doing *in this song* beats what they usually do.
  const roles = rolesHere.length > 0 ? rolesHere : member.roles
  const singer = roles.some((r) => band.roles.find((role) => role.id === r)?.view === 'singer')
  return singer ? 'singer' : 'musician'
}
