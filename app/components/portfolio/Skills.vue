<script setup lang="ts">
import type { SkillGroup } from '~~/shared/constants/site'

import Badge from '~~/app/components/ui/Badge.vue'
import Heading from '~~/app/components/ui/Heading.vue'

interface Props {
  /** Skill categories. Each group renders with its title and a list of items. */
  groups: readonly SkillGroup[]
}

const props = defineProps<Props>()
</script>

<template>
  <section
    id="skills"
    aria-labelledby="skills-heading"
    class="flex flex-col gap-8"
  >
    <Heading id="skills-heading" as="h2">Skills</Heading>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="group in props.groups"
        :key="group.title"
        class="rounded-xl border border-border bg-surface p-6 flex flex-col gap-4"
      >
        <!-- Heading is sentence case per DESIGN.md §4.3. The mono muted font
             signals "category kicker" without resorting to uppercase. -->
        <Heading as="h3" size="h4" class="!text-muted !text-sm font-mono">
          {{ group.title }}
        </Heading>
        <ul class="flex flex-wrap gap-2">
          <li v-for="item in group.items" :key="item">
            <Badge variant="default">{{ item }}</Badge>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
