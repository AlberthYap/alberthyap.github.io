import { describe, expect, it } from 'vitest'

import {
  ExperienceSchema,
  SkillGroupSchema,
} from '~~/shared/schemas/experience'

describe('SkillGroupSchema', () => {
  it('parses a valid skill group', () => {
    const result = SkillGroupSchema.safeParse({
      category: 'Frontend',
      items: ['Vue 3', 'TypeScript'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty items array', () => {
    const result = SkillGroupSchema.safeParse({
      category: 'Frontend',
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects category shorter than 1 char', () => {
    const result = SkillGroupSchema.safeParse({
      category: '',
      items: ['Vue 3'],
    })
    expect(result.success).toBe(false)
  })
})

describe('ExperienceSchema', () => {
  const baseExperience = {
    slug: 'acme-frontend-2023-present',
    company: 'Acme Corp',
    role: 'Senior Frontend Engineer',
    startDate: '2023-01',
    endDate: 'present',
    summary: 'Lead frontend for the next-generation inventory dashboard.',
    skills: [
      { category: 'Frontend', items: ['Vue 3', 'TypeScript'] },
    ],
  }

  it('parses a valid experience entry (endDate "present")', () => {
    const result = ExperienceSchema.safeParse(baseExperience)
    expect(result.success).toBe(true)
  })

  it('parses endDate as ISO YYYY-MM', () => {
    const result = ExperienceSchema.safeParse({ ...baseExperience, endDate: '2021-06' })
    expect(result.success).toBe(true)
  })

  it('rejects slug with non-kebab-case characters', () => {
    const result = ExperienceSchema.safeParse({ ...baseExperience, slug: 'Bad Slug' })
    expect(result.success).toBe(false)
  })

  it('rejects startDate outside YYYY-MM format', () => {
    const result = ExperienceSchema.safeParse({ ...baseExperience, startDate: '01/2023' })
    expect(result.success).toBe(false)
  })

  it('rejects endDate that is neither "present" nor YYYY-MM', () => {
    const result = ExperienceSchema.safeParse({ ...baseExperience, endDate: 'Present' })
    expect(result.success).toBe(false)
  })

  it('defaults skills to an empty array when omitted', () => {
    const { skills, ...rest } = baseExperience
    const result = ExperienceSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.skills).toEqual([])
    }
  })

  it('rejects summary shorter than 20 chars', () => {
    const result = ExperienceSchema.safeParse({ ...baseExperience, summary: 'too short' })
    expect(result.success).toBe(false)
  })

  it('defaults achievements to an empty array when omitted', () => {
    const result = ExperienceSchema.safeParse(baseExperience)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.achievements).toEqual([])
    }
  })

  it('parses achievements when supplied', () => {
    const withAchievements = {
      ...baseExperience,
      achievements: ['First achievement', 'Second achievement'],
    }
    const result = ExperienceSchema.safeParse(withAchievements)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.achievements).toHaveLength(2)
    }
  })

  it('defaults technologies to an empty array when omitted', () => {
    const result = ExperienceSchema.safeParse(baseExperience)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.technologies).toEqual([])
    }
  })

  it('parses technologies when supplied', () => {
    const withTech = {
      ...baseExperience,
      technologies: ['React', 'TypeScript'],
    }
    const result = ExperienceSchema.safeParse(withTech)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.technologies).toHaveLength(2)
    }
  })

  it('accepts optional location and type metadata', () => {
    const result = ExperienceSchema.safeParse({
      ...baseExperience,
      location: 'Jakarta, Indonesia',
      type: 'Full-time',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.location).toBe('Jakarta, Indonesia')
      expect(result.data.type).toBe('Full-time')
    }
  })

  it('rejects type values outside the employment-type enum', () => {
    const result = ExperienceSchema.safeParse({ ...baseExperience, type: 'Freelance-ish' })
    expect(result.success).toBe(false)
  })
})
