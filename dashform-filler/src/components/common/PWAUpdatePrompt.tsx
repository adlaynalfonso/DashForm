import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, WifiOff, X } from 'lucide-react'

// ── PWAUpdatePrompt ───────────────────────────────────────────────────────────
//
// Two distinct messages:
//
//  1. offlineReady — shown once after the app is first cached.
//     Auto-dismisses after 4 s. Tells the user the app now works offline.
//
//  2. needRefresh  — shown when a new service worker is waiting.
//     Stays until the user reloads or dismisses. With registerType:'autoUpdate'
//     the SW reloads the page on its own after the current navigation, so this
//     acts as a heads-up before the auto-refresh.
//
// ─────────────────────────────────────────────────────────────────────────────

export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, _r) {
      // SW registered — nothing extra needed
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error)
    },
  })

  // Auto-dismiss the "offline ready" toast
  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(() => setOfflineReady(false), 4000)
    return () => clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  if (!offlineReady && !needRefresh) return null

  return (
    // Fixed bottom-center banner, above any footer UI
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-4 w-full max-w-sm"
    >
      {offlineReady ? (
        // ── Offline-ready toast ──────────────────────────────────────────────
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-lg">
          <WifiOff className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Listo para usar sin conexión</p>
            <p className="text-xs text-emerald-100">
              La app está guardada y funciona offline.
            </p>
          </div>
          <button
            onClick={() => setOfflineReady(false)}
            className="shrink-0 rounded-lg p-1 hover:bg-emerald-500 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // ── Update-available banner ──────────────────────────────────────────
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-lg">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Nueva versión disponible
            </p>
            <p className="text-xs text-gray-500">
              Recarga para aplicar la actualización.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Recargar ahora
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Más tarde
              </button>
            </div>
          </div>
          <button
            onClick={() => setNeedRefresh(false)}
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
