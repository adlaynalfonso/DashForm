import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Service-worker registration is handled by vite-plugin-pwa.
// The PWAUpdatePrompt component (mounted inside App) uses `useRegisterSW`
// from `virtual:pwa-register/react` to subscribe to SW lifecycle events and
// surface the "offline ready" / "update available" UI to the user.
//
// Offline capabilities:
//   ✓ IndexedDB (idb)            — entirely client-side, no network needed
//   ✓ Export editable (.json)    — file-saver runs in the browser
//   ✓ Export PDF                 — @react-pdf/renderer runs in the browser;
//                                  the pdfGenerator chunk (~1.5 MB) is
//                                  pre-cached by the service worker
//   ✓ SPA routing (/fill/:id …)  — navigateFallback serves index.html offline

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
