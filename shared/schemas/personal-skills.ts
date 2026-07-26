import { z } from 'zod'

import { SkillGroupSchema } from './experience'

/**
 * Schema for `content/skills/personal-skills.yml` — a standalone list of
 * self-learned or personal-project technologies that aren't tied to any
 * single work experience entry. Merged with experience-derived skills
 * at render time by `aggregateSkills` in pages/index.vue.
 */
export const PersonalSkillsSchema = z.object({
  skills: z.array(SkillGroupSchema).default([]),
})
