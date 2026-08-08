<script setup lang="ts">
/**
 * Hero — Organic Professional, full-viewport, status-led.
 *
 * `data-section-id="hero"` drives scroll-spy so the matching `nav-link`
 * gets `data-active="true"`.
 */
import { ref } from 'vue'

import HeroDashboard from '~~/app/components/portfolio/HeroDashboard.vue'
import LinkButton from '~~/app/components/ui/LinkButton.vue'
import { useParallax } from '~~/app/composables/useParallax'

interface Props {
  name?: string
  /** Role/eyebrow — combined with `name` in the sr-only headline so ATs read
   *  "Name — Role" as the document outline, not just the visible display headline. */
  eyebrow?: string
  lead: string
  status?: string
  primaryTo: string
  primaryLabel: string
  secondaryTo?: string
  secondaryLabel?: string
}

withDefaults(defineProps<Props>(), {
  name: '',
  eyebrow: '',
  status: 'Available for new work',
  secondaryTo: '',
  secondaryLabel: '',
})

const heroBgRef = ref<HTMLElement | null>(null)
useParallax(heroBgRef, 0.35)
</script>

<template>
  <section
    id="hero"
    data-section-id="hero"
    aria-labelledby="hero-heading"
    class="relative min-h-[100dvh] flex items-center overflow-hidden"
  >
    <!-- Masked + low opacity so the bg reads as ambient texture rather than content. -->
    <img
      ref="heroBgRef"
      src="/hero-bg.webp"
      alt=""
      aria-hidden="true"
      class="hero-bg-image object-cover w-full h-full"
      fetchpriority="low"
      decoding="async"
      loading="lazy"
    >

    <!-- Combines name + eyebrow so ATs read "Name — Role" and the document outline
         stays anchored on the developer identity rather than the visible display headline. -->
    <h1
      v-if="name || eyebrow"
      id="hero-heading"
      class="sr-only"
    >
      <template v-if="name">{{ name }}</template>
      <template v-if="eyebrow"> — {{ eyebrow }}</template>
    </h1>

    <div
      class="relative mx-auto w-full max-w-[var(--spacing-container)] px-6 md:px-12 lg:px-16 py-24 z-10"
    >
      <div
        class="grid lg:grid-cols-2 gap-12 lg:gap-16 lg:items-center"
      >
        <div class="flex flex-col gap-8 md:gap-10 max-w-[640px]">
          <span
            class="status-pill reveal-up is-revealed self-start"
            style="animation-delay: 100ms"
          >
            <span class="status-dot" aria-hidden="true" />
            {{ status }}
          </span>

          <h2
            class="font-serif font-bold text-text leading-[1.05] tracking-tight reveal-up is-revealed text-[clamp(36px,7vw,72px)]"
            style="animation-delay: 300ms"
          >
            <slot />
          </h2>

          <p
            v-if="lead"
            class="font-sans text-body-lg text-muted leading-[1.70] reveal-up is-revealed"
            style="animation-delay: 500ms"
          >
            {{ lead }}
          </p>

          <div
            class="flex flex-wrap items-center gap-3 pt-4 reveal-up is-revealed"
            style="animation-delay: 700ms"
          >
            <LinkButton
              :to="primaryTo"
              variant="primary"
              size="lg"
              class="rounded-lg"
            >
              {{ primaryLabel }}
            </LinkButton>
            <LinkButton
              v-if="secondaryTo && secondaryLabel"
              :to="secondaryTo"
              variant="secondary"
              size="lg"
              class="rounded-lg"
            >
              {{ secondaryLabel }}
            </LinkButton>
          </div>
        </div>

        <!-- 900ms delay is the last beat of the inline reveal cascade
             (100/300/500/700/900) so the panel lands after the CTA cluster. -->
        <div class="hidden lg:block reveal-up is-revealed" style="animation-delay: 900ms">
          <HeroDashboard />
        </div>
      </div>
    </div>
  </section>
</template>
