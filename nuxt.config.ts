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

  // DESIGN.md v3.0 §13 — no-flash inline script.
  // Resolves saved theme before paint so the first frame matches the
  // user's preference. Default is `light` per the Organic Professional
  // palette (light-first); the script only picks `dark` when the user
  // has explicitly chosen it (localStorage) or the OS reports dark-scheme
  // and the user has never opted out.
  app: {
    head: {        // Eagerly preload the 52 KB hero-bg.webp texture so it lands
        // alongside the rest of the first-paint resources on slow
        // networks. fetchpriority=low keeps the budget unblocked:
        //   - Hero text is the LCP candidate, not the texture overlay;
        //   - texture is decorative — it can paint a few hundred ms
        //     later than its sibling resources without hurting UX.
        // WebP brings the texture from 1.5 MB (PNG) to 52 KB (~30x).
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
            // No-flash before-paint resolver. Reads the stored pref and
            // (if absent) defaults to 'light' — OS preference is no
            // longer consulted at runtime per project policy
            // (DESIGN.md "Organic Professional" is light-first and the
            // user pinned the default to light). `matchMedia` call was
            // dropped from the previous edition.
            "(function(){try{var p=localStorage.getItem('theme-pref');document.documentElement.setAttribute('data-theme',p==='dark'||p==='light'?p:'light');}catch(e){}})();",
          tagPosition: 'head',
          type: 'text/javascript',
        },
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
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
