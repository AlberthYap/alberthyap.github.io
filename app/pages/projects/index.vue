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
  <PageContainer width="wide" class="py-16 md:py-24">
    <header class="flex flex-col gap-3 mb-12">
      <Heading as="h1">Projects</Heading>
      <p class="text-muted">
        {{ projects?.length ?? 0 }}
        {{ projects?.length === 1 ? 'project' : 'projects' }} shipped or in progress.
      </p>
    </header>
    <div
      v-if="projects && projects.length"
      class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      <ProjectCard
        v-for="project in projects"
        :key="project.slug"
        :project="project"
      />
    </div>
    <div v-else class="rounded-xl border border-border bg-surface p-12 text-center">
      <p class="text-muted mb-2">No projects yet.</p>
      <p class="text-sm text-muted">
        Drop a markdown file into <code>content/projects/</code> matching
        <code>ProjectSchema</code> in <code>shared/schemas/project.ts</code>.
      </p>
    </div>
  </PageContainer>
</template>
