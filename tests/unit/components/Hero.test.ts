import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Hero from '~~/app/components/portfolio/Hero.vue'

describe('Hero', () => {
  it('renders the name role headline as an h1', () => {
    const wrapper = mount(Hero, {
      props: { name: 'Alberth Yaputra', role: 'Frontend Engineer' },
    })
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Alberth Yaputra')
    expect(h1.text()).toContain('Frontend Engineer')
  })

  it('renders lead paragraph when provided', () => {
    const wrapper = mount(Hero, {
      props: {
        name: 'A B',
        role: 'Engineer',
        lead: 'A short pitch sentence goes here.',
      },
    })
    expect(wrapper.text()).toContain('A short pitch sentence goes here.')
  })

  it('renders two CTAs (See projects + Get in touch) as NuxtLink stubs', () => {
    const wrapper = mount(Hero, {
      props: { name: 'A B', role: 'Engineer' },
    })
    const anchors = wrapper.findAll('a')
    const hrefs = anchors.map((a) => a.attributes('href')).filter(Boolean)
    expect(hrefs).toContain('/projects')
    expect(hrefs).toContain('#contact')
  })

  it('renders terminal card with default filename label', () => {
    const wrapper = mount(Hero, {
      props: { name: 'A B', role: 'Engineer' },
    })
    expect(wrapper.text()).toContain('~/whoami')
  })

  it('honours snippetTitle prop override', () => {
    const wrapper = mount(Hero, {
      props: {
        name: 'A B',
        role: 'Engineer',
        snippetTitle: '~/README.md',
      },
    })
    expect(wrapper.text()).toContain('~/README.md')
    expect(wrapper.text()).not.toContain('~/whoami')
  })

  it('renders default snippet content', () => {
    const wrapper = mount(Hero, {
      props: { name: 'A B', role: 'Engineer' },
    })
    expect(wrapper.text()).toContain('pnpm run whoami')
  })

  it('accepts a custom snippet prop', () => {
    const wrapper = mount(Hero, {
      props: {
        name: 'A B',
        role: 'Engineer',
        snippet: 'const answer = 42;',
      },
    })
    expect(wrapper.text()).toContain('const answer = 42;')
    expect(wrapper.text()).not.toContain('pnpm run whoami')
  })

  it('renders hero as a labelled region for screen readers', () => {
    const wrapper = mount(Hero, {
      props: { name: 'A', role: 'Engineer' },
    })
    const section = wrapper.find('section[aria-labelledby="hero-heading"]')
    expect(section.exists()).toBe(true)
  })
})
