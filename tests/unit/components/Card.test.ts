import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Card from '~~/app/components/ui/Card.vue'

const renderSlots = {
  media: '<img alt="cover" />',
  header: '<h3>Title</h3>',
  default: '<p>Body text goes here.</p>',
  footer: '<span>Footer</span>',
}

describe('Card', () => {
  it('renders as <article> when no href provided', () => {
    const wrapper = mount(Card, { slots: renderSlots })
    expect(wrapper.element.tagName).toBe('ARTICLE')
  })

  it('renders as <a> when href is provided', () => {
    const wrapper = mount(Card, {
      props: { href: '/projects/inventory' },
      slots: renderSlots,
    })
    expect(wrapper.element.tagName).toBe('A')
    expect((wrapper.element as HTMLAnchorElement).getAttribute('href'))
      .toBe('/projects/inventory')
  })

  it('adds safe target+rel on external https links (code-style.md §10)', () => {
    const wrapper = mount(Card, {
      props: { href: 'https://example.com/repo' },
      slots: renderSlots,
    })
    const a = wrapper.element as HTMLAnchorElement
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('does not add target/rel on internal paths', () => {
    const wrapper = mount(Card, {
      props: { href: '/projects/foo' },
      slots: renderSlots,
    })
    expect(wrapper.attributes('target')).toBeUndefined()
    expect(wrapper.attributes('rel')).toBeUndefined()
  })

  it('renders all slot regions', () => {
    const wrapper = mount(Card, { slots: renderSlots })
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Title')
    expect(wrapper.text()).toContain('Body text goes here.')
    expect(wrapper.text()).toContain('Footer')
  })

  it('clickable card exposes focus-visible ring for keyboard users', () => {
    const wrapper = mount(Card, {
      props: { href: '/projects/foo' },
      slots: renderSlots,
    })
    expect(wrapper.classes().join(' ')).toContain('focus-visible:ring-primary')
  })

  it('static article card does not apply interactive classes', () => {
    const wrapper = mount(Card, { slots: renderSlots })
    expect(wrapper.classes().join(' ')).not.toContain('cursor-pointer')
  })

  it('default variant uses border-border', () => {
    const wrapper = mount(Card, { slots: renderSlots })
    expect(wrapper.classes().join(' ')).toContain('border-border')
  })
})
