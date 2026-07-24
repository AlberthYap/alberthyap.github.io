import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Skills from '~~/app/components/portfolio/Skills.vue'
import type { SkillGroup } from '~~/shared/constants/site'

const groups: readonly SkillGroup[] = [
  { title: 'Frontend', items: ['Vue 3', 'Nuxt 4', 'TypeScript'] },
  { title: 'Tooling', items: ['Vitest', 'Playwright'] },
  { title: 'Practices', items: ['A11y', 'Performance'] },
]

describe('Skills', () => {
  it('renders one article per group', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const articles = wrapper.findAll('article')
    expect(articles).toHaveLength(3)
  })

  it('renders each group title as a heading', () => {
    const wrapper = mount(Skills, { props: { groups } })
    expect(wrapper.text()).toContain('Frontend')
    expect(wrapper.text()).toContain('Tooling')
    expect(wrapper.text()).toContain('Practices')
  })

  it('renders 7 items total across 3 groups', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const listItems = wrapper.findAll('li')
    expect(listItems).toHaveLength(7)
  })

  it('marks the section with aria-labelledby', () => {
    const wrapper = mount(Skills, { props: { groups } })
    const section = wrapper.find('section[aria-labelledby="skills-heading"]')
    expect(section.exists()).toBe(true)
  })

  it('still renders the heading when groups is empty', () => {
    const wrapper = mount(Skills, { props: { groups: [] } })
    expect(wrapper.find('h2').exists()).toBe(true)
    expect(wrapper.findAll('article')).toHaveLength(0)
  })
})
