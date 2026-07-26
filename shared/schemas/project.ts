import { z } from 'zod'

import { safeExternalUrl } from './_utils'

/**
 * Project (case study) frontmatter schema — single source of truth
 * for build-time validation, runtime types, and form/route validation.
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
  liveUrl: safeExternalUrl.nullable(),
  repoUrl: safeExternalUrl.nullable(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    })
  ).default([]),
  relatedProjects: z.array(z.string()).default([]),
})
