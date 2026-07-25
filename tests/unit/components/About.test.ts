import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import About from '~~/app/components/portfolio/About.vue'

/**
 * About v4 — 5-beat storytelling arc (eyebrow → lead → highlights →
 * footnote). The page-level wrapper toggles `reveal-up.is-revealed` and
 * each beat here carries a `data-stagger="0..5"` index, which the CSS
 * in main.css translates into a sequenced cascade.
 *
 * The visible section heading is replaced by an sr-only <h2> so the
 * document outline still has a stable anchor (used by
 * `aria-labelledby="about-heading"` on the section element as well as
 * any in-page anchor link).
 */
describe('About', () => {
  it('renders section with id="about" for in-page anchors', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.' },
    })
    const section = wrapper.find('section#about')
    expect(section.exists()).toBe(true)
  })

  it('keeps an sr-only <h2> for screen readers and document outline', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.' },
    })
    const h2 = wrapper.find('h2#about-heading')
    expect(h2.exists()).toBe(true)
    // Visible-headings are now the eyebrow caption; the structural heading
    // is hidden but stays in the DOM.
    expect(h2.classes()).toContain('sr-only')
  })

  it('renders the eyebrow caption when supplied', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.', eyebrow: 'Currently' },
    })
    const eyebrow = wrapper.find('p.font-mono.uppercase')
    expect(eyebrow.exists()).toBe(true)
    expect(eyebrow.text()).toBe('Currently')
  })

  it('falls back to "Now" eyebrow when prop omitted', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.' },
    })
    expect(wrapper.text()).toContain('Now')
  })

  it('renders the bio paragraph as the lead paragraph', () => {
    const wrapper = mount(About, {
      props: { bio: 'Long-form bio sentence goes here.' },
    })
    const lead = wrapper.find('p.text-text.text-body-lg')
    expect(lead.exists()).toBe(true)
    expect(lead.text()).toBe('Long-form bio sentence goes here.')
  })

  it('cascades each highlight with its own data-stagger index', () => {
    const wrapper = mount(About, {
      props: {
        bio: 'Bio.',
        highlights: ['WCAG a11y', 'Static-first delivery', 'Performance budgets'],
      },
    })
    const items = wrapper.findAll('ul > li')
    expect(items).toHaveLength(3)
    expect(items[0]?.attributes('data-stagger')).toBe('2')
    expect(items[1]?.attributes('data-stagger')).toBe('3')
    expect(items[2]?.attributes('data-stagger')).toBe('4')
  })

  it('renders the footnote at data-stagger="5" when supplied', () => {
    const wrapper = mount(About, {
      props: {
        bio: 'Bio.',
        footnote: 'Open to select frontend problems.',
      },
    })
    const footnote = wrapper.find('p.text-muted.text-body-sm')
    expect(footnote.exists()).toBe(true)
    expect(footnote.text()).toBe('Open to select frontend problems.')
    expect(footnote.attributes('data-stagger')).toBe('5')
  })

  it('omits the footnote block when footnote prop is empty', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.', footnote: '' },
    })
    const footnote = wrapper.find('p.text-muted.text-body-sm')
    expect(footnote.exists()).toBe(false)
  })

  it('does not render an empty highlights list', () => {
    const wrapper = mount(About, {
      props: { bio: 'Bio.', highlights: [] },
    })
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('renders the full 5-beat arc end-to-end', () => {
    const wrapper = mount(About, {
      props: {
        eyebrow: 'Now',
        bio: 'Lead paragraph.',
        highlights: ['Principle 1', 'Principle 2', 'Principle 3'],
        footnote: 'Closing line.',
      },
    })
    // Six cascade beats total (eyebrow=0, lead=1, h1=2, h2=3, h3=4,
    // footnote=5). Element count matches the design's "5-beat" promise
    // (eyebrow + lead + 3 highlights + footnote = 6 sequenced items).
    const seq = ['0', '1', '2', '3', '4', '5']
    for (const idx of seq) {
      expect(wrapper.find(`[data-stagger="${idx}"]`).exists()).toBe(true)
    }
  })
})
