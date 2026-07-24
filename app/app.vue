<script setup lang="ts">
// Skip-link target is provided by the default layout (`<main id="main-content">`).
// Keyboard users hit Tab once on any page to jump straight past the navbar.
</script>

<template>
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-bg"
  >
    Skip to main content
  </a>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
