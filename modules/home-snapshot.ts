/**
 * Home snapshot — JSON-static migration for the home route.
 *
 * Reads `content/{about.md, experience/*.md, skills/personal-skills.yml,
 * projects/*.md}` once at module setup + again on `build:before`, Zod-validates
 * each entry against the same schemas `@nuxt/content` would normally apply,
 * pre-renders `about.md`'s markdown body to HTML, and writes a single
 * `app/assets/generated/home-snapshot.json` that `app/pages/index.vue` imports
 * synchronously via ESM.
 *
 * ## Why this exists
 *
 * The previous path ran `@nuxt/content`'s `queryCollection()` at runtime on
 * home navigation. That shipped ~217 KB gzip of `sqlite3*.js` + OPFS WASM
 * chunks plus initialised a worker for the in-browser query engine. Pre-
 * computing the home payload during the build collapses all of that into a
 * single ~2 KB JSON asset that Vite tree-shakes the SQLite chunks out of the
 * modulepreload chain entirely.
 *
 * ## Markdown feature parity
 *
 * `marked` is a CommonMark-only renderer. It does NOT support `@nuxt/content`'s
 * MDC component syntax (e.g. `:button-link[Click]{to="/x"}`) — such syntax in
 * `content/about.md` will appear as literal text in the rendered HTML. Use
 * standard Markdown (paragraphs, emphasis, lists, links, code blocks, block-
 * quotes) only. The current body satisfies this; the limit must be respected
 * by future authors.
 *
 * ## Type lockstep
 *
 * `HomeSnapshot` derives from `z.infer<typeof …Schema>` rather than hand-
 * written mirrors. Adding a frontmatter field to any collection schema
 * automatically surfaces in the snapshot, eliminating silent-data-loss when
 * the snapshot type drifts from the schema.
 *
 * ## Sort stability
 *
 * `experiences` and `featuredProjects` order by a primary key (`startDate`,
 * `year`) with a `slug` tie-breaker so identical-key entries produce the same
 * output across builds. Without this, two `featured: true` projects in the
 * same year can swap positions between regenerations.
 *
 * @nuxt/content's runtime layer remains enabled for `/projects/[slug]` and
 * `/tools/[slug]` (collections `projects` and `tools` keep `clientDB: true`
 * in `content.config.ts`). Only the home route is migrated here because the
 * other routes navigate to entries that may not be prerendered.
 */
/// <reference types="node" />
import fs from 'node:fs/promises'
import path from 'node:path'

import { defineNuxtModule } from '@nuxt/kit'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { marked } from 'marked'
import type { z } from 'zod'

import { AboutSchema } from '../shared/schemas/about'
import { ExperienceSchema } from '../shared/schemas/experience'
import { PersonalSkillsSchema } from '../shared/schemas/personal-skills'
import { ProjectSchema } from '../shared/schemas/project'

import { sanitizeMarkdownHtml } from '../shared/sanitizeHtml'

type About = z.infer<typeof AboutSchema> & { bodyHtml: string }
type Experience = z.infer<typeof ExperienceSchema>
type Project = z.infer<typeof ProjectSchema>
type PersonalSkills = z.infer<typeof PersonalSkillsSchema>

export interface HomeSnapshot {
  about: About
  experiences: Experience[]
  featuredProjects: Project[]
  personalSkills: PersonalSkills
}

const FEATURED_PROJECTS_LIMIT = 3

async function listContentFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries
    .filter((e: { isFile(): boolean; name: string }) => e.isFile() && !e.name.startsWith('.'))
    .map((e: { name: string }) => e.name)
}

async function parseMarkdown<T>(
  file: string,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const raw = await fs.readFile(file, 'utf8')
  const fm = matter(raw)
  return schema.parse(fm.data)
}

/** Deterministic tie-breaker for same-key sort stability. */
function bySlug<T extends { slug: string }>(a: T, b: T): number {
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0
}

/** Warn on cross-file duplicate slugs (Zod validates per-file only). */
function warnDuplicateSlugs<T extends { slug: string }>(
  entries: readonly T[],
  collection: string,
): void {
  const seen = new Map<string, number>()
  for (const [i, entry] of entries.entries()) {
    const prev = seen.get(entry.slug)
    if (prev !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        `[home-snapshot] duplicate slug "${entry.slug}" in ${collection} `
        + `(entries ${prev + 1} and ${i + 1}) — sort may be non-deterministic`,
      )
    }
    seen.set(entry.slug, i)
  }
}

async function generateSnapshot(rootDir: string): Promise<HomeSnapshot> {
  const contentRoot = path.join(rootDir, 'content')

  // === ABOUT — markdown with body pre-rendered to HTML ===
  const aboutFm = matter(await fs.readFile(path.join(contentRoot, 'about.md'), 'utf8'))
  const aboutParsed = AboutSchema.parse(aboutFm.data)
  // `async: false` signals synchronous parsing explicitly.
  // Sanitize the rendered HTML at build time (audit C3): `marked` does
  // not strip raw HTML/scripts, and this string is injected via `v-html`
  // on the home page. The allowlist lives in `modules/sanitizeHtml.ts`.
  const aboutBodyHtml = sanitizeMarkdownHtml(marked.parse(aboutFm.content, {
    async: false,
  }) as string)

  // === EXPERIENCE — markdown, frontmatter only on home ===
  const expDir = path.join(contentRoot, 'experience')
  const expFiles = (await listContentFiles(expDir)).filter((f) => f.endsWith('.md'))
  const experiences = await Promise.all(
    expFiles.map((f) => parseMarkdown(path.join(expDir, f), ExperienceSchema)),
  )
  // Primary: startDate DESC. Tie-breaker: slug ASC for deterministic output
  // between builds when two roles share `startDate`.
  experiences.sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? 1 : -1
    return bySlug(a, b)
  })
  // Detect duplicate slugs — Zod validates per-file, not cross-file, so two
  // experience entries could declare the same slug which breaks the tie-
  // breaker and makes sort non-deterministic between builds.
  warnDuplicateSlugs(experiences, 'experience')

  // === FEATURED PROJECTS — markdown, frontmatter only on home ===
  const projDir = path.join(contentRoot, 'projects')
  const projFiles = (await listContentFiles(projDir)).filter((f) => f.endsWith('.md'))
  const allProjects = await Promise.all(
    projFiles.map((f) => parseMarkdown(path.join(projDir, f), ProjectSchema)),
  )
  // Detect duplicate slugs early — same rationale as experiences above.
  warnDuplicateSlugs(allProjects, 'projects')
  const featuredCandidates = allProjects.filter((p) => p.featured)
  // Surface truncation so a 4th `featured: true` doesn't go unnoticed —
  // silent drop on home tile count is the classic "frontmatter drift" foot-
  // gun.
  if (featuredCandidates.length > FEATURED_PROJECTS_LIMIT) {
    // eslint-disable-next-line no-console
    console.warn(
      `[home-snapshot] ${featuredCandidates.length} projects marked featured; `
      + `home gallery caps at ${FEATURED_PROJECTS_LIMIT}. `
      + `Not rendered: ${featuredCandidates
        .slice(FEATURED_PROJECTS_LIMIT)
        .map((p) => p.slug)
        .join(', ')}`,
    )
  }
  // Primary: year DESC. Tie-breaker: slug ASC for deterministic output
  // when multiple featured projects share the same year.
  const featuredProjects = featuredCandidates
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return bySlug(a, b)
    })
    .slice(0, FEATURED_PROJECTS_LIMIT)

  // === PERSONAL SKILLS — YAML ===
  const personalRaw = await fs.readFile(
    path.join(contentRoot, 'skills', 'personal-skills.yml'),
    'utf8',
  )
  const personalSkills = PersonalSkillsSchema.parse(yaml.load(personalRaw))

  return {
    about: { ...aboutParsed, bodyHtml: aboutBodyHtml },
    experiences,
    featuredProjects,
    personalSkills,
  }
}

export default defineNuxtModule({
  meta: { name: 'home-snapshot' },
  async setup(_options, nuxt) {
    const outDir = path.join(nuxt.options.rootDir, 'app', 'assets', 'generated')
    const outFile = path.join(outDir, 'home-snapshot.json')

    async function generate() {
      try {
        const snap = await generateSnapshot(nuxt.options.rootDir)
        await fs.mkdir(outDir, { recursive: true })
        // No indent: Vite inlines the JSON as a JS object literal,
        // minified further downstream. Compact source = smaller dev diffs.
        //
        // Atomic write via temp file + rename prevents Vite from reading
        // a partially-written file during dev.
        const tmpFile = path.join(outDir, `.home-snapshot.tmp`)
        await fs.writeFile(tmpFile, JSON.stringify(snap))
        await fs.rename(tmpFile, outFile)
        // eslint-disable-next-line no-console
        console.log(
          `[home-snapshot] wrote ${path.relative(nuxt.options.rootDir, outFile)} `
          + `(${snap.experiences.length} experiences, `
          + `${snap.featuredProjects.length} featured projects, `
          + `${snap.personalSkills.skills.length} personal skill groups)`,
        )
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[home-snapshot] generation failed:', err)
        throw err
      }
    }

    await generate()
    nuxt.hook('build:before', generate)
  },
})
