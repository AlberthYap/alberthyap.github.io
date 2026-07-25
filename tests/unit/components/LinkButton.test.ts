import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import LinkButton from '~~/app/components/ui/LinkButton.vue'

describe('LinkButton', () => {
  it('renders as anchor (via NuxtLink stub) with correct href for string route', () => {
    const wrapper = mount(LinkButton, {
      props: { to: '/projects' },
      slots: { default: 'See projects' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/projects')
  })

  it('renders href for object-style route ({ path })', () => {
    const wrapper = mount(LinkButton, {
      props: { to: { path: '/projects/foo' } },
      slots: { default: 'Detail' },
    })
    expect(wrapper.attributes('href')).toBe('/projects/foo')
  })

  it('respects ariaLabel override', () => {
    const wrapper = mount(LinkButton, {
      props: {
        to: '/contact',
        ariaLabel: 'Send a message to the team',
      },
      slots: { default: 'Contact' },
    })
    expect(wrapper.attributes('aria-label')).toBe('Send a message to the team')
  })

  it('applies primary variant classes (bg-primary text-white)', () => {
    const wrapper = mount(LinkButton, {
      props: { to: '/', variant: 'primary' },
    })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('bg-primary')
    // White text on sage green for maximum readability across displays.
    expect(classList).toContain('text-white')
  })

  it('applies secondary variant (green-tinted border, no bg)', () => {
    const wrapper = mount(LinkButton, {
      props: { to: '/', variant: 'secondary' },
    })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('border-primary')
    expect(classList).toContain('bg-transparent')
  })

  it('applies ghost variant (no background or border)', () => {
    const wrapper = mount(LinkButton, {
      props: { to: '/', variant: 'ghost' },
    })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('bg-transparent')
  })

  it('applies lg size (48 px = h-12) per DESIGN.md §7.1', () => {
    const wrapper = mount(LinkButton, {
      props: { to: '/', size: 'lg' },
    })
    expect(wrapper.classes().join(' ')).toContain('h-12')
  })

  it('exposes focus-visible ring for keyboard a11y', () => {
    const wrapper = mount(LinkButton, {
      props: { to: '/' },
    })
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('focus-visible:ring-primary')
  })

  it('passes slot content through', () => {
    const wrapper = mount(LinkButton, {
      props: { to: '/' },
      slots: { default: 'Visit site' },
    })
    expect(wrapper.text()).toBe('Visit site')
  })

  it('does not require Vue Router context (works in plain markup)', () => {
    // The NuxtLink stub handles string routes without a router instance.
    const wrapper = mount(LinkButton, {
      props: { to: '/projects/inventory' },
      slots: { default: 'Open' },
    })
    expect(wrapper.attributes('href')).toBe('/projects/inventory')
  })
})
