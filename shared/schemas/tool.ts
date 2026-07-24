import { z } from 'zod'

/**
 * Tool metadata schema per `PRD.md` §9.4.
 * Source of truth for: build-time validation (Nuxt Content),
 * runtime types (`z.infer` in `shared/types/`), and tools-catalog UI.
 */
export const ToolSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case slug required'),
  title: z.string().min(1).max(50),
  category: z.enum(['developer', 'productivity', 'design']),
  description: z.string().min(20).max(280),
  icon: z.string(),
  featured: z.boolean().default(false),
  keywords: z.array(z.string()).default([]),
  seo: z.object({
    title: z.string().max(60),
    description: z.string().min(50).max(160),
  }),
})

// Bounds rationale: `seo.title` ≤ 60 and `seo.description` 50–160 are SEO
// best-practice (DESIGN §15 / PRD §15 implicit) — Google SERP truncation
// thresholds. `title` ≤ 50 and `description` 20–280 are UX chips-fits +
// meta sweet-spot. PRD §9.4 does not specify bounds; tighten/relax as the
// project grows.
