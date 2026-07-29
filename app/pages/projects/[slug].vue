<script setup lang="ts">
import { computed } from 'vue'

import { SITE_NAME } from '~~/shared/constants/site'

const route = useRoute()

// vue-router 5 types `params.slug` as `string | string[]`. Pick first segment
// when the URL ever resolves an array (defensive — file-based routes keep this single).
const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})

const { data: project } = await useAsyncData(
  `project-${slug.value}`,
  () => queryCollection('projects')
    .path(`/projects/${slug.value}`)
    .first(),
)

if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found',
    fatal: true,
  })
}

useSeoMeta({
  title: `${project.value.title} — ${SITE_NAME}`,
  description: project.value.description,
  ogTitle: project.value.title,
  ogDescription: project.value.description,
  ogImage: project.value.thumbnail,
})
</script>

<template>
  <article v-if="project" class="pb-section">
    <!-- Hero area: thumbnail full-bleed + title overlay -->
    <div class="relative w-full aspect-[21/9] overflow-hidden bg-surface-container">
      <img
        v-if="project.thumbnail"
        :src="project.thumbnail"
        :alt="`${project.title} cover`"
        class="w-full h-full object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <div class="max-w-[var(--spacing-container)] mx-auto px-6 md:px-12 lg:px-16">
          <NuxtLink
            to="/projects"
            class="inline-block mb-4 text-sm text-muted hover:text-primary-deep transition-colors font-mono"
          >
            ← Back to projects
          </NuxtLink>
          <div class="flex flex-wrap items-center gap-3 text-sm text-muted font-mono mb-3">
            <span>{{ project.role }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ project.client }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ project.year }}</span>
          </div>
          <Heading as="h1">{{ project.title }}</Heading>
          <p class="text-body-lg text-muted leading-relaxed max-w-prose mt-3">
            {{ project.description }}
          </p>
          <div class="flex flex-wrap gap-3 mt-5">
            <LinkButton
              v-if="project.liveUrl"
              :to="project.liveUrl"
              variant="primary"
              size="md"
            >
              View live
            </LinkButton>
            <LinkButton
              v-if="project.repoUrl"
              :to="project.repoUrl"
              variant="secondary"
              size="md"
            >
              Source code
            </LinkButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Body content -->
    <PageContainer width="narrow" class="mt-10 md:mt-16">
      <!-- Tags -->
      <ul v-if="project.tags.length" class="flex flex-wrap gap-2 mb-8">
        <li v-for="tag in project.tags" :key="tag">
          <span class="tech-pill">{{ tag }}</span>
        </li>
      </ul>

      <!-- Content -->
      <div class="prose prose-headings:text-text prose-p:text-text prose-a:text-primary-deep prose-strong:text-text max-w-none">
        <ContentRenderer :value="project" />
      </div>
    </PageContainer>
  </article>
</template>
