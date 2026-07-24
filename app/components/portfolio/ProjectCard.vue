<script setup lang="ts">
import type { Project } from '~~/shared/types'

import Badge from '~~/app/components/ui/Badge.vue'
import Card from '~~/app/components/ui/Card.vue'

interface Props {
  /** Source project record from Nuxt Content collection. */
  project: Project
  /** Toggle the "Featured" badge. Default true. */
  showFeatured?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFeatured: true,
})
</script>

<template>
  <Card :href="`/projects/${props.project.slug}`">
    <template #media>
      <img
        :src="props.project.thumbnail"
        :alt="`${props.project.title} preview`"
        loading="lazy"
        class="aspect-video w-full object-cover"
      >
    </template>
    <header class="mb-3 flex items-start justify-between gap-3">
      <h3 class="m-0 text-xl font-semibold text-text">
        {{ props.project.title }}
      </h3>
      <Badge v-if="props.showFeatured && props.project.featured" variant="tech">
        Featured
      </Badge>
    </header>
    <p class="m-0 mb-4 text-sm text-muted leading-relaxed line-clamp-3">
      {{ props.project.description }}
    </p>
    <template #footer>
      <ul class="flex flex-wrap gap-2">
        <li v-for="tag in props.project.tags" :key="tag">
          <Badge variant="default">{{ tag }}</Badge>
        </li>
      </ul>
    </template>
  </Card>
</template>
