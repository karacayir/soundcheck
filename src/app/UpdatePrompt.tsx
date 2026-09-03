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
    <div className="sc-sh-lg fixed inset-x-5 bottom-5 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-2xl bg-card px-5 py-4">
      <span className="text-[14px] font-medium">A new version is ready.</span>
      <div className="flex gap-1.5">
        <Button size="sm" variant="quiet" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button size="sm" variant="solid" onClick={() => void updateServiceWorker(true)}>
          Update
        </Button>
      </div>
    </div>
  )
}
