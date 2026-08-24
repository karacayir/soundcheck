import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { contentPlugin } from './build/content-plugin.ts'

const pkg = createRequire(import.meta.url)('./package.json') as { version: string }

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    contentPlugin(),
    VitePWA({
      // 'prompt', never 'autoUpdate': a service worker must not swap itself
      // in mid-set. The user gets an unobtrusive "yeni sürüm var" nudge.
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Soundcheck',
        short_name: 'Soundcheck',
        description: 'The stage companion for bands — setlist, lyrics, charts, key and tempo.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Fonts and audio are NOT precached by default — without these the app
        // half-works offline, which is worse than not working at all.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,mp3,wav,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Take control on the very first load, so someone opening the app for
        // the first time at the venue is protected immediately rather than
        // from their next navigation onwards.
        clientsClaim: true,
        // But never swap an already-running version out from under them:
        // updates wait for the "Güncelle" prompt.
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, host: true },
  build: { target: 'es2022', sourcemap: true },
})
