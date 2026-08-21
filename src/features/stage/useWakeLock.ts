import { useEffect, useState } from 'react'

type Sentinel = { released: boolean; release: () => Promise<void> }
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<Sentinel> }
}

/**
 * Holds the screen awake while `active`.
 *
 * Supported on iOS/iPadOS Safari 16.4+, Chrome, and Firefox. The lock is
 * dropped by the OS whenever the tab is hidden, so it is re-acquired on
 * `visibilitychange` — otherwise the screen sleeps the first time someone
 * checks a message between songs.
 */
export function useWakeLock(active: boolean): { held: boolean; supported: boolean } {
  const [held, setHeld] = useState(false)
  const supported =
    typeof navigator !== 'undefined' && 'wakeLock' in (navigator as WakeLockNavigator)

  useEffect(() => {
    if (!active || !supported) {
      setHeld(false)
      return
    }

    let sentinel: Sentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        sentinel = (await (navigator as WakeLockNavigator).wakeLock!.request('screen')) ?? null
        if (cancelled) {
          void sentinel?.release()
          sentinel = null
          return
        }
        setHeld(true)
      } catch {
        // Denied (low battery, unsupported surface). Not worth interrupting anyone over.
        setHeld(false)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
      else setHeld(false)
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release()
      setHeld(false)
    }
  }, [active, supported])

  return { held, supported }
}
