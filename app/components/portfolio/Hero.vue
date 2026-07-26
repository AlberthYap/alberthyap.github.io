<script setup lang="ts">
/**
 * Hero — Organic Professional edition (full-viewport, status-led).
 *
 * Pattern from example.html:
 *   • Status pill ("Available for Contracts") with a pulsing
 *     primary-color dot + uppercase mono label.
 *   • Two-line full-serif headline: a base word + a <span class="text-primary">
 *     coloured second line. Tagline / lead carries a quieter tone.
 *   • Two CTAs: one primary fill, one glass-border secondary.
 *   • Brand wordmark can carry the brand line via slot.
 *
 * Right side (NEW): `HeroDashboard` 3D-tilted glass-panel mockup
 * reproducing example.html's `portfolio_v2`. Mounted on lg+
 * via the `hidden lg:block` wrapper; mobile readers see only the
 * text column (no decorative chrome stealing reading time).
 *
 * Background: image.png as a faint, masked, blur-tinted overlay
 * (`opacity: 0.10`, radial mask + 0.5 px blur). Centered + masked so
 * the image bleeds off the edges — never competes with copy.
 *
 * What was DROPPED from v4.1:
 *   • `.portrait-tile` + initials fallback. The new design is
 *     text-led, not portrait-led; the example has no portrait.
 *   • `useTypewriter` on the lead. The Organic Professional language
 *     prioritises stillness; typewriter reads as techy/gimmicky.
 *   • `@openteq/scroll-indicator` chevron. Removed because the hero
 *     no longer follows the lead-with-stack anchor (sections live
 *     below). The `Core Stack` is the next visual surface.
 *
 * Section id `data-section-id="hero"` is preserved so scroll-spy and
 * the nav-link pin still light up when the user is on the hero.
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

        <!-- RIGHT COLUMN — dashboard mockup (hidden <lg). The grid
             template above uses lg:grid-cols-2 so the panel can never
             widen past its column and force horizontal scroll. The
             inline 900 ms animation-delay sits at the end of
             Hero.vue's existing inline cascade (100 / 300 / 500 /
             700 / 900 ms) for a consistent reveal cadence across the
             hero. The wrapper itself carries both reveal-up and
             is-revealed and animates as the cascade target;
             HeroDashboard has no stagger attribute of its own and
             therefore appears as part of the column's fade, not as
             a self-animating panel. -->
        <div class="hidden lg:block reveal-up is-revealed" style="animation-delay: 900ms">
          <HeroDashboard />
        </div>
      </div>
    </div>
  </section>
</template>
