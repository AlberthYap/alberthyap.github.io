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
  // Phase 3 update: `failOnError: true` was safe in Phase 0–2 (no internal links
  // to dynamic slugs), but breaks Phase 3 builds once Navbar + ProjectCard emit
  // NuxtLink to `/projects/<slug>` while content collection is still empty.
  // Mitigation: `failOnError: false` lets the build complete while missing
  // slugs render the 404 page. Pages still emit `throw createError({ statusCode: 404 })`
  // so the runtime contract is preserved.
  // TODO Phase 3.x: re-tighten to `failOnError: true` once a sample case study
  // lands and `crawlLinks` discovers a real slug path.
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ['/', '/projects', '/tools', '/404'],
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
