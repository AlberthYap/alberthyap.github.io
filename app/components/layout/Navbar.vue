<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import LinkButton from '~~/app/components/ui/LinkButton.vue'
import PageContainer from '~~/app/components/layout/PageContainer.vue'

import { NAV_LINKS, SITE_NAME } from '~~/shared/constants/site'

const route = useRoute()
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

// DESIGN.md §6.1: Navbar transparent at top, gains background once scrollY ≥ 16 px.
function onScroll() {
  isScrolled.value = window.scrollY >= 16
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScroll)
  }
})

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  // Anchors like '/#about' never highlight via path matching.
  if (to.startsWith('/#')) return false
  return route.path === to || route.path.startsWith(`${to}/`)
}

function closeMobile() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 h-16 w-full border-b border-transparent',
      'transition-colors duration-[var(--motion-small)] ease-[var(--motion-easing)]',
      isScrolled
        ? 'bg-[color-mix(in_oklab,var(--color-bg)_85%,transparent)] backdrop-blur-md border-border'
        : 'bg-transparent',
    ]"
  >
    <PageContainer class="flex h-full items-center justify-between gap-4">
      <NuxtLink
        to="/"
        :aria-label="`${SITE_NAME} — home`"
        class="font-semibold text-text hover:text-primary transition-colors"
      >
        {{ SITE_NAME }}
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-8" aria-label="Primary">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="link.to"
          class="text-sm font-medium text-muted hover:text-primary transition-colors"
          :class="{ 'text-primary': isActive(link.to) }"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="hidden md:block">
        <LinkButton to="#contact" variant="primary" size="sm">
          Get in touch
        </LinkButton>
      </div>

      <button
        type="button"
        class="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-text hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="mobile-menu"
        :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <span aria-hidden="true">{{ isMobileMenuOpen ? '×' : '☰' }}</span>
      </button>
    </PageContainer>

    <div
      v-if="isMobileMenuOpen"
      id="mobile-menu"
      class="md:hidden border-t border-border bg-bg"
    >
      <PageContainer class="flex flex-col gap-1 py-4">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="link.to"
          class="block rounded-md px-3 py-2 text-base text-muted hover:bg-surface hover:text-primary"
          :class="{ 'text-primary bg-surface': isActive(link.to) }"
          @click="closeMobile"
        >
          {{ link.label }}
        </NuxtLink>
        <LinkButton
          to="#contact"
          variant="primary"
          size="md"
          class="mt-2 w-full justify-center"
          @click="closeMobile"
        >
          Get in touch
        </LinkButton>
      </PageContainer>
    </div>
  </header>
</template>
