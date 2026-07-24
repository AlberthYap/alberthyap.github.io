<script setup lang="ts">
import PageContainer from '~~/app/components/layout/PageContainer.vue'

import { NAV_LINKS, SITE_NAME, SOCIAL_LINKS } from '~~/shared/constants/site'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-border bg-surface mt-24">
    <PageContainer class="flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
      <p class="text-sm text-muted">
        © {{ currentYear }} {{ SITE_NAME }}. All rights reserved.
      </p>
      <nav aria-label="Footer" class="flex flex-wrap gap-6">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="link.to"
          class="text-sm text-muted hover:text-primary transition-colors"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <div class="flex items-center gap-4">
        <a
          v-for="social in SOCIAL_LINKS"
          :key="social.href"
          :href="social.href"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-muted hover:text-primary transition-colors"
          :aria-label="social.label"
        >
          {{ social.label }}
        </a>
      </div>
    </PageContainer>
  </footer>
</template>
