import { useSyncExternalStore } from 'react'

/**
 * A ~30 line global store. Everything the app remembers is small, flat and
 * per-device, so a state library would be more machinery than state.
 */
export interface Store<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T>(initial: T, onChange?: (value: T) => void): Store<T> {
  let value = initial
  const listeners = new Set<() => void>()

  return {
    get: () => value,
    set(next) {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      if (Object.is(resolved, value)) return
      value = resolved
      onChange?.(value)
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function useStore<T>(store: Store<T>): T
export function useStore<T, S>(store: Store<T>, selector: (value: T) => S): S
export function useStore<T, S>(store: Store<T>, selector?: (value: T) => S): T | S {
  return useSyncExternalStore(
    store.subscribe,
    () => (selector ? selector(store.get()) : store.get()),
    () => (selector ? selector(store.get()) : store.get()),
  )
}

/** localStorage that never throws — Safari private mode returns a locked quota. */
export const safeStorage = {
  read(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  write(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value)
    } catch {
      /* ignore: preferences are a convenience, never a requirement */
    }
  },
}
