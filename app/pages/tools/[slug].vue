<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})

const { data: tool } = await useAsyncData(
  `tool-${slug.value}`,
  () => queryCollection('tools').where('slug', '=', slug.value).first(),
)

if (!tool.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Tool not found',
    fatal: true,
  })
}

// Related tools — sibling entries from the tools collection (max 4).
// Compact strip below the workspace, before the footer, per brief §10.
const { data: allTools } = await useAsyncData(
  `related-tools-${slug.value}`,
  () => queryCollection('tools').order('title', 'ASC').all(),
)
const relatedTools = computed(() =>
  (allTools.value ?? []).filter((t) => t.slug !== slug.value).slice(0, 4),
)

const categoryLabel = computed(() => {
  if (!tool.value) return ''
  if (tool.value.category === 'developer') return 'Developer'
  if (tool.value.category === 'productivity') return 'Productivity'
  return 'Design'
})

// Compact hero trust badges — privacy-first messaging per UX audit.
const FEATURE_BADGES = ['Runs locally', 'No uploads', 'Instant']

useSeoMeta({
  title: tool.value.seo.title,
  description: tool.value.seo.description,
  ogTitle: tool.value.seo.title,
  ogDescription: tool.value.seo.description,
})
</script>

<template>
  <article v-if="tool" class="tool-detail-page pb-6 md:pb-8">
    <!-- Hero — compact utility-tool header (UX audit: reduce height ~30%).
         `tool-hero` anchors e2e per-viewport metrics (`.tool-hero h1` width). -->
    <div class="relative w-full bg-surface-container-high tool-hero">
      <PageContainer width="wide" class="pt-[calc(var(--spacing-navbar-height)+var(--spacing-md))] pb-6 md:pt-[calc(var(--spacing-navbar-height)+var(--spacing-lg))] md:pb-8">
        <!-- Breadcrumb — "Home / Tools / Converter" feels like an ecosystem. -->
        <nav class="flex items-center gap-1.5 text-sm text-muted font-mono mb-4" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-text transition-colors hidden sm:inline">Home</NuxtLink>
          <span aria-hidden="true" class="text-outline-variant hidden sm:inline">/</span>
          <NuxtLink to="/tools" class="hover:text-text transition-colors">Tools</NuxtLink>
          <span aria-hidden="true" class="text-outline-variant">/</span>
          <span class="text-text font-medium truncate">{{ tool.title }}</span>
        </nav>

        <div class="flex flex-col gap-2.5 max-w-[40rem]">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary-soft text-primary-deep text-sm font-bold leading-none"
              aria-hidden="true"
            >
              {{ tool.icon }}
            </span>
            <Badge variant="default">{{ categoryLabel }} Tool</Badge>
            <span
              v-if="tool.featured"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-soft text-primary-deep"
            >
              Local-first
            </span>
          </div>

          <h1 class="font-serif font-bold text-text text-headline-lg leading-[1.1] tracking-[-0.02em]">
            {{ tool.title }}
          </h1>

          <p
            class="text-body-sm md:text-body-md text-muted leading-relaxed max-w-[36rem] tool-hero__description"
            data-testid="hero-description"
          >
            {{ tool.description }}
          </p>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-0.5">
            <span
              v-for="badge in FEATURE_BADGES"
              :key="badge"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-text/90"
            >
              <span
                class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-soft text-primary-deep"
                aria-hidden="true"
              >✓</span>
              {{ badge }}
            </span>
          </div>
        </div>
      </PageContainer>
    </div>

    <!-- Body — the workspace is the focal point; no keywords interlude -->
    <PageContainer id="workspace" width="wide" class="mt-6 md:mt-8 scroll-mt-[7rem]">
      <!-- Tool interface — renders the interactive component when
           available, otherwise the Phase 4 placeholder. -->
      <LazyDelimiterTool v-if="slug === 'delimiter'" />
      <LazyJsonFormatterTool v-else-if="slug === 'json-formatter'" />
      <LazyRegexTesterTool v-else-if="slug === 'regex-tester'" />
      <LazyCsvCleanerTool v-else-if="slug === 'csv-cleaner'" />
      <LazyTextDiffTool v-else-if="slug === 'text-diff'" />
      <div
        v-else
        class="rounded-xl bg-surface-container-high p-10 md:p-14 flex flex-col items-center gap-3 text-center"
      >
        <span class="text-4xl mb-2">{{ tool.icon }}</span>
        <p class="text-muted text-body-md">
          The interactive interface for
          <strong class="text-text">{{ tool.title }}</strong>
          ships in Phase 4.
        </p>
        <p class="text-sm text-muted font-mono">
          Registered in <code class="text-primary-deep">content.config.ts</code>
          as the <code class="text-primary-deep">tools</code> collection
          with <code class="text-primary-deep">ToolSchema</code>.
        </p>
      </div>

      <!-- Related tools — compact strip, keeps the page dense (brief §10) -->
      <section v-if="relatedTools.length" class="mt-8 md:mt-10">
        <h2 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-4">
          Related tools
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="t in relatedTools"
            :key="t.slug"
            :to="`/tools/${t.slug}`"
            class="group rounded-xl border border-outline-variant bg-surface-container-low p-4 transition-colors hover:border-primary hover:bg-surface"
          >
            <span
              class="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary-soft text-primary-deep text-sm font-bold leading-none"
              aria-hidden="true"
            >
              {{ t.icon }}
            </span>
            <h3 class="mt-2.5 font-serif text-headline-sm font-bold text-text group-hover:text-primary-deep transition-colors">
              {{ t.title }}
            </h3>
            <p class="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
              {{ t.description }}
            </p>
          </NuxtLink>
        </div>
      </section>

      <!-- Compact bottom nav — replaces the old tall CTA block -->
      <div class="mt-6 pt-4 border-t border-outline-variant">
        <NuxtLink
          to="/tools"
          class="inline-flex items-center px-2 py-1 text-sm text-muted hover:text-text transition-colors font-mono"
        >
          <span aria-hidden="true">←</span>
          All tools
        </NuxtLink>
      </div>
    </PageContainer>
  </article>
</template>
