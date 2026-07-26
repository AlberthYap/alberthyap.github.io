import { z } from 'zod'

import { safeExternalUrl } from './_utils'

/**
 * Tool metadata schema — single source of truth for build-time
 * validation, runtime types, and the tools-catalog UI.
 */
export const ToolSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case slug required'),
  title: z.string().min(1).max(50),
  category: z.enum(['developer', 'productivity', 'design']),
  description: z.string().min(20).max(280),
  icon: z.string(),
  url: safeExternalUrl.optional(),
  repoUrl: safeExternalUrl.optional(),
  featured: z.boolean().default(false),
  keywords: z.array(z.string()).default([]),
  seo: z.object({
    title: z.string().max(60),
    description: z.string().min(50).max(160),
  }),
})
