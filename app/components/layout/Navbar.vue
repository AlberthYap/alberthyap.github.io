<script setup lang="ts">
/**
 * Navbar — Floating glass-panel pill (Organic Professional design).
 *
 * Pattern from example.html: a centered `rounded-full` pill at the
 * top of the viewport, capped to ~95% width and a generous max-width
 * container (`container-max` = 1200 px). The pill stays fixed so it
 * always floats above grid + glow decorations.
 *
 * Compared to the old sticky-banner nav:
 *   • Brand stays left, links stay right, CTA becomes a primary pill.
 *   • All chrome shares one `.glass-panel` rather than per-link borders.
 *   • Mobile collapses to a hamburger that opens an inline drawer
 *     BELOW the pill (still scrollable, doesn't break the floating
 *     gesture).
 *
 * Scroll-spy is preserved via `useInjectActiveSection` so the matching
 * `data-section-id` link gets `data-active="true"` (nav-link pin).
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import ThemeToggle from '~~/app/components/ui/ThemeToggle.vue'

import { NAV_LINKS, SITE_NAME } from '~~/shared/constants/site'
import { useInjectActiveSection } from '~~/app/composables/useActiveSection'

const route = useRoute()
const activeSection = useInjectActiveSection()
const isMobileMenuOpen = ref(false)

/** Pull the section id out of a hash-anchor `to` like `/#about` → `about`. */
function sectionIdFrom(to: string): string | null {
  const hashIdx = to.indexOf('#')
  if (hashIdx === -1) return null
  const raw = to.slice(hashIdx + 1)
  return raw.length === 0 ? null : raw
}

/**
 * Active-state predicate. Lights up when the user is on `/` AND the
 * scroll-spy says this section's id is currently dominant.
 */
function navLinkActive(to: string): boolean {
  if (route.path !== '/') return false
  const id = sectionIdFrom(to)
  return id !== null && activeSection.currentSectionId.value === id
}

function navLinkAriaCurrent(to: string): 'location' | undefined {
  return navLinkActive(to) ? 'location' : undefined
}

function closeMobile() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header class="fixed inset-x-0 top-4 z-50 px-4 pointer-events-none">
    <!-- Pill nav — centered, 95% wide-ish, capped at container-max. pointer-events:auto
         on the pill itself so the surrounding px-4 gutter doesn't capture clicks. -->
    <div
      class="glass-panel mx-auto flex w-full max-w-[var(--spacing-container)] items-center justify-between gap-4 rounded-full px-6 py-3 pointer-events-auto"
    >
      <!-- Brand — AY monogram + visible wordmark. Monogram stays at every
           viewport; the wordmark surfaces from `sm:` upward so the pill
           on small phones stays minimal (monogram + theme + hamburger,
           no crowding). Both pieces share the home link's aria-label,
           so screen readers hear the full brand exactly once. -->
      <NuxtLink
        to="/"
        :aria-label="`${SITE_NAME} — home`"
        class="flex items-center gap-3 shrink-0 group"
      >
        <picture>
          <!-- WebP primary; <img> below is the PNG fallback for older browsers. -->
          <source srcset="/ay-monogram.webp" type="image/webp" />
          <img
            src="/ay-monogram.png"
            alt=""
            class="h-[40px] w-auto
                   transition-all duration-[var(--motion-small)] ease-[var(--motion-easing)]
                   group-hover:scale-105 group-active:scale-95"
          />
        </picture>
        <span
          class="hidden sm:block font-serif font-semibold text-body-md leading-none text-text tracking-tight whitespace-nowrap"
          data-testid="brand-wordmark"
        >
          {{ SITE_NAME }}
        </span>
      </NuxtLink>

      <nav
        class="hidden md:flex items-center gap-8 font-mono text-label-md uppercase tracking-widest"
        aria-label="Primary"
      >
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="link.to"
          class="nav-link text-muted hover:text-text transition-colors duration-200"
          :data-active="navLinkActive(link.to) ? 'true' : 'false'"
          :aria-current="navLinkAriaCurrent(link.to)"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Right cluster: theme toggle (always visible) + hamburger (mobile only). -->
      <div class="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          class="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="mobile-menu"
          :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <span aria-hidden="true">{{ isMobileMenuOpen ? '×' : '☰' }}</span>
        </button>
      </div>
    </div>

    <!-- Mobile drawer — slides out below the pill at md-; nav links only. -->
    <div
      v-if="isMobileMenuOpen"
      id="mobile-menu"
      class="md:hidden glass-panel mx-auto mt-2 w-full max-w-[var(--spacing-container)] rounded-2xl p-4 pointer-events-auto"
    >
      <nav
        class="flex flex-col gap-1 font-mono text-label-md uppercase tracking-widest"
        aria-label="Primary mobile"
      >
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="link.to"
          class="nav-link block rounded-md px-3 py-2 text-muted hover:text-text hover:bg-surface-container-high"
          :data-active="navLinkActive(link.to) ? 'true' : 'false'"
          :aria-current="navLinkAriaCurrent(link.to)"
          @click="closeMobile"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
