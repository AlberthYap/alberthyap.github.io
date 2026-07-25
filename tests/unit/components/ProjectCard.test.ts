import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { Project } from '~~/shared/types'

import ProjectCard from '~~/app/components/portfolio/ProjectCard.vue'

const baseProject: Project = {
  title: 'Inventory Dashboard',
  slug: 'inventory-dashboard',
  description: 'Real-time stock visibility dashboard for warehouse teams working across timezones.',
  role: 'Lead Frontend',
  client: 'Acme Corp',
  year: 2024,
  status: 'shipped',
  featured: true,
  tags: ['Vue 3', 'TypeScript', 'Tailwind'],
  technologies: [{ name: 'Vue', purpose: 'UI framework' }],
  thumbnail: '/projects/inventory/cover.png',
  images: [],
  liveUrl: 'https://inventory.example.com',
  repoUrl: null,
  metrics: [],
  relatedProjects: [],
}

/**
 * ProjectCard v4 — Vertical full-bleed cover (Organic Professional).
 *
 * The card refactor turns the previous horizontal split into a
 * Hero-style top image with content stacked below. Two consequences
 * that tests need to know about:
 *
 *   • Root is `<article>`, NOT `<a>` — nested interactive elements
 *     were invalid. The `tonal-card` class now sits on the article
 *     element directly.
 *   • The image is wrapped in a NuxtLink (`<a>`); "View case study"
 *     is a real `<LinkButton>` (a separate `<a>`). Tests
 *     `wrapper.find('a')` only resolves the first anchor (image
 *     link); CTAs surface via `wrapper.text()`.
 *
 * Status badge: derived from `project.status` ('shipped' →
 * "Active · Production"; 'in-progress' → "In Progress"), replacing
 * the v2 "Featured" badge.
 *
 * Scroll-spy wiring: card carries `data-project-marker` +
 * `data-project-slug="<slug>"` so `useProjectObserver` (the page-
 * level sticky counter composable) can track which card is
 * currently dominant in the viewport.
 */

describe('ProjectCard (vertical full-bleed cover)', () => {
  it('renders a tonal-card layout on the article root', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    // Root switched from <a> to <article> so the card can host
    // nested interactive elements (NuxtLink on image, LinkButton for
    // CTAs) without invalid-HTML warnings.
    expect(wrapper.find('article.tonal-card').exists()).toBe(true)
  })

  it('exposes scroll-spy attributes for useProjectObserver', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const root = wrapper.find('[data-project-marker]')
    expect(root.exists()).toBe(true)
    expect(root.attributes('data-project-slug')).toBe(baseProject.slug)
  })

  it('mounts a NuxtLink wrapping the portrait image at the top', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const coverLink = wrapper.find('a[href="/projects/inventory-dashboard"]')
    expect(coverLink.exists()).toBe(true)
    // First anchor in DOM order is the image link — confirms the
    // refactor preserved "image-navigates-to-project" affordance.
    expect(wrapper.find('a').attributes('href')).toBe('/projects/inventory-dashboard')
  })

  it('renders the cover image with aspect-video (full-bleed 16:9)', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const cover = wrapper.find('.aspect-video')
    expect(cover.exists()).toBe(true)
    // The cover wrapper is a NuxtLink with the aspect-video class
    // directly applied, not via a child layer.
    expect(cover.element.tagName.toLowerCase()).toBe('a')
  })

  it('renders the cover image with descriptive alt text', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const img = wrapper.find('.aspect-video img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('alt')).toBe(`${baseProject.title} cover`)
    expect(img.attributes('src')).toBe(baseProject.thumbnail)
  })

  it('marks the thumbnail as lazy-loaded', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.find('.aspect-video img').attributes('loading')).toBe('lazy')
  })

  it('renders the project title and status badge when shipped', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.text()).toContain(baseProject.title)
    expect(wrapper.text()).toContain('Active')
  })

  it('shows "In Progress" badge when project.status="in-progress"', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: { ...baseProject, status: 'in-progress' } },
    })
    expect(wrapper.text()).toContain('In Progress')
  })

  it('renders the description as the body copy', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.text()).toContain(baseProject.description)
  })

  it('renders technology pills as tech-pill chips', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const pills = wrapper.findAll('.tech-pill')
    expect(pills.length).toBe(baseProject.technologies.length)
  })

  it('renders a "View case study" CTA in the action cluster', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.text()).toContain('View case study')
  })

  it('renders the "Source code" CTA when repoUrl is present', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: { ...baseProject, repoUrl: 'https://github.com/x/y' } },
    })
    expect(wrapper.text()).toContain('Source code')
  })

  it('hides the status badge when showStatus=false', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: baseProject, showStatus: false },
    })
    expect(wrapper.text()).not.toContain('Active')
  })
})
