import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/design/primitives'

/**
 * Updates are opt-in, never automatic: a service worker swapping itself out
 * mid-set would reload the page in front of an audience.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-5 bottom-5 z-50 flex items-center justify-between gap-4 rounded-lg border border-line-2 bg-surface-2 px-4 py-3 shadow-lg backdrop-blur">
      <span className="text-xs">A new version is ready.</span>
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button size="sm" variant="accent" onClick={() => void updateServiceWorker(true)}>
          Update
        </Button>
      </div>
    </div>
  )
}
