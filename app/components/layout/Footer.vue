<script setup lang="ts">
/**
 * Footer — Status footer (Organic Professional design).
 *
 * Pattern from example.html: brand wordmark + status pill on the left,
 * social links grid on the right, copyright + version line at the
 * bottom. No in-app NAV_LINKS here — those live exclusively in the
 * floating pill navbar so the footer stays a brand/identity surface.
 */
import { SITE_NAME, SOCIAL_LINKS } from '~~/shared/constants/site'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-outline-variant bg-bg mt-[var(--spacing-section)]">
    <div
      class="mx-auto w-full max-w-[var(--spacing-container)] px-6 md:px-12 lg:px-16 py-[var(--spacing-section)] flex flex-col gap-[var(--spacing-lg)]"
    >
      <!-- Top row: brand wordmark + status pill on the left, social grid on the right. -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-[var(--spacing-lg)]">
        <div class="space-y-4">
          <span
            class="font-serif text-headline-xl font-bold text-text leading-none block"
          >
            {{ SITE_NAME }}
          </span>
          <span class="status-pill">
            <span class="status-dot" aria-hidden="true" />
            All systems operational
          </span>
        </div>

        <nav
          aria-label="Social"
          class="grid grid-cols-2 sm:grid-cols-4 gap-x-12 gap-y-4 font-mono text-label-md uppercase tracking-widest"
        >
          <a
            v-for="link in SOCIAL_LINKS"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="text-muted hover:text-primary transition-colors duration-200"
            :aria-label="link.label"
          >
            {{ link.label }}
          </a>
          <NuxtLink
            to="/projects"
            class="text-muted hover:text-primary transition-colors duration-200"
          >
            Projects
          </NuxtLink>
          <NuxtLink
            to="/tools"
            class="text-muted hover:text-primary transition-colors duration-200"
          >
            Tools
          </NuxtLink>
        </nav>
      </div>

      <!-- Bottom row: copyright + version stamp. -->
      <div
        class="pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-label-sm text-muted"
      >
        <p>© {{ currentYear }} {{ SITE_NAME }} — Built for the high-performance web.</p>
      </div>
    </div>
  </footer>
</template>
