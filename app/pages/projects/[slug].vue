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
  <article v-if="project" class="flex flex-col gap-8">
    <PageContainer width="default" class="pt-12">
      <NuxtLink
        to="/projects"
        class="text-sm text-muted hover:text-primary transition-colors"
      >
        ← Back to projects
      </NuxtLink>
    </PageContainer>

    <PageContainer width="default">
      <header class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center gap-3 text-sm text-muted font-mono">
          <span>{{ project.role }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ project.client }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ project.year }}</span>
        </div>
        <Heading as="h1">{{ project.title }}</Heading>
        <p class="text-lg text-muted leading-relaxed max-w-prose">
          {{ project.description }}
        </p>
        <ul v-if="project.tags.length" class="flex flex-wrap gap-2">
          <li v-for="tag in project.tags" :key="tag">
            <Badge variant="tech">{{ tag }}</Badge>
          </li>
        </ul>
        <div v-if="project.liveUrl || project.repoUrl" class="flex flex-wrap gap-3 pt-2">
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
      </header>
    </PageContainer>

    <PageContainer width="default">
      <img
        v-if="project.thumbnail"
        :src="project.thumbnail"
        :alt="`${project.title} cover image`"
        class="w-full rounded-xl border border-border"
        loading="lazy"
      >
    </PageContainer>

    <PageContainer width="narrow">
      <div class="prose prose-invert prose-headings:text-text prose-p:text-text prose-a:text-primary prose-strong:text-text max-w-none">
        <ContentRenderer :value="project" />
      </div>
    </PageContainer>
  </article>
</template>
