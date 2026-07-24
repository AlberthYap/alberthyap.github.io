import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Badge from '~~/app/components/ui/Badge.vue'

describe('Badge', () => {
  it('renders default slot text', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'TypeScript' },
    })
    expect(wrapper.text()).toBe('TypeScript')
  })

  it('renders as an inline <span>', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'TS' },
    })
    expect(wrapper.element.tagName).toBe('SPAN')
  })

  it('uses pill shape (rounded-full)', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'TS' },
    })
    expect(wrapper.classes().join(' ')).toContain('rounded-full')
  })

  it('uses mono font for code-like identity per DESIGN.md §4.2', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'TS' },
    })
    expect(wrapper.classes().join(' ')).toContain('font-mono')
  })

  it('applies neutral default variant classes', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'tag' },
    })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('bg-surface')
    expect(classList).toContain('text-muted')
  })

  it('applies tech variant — primary-soft background and primary text', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'tech' },
      slots: { default: 'Vue' },
    })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('bg-primary-soft')
    expect(classList).toContain('text-primary')
  })

  it('applies status-shipped variant with accent color', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'status-shipped' },
      slots: { default: 'shipped' },
    })
    expect(wrapper.classes().join(' ')).toContain('text-accent')
  })

  it('applies status-archived variant with muted appearance', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'status-archived' },
      slots: { default: 'archived' },
    })
    expect(wrapper.classes().join(' ')).toContain('text-muted')
  })
})
