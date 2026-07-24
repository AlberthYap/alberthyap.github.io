// https://vitest.dev/config/
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * Unit-test config for `app/components/ui/*` and similar pure Vue components.
 *
 * Scope: tests under `tests/unit/` exercise rendering, props, slots, and emit
 * contracts without spinning up Nuxt's runtime — `happy-dom` provides just enough
 * DOM. Path aliases mirror Nuxt 4 conventions (`~`, `~~`, `@` all resolve to
 * the project root) so test files can import subjects via `~~/app/...` like
 * the app code does.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    css: false,
    setupFiles: ['./tests/setup.ts'],
  },
})
