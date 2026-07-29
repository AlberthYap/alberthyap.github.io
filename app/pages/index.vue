<script setup lang="ts">
/**
 * Home page — five narrative sections with per-section reveal.
 *
 * Data comes from a build-time JSON snapshot (`modules/home-snapshot.ts`)
 * instead of runtime `queryCollection()`, saving ~217 KB gzip of SQLite
 * WASM from the home route's modulepreload chain.
 */
import { computed } from 'vue'

import type { Experience, Project, SkillGroup } from '~~/shared/types'

import { useSectionReveal } from '~~/app/composables/useSectionReveal'
import { useProvideActiveSection } from '~~/app/composables/useActiveSection'

import { SITE_LEAD, SITE_NAME } from '~~/shared/constants/site'

import type { HomeSnapshot } from '~~/modules/home-snapshot'
import rawSnapshot from '~~/app/assets/generated/home-snapshot.json'

/**
 * Preferred display order for skill categories. Categories not in this
 * list appear at the end in insertion order.
 */
const CATEGORY_ORDER = [
  'Frontend',
  'Backend',
  'Data Engineering',
  'Infrastructure',
  'Database',
] as const

/**
 * Merge experience-derived skills with personal/self-learned skills into
 * one `SkillGroup[]` keyed by category. Personal skills are merged into
 * the same categories so e.g. "Vue.js" adds alongside "React" under
 * Frontend. Items deduplicate across both sources.
 */
function aggregateSkills(
  experiences: readonly Experience[],
  personal: readonly SkillGroup[] = [],
): SkillGroup[] {
  const groups = new Map<string, Set<string>>()
  for (const exp of experiences) {
    for (const sg of exp.skills) {
      let bucket = groups.get(sg.category)
      if (!bucket) {
        bucket = new Set()
        groups.set(sg.category, bucket)
      }
      for (const item of sg.items) bucket.add(item)
    }
  }
  // Merge personal/self-learned skills into the same categories
  for (const sg of personal) {
    let bucket = groups.get(sg.category)
    if (!bucket) {
      bucket = new Set()
      groups.set(sg.category, bucket)
    }
    for (const item of sg.items) bucket.add(item)
  }
  return Array.from(groups)
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a[0] as (typeof CATEGORY_ORDER)[number])
      const bi = CATEGORY_ORDER.indexOf(b[0] as (typeof CATEGORY_ORDER)[number])
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    .map(([category, items]) => ({
      category,
      items: Array.from(items).sort(),
    }))
}

// JSON imports widen to `Record<string, unknown>` at compile time.
// Build-time Zod pass in `modules/home-snapshot.ts` is the source of truth.
const homeSnapshot = rawSnapshot as unknown as HomeSnapshot

const about = homeSnapshot.about
const experiences = homeSnapshot.experiences
const featuredProjects = homeSnapshot.featuredProjects
const personalSkills = homeSnapshot.personalSkills.skills

const skillGroups = computed<SkillGroup[]>(() =>
  aggregateSkills(experiences, personalSkills),
)

useSeoMeta({
  title: `${SITE_NAME} — Frontend Engineer`,
  description: about.tagline,
  ogTitle: `${SITE_NAME} — Frontend Engineer`,
  ogDescription: about.tagline,
  ogImage: '/og/default.png',
  twitterCard: 'summary_large_image',
})

const reveal = useSectionReveal()
const aboutRef = reveal.isRevealed('about')
const skillsRef = reveal.isRevealed('skills')
const experienceRef = reveal.isRevealed('experience')
const portfolioRef = reveal.isRevealed('projects')

// Provide scroll-spy context so Navbar reads `currentSectionId`.
// No-op in templates; return value intentionally unused.
useProvideActiveSection()
</script>

<template>
  <div
    class="relative min-h-screen"
    :data-intro-complete="reveal.allRevealed.value ? 'true' : 'false'"
  >
    <!-- Grid backdrop overlay — fixed, ~15% opacity -->
    <div
      aria-hidden="true"
      class="fixed inset-0 grid-bg opacity-[15%] pointer-events-none z-0"
    />

    <div class="relative z-10">
      <!-- Hero — scroll-spy observed via data-section-id="hero". -->
      <div data-section-id="hero">
        <Hero
          :name="about.name"
          :eyebrow="about.eyebrow"
          :lead="about.tagline"
          status="Available for new work"
          primary-to="/projects"
          primary-label="View selected work"
        >
          Building calm,<br>
          <span class="text-primary-deep">Scalable Systems</span>
        </Hero>
      </div>

      <PageContainer width="default" class="flex flex-col gap-section pt-section pb-section">
        <!-- About ─────────────────────────────────────── -->
        <div
          data-section-id="about"
          class="reveal-up"
          :class="{ 'is-revealed': aboutRef }"
        >
          <LazyAbout
            :name="about.name"
            :bio="about.tagline"
            :portrait="about.portrait ?? null"
            :highlights="about.highlights"
            :body-html="about.bodyHtml"
            :footnote="about.footnote ?? ''"
          />
        </div>

        <!-- Core Stack ────────────────────────────────── -->
        <div
          data-section-id="skills"
          class="py-section reveal-up"
          :class="{ 'is-revealed': skillsRef }"
        >
          <LazySkills :groups="skillGroups" />
        </div>

        <!-- Experience ───────────────────────────────── -->
        <div
          data-section-id="experience"
          class="reveal-up"
          :class="{ 'is-revealed': experienceRef }"
        >
          <LazyExperience
            v-if="experiences.length"
            :experiences="experiences"
          />
        </div>

        <!-- Projects ─────────────────────────────────── -->
        <section
          id="projects"
          data-section-id="projects"
          aria-labelledby="projects-heading"
          class="flex flex-col gap-8 reveal-up"
          :class="{ 'is-revealed': portfolioRef }"
        >
          <div data-stagger="0" class="flex flex-col gap-2 text-center items-center">
            <p class="font-mono text-label-sm uppercase tracking-widest text-primary-deep">
              Work
            </p>
            <h2
              id="projects-heading"
              class="font-headline font-bold text-text text-headline-xl leading-tight"
            >
              Selected <span class="text-primary-deep">projects</span>
            </h2>
          </div>

          <div
            v-if="featuredProjects.length"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            <div
              v-for="(project, idx) in featuredProjects"
              :key="project.slug"
              :data-stagger="Math.min(idx + 1, 4)"
            >
              <LazyProjectCard :project="project" compact />
            </div>
          </div>
          <p v-else data-stagger="1" class="text-muted">
            No featured projects yet — drafts land in <code>content/projects/</code>.
          </p>
        </section>
      </PageContainer>
    </div>
  </div>
</template>
