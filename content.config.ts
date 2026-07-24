import { defineContentConfig } from '@nuxt/content'

/**
 * Nuxt Content v3 collection configuration.
 *
 * Content lives at the project root in `content/` (architecture.md §3.1).
 *
 * @see .agents/architecture.md §8 — Content Architecture
 */
// TODO(Phase 1 — Design System / Schemas): register `projects` (page
// collection, source `projects/**/*.md`) and `tools` (data collection,
// source `tools/**/*.yml`) backed by Zod schemas from `shared/schemas/`.
export default defineContentConfig({
  collections: {},
})
