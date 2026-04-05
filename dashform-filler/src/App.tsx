import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import HomePage from '@/pages/HomePage'
import FillPage from '@/pages/FillPage'
import { PWAUpdatePrompt } from '@/components/common/PWAUpdatePrompt'

// ExportPage pulls in @react-pdf/renderer (~1.5 MB). Lazy-load it so the
// main bundle stays small and the PDF engine only downloads when needed.
const ExportPage = lazy(() => import('@/pages/ExportPage'))

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PWAUpdatePrompt />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fill/:id" element={<FillPage />} />
        <Route
          path="/export/:id"
          element={
            <Suspense fallback={<PageFallback />}>
              <ExportPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
