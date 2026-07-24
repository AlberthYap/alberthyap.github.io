<script setup lang="ts">
// Default layout — wraps every page with `Navbar` + `<main>` + `Footer`.
// Pages opt-in via `definePageMeta({ layout: 'default' })` but Nuxt applies
// this automatically when no explicit layout is set.
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg text-text">
    <Navbar />
    <main id="main-content" class="flex-1 focus:outline-none" tabindex="-1">
      <slot />
    </main>
    <Footer />
  </div>
</template>
