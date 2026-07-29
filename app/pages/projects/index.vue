<script setup lang="ts">
import { SITE_NAME } from '~~/shared/constants/site'

const { data: projects } = await useAsyncData(
  'all-projects',
  () => queryCollection('projects').order('year', 'DESC').all(),
)

useSeoMeta({
  title: `Projects — ${SITE_NAME}`,
  description: 'Case studies of selected work.',
  ogTitle: `Projects — ${SITE_NAME}`,
  ogDescription: 'Case studies of selected work.',
})
</script>

<template>
  <PageContainer width="wide" class="py-section">
    <header class="flex flex-col gap-4 mb-12">
      <p class="font-mono text-label-sm uppercase tracking-widest text-primary-deep">
        Archive
      </p>
      <h1 class="font-serif font-bold text-text text-display leading-none">
        All <span class="text-primary-deep">projects</span>
      </h1>
      <p class="text-muted text-body-md">
        {{ projects?.length ?? 0 }}
        {{ projects?.length === 1 ? 'project' : 'projects' }} shipped or in progress.
      </p>
    </header>
    <div
      v-if="projects && projects.length"
      class="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      <ProjectCard
        v-for="project in projects"
        :key="project.slug"
        :project="project"
      />
    </div>
    <div
      v-else
      class="rounded-xl border border-outline-variant bg-surface-container p-12 text-center"
    >
      <p class="text-muted mb-2">No projects yet.</p>
      <p class="text-sm text-muted">
        Drop a markdown file into <code>content/projects/</code> matching
        <code>ProjectSchema</code> in <code>shared/schemas/project.ts</code>.
      </p>
    </div>
  </PageContainer>
</template>
