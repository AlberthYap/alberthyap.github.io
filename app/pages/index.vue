<script setup lang="ts">
/**
 * Home page — orchestrates the per-section reveal and renders the
 * five narrative sections of the site (Organic Professional edition).
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Hero         │ id="hero"     │ Status-led editorial + 2-col    │
 *   │              │               │ layout with HeroDashboard on    │
 *   │              │               │ the right column on lg+.        │
 *   │ About        │ id="about"    │ Bio + bullets                    │
 *   │ Core Stack   │ id="skills"   │ Glass-panel 3-up card grid       │
 *   │ Experience   │ id="experience"│ Timeline of experience entries   │
 *   │ Projects     │ id="projects" │ Compact card grid — work showcase │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * The page also mounts a `<div class="grid-bg">` fixed-positioned
 * backdrop overlay (DESIGN §11) so all sections share a faint
 * grid texture without re-declaring it per section.
 */
import { computed } from 'vue'

import type { Experience, SkillGroup } from '~~/shared/types'

import { useSectionReveal } from '~~/app/composables/useSectionReveal'
import { useProvideActiveSection } from '~~/app/composables/useActiveSection'

import { SITE_LEAD, SITE_NAME } from '~~/shared/constants/site'

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
]

/**
 * Merge experience-derived skills with personal/self-learned skills into
 * one `SkillGroup[]` keyed by category. Personal skills are merged into
 * the same categories so e.g. "Vue.js" adds alongside "React" under
 * Frontend. Items deduplicate across both sources.
 */
function aggregateSkills(
  experiences: readonly Experience[],
  personal: SkillGroup[] = [],
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
      const ai = CATEGORY_ORDER.indexOf(a[0])
      const bi = CATEGORY_ORDER.indexOf(b[0])
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    .map(([category, items]) => ({
      category,
      items: Array.from(items).sort(),
    }))
}

const { data: about } = await useAsyncData(
  'home-about',
  () => queryCollection('about').first(),
)

const { data: experiences } = await useAsyncData(
  'home-experiences',
  () => queryCollection('experience').order('startDate', 'DESC').all(),
)

const { data: featuredProjects } = await useAsyncData(
  'home-featured-projects',
  () =>
    queryCollection('projects')
      .order('year', 'DESC')
      .where('featured', '=', true)
      .limit(3)
      .all(),
)

const { data: personalSkillsData } = await useAsyncData(
  'home-personal-skills',
  () => queryCollection('personalSkills').first(),
)

const skillGroups = computed<SkillGroup[]>(() =>
  aggregateSkills(experiences.value ?? [], personalSkillsData.value?.skills ?? []),
)

useSeoMeta({
  title: `${SITE_NAME} — Frontend Engineer`,
  description: about?.tagline ?? SITE_LEAD,
  ogTitle: `${SITE_NAME} — Frontend Engineer`,
  ogDescription: about?.tagline ?? SITE_LEAD,
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
    <!-- Grid backdrop overlay — fixed, faint (~15%). The grid uses a
         tonal surface-container hue (close to cream) so the lines
         bleed into the bg tier rather than punching through. At 15%
         opacity the lines land above the perceptual JND threshold on
         most displays (ΔL ~3%) — present but not dominant, reads as
         "softly engineered" rather than "blueprint scaffold". -->
    <div
      aria-hidden="true"
      class="fixed inset-0 grid-bg opacity-[15%] pointer-events-none z-0"
    />

    <div class="relative z-10">
      <!-- Hero — scroll-spy observed via data-section-id="hero". -->
      <div data-section-id="hero">
        <Hero
          :name="about?.name ?? SITE_NAME"
          :eyebrow="about?.eyebrow ?? SITE_NAME"
          :lead="about?.tagline ?? SITE_LEAD"
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
          <About
            v-if="about"
            :name="about.name"
            :bio="about.tagline"
            :portrait="about?.portrait ?? null"
            :highlights="about.highlights"
            :body-doc="about"
            :footnote="about.footnote ?? ''"
          />
        </div>

        <!-- Core Stack ────────────────────────────────── -->
        <div
          data-section-id="skills"
          class="py-section reveal-up"
          :class="{ 'is-revealed': skillsRef }"
        >
          <Skills :groups="skillGroups" />
        </div>

        <!-- Experience ───────────────────────────────── -->
        <div
          data-section-id="experience"
          class="reveal-up"
          :class="{ 'is-revealed': experienceRef }"
        >
          <Experience
            v-if="experiences && experiences.length"
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
            v-if="featuredProjects && featuredProjects.length"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            <div
              v-for="(project, idx) in featuredProjects"
              :key="project.slug"
              :data-stagger="Math.min(idx + 1, 4)"
            >
              <ProjectCard :project="project" compact />
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
