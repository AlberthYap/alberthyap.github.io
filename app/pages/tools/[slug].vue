<script setup lang="ts">
import { computed } from 'vue'

import { SITE_NAME } from '~~/shared/constants/site'

const route = useRoute()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})

const { data: tool } = await useAsyncData(
  `tool-${slug.value}`,
  () => queryCollection('tools').path(`/tools/${slug.value}`).first(),
)

if (!tool.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Tool not found',
    fatal: true,
  })
}

useSeoMeta({
  title: tool.value.seo.title,
  description: tool.value.seo.description,
  ogTitle: tool.value.seo.title,
  ogDescription: tool.value.seo.description,
})
</script>

<template>
  <article v-if="tool" class="flex flex-col gap-8">
    <PageContainer width="default" class="pt-12">
      <NuxtLink to="/tools" class="text-sm text-muted hover:text-primary">← Back to tools</NuxtLink>
    </PageContainer>

    <PageContainer width="narrow">
      <header class="flex flex-col gap-4 mb-8">
        <Badge variant="default">{{ tool.category }}</Badge>
        <Heading as="h1">{{ tool.title }}</Heading>
        <p class="text-lg text-muted leading-relaxed">{{ tool.description }}</p>
      </header>

      <!-- Phase 4 will mount the tool component here; registration pattern
           is set in roadmap Sesi 2 (e.g. `<JsonFormatter>` if slug === 'json-formatter'). -->
      <div
        class="rounded-xl border border-border border-dashed bg-surface p-12 flex flex-col items-center gap-3 text-center"
      >
        <p class="text-muted">
          The interactive tool interface for <code>{{ tool.slug }}</code> ships in
          <strong>Phase 4 — Tools</strong>.
        </p>
        <p class="text-sm text-muted font-mono">
          Registered in <code>content.config.ts</code> as the <code>tools</code> collection
          with <code>ToolSchema</code>.
        </p>
      </div>
    </PageContainer>
  </article>
</template>
