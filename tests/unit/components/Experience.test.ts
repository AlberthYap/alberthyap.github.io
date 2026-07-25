import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Experience from '~~/app/components/portfolio/Experience.vue'
import type { Experience } from '~~/shared/types'

const entries: Experience[] = [
  {
    slug: 'we-plus-2023-present',
    company: 'PT. Kita Indonesia Plus (WE+)',
    role: 'Fullstack Developer',
    startDate: '2023-11',
    endDate: 'present',
    summary: 'Fullstack web development with Django, FastAPI, and React.',
    skills: [],
    achievements: [
      'Enhanced application performance through comprehensive debugging',
      'Followed software development best practices',
    ],
    technologies: ['React', 'Django', 'FastAPI'],
  },
  {
    slug: 'artha-graha-2022-2023',
    company: 'PT. Bank Artha Graha Internasional',
    role: 'Data Engineer',
    startDate: '2022-08',
    endDate: '2023-11',
    summary: 'Built automation scripts reducing manual work by 60%.',
    skills: [],
    achievements: [
      'Created Telegram bots for automated data collection',
      'Built Android dashboard app using Dart',
    ],
    technologies: ['Python', 'Apache Spark', 'Golang'],
  },
]

describe('Experience', () => {
  it('renders section with id="experience" for in-page anchors', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.find('section#experience').exists()).toBe(true)
  })

  it('renders the heading "Experience"', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.text()).toContain('Experience')
  })

  it('renders one timeline entry per experience record', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.findAll('section#experience > ol > li')).toHaveLength(2)
  })

  it('renders role and company inside each entry header', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.text()).toContain('Fullstack Developer')
    expect(wrapper.text()).toContain('PT. Kita Indonesia Plus (WE+)')
    expect(wrapper.text()).toContain('Data Engineer')
    expect(wrapper.text()).toContain('PT. Bank Artha Graha Internasional')
  })

  it('renders a formatted period for each entry ("YYYY-MM" → "Mon YYYY")', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.text()).toContain('Nov 2023 — Present')
    expect(wrapper.text()).toContain('Aug 2022 — Nov 2023')
  })

  it('renders the summary line for each entry', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.text()).toContain('Django, FastAPI, and React')
    expect(wrapper.text()).toContain('reducing manual work by 60%')
  })

  it('marks the current-role entry with the primary accent (ring on dot)', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    // The "present" entry uses bg-primary; the prior entry uses bg-muted.
    const primaryDots = wrapper.findAll('span.bg-primary.ring-primary-soft')
    expect(primaryDots).toHaveLength(1)
  })

  it('renders achievements as bullet points', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.text()).toContain('Enhanced application performance')
    expect(wrapper.text()).toContain('Followed software development best practices')
    expect(wrapper.text()).toContain('Created Telegram bots')
    expect(wrapper.text()).toContain('Built Android dashboard app using Dart')
  })

  it('renders technologies as badge chips', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    expect(wrapper.text()).toContain('React')
    expect(wrapper.text()).toContain('Django')
    expect(wrapper.text()).toContain('Python')
    expect(wrapper.text()).toContain('Golang')
  })

  it('still renders the heading when experiences is empty', () => {
    const wrapper = mount(Experience, { props: { experiences: [] } })
    expect(wrapper.find('h2').exists()).toBe(true)
    expect(wrapper.findAll('section#experience > ol > li')).toHaveLength(0)
  })

  it('emits data-stagger indices so children can stagger reveal', () => {
    const wrapper = mount(Experience, { props: { experiences: entries } })
    const lis = wrapper.findAll('section#experience > ol > li')
    expect(lis[0].attributes('data-stagger')).toBe('0')
    expect(lis[1].attributes('data-stagger')).toBe('1')
  })
})
