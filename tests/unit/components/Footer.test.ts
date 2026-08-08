import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Footer from '~~/app/components/layout/Footer.vue'
import { SITE_NAME, SOCIAL_LINKS } from '~~/shared/constants/site'

/**
 * Footer — Status footer (Organic Professional).
 *
 * Pattern from example.html: brand wordmark + status pill at left,
 * social links grid at right, copyright row at bottom. No in-app
 * NAV_LINKS here — those live exclusively in the floating pill navbar
 * so the footer stays a brand/identity surface.
 */

describe('Footer', () => {
  it('renders as <footer>', () => {
    const wrapper = mount(Footer)
    expect(wrapper.element.tagName).toBe('FOOTER')
  })

  it('renders the brand wordmark (Literata serif headline)', () => {
    const wrapper = mount(Footer)
    expect(wrapper.text()).toContain(SITE_NAME)
  })

  it('carries the "All systems operational" status text', () => {
    const wrapper = mount(Footer)
    expect(wrapper.text()).toContain('All systems operational')
  })

  it('includes the current year in the copyright line', () => {
    const wrapper = mount(Footer)
    const year = String(new Date().getFullYear())
    expect(wrapper.text()).toContain(year)
  })

  it('renders social links with safe target + rel for external URLs', () => {
    const wrapper = mount(Footer)
    const externalAnchors = wrapper.findAll('a[target="_blank"]')
    expect(externalAnchors.length).toBeGreaterThanOrEqual(SOCIAL_LINKS.length)
    for (const anchor of externalAnchors) {
      expect(anchor.attributes('rel')).toBe('noopener noreferrer')
    }
  })

  it('exposes accessible labels for social link anchors', () => {
    const wrapper = mount(Footer)
    const ariaLabels = wrapper.findAll('a[aria-label]')
    expect(ariaLabels.length).toBeGreaterThan(0)
  })

  it('does NOT render the in-app NAV_LINKS (they live in the navbar pill)', () => {
    // Footer is brand/identity; NAV_LINKS would duplicate the navbar.
    const wrapper = mount(Footer)
    // The footer nav carries aria-label="Social"; another aria-label
    // would indicate a duplicated nav.
    const navBlocks = wrapper.findAll('nav')
    navBlocks.forEach((nav) => {
      expect(nav.attributes('aria-label')).toBe('Social')
    })
  })
})
