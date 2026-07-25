import { describe, expect, it } from 'vitest'

import { AboutSchema } from '~~/shared/schemas/about'

describe('AboutSchema', () => {
  it('parses a valid about entry', () => {
    const result = AboutSchema.safeParse({
      name: 'Alberth Yaputra',
      tagline: 'A short tagline.',
      highlights: ['WCAG a11y', 'Static-first'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Alberth Yaputra')
      expect(result.data.tagline).toBe('A short tagline.')
      expect(result.data.highlights).toEqual(['WCAG a11y', 'Static-first'])
      // New defaults in Phase 4: eyebrow falls back to "Now".
      expect(result.data.eyebrow).toBe('Now')
      expect(result.data.footnote).toBeUndefined()
    }
  })

  it('accepts an optional portrait', () => {
    const result = AboutSchema.safeParse({
      name: 'A',
      tagline: 'Tagline.',
      portrait: { src: '/portrait.jpg', alt: 'Portrait' },
    })
    expect(result.success).toBe(true)
  })

  it('accepts a custom eyebrow override', () => {
    const result = AboutSchema.safeParse({
      name: 'A',
      tagline: 'Tagline.',
      eyebrow: 'Currently',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eyebrow).toBe('Currently')
    }
  })

  it('accepts a footnote when supplied', () => {
    const result = AboutSchema.safeParse({
      name: 'A',
      tagline: 'Tagline.',
      footnote: 'Open to select frontend problems.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.footnote).toBe('Open to select frontend problems.')
    }
  })

  it('defaults highlights to an empty array when omitted', () => {
    const result = AboutSchema.safeParse({
      name: 'A',
      tagline: 'Tagline.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.highlights).toEqual([])
    }
  })

  it('rejects missing required `name`', () => {
    const result = AboutSchema.safeParse({ tagline: 'No name provided.' })
    expect(result.success).toBe(false)
  })

  it('rejects tagline exceeding 160 chars', () => {
    const result = AboutSchema.safeParse({
      name: 'A',
      tagline: 'x'.repeat(161),
    })
    expect(result.success).toBe(false)
  })

  it('rejects eyebrow exceeding 40 chars', () => {
    const result = AboutSchema.safeParse({
      name: 'A',
      tagline: 'Tagline.',
      eyebrow: 'x'.repeat(41),
    })
    expect(result.success).toBe(false)
  })

  it('rejects footnote exceeding 280 chars', () => {
    const result = AboutSchema.safeParse({
      name: 'A',
      tagline: 'Tagline.',
      footnote: 'x'.repeat(281),
    })
    expect(result.success).toBe(false)
  })
})
