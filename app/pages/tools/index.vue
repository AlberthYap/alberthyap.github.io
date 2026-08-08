<script setup lang="ts">
import { SITE_NAME } from '~~/shared/constants/site'

const { data: tools } = await useAsyncData(
  'all-tools',
  () => queryCollection('tools').order('title', 'ASC').all(),
)

useSeoMeta({
  title: `Tools | ${SITE_NAME}`,
  description: 'Browser-based utilities for developers and designers.',
})
</script>

<template>
  <PageContainer width="wide" class="py-section">
    <header class="flex flex-col gap-4 mb-12">
      <p class="font-mono text-label-sm uppercase tracking-widest text-primary-deep">
        Utilities
      </p>
      <h1 class="font-serif font-bold text-text text-display leading-none">
        Browser <span class="text-primary-deep">tools</span>
      </h1>
      <p class="text-muted text-body-md max-w-prose">
        Browser-based utilities. No data leaves your machine — everything runs locally.
      </p>
    </header>
    <div
      v-if="tools && tools.length"
      class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      <Card
        v-for="tool in tools"
        :key="tool.slug"
        :href="`/tools/${tool.slug}`"
      >
        <header class="flex items-start justify-between gap-3 mb-3">
          <h2 class="font-serif text-headline-md font-bold text-text">
            {{ tool.title }}
          </h2>
          <Badge v-if="tool.featured" variant="tech">Featured</Badge>
        </header>
        <p class="text-sm text-muted leading-relaxed line-clamp-3 mb-4">
          {{ tool.description }}
        </p>
        <template #footer>
          <Badge variant="default">{{ tool.category }}</Badge>
        </template>
      </Card>
    </div>
    <div
      v-else
      class="rounded-xl border border-outline-variant bg-surface-container p-12 text-center"
    >
      <p class="text-muted mb-2">No tools yet.</p>
      <p class="text-sm text-muted">
        Phase 4 will ship the first tool here (JSON Formatter as the pattern validator).
      </p>
    </div>
  </PageContainer>
</template>
