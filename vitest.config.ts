import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Deliberately not the app's vite.config: tests need the alias, not the PWA
// service worker or the content virtual module.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
