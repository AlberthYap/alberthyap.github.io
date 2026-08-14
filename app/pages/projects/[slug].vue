<script setup lang="ts">
import { computed } from 'vue'

import { SITE_NAME } from '~~/shared/constants/site'

const route = useRoute()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})

// Data is fetched from a server endpoint rather than `queryCollection`
// directly, so the in-browser SQLite/WASM runtime is never loaded (the
// strict CSP would otherwise block it during client-side navigation).
// The reactive URL re-fetches when `slug` changes (project → project).
const { data: project, error: queryError } = await useFetch(
  () => `/api/projects/${slug.value}`,
)

// Distinguish a query/runtime failure (500) from a genuine not-found
// (404) — the endpoint throws the right status, mirrored here so the
// error page shows the correct message.
if (queryError.value) {
  throw createError({
    statusCode: queryError.value.statusCode ?? 500,
    statusMessage:
      queryError.value.statusMessage || 'Project data could not be loaded',
    fatal: true,
  })
}

// A null result after a successful fetch is the only true 404.
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

const statusBadgeClass = computed(() => {
  if (!project.value) return ''
  return project.value.status === 'shipped'
    ? 'bg-primary-soft text-primary-deep'
    : project.value.status === 'in-progress'
    ? 'bg-warning/40 text-tertiary'
    : 'bg-surface-container-high text-muted'
})

const galleryImages = computed(() => {
  if (!project.value) return []
  return project.value.images.filter((img) => Boolean(img.light))
})

// Display URL for the browser-frame chrome (strip protocol + trailing slash).
const displayUrl = computed(() => {
  const url = project.value?.liveUrl || project.value?.repoUrl || ''
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
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
    <PageContainer width="wide" class="pt-20 md:pt-24">
      <!-- Back -->
      <NuxtLink
        to="/projects"
        class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-deep transition-colors font-mono mb-10"
      >
        <span aria-hidden="true">←</span> All projects
      </NuxtLink>

      <!-- Hero: editorial split — text left, browser-framed screenshot right -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16 md:mb-20 items-start">
        <!-- Text column -->
        <div class="lg:col-span-5 flex flex-col">
          <!-- Meta row: role · client · year + status badge -->
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-mono text-muted mb-5">
            <span class="text-primary-deep font-semibold">{{ project.role }}</span>
            <span aria-hidden="true" class="text-muted/30">·</span>
            <span>{{ project.client }}</span>
            <span aria-hidden="true" class="text-muted/30">·</span>
            <span>{{ project.year }}</span>
            <span
              class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              :class="statusBadgeClass"
            >
              {{ statusLabel }}
            </span>
          </div>

          <h1 class="font-serif font-bold text-text text-display md:text-[3.5rem] leading-[1.05] tracking-[-0.02em] max-w-xl">
            {{ project.title }}
          </h1>

          <p class="text-body-lg text-muted leading-relaxed max-w-lg mt-5">
            {{ project.description }}
          </p>

          <div class="flex flex-wrap gap-3 mt-8">
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

          <!-- Tags as tidy chips -->
          <ul
            v-if="project.tags.length"
            class="flex flex-wrap gap-2 mt-10 pt-8 border-t border-outline-variant"
          >
            <li v-for="tag in project.tags" :key="tag">
              <Badge variant="tech">{{ tag }}</Badge>
            </li>
          </ul>
        </div>

        <!-- Screenshot column: browser frame + theme-aware image -->
        <div class="lg:col-span-7">
          <figure
            class="rounded-xl overflow-hidden border border-outline-variant bg-surface-container-lowest shadow-sm"
          >
            <!-- Browser chrome -->
            <div class="flex items-center gap-2 px-4 py-3 bg-surface-container/70 border-b border-outline-variant">
              <span class="flex gap-1.5" aria-hidden="true">
                <span class="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span class="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span class="h-3 w-3 rounded-full bg-[#28c840]" />
              </span>
              <span
                class="flex-1 mx-auto max-w-sm truncate rounded-md bg-surface-container-high px-3 py-1 font-mono text-xs text-muted text-center"
              >
                {{ displayUrl || project.liveUrl }}
              </span>
            </div>
            <!-- Screenshot (theme-aware: dark shot in dark mode) -->
            <ThemeImage
              :light="project.thumbnail"
              :dark="project.thumbnailDark"
              :alt="`${project.title} screenshot`"
              class="w-full aspect-[16/10] object-cover object-top bg-surface-container"
            />
          </figure>
        </div>
      </div>

      <!-- Two-column: body + sidebar -->
      <div class="flex flex-col lg:flex-row gap-12 lg:gap-20">
        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <!-- Markdown body -->
          <div class="prose prose-headings:text-text prose-p:text-text prose-p:leading-relaxed prose-a:text-primary-deep prose-strong:text-text prose-code:text-primary-deep prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-li:text-text max-w-none">
            <ContentRenderer :value="project" />
          </div>

          <!-- Image gallery -->
          <div
            v-if="galleryImages.length"
            class="mt-14"
          >
            <h2 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-5">
              Gallery
            </h2>
            <div class="flex gap-4 overflow-x-auto pb-3 snap-x snap-proximity">
              <div
                v-for="(img, idx) in galleryImages"
                :key="img.light"
                class="shrink-0 w-[85vw] sm:w-[70vw] md:w-[55vw] aspect-video rounded-xl overflow-hidden bg-surface-container snap-center"
              >
                <ThemeImage
                  :light="img.light"
                  :dark="img.dark"
                  :alt="`${project.title} screenshot ${idx + 1}`"
                  lazy
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <!-- Bottom CTAs -->
          <div class="flex flex-wrap gap-3 mt-14 pt-10 border-t border-outline-variant">
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
