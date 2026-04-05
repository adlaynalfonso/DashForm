import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import EditorPage from '@/pages/EditorPage'
import PreviewPage from '@/pages/PreviewPage'
import { PWAUpdatePrompt } from '@/components/common/PWAUpdatePrompt'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor/:id?" element={<EditorPage />} />
        <Route path="/preview/:id" element={<PreviewPage />} />
      </Routes>
      <PWAUpdatePrompt />
    </BrowserRouter>
  )
}
