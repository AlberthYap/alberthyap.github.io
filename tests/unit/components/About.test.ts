import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import About from '~~/app/components/portfolio/About.vue'

describe('About', () => {
  it('renders section with id="about" for in-page anchors', () => {
    const wrapper = mount(About, {
      props: { name: 'A', bio: 'Bio.' },
    })
    const section = wrapper.find('section#about')
    expect(section.exists()).toBe(true)
  })

  it('renders an "About" heading', () => {
    const wrapper = mount(About, {
      props: { name: 'A', bio: 'Bio.' },
    })
    expect(wrapper.text()).toContain('About')
  })

  it('renders the bio paragraph', () => {
    const wrapper = mount(About, {
      props: { name: 'A', bio: 'Long-form bio sentence goes here.' },
    })
    expect(wrapper.text()).toContain('Long-form bio sentence goes here.')
  })

  it('renders the highlights list when provided', () => {
    const wrapper = mount(About, {
      props: {
        name: 'A',
        bio: 'Bio.',
        highlights: ['Design systems', 'WCAG a11y', 'Performance budgets'],
      },
    })
    expect(wrapper.text()).toContain('Design systems')
    expect(wrapper.text()).toContain('WCAG a11y')
    expect(wrapper.text()).toContain('Performance budgets')
    expect(wrapper.findAll('li')).toHaveLength(3)
  })

  it('renders the portrait image when provided', () => {
    const wrapper = mount(About, {
      props: {
        name: 'A',
        bio: 'Bio.',
        portrait: { src: '/portrait.jpg', alt: 'Portrait of A' },
      },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/portrait.jpg')
    expect(img.attributes('alt')).toBe('Portrait of A')
  })

  it('falls back to a decorative placeholder when portrait is omitted', () => {
    const wrapper = mount(About, {
      props: { name: 'Alberth', bio: 'Bio.' },
    })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Alberth')
  })

  it('does not render an empty highlights list', () => {
    const wrapper = mount(About, {
      props: { name: 'A', bio: 'Bio.', highlights: [] },
    })
    expect(wrapper.find('ul').exists()).toBe(false)
  })
})
