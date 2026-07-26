<script setup lang="ts">
/**
 * Skills — Single column, category heading + chips with icons.
 * Uses shared techIcon() from ~/utils/techIcons.
 */
import type { SkillGroup } from '~~/shared/types'

import { techIcon } from '~~/app/utils/techIcons'

interface Props {
  groups: readonly SkillGroup[]
}

defineProps<Props>()
</script>

<template>
  <section
    id="skills"
    aria-labelledby="skills-heading"
    class="flex flex-col gap-10"
  >
    <header class="text-center flex flex-col gap-3 max-w-[640px] mx-auto">
      <h2
        id="skills-heading"
        data-stagger="0"
        class="font-serif font-bold text-text reveal-up is-revealed text-headline-xl"
      >
        Core <span class="text-primary">Stack</span>
      </h2>
      <p
        data-stagger="1"
        class="font-sans text-body-sm text-muted reveal-up is-revealed"
      >
        Building scalable web systems — backend engineering, APIs, and automation.
      </p>
    </header>

    <div class="flex flex-col gap-6">
      <div
        v-for="(group, idx) in groups"
        :key="group.category"
        :data-stagger="Math.min(idx + 2, 4)"
        class="flex flex-col gap-3 reveal-up is-revealed"
      >
        <h3
          class="font-mono text-label-sm uppercase tracking-widest text-primary font-semibold"
        >
          {{ group.category }}
        </h3>

        <ul class="flex flex-wrap gap-2">
          <li v-for="item in group.items" :key="item" class="skill-chip-wrapper">
            <span class="skill-chip gap-1.5" :title="group.category">
              <svg
                class="h-3.5 w-3.5 shrink-0 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="techIcon(item)" />
              </svg>
              <span>{{ item }}</span>
            </span>
            <span
              aria-hidden="true"
              class="skill-chip-tooltip"
            >{{ group.category }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
