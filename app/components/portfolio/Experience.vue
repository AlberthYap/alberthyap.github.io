<script setup lang="ts">
/**
 * Experience — vertical timeline of role entries.
 *
 * Reads the `experience` content collection (declared in `content.config.ts`)
 * and renders each entry as a node on a single vertical timeline. The
 * collection is already order-by-startDate-DESC by the calling page, so the
 * most recent role appears at the top.
 *
 * Each entry surfaces:
 *   • company · role (the headline)
 *   • period (formatted as `YYYY-MM` → "Nov 2023" — present as "Present")
 *   • summary (one-liner from frontmatter)
 *   • achievements (bullet point list)
 *   • technologies (badge chips)
 *
 * Animation: the section wrapper div in pages/index.vue carries
 * `class="reveal-up" :class="{ is-revealed: experienceStep }"`. Header +
 * timeline-rail animate with the parent; timeline entries (`<li>`) emit
 * `data-stagger="0|1|2"` so each entry falls in sequence after the parent
 * reveals.
 */
import { computed } from 'vue'

import type { Experience } from '~~/shared/types'

import Heading from '~~/app/components/ui/Heading.vue'

import { techIcon } from '~~/app/utils/techIcons'

interface Props {
  /** Experience collection entries, sorted (newest first by the caller). */
  experiences: readonly Experience[]
}

const props = defineProps<Props>()

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatMonth(iso: string | 'present'): string {
  if (iso === 'present') return 'Present'
  const [y, m] = iso.split('-')
  if (!y || !m) return iso
  const monthIdx = Number(m) - 1
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return iso
  const monthName = SHORT_MONTHS[monthIdx]
  if (!monthName) return iso
  return `${monthName} ${y}`
}

interface Entry {
  experience: Experience
  period: string
  isCurrent: boolean
}

const entries = computed<Entry[]>(() =>
  props.experiences.map((e) => ({
    experience: e,
    period: `${formatMonth(e.startDate)} — ${formatMonth(e.endDate)}`,
    isCurrent: e.endDate === 'present',
  })),
)
</script>

<template>
  <section
    id="experience"
    aria-labelledby="experience-heading"
    class="flex flex-col gap-10"
  >
    <div class="flex items-end justify-between gap-4">
      <Heading id="experience-heading" as="h2">Experience</Heading>
      <p class="text-sm text-muted whitespace-nowrap">Building since 2021</p>
    </div>

    <ol class="relative pl-8 md:pl-10">
      <!-- Vertical rail -->
      <span
        aria-hidden="true"
        class="absolute left-3 md:left-4 top-2 bottom-2 w-px bg-border-strong"
      />

      <li
        v-for="(entry, idx) in entries"
        :key="entry.experience.slug"
        :data-stagger="Math.min(idx, 4)"
        class="relative pb-10 last:pb-0"
      >
        <!-- Timeline dot -->
        <span
          aria-hidden="true"
          class="absolute -left-[26px] md:-left-[34px] top-2 inline-block h-3 w-3 rounded-full"
          :class="entry.isCurrent ? 'bg-primary ring-4 ring-primary-soft' : 'bg-muted ring-2 ring-surface'"
        />

        <div class="flex flex-col gap-3">
          <!-- Headline: role · company -->
          <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Heading as="h3" size="h4">
              {{ entry.experience.role }}
            </Heading>
            <span class="text-muted text-sm">·</span>
            <p class="font-medium text-text m-0">
              {{ entry.experience.company }}
            </p>
          </header>

          <!-- Period -->
          <p class="m-0 font-mono text-caption text-muted tracking-wide">
            {{ entry.period }}
          </p>

          <!-- Description (summary from frontmatter) -->
          <p class="m-0 text-text text-body leading-relaxed">
            {{ entry.experience.summary }}
          </p>

          <!-- Achievements bullet list -->
          <ul
            v-if="entry.experience.achievements.length"
            class="flex flex-col gap-2 mt-1"
          >
            <li
              v-for="(achievement, aidx) in entry.experience.achievements"
              :key="`${entry.experience.slug}-ach-${aidx}`"
              class="flex items-start gap-2 text-sm text-text/85 leading-relaxed"
            >
              <span class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {{ achievement }}
            </li>
          </ul>

          <!-- Technologies as skill chips (style matches Skills.vue) -->
          <div
            v-if="entry.experience.technologies.length"
            class="flex flex-wrap gap-1.5 mt-1"
          >
            <span
              v-for="(tech, tidx) in entry.experience.technologies"
              :key="`${entry.experience.slug}-tech-${tidx}`"
              class="skill-chip gap-1.5"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="techIcon(tech)" />
              </svg>
              {{ tech }}
            </span>
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>
