import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// `useRoute` in Navbar.vue is imported explicitly from vue-router, so the
// test mocks the whole module factory. This mirrors how a real Nuxt runtime
// resolves the auto-import and is the only way to substitute a value at the
// module-scope binding level in strict ES modules.
const useRouteMock = vi.fn(() => ({ path: '/' }))
vi.mock('vue-router', () => ({
  useRoute: useRouteMock,
}))

// Re-import lazily so the mock above takes effect.
const { default: Navbar } = await import('~~/app/components/layout/Navbar.vue')

// Window stub for scroll listener tests.
function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value })
}

describe('Navbar', () => {
  beforeEach(() => {
    useRouteMock.mockReturnValue({ path: '/' })
    setScrollY(0)
  })

  it('renders the site name as a link to home', () => {
    const wrapper = mount(Navbar)
    const anchor = wrapper.find('a[href="/"]')
    expect(anchor.exists()).toBe(true)
    expect(anchor.text().length).toBeGreaterThan(0)
  })

  it('renders 3 primary nav links (Home, Projects, Tools)', () => {
    const wrapper = mount(Navbar)
    const nav = wrapper.find('nav[aria-label="Primary"]')
    expect(nav.exists()).toBe(true)
    expect(nav.text()).toContain('Home')
    expect(nav.text()).toContain('Projects')
    expect(nav.text()).toContain('Tools')
  })

  it('marks current route with aria-current="page"', () => {
    useRouteMock.mockReturnValue({ path: '/projects' })
    const wrapper = mount(Navbar)
    const nav = wrapper.find('nav[aria-label="Primary"]')
    const projectsLink = nav.find('a[href="/projects"]')
    expect(projectsLink.attributes('aria-current')).toBe('page')
  })

  it('does not mark non-matching routes as current', () => {
    useRouteMock.mockReturnValue({ path: '/projects' })
    const wrapper = mount(Navbar)
    const nav = wrapper.find('nav[aria-label="Primary"]')
    const toolsLink = nav.find('a[href="/tools"]')
    expect(toolsLink.attributes('aria-current')).toBeUndefined()
  })

  it('starts in transparent state at scrollY = 0', () => {
    const wrapper = mount(Navbar)
    expect(wrapper.classes().join(' ')).toContain('bg-transparent')
  })

  it('adds background + border when scrolled >= 16 px', async () => {
    setScrollY(100)
    const wrapper = mount(Navbar)
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    const classList = wrapper.classes().join(' ')
    expect(classList).toContain('border-border')
    expect(classList).not.toContain('bg-transparent')
  })

  it('exposes a hamburger button on mobile breakpoints via md:hidden', () => {
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
    const mobileLink = wrapper.find('#mobile-menu a[href="/projects"]')
    await mobileLink.trigger('click')
    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
  })
})
