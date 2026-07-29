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

  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/portfolio', pathPrefix: false },
    { path: '~/components/tools', pathPrefix: false },
  ],

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ['/', '/projects', '/tools', '/404'],
    },
  },

  // DESIGN.md §13 — no-flash inline script. Resolves saved theme before
  // paint so first frame matches user preference. Default `light` per
  // Organic Professional palette; the script picks `dark` only when
  // explicitly stored in localStorage.
  app: {
    head: {
      // `<html lang>` is required for screen readers to pick the right
      // pronunciation profile and for the browser to offer translation
      // for the page. The portfolio copy is English throughout.
      htmlAttrs: { lang: 'en' },        // Eagerly preload the 52 KB hero-bg.webp texture. fetchpriority=low
        // because hero text is the LCP candidate and the texture is
        // decorative — it can paint late without hurting UX. WebP brings
        // it from 1.5 MB PNG to 52 KB (~30×).
        link: [
          {
            rel: 'preload',
            as: 'image',
            href: '/hero-bg.webp',
            fetchpriority: 'low',
            // Gate the preload to mid+ viewports. Below 640 px the
            // hero composition softens and the texture is barely
            // visible anyway, so the preloaded bytes are pure waste
            // on mobile + small-tablet networks.
            media: '(min-width: 640px)',
            type: 'image/webp',
          },
          // Brand mark is above-the-fold and visible on first paint;
          // high fetchpriority lands the 12 KB WebP alongside hero content.
          {
            rel: 'preload',
            as: 'image',
            href: '/ay-monogram.webp',
            type: 'image/webp',
            fetchpriority: 'high',
          },
        ],
      script: [
        {
          innerHTML:
            // No-flash resolver. Reads stored pref; defaults to 'light'
            // per DESIGN.md (light-first by policy). OS preference is
            // not consulted — matchMedia was removed in a prior edit.
            "(function(){try{var p=localStorage.getItem('theme-pref');document.documentElement.setAttribute('data-theme',p==='dark'||p==='light'?p:'light');}catch(e){}})();",
          tagPosition: 'head',
          type: 'text/javascript',
        },
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
    // NOTE: prose-component bundling intentionally NOT applied —
    // `manualChunks` matching `/Prose/` breaks Nitro chunk-graph identity
    // under Nuxt 4.5 + @nuxt/content 3.15. Revisit via nitro.rollupConfig
    // if needed in the future.
  },

  typescript: {
    strict: true,
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
