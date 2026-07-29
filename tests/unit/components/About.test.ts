import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import About from '~~/app/components/portfolio/About.vue'

// Cascade beats per About.vue: name+tagline (0) → bodyDoc (1) →
// highlights (2, 3, 4) → footnote (5). No decorative line, no eyebrow.
describe('About', () => {
  it('renders section with id="about" for in-page anchors', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.' },
    })
    const section = wrapper.find('section#about')
    expect(section.exists()).toBe(true)
  })

  it('renders a visible section header with mono label and serif title', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.' },
    })
    const h2 = wrapper.find('h2#about-heading')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toContain('About')
    expect(h2.text()).toContain('Me')
    expect(h2.classes()).not.toContain('sr-only')
  })

  it('renders the name as a serif heading when supplied', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.', name: 'Alberth Yaputra' },
    })
    const heading = wrapper.find('h3.font-serif')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Alberth Yaputra')
  })

  it('renders the tagline as a muted paragraph below the name', () => {
    const wrapper = mount(About, {
      props: { bio: 'Engineer — API design, automation.' },
    })
    const tagline = wrapper.find('p.text-muted.text-body-lg')
    expect(tagline.exists()).toBe(true)
    expect(tagline.text()).toBe('Engineer — API design, automation.')
  })

  it('renders each highlight as a stat card with staggered data-stagger index', () => {
    const wrapper = mount(About, {
      props: {
        bio: 'Bio.',
        highlights: ['WCAG a11y', 'Static-first delivery', 'Performance budgets'],
      },
    })
    const cards = wrapper.findAll('[data-stagger]')
    const staggerCards = cards.filter((el) =>
      ['2', '3', '4'].includes(el.attributes('data-stagger') ?? ''),
    )
    expect(staggerCards).toHaveLength(3)
    expect(staggerCards[0]?.attributes('data-stagger')).toBe('2')
    expect(staggerCards[1]?.attributes('data-stagger')).toBe('3')
    expect(staggerCards[2]?.attributes('data-stagger')).toBe('4')
  })

  it('renders the footnote CTA at data-stagger="5" with footnote text and "Let\'s build" prompt', () => {
    const wrapper = mount(About, {
      props: {
        bio: 'Bio.',
        footnote: 'Open to select frontend problems.',
      },
    })
    const footnote = wrapper.find('[data-stagger="5"]')
    expect(footnote.exists()).toBe(true)
    expect(footnote.text()).toContain('Open to select frontend problems.')
    expect(footnote.text()).toContain("Let's build")
  })

  it('omits the footnote block when footnote prop is empty', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.', footnote: '' },
    })
    const footnote = wrapper.find('[data-stagger="5"]')
    expect(footnote.exists()).toBe(false)
  })

  it('does not render highlight cards when highlights list is empty', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.', highlights: [] },
    })
    // No element should have stagger="2" (first highlight index)
    expect(wrapper.find('[data-stagger="2"]').exists()).toBe(false)
  })

  it('renders the cascade arc end-to-end', () => {
    const wrapper = mount(About, {
      props: {
        name: 'Test Name',
        bio: 'Lead paragraph.',
        highlights: ['Principle 1', 'Principle 2', 'Principle 3'],
        footnote: 'Closing line.',
      },
    })
    for (const idx of ['0', '2', '3', '4', '5']) {
      expect(wrapper.find(`[data-stagger="${idx}"]`).exists()).toBe(true)
    }
  })

  // Body narrative switched from <ContentRenderer> + AST to `v-html` over a
  // build-time-rendered string (see modules/home-snapshot.ts). These tests
  // pin down both the rendered-HTML path and the empty-string default.
  it('renders bodyHtml as v-html in the body narrative block', () => {
    const wrapper = mount(About, {
      props: {
        bio: 'Bio.',
        bodyHtml: '<p>First paragraph.</p><p>Second paragraph.</p>',
      },
    })
    const body = wrapper.find('[data-stagger="1"]')
    expect(body.exists()).toBe(true)
    expect(body.html()).toContain('First paragraph.')
    expect(body.html()).toContain('Second paragraph.')
  })

  it('omits the body narrative block when bodyHtml defaults to empty', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.' },
    })
    expect(wrapper.find('[data-stagger="1"]').exists()).toBe(false)
  })
})
