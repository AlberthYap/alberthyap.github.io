// https://vitest.dev/config/
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * Unit-test config for `app/components/ui/*` and similar pure Vue components.
 *
 * Scope: tests under `tests/unit/` exercise rendering, props, slots, and emit
 * contracts without spinning up Nuxt's runtime — `happy-dom` provides just enough
 * DOM. Path aliases mirror Nuxt 4 conventions so test-side imports resolve to
 * the same locations they would in `nuxt dev` / `nuxt build`:
 *
 *   `~` / `@`    → `./app/`            (app source — components, layouts, pages, utils, composables)
 *   `~~` / `@@`  → `./` (project root) (cross-cutting — `shared/`, `content/`, `tests/`, configs)
 *
 * Without this alignment, an import like `~/utils/buttonClasses` works in Nuxt
 * but resolves to `./utils/buttonClasses` (which doesn't exist) under vitest.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app/', import.meta.url)),
      '@': fileURLToPath(new URL('./app/', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '@@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    css: false,
    setupFiles: ['./tests/setup.ts'],
  },
})
