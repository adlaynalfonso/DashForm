import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // @react-pdf/renderer uses internal web workers and dynamic imports that
  // conflict with Vite's dependency pre-bundling. Excluding it avoids those issues.
  optimizeDeps: {
    exclude: ['@react-pdf/renderer'],
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // Ensure public-folder assets are included in the SW precache manifest
      includeAssets: [
        'favicon.svg',
        'icon-192.svg',
        'icon-512.svg',
        'apple-touch-icon.svg',
      ],

      workbox: {
        // Pre-cache all built JS/CSS/HTML and static assets.
        // The pdfGenerator chunk (~1.5 MB) is included so PDF export works offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Raise the limit above the default 2 MB so the PDF engine chunk is cached.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB

        // SPA fallback: serve index.html for any navigation request that isn't
        // a file (e.g. /fill/123 while offline). The React router handles routing.
        navigateFallback: 'index.html',

        // Don't intercept real API paths (none at the moment, but good practice)
        navigateFallbackDenylist: [/^\/api\//],

        // ── Runtime caching ────────────────────────────────────────────────────
        // Most assets are already in the precache.
        // Runtime rules handle anything fetched at runtime that isn't pre-cached.
        runtimeCaching: [
          {
            // Google Fonts stylesheet + font files
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Any same-origin script or style not in precache (shouldn't happen
            // with the glob above, but acts as a safety net after updates)
            urlPattern: /\.(js|css)(\?.*)?$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },

      manifest: {
        name: 'DashForm Filler',
        short_name: 'Filler',
        description: 'Rellena y exporta formularios DashForm sin conexión',
        lang: 'es',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          // Maskable variant (uses the full-bleed green background as the safe zone)
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },

      // Set enabled: true to test the service worker during `vite dev`
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
})
