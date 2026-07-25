import { z } from 'zod'

/**
 * About (singleton page) frontmatter schema — single source of truth
 * for build-time validation, runtime types, and the hero/about copy.
 *
 * One file at `content/about.md` declares site identity and the lead
 * paragraph read by the home page. `highlight` items surface as the
 * About narrative section's bullets.
 *
 * Min lengths are intentionally permissive (≥1) so authors can write
 * short taglines during early-stage setup; max lengths stay tight so
 * the rendered lead doesn't blow out the reading column.
 */
export const AboutSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().min(1).max(160),
  eyebrow: z.string().min(1).max(40).default('Now'),
  footnote: z.string().min(1).max(280).optional(),
  highlights: z.array(z.string()).default([]),
  portrait: z
    .object({
      src: z.string().min(1),
      alt: z.string().min(1),
    })
    .optional(),
})
