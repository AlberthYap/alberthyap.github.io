<script setup lang="ts">
import { computed } from 'vue'

import { SITE_NAME } from '~~/shared/constants/site'

const route = useRoute()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})

// Reactive key + `watch: [slug]` so navigating directly from one project
// to another (same page component, changed param) re-runs the query
// instead of serving the previous slug's data (audit M2).
const dataKey = computed(() => `project-${slug.value}`)

const { data: project, error: queryError } = await useAsyncData(
  dataKey,
  () => queryCollection('projects')
    .path(`/projects/${slug.value}`)
    .first(),
  { watch: [slug] },
)

// Distinguish a query/runtime failure (500) from a genuine not-found
// (404) — previously any content-query failure was reported as 404,
// which masked the CSP/WASM issue (audit M1).
if (queryError.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Project data could not be loaded',
    fatal: true,
  })
}

// With `await useAsyncData` in setup, status is settled here: either
// `error` (handled above → 500) or `success` with possibly-null data.
// A null result after a successful query is the only true 404.
if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found',
    fatal: true,
  })
}

const statusLabel = computed(() => {
  if (!project.value) return ''
  if (project.value.status === 'shipped') return 'Shipped'
  if (project.value.status === 'in-progress') return 'In Progress'
  return 'Archived'
})

const galleryImages = computed(() => {
  if (!project.value) return []
  return project.value.images.filter(Boolean)
})

useSeoMeta({
  title: `${project.value.title} | ${SITE_NAME}`,
  description: project.value.description,
  ogTitle: project.value.title,
  ogDescription: project.value.description,
  ogImage: project.value.thumbnail,
})
</script>

<template>
  <article v-if="project" class="pb-section">
    <PageContainer width="wide" class="pt-20 md:pt-28">
      <!-- Back -->
      <NuxtLink
        to="/projects"
        class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-deep transition-colors font-mono mb-6"
      >
        <span aria-hidden="true">←</span> Back to projects
      </NuxtLink>

      <!-- Featured image — simple, no full-bleed hero -->
      <img
        v-if="project.thumbnail"
        :src="project.thumbnail"
        :alt="`${project.title} cover`"
        class="w-full aspect-video object-cover rounded-xl bg-surface-container mb-10"
      >

      <!-- Header -->
      <header class="mb-14">
        <div class="flex flex-wrap items-center gap-3 text-sm font-mono text-muted mb-5">
          <span class="text-primary-deep font-semibold">{{ project.role }}</span>
          <span aria-hidden="true" class="text-muted/30">·</span>
          <span>{{ project.client }}</span>
          <span aria-hidden="true" class="text-muted/30">·</span>
          <span>{{ project.year }}</span>
          <span
            class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
            :class="project.status === 'shipped'
              ? 'bg-primary-soft text-primary-deep'
              : project.status === 'in-progress'
              ? 'bg-warning/40 text-tertiary'
              : 'bg-surface-container-high text-muted'"
          >
            {{ statusLabel }}
          </span>
        </div>

        <h1 class="font-serif font-bold text-text text-display md:text-[3.5rem] leading-[1.05] tracking-[-0.02em] max-w-4xl">
          {{ project.title }}
        </h1>

        <p class="text-body-lg text-muted leading-relaxed max-w-3xl mt-5">
          {{ project.description }}
        </p>

        <div class="flex flex-wrap gap-3 mt-6">
          <LinkButton
            v-if="project.liveUrl"
            :to="project.liveUrl"
            variant="primary"
            size="md"
            class="rounded-lg"
          >
            View live →
          </LinkButton>
          <LinkButton
            v-if="project.repoUrl"
            :to="project.repoUrl"
            variant="secondary"
            size="md"
            class="rounded-lg"
          >
            Source code
          </LinkButton>
        </div>
      </header>

      <!-- Tags -->
      <ul v-if="project.tags.length" class="flex flex-wrap gap-2 mb-12">
        <li v-for="tag in project.tags" :key="tag">
          <Badge>{{ tag }}</Badge>
        </li>
      </ul>

      <!-- Two-column: body + sidebar -->
      <div class="flex flex-col lg:flex-row gap-12 lg:gap-20">
        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <!-- Image gallery -->
          <div
            v-if="galleryImages.length"
            class="mb-14"
          >
            <h2 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-5">
              Gallery
            </h2>
            <div class="flex gap-4 overflow-x-auto pb-3 snap-x snap-proximity">
              <div
                v-for="(img, idx) in galleryImages"
                :key="img"
                class="shrink-0 w-[85vw] sm:w-[70vw] md:w-[55vw] aspect-video rounded-xl overflow-hidden bg-surface-container snap-center"
              >
                <img
                  :src="img"
                  :alt="`${project.title} screenshot ${idx + 1}`"
                  class="w-full h-full object-cover"
                >
              </div>
            </div>
          </div>

          <!-- Markdown body -->
          <div class="prose prose-headings:text-text prose-p:text-text prose-p:leading-relaxed prose-a:text-primary-deep prose-strong:text-text prose-code:text-primary-deep prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-li:text-text max-w-none">
            <ContentRenderer :value="project" />
          </div>

          <!-- Bottom CTAs -->
          <div class="flex flex-wrap gap-3 mt-14 pt-10">
            <LinkButton
              v-if="project.liveUrl"
              :to="project.liveUrl"
              variant="primary"
              size="md"
              class="rounded-lg"
            >
              View live →
            </LinkButton>
            <LinkButton
              v-if="project.repoUrl"
              :to="project.repoUrl"
              variant="secondary"
              size="md"
              class="rounded-lg"
            >
              Source code
            </LinkButton>
            <NuxtLink
              to="/projects"
              class="inline-flex items-center px-4 py-2 text-sm text-muted hover:text-text transition-colors font-mono"
            >
              ← All projects
            </NuxtLink>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="lg:w-72 shrink-0">
          <div class="flex flex-col gap-10 lg:sticky lg:top-24">
            <!-- Metrics -->
            <div v-if="project.metrics.length">
              <h3 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-4">
                Metrics
              </h3>
              <dl class="grid grid-cols-2 gap-y-5 gap-x-4">
                <div
                  v-for="m in project.metrics"
                  :key="m.label"
                >
                  <dt class="font-mono text-xs uppercase tracking-wider text-muted mb-1">
                    {{ m.label }}
                  </dt>
                  <dd class="font-serif text-headline-md font-bold text-text">
                    {{ m.value }}
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Tech stack -->
            <div v-if="project.technologies.length">
              <h3 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-4">
                Tech stack
              </h3>
              <ul class="flex flex-col gap-3">
                <li
                  v-for="t in project.technologies"
                  :key="t.name"
                  class="flex flex-col gap-0.5 pb-3 border-b border-outline-variant last:border-0 last:pb-0"
                >
                  <span class="font-mono text-sm font-semibold text-text">{{ t.name }}</span>
                  <span class="text-xs text-muted leading-relaxed">{{ t.purpose }}</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </PageContainer>
  </article>
</template>
