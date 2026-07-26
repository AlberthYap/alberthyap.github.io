<script setup lang="ts">
/**
 * Hero — Organic Professional, full-viewport, status-led.
 *
 * Two-column layout (text + dashboard mockup) on lg+; mobile readers
 * see only the text column so the decorative chrome does not steal
 * reading time. Drained state:
 *
 *   - Status pill (mono caption + decorative dot, default "Available
 *     for new work")
 *   - sr-only `<h1>` carrying name + eyebrow for AT document outline
 *   - Visible `<h2>` headline from the default slot at clamp(36,7vw,72)
 *     with optional primary-tinted span
 *   - Lead paragraph + two CTAs (LinkButton)
 *   - Right column: `HeroDashboard` panel (hidden <lg)
 *   - Faint background image overlay (decoration, aria-hidden)
 *
 * Per-section id `data-section-id="hero"` drives scroll-spy so the
 * matching `nav-link` in the navbar gets `data-active="true"`.
 */
import HeroDashboard from '~~/app/components/portfolio/HeroDashboard.vue'
import LinkButton from '~~/app/components/ui/LinkButton.vue'

interface Props {
  /** Display name used for the `sr-only` headline. */
  name?: string
  /** Role/eyebrow title — used in the `sr-only` headline so screen
   *  readers see "Name — Role" as the document outline, not just the
   *  visible display headline. */
  eyebrow?: string
  /** Lead paragraph below the headline. */
  lead: string
  /** Status pill label (e.g. "Available for Contracts"). */
  status?: string
  /** Primary CTA destination. */
  primaryTo: string
  /** Primary CTA label. */
  primaryLabel: string
  /** Secondary CTA destination. */
  secondaryTo?: string
  /** Secondary CTA label. */
  secondaryLabel?: string
}

withDefaults(defineProps<Props>(), {
  name: '',
  eyebrow: '',
  status: 'Available for new work',
  secondaryTo: '',
  secondaryLabel: '',
})
</script>

<template>
  <section
    id="hero"
    data-section-id="hero"
    aria-labelledby="hero-heading"
    class="relative min-h-screen flex items-center overflow-hidden"
  >
    <!-- Faint background image overlay (image.png from public/). Masked
         + low opacity so it reads as ambient texture, not content. -->
    <img
      src="/image.png"
      alt=""
      aria-hidden="true"
      class="hero-bg-image object-cover w-full h-full"
      fetchpriority="low"
      decoding="async"
    >

    <!-- Screen-reader-only headline carrying the developer identity. Combines
         name + eyebrow so ATs read "Name — Role" and the document outline
         stays anchored on the hero wording rather than the brand-new design
         word alone. The visible headline in the <h2> below still carries the
         display copy via the default slot. -->
    <h1
      v-if="name || eyebrow"
      id="hero-heading"
      class="sr-only"
    >
      <template v-if="name">{{ name }}</template>
      <template v-if="eyebrow"> — {{ eyebrow }}</template>
    </h1>

    <div
      class="relative mx-auto w-full max-w-[var(--spacing-container)] px-6 md:px-12 lg:px-16 py-32 z-10"
    >
      <div
        class="grid lg:grid-cols-2 gap-12 lg:gap-16 lg:items-center"
      >
        <!-- LEFT COLUMN — text surface (status pill + headline + lead + CTAs). -->
        <div class="flex flex-col gap-8 md:gap-10 max-w-[640px]">
          <!-- Status pill -->
          <span
            class="status-pill reveal-up is-revealed self-start"
            style="animation-delay: 100ms"
          >
            <span class="status-dot" aria-hidden="true" />
            {{ status }}
          </span>

          <!-- Headline — caller passes via default slot (e.g. "Building
               calm,<br><span class="text-primary">accessible systems</span>"). -->
          <h2
            data-section-id="hero-heading"
            class="font-serif font-bold text-text leading-[1.05] tracking-tight reveal-up is-revealed text-[clamp(36px,7vw,72px)]"
            style="animation-delay: 300ms"
          >
            <slot />
          </h2>

          <!-- Lead -->
          <p
            v-if="lead"
            class="font-sans text-body-lg text-muted leading-[1.70] reveal-up is-revealed"
            style="animation-delay: 500ms"
          >
            {{ lead }}
          </p>

          <!-- CTA cluster -->
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

        <!-- Right column — dashboard mockup, hidden below lg. Inline
             900 ms animation-delay is the last beat of the inline
             cascade (100/300/500/700/900) so the panel lands after the
             CTA cluster. -->
        <div class="hidden lg:block reveal-up is-revealed" style="animation-delay: 900ms">
          <HeroDashboard />
        </div>
      </div>
    </div>
  </section>
</template>
