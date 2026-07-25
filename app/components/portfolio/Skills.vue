<script setup lang="ts">
/**
 * Skills — Core Stack glass-card layout (Organic Professional).
 *
 * Replaces the previous "categorized badge cluster" with the example's
 * 3-up glass-panel card row. Each card carries:
 *
 *   • Mono icon glyph (layers/database/cloud) — inline SVG, no
 *     external Material Symbols runtime.
 *   • Title (h3) + section description.
 *   • "Production Ready" status pill upper-right.
 *   • Tech tag pill list.
 *   • Hover lift + border-primary accent (per `.tonal-card` class).
 *
 * Heading + cards stagger as children of the surrounding
 * `.reveal-up.is-revealed` wrapper in pages/index.vue.
 */
import type { SkillGroup } from '~~/shared/types'

interface Props {
  /** Skill categories sorted/aggregated by the calling page. */
  groups: readonly SkillGroup[]
}

defineProps<Props>()

/**
 * Map a SkillGroup category to a Material-style icon glyph for the
 * card header. Returns the SVG path for the icon + an aria-hint.
 * Falls back to a generic "stack" glyph when the category is unknown.
 */
function iconForCategory(category: string): { hint: string; path: string } {
  const c = category.toLowerCase()
  if (c.includes('frontend') || c.includes('front')) {
    return {
      hint: 'layers',
      path: 'M3 6l9-4 9 4-9 4-9-4zm0 6l9 4 9-4M3 18l9 4 9-4',
    }
  }
  if (c.includes('tooling')) {
    return {
      hint: 'database',
      path: 'M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3v12c0 1.66-3.58 3-8 3s-8-1.34-8-3V6zm0 6c0 1.66 3.58 3 8 3s8-1.34 8-3',
    }
  }
  if (c.includes('practice') || c.includes('practices') || c.includes('cloud') || c.includes('ops')) {
    return {
      hint: 'cloud',
      path: 'M6 19a4 4 0 010-8 6 6 0 0111.5-1.5A4.5 4.5 0 0118 19H6z',
    }
  }
  return {
    hint: 'stack',
    path: 'M3 5h18v3H3V5zm0 6h18v3H3v-3zm0 6h18v3H3v-3z',
  }
}

/**
 * Editorial copy per category. Single sentence per card; tone matches
 * the example's "Production-ready" voice.
 */
function descriptionFor(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('frontend')) {
    return 'Type-safe interfaces and reactive architectures built for scale, accessibility, and editorial rhythm.'
  }
  if (c.includes('tooling')) {
    return 'Test infrastructure that makes regressions visible — visual, axe, and unit-test layers.'
  }
  if (c.includes('practice') || c.includes('practices')) {
    return 'Operational habits: design-token stewardship, performance budgets, accessibility audits.'
  }
  if (c.includes('backend')) {
    return 'Memory-safe systems focusing on low-latency data processing and high concurrency.'
  }
  if (c.includes('cloud')) {
    return 'Scalable container orchestration and automated CI/CD pipelines.'
  }
  return `A focused surface for the ${category} concern — every item is in production somewhere.`
}
</script>

<template>
  <section
    id="skills"
    aria-labelledby="skills-heading"
    class="flex flex-col gap-12"
  >
    <header
      class="text-center flex flex-col gap-4 max-w-[640px] mx-auto"
    >
      <h2
        id="skills-heading"
        data-stagger="0"
        class="font-serif font-bold text-text reveal-up is-revealed text-headline-xl"
      >
        Core <span class="text-primary">Stack</span>
      </h2>
      <p
        data-stagger="1"
        class="font-sans text-body-md text-muted reveal-up is-revealed"
      >
        Purpose-built technologies for modern product delivery — verified in
        production across the last five years.
      </p>
    </header>

    <div class="grid md:grid-cols-3 gap-8">
      <article
        v-for="(group, idx) in groups.slice(0, 3)"
        :key="group.category"
        :data-stagger="Math.min(idx + 2, 4)"
        class="tonal-card p-8 flex flex-col gap-6 reveal-up is-revealed"
      >
        <header class="flex justify-between items-start gap-4">
          <svg
            class="text-primary w-10 h-10"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            :aria-label="iconForCategory(group.category).hint"
            role="img"
          >
            <path :d="iconForCategory(group.category).path" />
          </svg>
          <span
            class="font-mono text-label-sm uppercase tracking-widest text-primary border border-primary/40 rounded-md px-2 py-1"
          >
            Production Ready
          </span>
        </header>

        <div>
          <h3 class="font-serif text-headline-lg font-bold text-text mb-2">
            {{ group.category }}
          </h3>
          <p class="font-sans text-body-sm text-muted leading-relaxed">
            {{ descriptionFor(group.category) }}
          </p>
        </div>

        <ul class="flex flex-wrap gap-2 mt-auto">
          <li v-for="item in group.items" :key="item">
            <span class="tech-pill">{{ item }}</span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
