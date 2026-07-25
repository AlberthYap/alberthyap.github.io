import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Skills from '~~/app/components/portfolio/Skills.vue'
import type { SkillGroup } from '~~/shared/types'

/**
 * Skills v5 — Core Stack (Organic Professional).
 *
 * Layout: 3-up grid of glass-panel cards (`tonal-card`). Heading reads
 * "Core Stack" with the "Stack" word tinted primary. Each card carries
 * a "Production Ready" status pill, a serif h3 category title, an
 * editor's description, and a list of `tech-pill` items.
 */
const groups: readonly SkillGroup[] = [
  { category: 'Frontend', items: ['Vue 3', 'Nuxt 4', 'TypeScript'] },
  { category: 'Tooling', items: ['Vitest', 'Playwright'] },
  { category: 'Practices', items: ['A11y', 'Performance'] },
]

describe('Skills (Core Stack edition)', () => {
  it('renders the section with id="skills" for in-page anchors', () => {
    const wrapper = mount(Skills, { props: { groups } })
    expect(wrapper.find('section#skills').exists()).toBe(true)
  })

  it('renders a Core Stack heading with primary tint on the second word', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const heading = wrapper.find('#skills-heading')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Core')
    expect(heading.text()).toContain('Stack')
    expect(heading.find('span.text-primary').exists()).toBe(true)
  })

  it('caps the rendered cards at 3 (Core Stack keeps 3-up)', () => {
    const wrapper = mount(Skills, {
      props: {
        groups: [
          { category: 'Frontend', items: ['Vue 3'] },
          { category: 'Tooling', items: ['Vitest'] },
          { category: 'Practices', items: ['A11y'] },
          { category: 'Backend', items: ['Rust'] },
        ],
      },
    })
    expect(wrapper.findAll('article')).toHaveLength(3)
  })

  it('renders each card with a "Production Ready" status pill', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const pills = wrapper.findAll('article span')[0] // upper-right pill
    expect(wrapper.text()).toContain('Production Ready')
    expect(pills.text()).toContain('Production Ready')
  })

  it('renders tech items as tech-pill chips (mono uppercase)', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const pills = wrapper.findAll('.tech-pill')
    expect(pills.length).toBeGreaterThanOrEqual(7)
    // Every tech-pill carries the mono uppercase styling alias.
    pills.forEach((pill) => {
      expect(pill.classes()).toContain('tech-pill')
    })
  })

  it('emits `data-stagger` indices so the cascade animates cards in order', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const articles = wrapper.findAll('article')
    // Index 2..4 on each card (after the heading+intro stagger 0..1).
    expect(articles[0]?.attributes('data-stagger')).toBe('2')
    expect(articles[1]?.attributes('data-stagger')).toBe('3')
    expect(articles[2]?.attributes('data-stagger')).toBe('4')
  })

  it('emits heading at data-stagger="0" + intro paragraph at "1"', () => {
    const wrapper = mount(Skills, { props: { groups } })
    expect(wrapper.find('#skills-heading').attributes('data-stagger')).toBe('0')
    expect(wrapper.find('p[data-stagger="1"]').exists()).toBe(true)
  })

  it('still renders the heading when groups is empty', () => {
    const wrapper = mount(Skills, { props: { groups: [] } })
    expect(wrapper.find('#skills-heading').exists()).toBe(true)
    expect(wrapper.findAll('article')).toHaveLength(0)
  })
})
