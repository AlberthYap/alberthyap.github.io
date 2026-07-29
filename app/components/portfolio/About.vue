<script setup lang="ts">
/**
 * About — Editorial Calm (Organic Professional).
 *
 * Two-column editorial layout on desktop (portrait left, text right).
 * Content beats flow as plain typography: name → tagline → body →
 * highlight stat cards → footnote. No decorative lines, no eyebrow
 * — clean text hierarchy with tonal-cards reserved for highlights.
 */
interface Props {
  /** Full name displayed as the section heading. */
  name?: string
  /** Short role tagline — appears directly below name. */
  bio: string
  /** Pre-rendered HTML from the build-time snapshot. Empty string omits the block. */
  bodyHtml?: string
  /** Portrait image (optional — shows initials fallback). */
  portrait?: { src: string; alt: string } | null
  /** Key highlights shown as bullet-point list with green dots. */
  highlights?: readonly string[]
  /** Footer postscript prefixed with em dash (editorial style). */
  footnote?: string
}

withDefaults(defineProps<Props>(), {
  name: '',
  bodyHtml: '',
  portrait: null,
  highlights: () => [],
  footnote: '',
})
</script>

<template>
  <section
    id="about"
    aria-labelledby="about-heading"
    class="flex flex-col gap-8"
  >
    <div data-stagger="0" class="flex flex-col gap-2 text-center items-center">
      <p class="font-mono text-label-sm uppercase tracking-widest text-primary-deep">
        About
      </p>
      <h2
        id="about-heading"
        class="font-headline font-bold text-text text-headline-xl leading-tight"
      >
        About <span class="text-primary-deep">Me</span>
      </h2>
    </div>

    <div class="flex flex-col gap-6 md:grid md:grid-cols-[280px_1fr] md:gap-14 md:items-center">
    <!-- Portrait — square rounded frame, left column on md+ -->
    <div
      class="w-full max-w-[200px] sm:max-w-[240px] md:max-w-none mx-auto md:mx-0"
      data-stagger="0"
    >
      <div class="portrait-tile w-full">
        <img
          v-if="portrait"
          :src="portrait.src"
          :alt="portrait.alt"
          class="w-full h-full object-cover"
        />
        <span v-else class="initials">AY</span>
      </div>
    </div>

    <!-- Text column — right column on md+, generous spacing -->
    <div class="flex flex-col gap-8">
      <!-- Name + role tagline — staggered with portrait -->
      <div data-stagger="0" class="flex flex-col gap-2">
        <h3
          v-if="name"
          class="font-serif text-headline-lg font-bold text-text leading-[1.1] tracking-[-0.02em]"
        >
          {{ name }}
        </h3>
        <p class="text-muted text-body-lg leading-[1.55]">
          {{ bio }}
        </p>
      </div>

      <!-- Body narrative — `[&_>p]:m-0` so parent `gap-6` controls spacing -->
      <div
        v-if="bodyHtml"
        data-stagger="1"
        class="text-text text-body-md leading-[1.75] flex flex-col gap-6 [&_>p]:m-0"
        v-html="bodyHtml"
      />

      <!-- Highlight accent cards — tint background + body-md text size
           matches body paragraph above for visual continuity -->
      <div
        v-if="highlights.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        <div
          v-for="(item, idx) in highlights"
          :key="item"
          :data-stagger="2 + Math.min(idx, 3)"
          class="flex flex-col gap-4 p-5 rounded-xl border border-primary/15 bg-primary-soft transition-all duration-[var(--motion-small)] ease-[var(--motion-easing)] hover:-translate-y-[2px] hover:border-primary/30"
        >
          <!-- Accent bar group — subtle green markers at top-left -->
          <div
            aria-hidden="true"
            class="flex items-center gap-2"
          >
            <span class="block w-8 h-[3px] rounded-full bg-primary/60" />
            <span class="block w-2 h-[3px] rounded-full bg-primary/30" />
          </div>
          <!-- Text uses body-md (same as body paragraphs above) so the
               cards feel like a natural extension of the narrative -->
          <p class="text-text text-body-md leading-[1.65]">
            {{ item }}
          </p>
        </div>
      </div>

      <!-- Footnote CTA — larger size, primary color for emphasis -->
      <p
        v-if="footnote"
        data-stagger="5"
        class="text-text text-body-md pt-6 mt-2 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <span>{{ footnote }}</span>
        <span class="text-primary-deep text-body-sm font-mono tracking-[0.04em]">
          Let's build →
        </span>
      </p>
    </div>
    </div>
  </section>
</template>
