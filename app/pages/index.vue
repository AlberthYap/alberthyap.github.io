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
 *   │ Projects     │ id="projects" │ Header carries sticky "01 / 03"   │
 *   │              │               │ counter (useProjectObserver);    │
 *   │              │               │ cards are vertical full-bleed    │
 *   │              │               │ covers.                          │
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
import { useProjectObserver } from '~~/app/composables/useProjectObserver'

import { SITE_LEAD, SITE_NAME } from '~~/shared/constants/site'

/** Pad an integer with a leading zero so the counter reads "01 / 03". */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

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

/**
 * Scroll-spy for the projects section — emits the 1-based card index
 * and total count whenever ≥50% of a `[data-project-marker]` enters
 * the viewport. Drives the sticky "01 / 03" counter on the section
 * header.
 *
 * The composable wires its own IntersectionObserver inside
 * `onMounted`; we only read `current` / `total` reactively here.
 */
const projectsObserver = useProjectObserver('[data-project-marker]')

/** Reactive "01 / 03" formatted string. Empty until first observation
 *  fires so the counter doesn't proudly show "00 / 00" at top-of-page. */
const projectCounter = computed(() =>
  projectsObserver.total.value > 0
    ? `${pad2(projectsObserver.current.value)} / ${pad2(projectsObserver.total.value)}`
    : '',
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
          <span class="text-primary">accessible systems</span>
        </Hero>
      </div>

      <PageContainer width="default" class="flex flex-col gap-section pb-section">
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
          class="flex flex-col gap-10 reveal-up"
          :class="{ 'is-revealed': portfolioRef }"
        >
          <!-- Section header. lg+ carries a sticky counter pinned just
               below the navbar pill at z-40 — sits below the navbar's
               z-50 but above the section content. The counter is
               `aria-live="polite"` so screen readers announce "01 / 03"
               updates without barging into the current speech. The
               mobile path keeps the counter (it's tonal, not
               decorative) but the sticky position resolves to a flow
               position because the navbar pill collapses on sm. We
               reference `--spacing-navbar-height` so the offset tracks
               any future navbar reflow rather than hard-coding 80 px.
               The mobile path hides the counter to preserve breathing
               room (each card already has its own per-card cascade). -->
          <header
            class="sticky top-[var(--spacing-navbar-height)] z-40 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 py-4 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            data-stagger="0"
          >
            <div class="flex flex-col gap-2">
              <p class="font-mono text-label-sm uppercase tracking-widest text-primary">
                Engineered Systems
              </p>
              <h2
                id="projects-heading"
                class="font-headline font-bold text-text text-headline-xl leading-tight"
              >
                Selected <span class="text-primary">work</span>
              </h2>
            </div>
            <div
              v-if="projectCounter"
              aria-live="polite"
              aria-label="Currently visible project"
              class="font-mono text-label-md uppercase tracking-widest text-muted tabular-nums"
            >
              {{ projectCounter }}
            </div>
          </header>

          <div
            v-if="featuredProjects && featuredProjects.length"
            class="flex flex-col gap-8"
          >
            <div
              v-for="(project, idx) in featuredProjects"
              :key="project.slug"
              :data-stagger="Math.min(idx + 1, 4)"
            >
              <ProjectCard :project="project" />
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
