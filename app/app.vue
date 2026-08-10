<script setup lang="ts">
// Skip-link here is load-bearing for `error.vue`, which is layout-less
// and doesn't inherit the default layout's landmarks.

// Preload VARIABLE fonts so the fetch starts during HTML parse, not
// after @font-face discovery. Wght-axis coverage means one Literata-
// Variable fetch handles every `font-serif` weight (400/600/700),
// one NunitoSans-Variable the same for `font-sans` — 2 preloads
// replace 4 static fetches. `crossorigin="anonymous"` is required:
// preloads download opaque without it and the browser double-fetches
// when @font-face fires.
import literataVariableUrl from '~/assets/fonts/Literata-Variable.woff2?url'
import nunitoSansVariableUrl from '~/assets/fonts/NunitoSans-Variable.woff2?url'

useHead({
  link: [
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: literataVariableUrl,
      crossorigin: 'anonymous',
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: nunitoSansVariableUrl,
      crossorigin: 'anonymous',
    },
  ],
})
</script>

<template>
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-button-primary focus:px-4 focus:py-2 focus:text-on-primary"
  >
    Skip to main content
  </a>
  <NuxtLayout>
    <NuxtPage
      :transition="{
        name: 'page',
        mode: 'out-in',
      }"
    />
  </NuxtLayout>
</template>
