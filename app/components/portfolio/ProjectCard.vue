<script setup lang="ts">
/**
 * ProjectCard — Vertical full-bleed cover card (Organic Professional).
 *
 * Pattern: a cover image fills the top (`aspect-video`), and the content
 * stack sits below. Two layouts via the `compact` prop:
 *
 *   - `compact` (home page gallery): cover + title + summary + URL pill
 *   - full (`/projects` index): cover + status + description + metrics +
 *     tech pills + CTAs
 *
 * a11y / interaction:
 *   - Root is `<article>`, NOT an `<a>` so the cover, title, and CTAs
 *     can each be their own focusable element (no invalid nesting).
 *   - Cover image is a `<NuxtLink>` to the project page (primary visual
 *     affordance for "click to read"). Title duplicates that link for
 *     readers who scan by text. URL pill is an external `<a>`.
 *   - External `liveUrl` / `repoUrl` always carry
 *     `target="_blank" rel="noopener noreferrer"` (security baseline).
 *
 * Status label maps `project.status` → human string (`shipped` →
 * `Active · Production`; `in-progress` → `In Progress`; → `Archived`).
 * Pass `showStatus={false}` on the home page so the gallery is just
 * image + title + URL.
 */
import { computed } from 'vue'

import type { Project } from '~~/shared/types'

import LinkButton from '~~/app/components/ui/LinkButton.vue'

interface Props {
  /** Source project record from Nuxt Content collection. */
  project: Project
  /** Toggle the "Active" badge when status === 'shipped'. Default true. */
  showStatus?: boolean
  /** Compact mode — cover image + title overlay only (home page gallery). */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showStatus: true,
  compact: false,
})

/**
 * Format a status badge label.
 *   'shipped' → 'Active · Production'
 *   'in-progress' → 'In Progress'
 *   anything else → 'Archived'
 *
 * Pure function (no side-effects on `props`); computed at render.
 */
function statusLabel(): string {
  if (props.project.status === 'shipped') return 'Active · Production'
  if (props.project.status === 'in-progress') return 'In Progress'
  return 'Archived'
}
const displayUrl = computed<string>(() => {
  const url = props.project.liveUrl || props.project.repoUrl
  return url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''
})
</script>

<template>
  <article
    class="tonal-card group flex flex-col overflow-hidden reveal-up is-revealed"
  >
    <!-- Content stack — compact (home gallery) or full (projects index) -->
    <template v-if="compact">
      <!-- Compact card: cover image (clickable → detail page) + title + URL (clickable → external) -->
      <!-- Cover image → links to project detail page -->
      <NuxtLink
        :to="`/projects/${props.project.slug}`"
        :aria-label="`Open ${props.project.title} case study`"
        class="relative block aspect-video overflow-hidden bg-surface-container"
      >
        <img
          v-if="props.project.thumbnail"
          :src="props.project.thumbnail"
          :alt="`${props.project.title} cover`"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        >
        <div
          v-else
          class="w-full h-full bg-surface-container-high flex items-center justify-center font-serif text-headline-lg text-muted/40"
          aria-hidden="true"
        >
          {{ props.project.title.slice(0, 2).toUpperCase() }}
        </div>
      </NuxtLink>

      <!-- Content below image: title + description + clickable URL -->
      <div class="p-4 flex flex-col gap-1.5 grow">
        <NuxtLink
          :to="`/projects/${props.project.slug}`"
          class="block"
        >
          <h3 class="font-serif text-headline-sm font-bold text-text leading-tight hover:text-primary-deep transition-colors">
            {{ props.project.title }}
          </h3>
        </NuxtLink>
        <p class="font-sans text-body-sm text-muted leading-relaxed">
          {{ props.project.description }}
        </p>
        <a
          v-if="props.project.liveUrl || props.project.repoUrl"
          :href="props.project.liveUrl || props.project.repoUrl || undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-label-sm text-primary-deep hover:text-primary-deep/80 underline decoration-primary-deep/30 hover:decoration-primary-deep/60 transition-colors truncate mt-0.5 self-start"
        >
          {{ displayUrl }}
        </a>
      </div>
    </template>

    <template v-else>
      <!-- Full mode: cover image (clickable) + content stack -->
      <NuxtLink
        :to="`/projects/${props.project.slug}`"
        :aria-label="`Open ${props.project.title} case study`"
        class="relative block aspect-video overflow-hidden bg-surface-container"
      >
        <img
          v-if="props.project.thumbnail"
          :src="props.project.thumbnail"
          :alt="`${props.project.title} cover`"
          loading="lazy"
          class="w-full h-full object-cover aspect-video transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
        >
        <div
          v-else
          class="w-full h-full aspect-video bg-surface-container-high flex items-center justify-center font-serif text-headline-lg text-muted/40"
          aria-hidden="true"
        >
          {{ props.project.title.slice(0, 2).toUpperCase() }}
        </div>
        <div
          class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface-container/85 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </NuxtLink>

      <div class="p-6 md:p-8 flex flex-col gap-5 grow">
        <header class="flex items-center gap-3 flex-wrap">
          <h3 class="font-serif text-headline-md font-bold text-text leading-tight">
            {{ props.project.title }}
          </h3>
          <span
            v-if="props.showStatus"
            class="font-mono text-label-sm uppercase tracking-widest text-primary-deep bg-primary-soft border border-primary-deep/30 rounded px-2 py-1"
          >
            {{ statusLabel() }}
          </span>
        </header>

        <p class="font-sans text-body-md text-muted leading-relaxed">
          {{ props.project.description }}
        </p>

        <!-- Metrics strip -->
        <div
          v-if="props.project.metrics.length"
          class="grid grid-cols-2 gap-6 border-y border-outline-variant py-4"
        >
          <div
            v-for="m in props.project.metrics"
            :key="m.label"
            class="flex flex-col gap-1"
          >
            <span class="font-mono text-label-sm uppercase tracking-widest text-muted">
              {{ m.label }}
            </span>
            <span class="font-sans text-body-md text-primary-deep font-semibold">
              {{ m.value }}
            </span>
          </div>
        </div>

        <!-- Tech stack pills -->
        <ul
          v-if="props.project.technologies.length"
          class="flex flex-wrap gap-2"
        >
          <li v-for="t in props.project.technologies" :key="t.name">
            <span class="tech-pill">{{ t.name }}</span>
          </li>
        </ul>

        <!-- CTA cluster -->
        <div class="flex flex-wrap gap-3 pt-2 mt-auto">
          <LinkButton
            :to="`/projects/${props.project.slug}`"
            variant="primary"
            size="md"
            class="rounded-lg"
          >
            View case study
          </LinkButton>
          <LinkButton
            v-if="props.project.repoUrl"
            :to="props.project.repoUrl"
            variant="secondary"
            size="md"
            class="rounded-lg"
          >
            Source code
          </LinkButton>
        </div>
      </div>
    </template>
  </article>
</template>
