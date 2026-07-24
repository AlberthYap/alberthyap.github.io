<script setup lang="ts">
import {
  ABOUT_BIO,
  SITE_LEAD,
  SITE_NAME,
  SITE_ROLE,
  SKILL_GROUPS,
} from '~~/shared/constants/site'

const { data: featuredProjects } = await useAsyncData(
  'home-featured-projects',
  () => queryCollection('projects')
    .order('year', 'DESC')
    .where('featured', '=', true)
    .limit(3)
    .all(),
)

useSeoMeta({
  title: `${SITE_NAME} — ${SITE_ROLE}`,
  description: SITE_LEAD,
  ogTitle: `${SITE_NAME} — ${SITE_ROLE}`,
  ogDescription: SITE_LEAD,
  ogImage: '/og/default.png',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <Hero :name="SITE_NAME" :role="SITE_ROLE" :lead="SITE_LEAD" />

    <PageContainer width="default" class="flex flex-col gap-24 md:gap-32 pb-24">
      <About :name="SITE_NAME" :bio="ABOUT_BIO" />

      <Skills :groups="SKILL_GROUPS" />

      <section
        id="projects"
        aria-labelledby="projects-heading"
        class="flex flex-col gap-8"
      >
        <div class="flex items-end justify-between gap-4">
          <Heading id="projects-heading" as="h2">Selected work</Heading>
          <NuxtLink
            to="/projects"
            class="text-sm font-medium text-muted hover:text-primary transition-colors whitespace-nowrap"
          >
            All projects →
          </NuxtLink>
        </div>
        <div
          v-if="featuredProjects && featuredProjects.length"
          class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <ProjectCard
            v-for="project in featuredProjects"
            :key="project.slug"
            :project="project"
          />
        </div>
        <p v-else class="text-muted">
          No featured projects yet — drafts land in <code>content/projects/</code>.
        </p>
      </section>
    </PageContainer>
  </div>
</template>
