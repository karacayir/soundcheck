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
    <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-4 border border-fg bg-bg px-4 py-3">
      <span className="text-xs">Yeni sürüm hazır.</span>
      <div className="flex gap-px">
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          Sonra
        </Button>
        <Button size="sm" variant="solid" onClick={() => void updateServiceWorker(true)}>
          Güncelle
        </Button>
      </div>
    </div>
  )
}
