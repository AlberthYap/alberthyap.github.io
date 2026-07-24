import { defineCollection, defineContentConfig } from '@nuxt/content'

import { ProjectSchema } from '~~/shared/schemas/project'
import { ToolSchema } from '~~/shared/schemas/tool'

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
export default defineContentConfig({
  collections: {
    projects: defineCollection({
      type: 'page', // Markdown + rendered body; case-study narratives
      source: 'projects/**/*.md',
      schema: ProjectSchema,
    }),
    tools: defineCollection({
      type: 'data', // YAML-only structured records; tool metadata
      source: 'tools/**/*.yml',
      schema: ToolSchema,
    }),
  },
})
