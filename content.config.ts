import { defineCollection, defineContentConfig } from '@nuxt/content'

// content.config.ts is loaded by Node during `nuxi prepare` (NOT by Vite),
// so the `~~/` and `@/` aliases configured for the Vite build don't
// resolve here. Relative paths work in both contexts.
//
// The schemas live INSIDE this repo at `shared/schemas/` — `./shared/…`
// is the correct relative path. (An earlier revision imported
// `../shared/…`, which points at the parent directory and only worked
// by accident through resolver quirks.)
import { ProjectSchema } from './shared/schemas/project'
import { ToolSchema } from './shared/schemas/tool'
import { AboutSchema } from './shared/schemas/about'
import { ExperienceSchema } from './shared/schemas/experience'

/**
 * Nuxt Content v3 collection configuration.
 *
 * Content lives at the project root in `content/` (architecture.md §3.1).
 *
 * Schema-as-source-of-truth pattern (architecture.md §8.2):
 *   Zod schemas in `shared/schemas/` are imported directly here, validated
 *   at build time by Nuxt Content, and inferred to TS types via `z.infer`
 *   in `shared/types/`. One source of truth for build-time validation,
 *   TS types, and runtime form/route validation.
 */
import { PersonalSkillsSchema } from './shared/schemas/personal-skills'

export default defineContentConfig({
  collections: {
    // `clientDB: false` opts a collection out of the @nuxt/content
    // runtime SQLite layer. Disabling prevents the runtime SQLite engine
    // (OPFS WASM + worker) from initializing on first `queryCollection()`
    // call — chunks still ship in build output, but runtime calls will
    // throw if they ever land. `projects` and `tools` keep default because
    // their `[slug]` routes may runtime-nav to non-prerendered entries;
    // same applies for any future route adding a runtime `queryCollection`.
    // `clientDB: false` for `projects` and `tools` too: every slug is
    // known at build time (static markdown/YAML) and is explicitly
    // prerendered with its route payload, so client-side navigation
    // hydrates `useAsyncData` from the payload — the in-browser SQLite
    // engine (OPFS WASM + worker, ~1.7 MB) is never initialized and the
    // `wasm-unsafe-eval` CSP allowance can be dropped (audit H4/H5).
    // If a future slug is genuinely dynamic, re-enable clientDB for it.
    projects: defineCollection({
      type: 'page', // Markdown + rendered body; case-study narratives
      source: 'projects/**/*.md',
      schema: ProjectSchema,
      clientDB: false,
    }),
    tools: defineCollection({
      type: 'data', // YAML-only structured records; tool metadata
      source: 'tools/**/*.yml',
      schema: ToolSchema,
      clientDB: false,
    }),
    about: defineCollection({
      type: 'page',
      source: 'about.md',
      schema: AboutSchema,
      clientDB: false,
    }),
    experience: defineCollection({
      type: 'page',
      source: 'experience/**/*.md',
      schema: ExperienceSchema,
      clientDB: false,
    }),
    personalSkills: defineCollection({
      type: 'data',
      source: 'skills/personal-skills.yml',
      schema: PersonalSkillsSchema,
      clientDB: false,
    }),
  },
})
