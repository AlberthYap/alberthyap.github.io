import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Heading from '~~/app/components/ui/Heading.vue'

describe('Heading', () => {
  it('defaults to <h2> per DESIGN.md §4.3 (most common usage)', () => {
    const wrapper = mount(Heading, { slots: { default: 'Section' } })
    expect(wrapper.element.tagName).toBe('H2')
  })

  it('renders <h1> when as="h1"', () => {
    const wrapper = mount(Heading, {
      props: { as: 'h1' },
      slots: { default: 'Page title' },
    })
    expect(wrapper.element.tagName).toBe('H1')
  })

  it('renders <h3> when as="h3"', () => {
    const wrapper = mount(Heading, {
      props: { as: 'h3' },
      slots: { default: 'Card title' },
    })
    expect(wrapper.element.tagName).toBe('H3')
  })

  it('renders all six heading levels via `as`', () => {
    const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
    for (const level of levels) {
      const wrapper = mount(Heading, {
        props: { as: level },
        slots: { default: 'text' },
      })
      expect(wrapper.element.tagName).toBe(level.toUpperCase())
    }
  })

  it('matches visual size class to semantic level by default', () => {
    const wrapper = mount(Heading, {
      props: { as: 'h2' },
      slots: { default: 'Section' },
    })
    const classList = wrapper.classes().join(' ')
    // h2 size class set contains text-3xl/tight tracking — spot-check one signature.
    expect(classList).toContain('text-3xl')
  })

  it('allows size override independent from semantic level', () => {
    const wrapper = mount(Heading, {
      props: { as: 'h2', size: 'h4' },
      slots: { default: 'Visually smaller heading' },
    })
    const classList = wrapper.classes().join(' ')
    // Still a semantically h2 heading…
    expect(wrapper.element.tagName).toBe('H2')
    // …but visually painted with the h4 scale.
    expect(classList).toContain('text-xl')
    expect(classList).not.toContain('text-3xl')
  })

  it('emits slot content', () => {
    const wrapper = mount(Heading, {
      slots: { default: '<span>Project title</span>' },
    })
    expect(wrapper.text()).toBe('Project title')
  })

  it('forwards id prop to the rendered heading element for aria-labelledby wiring', () => {
    const wrapper = mount(Heading, {
      props: { as: 'h2', id: 'skills-heading' },
      slots: { default: 'Skills' },
    })
    expect(wrapper.element.id).toBe('skills-heading')
  })
})
