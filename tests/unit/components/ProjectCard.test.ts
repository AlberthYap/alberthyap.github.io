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

describe('ProjectCard', () => {
  it('links to /projects/<slug>', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const anchor = wrapper.find('a')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('/projects/inventory-dashboard')
  })

  it('renders thumbnail with descriptive alt text in the media slot', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const img = wrapper.find('img')
    expect(img.attributes('alt')).toBe('Inventory Dashboard preview')
    expect(img.attributes('src')).toBe('/projects/inventory/cover.png')
  })

  it('marks thumbnail as lazy-loaded for below-the-fold perf budget', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.find('img').attributes('loading')).toBe('lazy')
  })

  it('renders project title in header', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.text()).toContain('Inventory Dashboard')
  })

  it('clamps description to 3 lines via line-clamp', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const description = wrapper.find('p')
    expect(description.classes().join(' ')).toContain('line-clamp-3')
  })

  it('shows Featured badge when project.featured and showFeatured=true (default)', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    expect(wrapper.text()).toContain('Featured')
  })

  it('hides Featured badge when showFeatured=false', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: baseProject, showFeatured: false },
    })
    expect(wrapper.text()).not.toContain('Featured')
  })

  it('does not show Featured badge when project.featured=false', () => {
    const wrapper = mount(ProjectCard, {
      props: {
        project: { ...baseProject, featured: false },
      },
    })
    expect(wrapper.text()).not.toContain('Featured')
  })

  it('renders every tag inside the footer list', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    // Scope assertions to the footer list to avoid catching the title or
    // description text. The footer Badges are inside `<ul><li>` per
    // ProjectCard's slot pattern.
    const footerItems = wrapper.find('ul').findAll('li')
    const footerTexts = footerItems.map((li) => li.text())
    expect(footerTexts).toEqual(['Vue 3', 'TypeScript', 'Tailwind'])
  })

  it('does not duplicate tags (tags array length === footer list items)', () => {
    const wrapper = mount(ProjectCard, { props: { project: baseProject } })
    const footerItems = wrapper.find('ul').findAll('li')
    expect(footerItems).toHaveLength(baseProject.tags.length)
  })
})
