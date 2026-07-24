import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Footer from '~~/app/components/layout/Footer.vue'

describe('Footer', () => {
  it('renders as <footer>', () => {
    const wrapper = mount(Footer)
    expect(wrapper.element.tagName).toBe('FOOTER')
  })

  it('includes the current year in the copyright line', () => {
    const wrapper = mount(Footer)
    const year = String(new Date().getFullYear())
    expect(wrapper.text()).toContain(year)
  })

  it('renders the footer nav with the 3 primary links', () => {
    const wrapper = mount(Footer)
    const nav = wrapper.find('nav[aria-label="Footer"]')
    expect(nav.exists()).toBe(true)
    expect(nav.text()).toContain('Home')
    expect(nav.text()).toContain('Projects')
    expect(nav.text()).toContain('Tools')
  })

  it('renders social links with safe target + rel for external URLs (code-style.md §10)', () => {
    const wrapper = mount(Footer)
    const externalAnchors = wrapper.findAll('a[target="_blank"]')
    expect(externalAnchors.length).toBeGreaterThan(0)
    for (const anchor of externalAnchors) {
      expect(anchor.attributes('rel')).toBe('noopener noreferrer')
    }
  })

  it('exposes accessible labels for social link icons', () => {
    const wrapper = mount(Footer)
    const ariaLabels = wrapper.findAll('a[aria-label]')
    expect(ariaLabels.length).toBeGreaterThan(0)
  })
})
