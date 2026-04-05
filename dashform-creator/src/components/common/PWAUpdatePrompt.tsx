import { useEffect, useState } from 'react'
import { RefreshCw, X, Download } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWAUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll for updates every 60 minutes when the tab is visible
      if (r) {
        setInterval(() => {
          if (document.visibilityState === 'visible') r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] SW registration error:', error)
    },
  })

  // Reset dismissed state when a new update arrives
  useEffect(() => {
    if (needRefresh) setDismissed(false)
  }, [needRefresh])

  if (!needRefresh || dismissed) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 sm:px-0"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-4 shadow-xl shadow-blue-900/10 ring-1 ring-blue-50">
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Download className="h-4 w-4 text-blue-600" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Actualización disponible
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Hay una nueva versión de DashForm Creator lista para instalar.
          </p>

          <button
            onClick={() => updateServiceWorker(true)}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recargar y actualizar
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="mt-0.5 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
