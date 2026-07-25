<script setup lang="ts">
/**
 * About — Editorial narrative section (Organic Professional).
 *
 * Same 5-beat storytelling arc as before (eyebrow kicker → lead → 3
 * highlights → footnote) so the data-stagger contract (indices 0..5)
 * is preserved for downstream tests.
 *
 * Visual treatment updated to use the Literata + Nunito Sans pairing:
 * a mono uppercase kicker (cap height meets the design's small-label
 * rhythm) sits above the body, then a sans lead flows underneath.
 */
import Heading from '~~/app/components/ui/Heading.vue'

interface Props {
  /** Lead paragraph. */
  bio: string
  /** Full body document (from Nuxt Content) — rendered via ContentRenderer below the tagline. */
  bodyDoc?: object | null
  /** Portrait image — monogram fallback shown when absent. */
  portrait?: { src: string; alt: string } | null
  /** Mono caption above the lead. Defaults to "About". */
  eyebrow?: string
  /** Bulleted highlight list. */
  highlights?: readonly string[]
  /** Closing line for the section. */
  footnote?: string
}

withDefaults(defineProps<Props>(), {
  eyebrow: 'Now',
  bodyDoc: null,
  portrait: null,
  highlights: () => [],
  footnote: '',
})
</script>

<template>
  <section
    id="about"
    aria-labelledby="about-heading"
    class="flex flex-col gap-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:items-start"
  >
    <!-- Voice-control anchor. -->
    <Heading id="about-heading" as="h2" class="sr-only">About</Heading>

    <!-- Portrait tile — square rounded frame, monogram fallback when no image. -->
    <div class="w-full max-w-[200px] sm:max-w-[240px] lg:max-w-none mx-auto lg:mx-0" data-stagger="0">
      <div class="portrait-tile w-full">
        <img v-if="portrait" :src="portrait.src" :alt="portrait.alt" class="w-full h-full object-cover" />
        <span v-else class="initials">AY</span>
      </div>
    </div>

    <!-- Text column -->
    <div class="flex flex-col gap-6">

    <p
      v-if="eyebrow"
      data-stagger="0"
      class="font-mono text-label-sm uppercase tracking-[0.05em] text-primary"
    >
      {{ eyebrow }}
    </p>

    <p
      data-stagger="1"
      class="text-text text-body-lg leading-[1.70]"
    >
      {{ bio }}
    </p>

    <div
      v-if="bodyDoc"
      data-stagger="1"
      class="mt-6 text-text text-body-lg leading-[1.70] flex flex-col gap-lg [&_>p]:m-0"
    >
      <ContentRenderer :value="bodyDoc" />
    </div>

    <ul
      v-if="highlights.length"
      class="flex flex-col gap-3 pt-6"
    >
      <li
        v-for="(item, idx) in highlights"
        :key="item"
        :data-stagger="2 + idx"
        class="flex items-start gap-3 text-text"
      >
        <span aria-hidden="true" class="font-mono text-primary shrink-0">—</span>
        <span>{{ item }}</span>
      </li>
    </ul>

    <p
      v-if="footnote"
      data-stagger="5"
      class="text-muted text-body-sm pt-4 mt-2 border-t border-border"
    >
      {{ footnote }}
    </p>

    </div>
  </section>
</template>
