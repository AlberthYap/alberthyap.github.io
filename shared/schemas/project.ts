import { z } from 'zod'

/**
 * Project (case study) frontmatter schema per `PRD.md` §9.3.
 * Single source of truth for: build-time validation (Nuxt Content),
 * runtime types (`z.infer` in `shared/types/`), and form/route validation
 * when needed.
 */
export const ProjectSchema = z.object({
  title: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case slug required'),
  description: z.string().min(20).max(280),
  role: z.string(),
  client: z.string(),
  year: z.number().int().min(2000).max(2100),
  status: z.enum(['shipped', 'in-progress', 'archived']),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).min(1),
  technologies: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
    })
  ),
  thumbnail: z.string(),
  images: z.array(z.string()).default([]),
  liveUrl: z.string().url().nullable(),
  repoUrl: z.string().url().nullable(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    })
  ).default([]),
  relatedProjects: z.array(z.string()).default([]),
})

// Bounds rationale: explicit `min`/`max` and regex constraints are layered on
// the PRD §9.3 spec to catch typos and align with `DESIGN.md` §15 SEO conventions
// (e.g. `description` capped near meta-description sweet-spot per SEO norms;
// `slug` regex locks to kebab-case so URLs are stable). Tighten/relax as the
// project grows — these are NOT spec-mandated.
