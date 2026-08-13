import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config for Nuxt 4 portfolio.
 *
 * Spins up a Nuxt server via `webServer`, waits for the URL to respond,
 * then runs tests against it. Chromium only — pipeline-friendly and
 * sufficient for this SPA's critical user flows.
 *
 * Port is single-source: `PORT` env (default 3000) drives BOTH the
 * webServer and `baseURL`, so the two can never drift (audit H3).
 * In CI we run against a production preview build (`npm run preview`)
 * instead of the dev server, matching what users actually get.
 */
const port = Number(process.env.PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serve the PRODUCTION build (not `nuxt dev`) for E2E: dev mode does
  // an on-demand Vite compile + hard reload on first navigation, which
  // races with fully-parallel `page.goto` calls (net::ERR_ABORTED, frame
  // detached). A preview server is deterministic and matches what users
  // actually get. Override with PLAYWRIGHT_SERVER_COMMAND if you need
  // the dev server locally.
  webServer: {
    command: process.env.PLAYWRIGHT_SERVER_COMMAND
      ?? `npm run build && npm run preview -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
