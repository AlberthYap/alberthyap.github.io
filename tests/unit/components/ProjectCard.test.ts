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
 * ProjectCard — Vertical full-bleed cover (Organic Professional).
 *
 * - Root is `<article>`, not `<a>`: the card hosts nested interactive
 *   elements (cover NuxtLink, title NuxtLink, external URL `<a>`,
 *   CTAs) without invalid HTML nesting.
 * - `wrapper.find('a')` resolves the first anchor (cover link) in
 *   DOM order; CTAs surface via `wrapper.text()`.
 * - Status badge derives from `project.status` — `shipped` → "Active
 *   · Production", `in-progress` → "In Progress", else "Archived".
 *   Pass `showStatus={false}` on the home gallery so it's just
 *   image + title + URL.
 */

describe('ProjectCard (vertical full-bleed cover)', () => {
  it('renders an article root with the tonal-card class', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.find('article.tonal-card').exists()).toBe(true)
  })

  it('mounts a NuxtLink wrapping the cover image at the top', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const coverLink = wrapper.find('a[href="/projects/inventory-dashboard"]')
    expect(coverLink.exists()).toBe(true)
    expect(wrapper.find('a').attributes('href')).toBe('/projects/inventory-dashboard')
  })

  it('renders the cover image with aspect-video, descriptive alt, and lazy-loading', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const cover = wrapper.find('.aspect-video')
    expect(cover.exists()).toBe(true)
    expect(cover.element.tagName.toLowerCase()).toBe('a')
    const img = wrapper.find('.aspect-video img')
    expect(img.attributes('alt')).toBe(`${baseProject.title} cover`)
    expect(img.attributes('src')).toBe(baseProject.thumbnail)
    expect(img.attributes('loading')).toBe('lazy')
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
