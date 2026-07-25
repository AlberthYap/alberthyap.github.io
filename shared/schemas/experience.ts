import { z } from 'zod'

export const SkillGroupSchema = z.object({
  category: z.string().min(1).max(40),
  items: z.array(z.string()).min(1),
})

/**
 * Experience schema for `content/experience/*.md` — one role per entry.
 * Skills.vue aggregates the `skills` frontmatter across all entries.
 */
export const ExperienceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case slug required'),
  company: z.string(),
  role: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM required'),
  endDate: z.union([
    z.literal('present'),
    z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM or "present"'),
  ]),
  summary: z.string().min(20).max(280),
  skills: z.array(SkillGroupSchema).default([]),
  achievements: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
})
