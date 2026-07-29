import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Skills from '~~/app/components/portfolio/Skills.vue'
import type { SkillGroup } from '~~/shared/types'

/**
 * Skills — Single column, category heading + chips with icons.
 */
const groups: readonly SkillGroup[] = [
  { category: 'Frontend', items: ['Vue 3', 'Nuxt 4', 'TypeScript'] },
  { category: 'Tooling', items: ['Vitest', 'Playwright'] },
  { category: 'Practices', items: ['A11y', 'Performance'] },
]

describe('Skills (chips with icons)', () => {
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
    expect(heading.find('span.text-primary-deep').exists()).toBe(true)
  })

  it('renders all skill categories as h3 headings', () => {
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
    const headings = wrapper.findAll('h3')
    expect(headings.length).toBe(4)
    expect(headings[0].text()).toBe('Frontend')
    expect(headings[1].text()).toBe('Tooling')
    expect(headings[2].text()).toBe('Practices')
    expect(headings[3].text()).toBe('Backend')
  })

  it('renders tech items as skill-chip pills with icons', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const chips = wrapper.findAll('.skill-chip')
    expect(chips.length).toBeGreaterThanOrEqual(7)
    chips.forEach((chip) => {
      expect(chip.find('svg').exists()).toBe(true)
    })
  })

  it('renders category heading with uppercase mono styling', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const categoryEl = wrapper.find('h3')
    expect(categoryEl.exists()).toBe(true)
    expect(categoryEl.text()).toBe('Frontend')
    const parent = categoryEl.element.parentElement
    expect(parent?.getAttribute('data-stagger')).toBeDefined()
  })

  it('emits heading wrapper at data-stagger="0"', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const headerWrapper = wrapper.find('[data-stagger="0"]')
    expect(headerWrapper.exists()).toBe(true)
    expect(headerWrapper.find('#skills-heading').exists()).toBe(true)
  })

  it('still renders the heading when groups is empty', () => {
    const wrapper = mount(Skills, { props: { groups: [] } })
    expect(wrapper.find('#skills-heading').exists()).toBe(true)
    expect(wrapper.findAll('.skill-chip')).toHaveLength(0)
  })
})
