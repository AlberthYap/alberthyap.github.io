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

interface Props {
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer
    class="border-t border-outline-variant bg-surface-container-low mt-[var(--spacing-section)]"
    :class="props.compact && 'site-footer--compact'"
  >
    <div
      class="site-footer__inner mx-auto w-full max-w-[var(--spacing-container)] px-6 md:px-12 lg:px-16 py-[var(--spacing-section)] flex flex-col gap-[var(--spacing-6)]"
    >
      <!-- Top row: brand wordmark + status pill on the left, social grid on the right. -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-[var(--spacing-6)]">
        <div class="space-y-4">
          <span
            class="font-serif font-bold text-text leading-none block text-[clamp(30px,8vw,48px)]"
          >
            {{ SITE_NAME }}
          </span>
          <span class="text-sm text-muted font-mono">All systems operational</span>
        </div>

        <nav
          aria-label="Social"
          class="grid grid-cols-2 sm:grid-cols-4 gap-x-8 sm:gap-x-12 gap-y-3 font-mono text-label-md uppercase tracking-widest"
        >
          <a
            v-for="link in SOCIAL_LINKS"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="text-muted hover:text-primary-deep transition-colors duration-200"
            :aria-label="link.label"
          >
            {{ link.label }}
          </a>
          <NuxtLink
            to="/projects"
            class="text-muted hover:text-primary-deep transition-colors duration-200"
          >
            Projects
          </NuxtLink>
          <NuxtLink
            to="/tools"
            class="text-muted hover:text-primary-deep transition-colors duration-200"
          >
            Tools
          </NuxtLink>
        </nav>
      </div>

      <!-- Bottom row: copyright + tech stamp. -->
      <div
        class="pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-3 font-mono text-label-sm text-muted"
      >
        <p class="text-center md:text-left">© {{ currentYear }} {{ SITE_NAME }} · Built for the high-performance web.</p>
        <p class="flex items-center gap-2" aria-hidden="true">
          <span>Nuxt</span>
          <span class="text-outline-variant" aria-hidden="true">·</span>
          <span>Vue</span>
          <span class="text-outline-variant" aria-hidden="true">·</span>
          <span>Tailwind</span>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer--compact {
  margin-top: 40px;
}

.site-footer--compact .site-footer__inner {
  padding-top: 48px;
  padding-bottom: 48px;
}
</style>
