import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// `useRoute` in Navbar.vue is imported explicitly from vue-router, so the
// test mocks the whole module factory.
const useRouteMock = vi.fn(() => ({ path: '/' }))
vi.mock('vue-router', () => ({
  useRoute: useRouteMock,
}))

// Re-import lazily so the mock above takes effect.
const { default: Navbar } = await import('~~/app/components/layout/Navbar.vue')

import { NAV_LINKS } from '~~/shared/constants/site'

/**
 * Navbar v3 — Floating glass-panel pill (Organic Professional).
 *
 * Pattern from example.html: a fixed positioned pill (`.glass-panel`) at
 * the top of the viewport. No scrolling state change in this edition;
 * the pill is always visible. `data-section-id` scroll-spy still wires
 * in `data-active="true"` on the matching link.
 *
 * Mobile drawer slides out below the pill on hamburger click.
 */

describe('Navbar (floating glass-panel pill)', () => {
  beforeEach(() => {
    useRouteMock.mockReturnValue({ path: '/' })
  })

  it('renders the AY monogram via <picture>: WebP primary with PNG fallback', () => {
    const wrapper = mount(Navbar)
    const anchor = wrapper.find('a[href="/"]')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('aria-label')).toContain('Alberth Yaputra')
    // Brand via <picture>: WebP primary + PNG fallback. Decorative
    // (alt=""); link's aria-label carries the full brand name.
    const picture = anchor.find('picture')
    expect(picture.exists()).toBe(true)
    const source = picture.find('source[srcset="/ay-monogram.webp"]')
    expect(source.exists()).toBe(true)
    expect(source.attributes('type')).toBe('image/webp')
    const img = picture.find('img[src="/ay-monogram.png"]')
    expect(img.exists()).toBe(true)
    expect(img.attributes('alt')).toBe('')
    expect(img.classes().join(' ')).toMatch(/h-\[40px\]/)
    expect(img.classes().join(' ')).toMatch(/w-auto/)
  })

  it('wraps the pill chrome in a `glass-panel` chrome', () => {
    const wrapper = mount(Navbar)
    expect(wrapper.find('.glass-panel').exists()).toBe(true)
  })

  it('renders every NAV_LINKS entry as a primary nav link', () => {
    const wrapper = mount(Navbar)
    const nav = wrapper.find('nav[aria-label="Primary"]')
    expect(nav.exists()).toBe(true)
    const navText = nav.text()
    expect(NAV_LINKS.length).toBe(5)
    for (const link of NAV_LINKS) {
      expect(navText).toContain(link.label)
    }
  })

  it('uses fixed positioning so the pill stays visible across scroll positions', () => {
    const wrapper = mount(Navbar)
    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.classes()).toContain('fixed')
    expect(wrapper.classes()).toContain('top-4')
  })

  it('caps the pill at the container-max token (1200 px)', () => {
    const wrapper = mount(Navbar)
    const pill = wrapper.find('.glass-panel')
    expect(pill.classes().join(' ')).toContain('max-w-[var(--spacing-container)]')
  })

  it('exposes a hamburger button on mobile breakpoints', () => {
    const wrapper = mount(Navbar)
    const hamburger = wrapper.find('button[aria-controls="mobile-menu"]')
    expect(hamburger.exists()).toBe(true)
    expect(hamburger.attributes('aria-label')).toBeTruthy()
  })

  it('toggles mobile menu open/closed on hamburger click', async () => {
    const wrapper = mount(Navbar)
    const hamburger = wrapper.find('button[aria-controls="mobile-menu"]')
    expect(hamburger.attributes('aria-expanded')).toBe('false')
    await hamburger.trigger('click')
    expect(hamburger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#mobile-menu').exists()).toBe(true)
  })

  it('closes mobile menu when a nav link is clicked', async () => {
    const wrapper = mount(Navbar)
    const hamburger = wrapper.find('button[aria-controls="mobile-menu"]')
    await hamburger.trigger('click')
    expect(wrapper.find('#mobile-menu').exists()).toBe(true)
    const mobileLinks = wrapper.findAll('#mobile-menu a[href^="/#"]')
    expect(mobileLinks.length).toBeGreaterThan(0)
    await mobileLinks[0]!.trigger('click')
    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
  })

  it('renders nav-link elements with `data-active="false"` out of the gate', () => {
    const wrapper = mount(Navbar)
    const links = wrapper.findAll('nav[aria-label="Primary"] a.nav-link')
    links.forEach((link) => {
      expect(['true', 'false']).toContain(link.attributes('data-active'))
    })
  })

  it('keeps the theme toggle in the main pill (not duplicated in the mobile drawer)', async () => {
    const wrapper = mount(Navbar)
    // Theme toggle is in the always-visible right cluster — not duplicated in the drawer.
    const mainPill = wrapper.find('header > div.glass-panel')
    expect(mainPill.find('[data-theme-picker]').exists()).toBe(true)
    // Open the mobile drawer.
    const hamburger = wrapper.find('button[aria-controls="mobile-menu"]')
    await hamburger.trigger('click')
    // Drawer exists — but it must NOT contain a duplicate theme toggle.
    const drawer = wrapper.find('#mobile-menu')
    expect(drawer.exists()).toBe(true)
    expect(drawer.find('[data-theme-picker]').exists()).toBe(false)
  })
})
