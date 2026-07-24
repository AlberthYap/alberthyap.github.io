import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
  ],

  css: [
    '~/assets/css/main.css',
  ],

  // Auto-import components from subfolders without path prefix
  // (architecture.md §5.3) — keeps templates readable: <Button> instead of <UiButton>.
  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/portfolio', pathPrefix: false },
    { path: '~/components/tools', pathPrefix: false },
  ],

  // Static Site Generation for GitHub Pages (PRD §19.2).
  // crawlLinks auto-discovers linked routes from the entry page.
  // failOnError is safe in Phase 0 (NuxtWelcome has no internal links)
  // but should be revisited in Phase 3 when /projects/[slug] etc. land.
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
    },
  },

  vite: {
    // Tailwind CSS 4 via first-party Vite plugin (architecture.md §10.1).
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    // Push stricter flags into Nuxt-generated tsconfig fragments so they
    // actually guard app/shared/server source (architecture.md §9.1).
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
        noImplicitReturns: true,
      },
    },
  },
})
