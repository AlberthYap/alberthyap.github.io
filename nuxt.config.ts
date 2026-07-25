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
    head: {
      // Eagerly preload the 1.5 MB hero texture so it lands alongside
      // the rest of the first-paint resources on slow networks. The
      // console is logically classified as a 'fetchpriority=low'
      // rather than 'high' tag because:
      //   - Hero text is the LCP candidate, not the texture overlay;
      //   - low priority keeps the font + JS budget unblocked;
      //   - the texture is decorative — it can paint a few hundred ms
      //     later than its sibling resources without hurting UX.
      link: [
        {
          rel: 'preload',
          as: 'image',
          href: '/image.png',
          fetchpriority: 'low',
          // Gate the 1.5 MB preload to mid+ viewports. Below 640 px
          // the hero composition softens and the texture is barely
          // visible anyway, so the preloaded bytes are pure waste on
          // mobile + small-tablet networks.
          media: '(min-width: 640px)',
          type: 'image/png',
        },
      ],
      script: [
        {
          innerHTML:
            "(function(){try{var p=localStorage.getItem('theme-pref');var r=p==='dark'||p==='light'?p:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',r);}catch(e){}})();",
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
