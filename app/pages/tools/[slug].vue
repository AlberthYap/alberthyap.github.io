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

const categoryLabel = computed(() => {
  if (!tool.value) return ''
  if (tool.value.category === 'developer') return 'Developer'
  if (tool.value.category === 'productivity') return 'Productivity'
  return 'Design'
})

useSeoMeta({
  title: tool.value.seo.title,
  description: tool.value.seo.description,
  ogTitle: tool.value.seo.title,
  ogDescription: tool.value.seo.description,
})
</script>

<template>
  <article v-if="tool" class="pb-section">
    <!-- Hero — icon + title, minimal -->
    <div class="relative w-full bg-surface-container-high">
      <PageContainer width="wide" class="pt-16 pb-12 md:pt-24 md:pb-16">
        <NuxtLink
          to="/tools"
          class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-deep transition-colors font-mono mb-8"
        >
          <span aria-hidden="true">←</span> Back to tools
        </NuxtLink>

        <div class="flex items-start gap-6">
          <!-- Icon -->
          <div class="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-surface flex items-center justify-center text-2xl md:text-3xl shadow-sm">
            {{ tool.icon }}
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <Badge variant="default">{{ categoryLabel }}</Badge>
              <span
                v-if="tool.featured"
                class="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-soft text-primary-deep"
              >
                Featured
              </span>
            </div>

            <h1 class="font-serif font-bold text-text text-display md:text-[3rem] leading-[1.05] tracking-[-0.02em]">
              {{ tool.title }}
            </h1>

            <p class="text-body-lg text-muted leading-relaxed max-w-2xl">
              {{ tool.description }}
            </p>

            <div class="flex flex-wrap gap-3 mt-3">
              <LinkButton
                v-if="tool.url"
                :to="tool.url"
                variant="primary"
                size="md"
                class="rounded-lg"
              >
                Open tool →
              </LinkButton>
              <LinkButton
                v-if="tool.repoUrl"
                :to="tool.repoUrl"
                variant="secondary"
                size="md"
                class="rounded-lg"
              >
                Source code
              </LinkButton>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>

    <!-- Body -->
    <PageContainer width="wide" class="mt-12 md:mt-16">
      <div class="flex flex-col lg:flex-row gap-12 lg:gap-20">
        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <!-- Keywords -->
          <div v-if="tool.keywords.length" class="mb-10">
            <h2 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-4">
              Keywords
            </h2>
            <div class="flex flex-wrap gap-2">
              <Badge v-for="kw in tool.keywords" :key="kw" variant="tech">{{ kw }}</Badge>
            </div>
          </div>

          <!-- Tool interface placeholder -->
          <div class="mb-10">
            <h2 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-4">
              Tool
            </h2>
            <div class="rounded-xl bg-surface-container-high p-10 md:p-14 flex flex-col items-center gap-3 text-center">
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
          </div>

          <!-- Bottom CTAs -->
          <div class="flex flex-wrap gap-3 mt-14 pt-10">
            <LinkButton
              v-if="tool.url"
              :to="tool.url"
              variant="primary"
              size="md"
              class="rounded-lg"
            >
              Open tool →
            </LinkButton>
            <LinkButton
              v-if="tool.repoUrl"
              :to="tool.repoUrl"
              variant="secondary"
              size="md"
              class="rounded-lg"
            >
              Source code
            </LinkButton>
            <NuxtLink
              to="/tools"
              class="inline-flex items-center px-4 py-2 text-sm text-muted hover:text-text transition-colors font-mono"
            >
              ← All tools
            </NuxtLink>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="lg:w-72 shrink-0">
          <div class="flex flex-col gap-10 lg:sticky lg:top-24">
            <!-- Info -->
            <div>
              <h3 class="font-mono text-label-sm uppercase tracking-widest text-muted mb-4">
                Details
              </h3>
              <dl class="flex flex-col gap-3">
                <div class="flex flex-col gap-0.5 pb-3 border-b border-outline-variant last:border-0 last:pb-0">
                  <dt class="font-mono text-xs uppercase tracking-wider text-muted">Category</dt>
                  <dd class="text-sm text-text">{{ categoryLabel }}</dd>
                </div>
                <div class="flex flex-col gap-0.5 pb-3 border-b border-outline-variant last:border-0 last:pb-0">
                  <dt class="font-mono text-xs uppercase tracking-wider text-muted">Status</dt>
                  <dd class="text-sm text-text">
                    <span class="text-amber-600 dark:text-amber-400">In development</span>
                  </dd>
                </div>
                <div v-if="tool.url" class="flex flex-col gap-0.5 pb-3 border-b border-outline-variant last:border-0 last:pb-0">
                  <dt class="font-mono text-xs uppercase tracking-wider text-muted">URL</dt>
                  <dd>
                    <a
                      :href="tool.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-primary-deep hover:underline font-mono break-all"
                    >
                      {{ tool.url.replace(/^https?:\/\//, '').replace(/\/$/, '') }}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </PageContainer>
  </article>
</template>
