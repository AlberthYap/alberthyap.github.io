import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Hero from '~~/app/components/portfolio/Hero.vue'

const baseProps = {
  lead: 'Lead.',
  primaryTo: '/projects',
  primaryLabel: 'See selected work',
  secondaryTo: '#contact',
  secondaryLabel: 'Get in touch',
} as const

describe('Hero (Organic Professional edition)', () => {
  it('renders as a labelled region with min-h-screen', () => {
    const wrapper = mount(Hero, { props: baseProps })
    const section = wrapper.find('section[aria-labelledby="hero-heading"][data-section-id="hero"]')
    expect(section.exists()).toBe(true)
    expect(section.classes()).toContain('min-h-screen')
  })

  it('renders an sr-only headline carrying the developer identity', () => {
    const wrapper = mount(Hero, {
      props: { ...baseProps, name: 'Alberth Yaputra', eyebrow: 'Developer' },
    })
    const h1 = wrapper.find('#hero-heading')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Alberth Yaputra')
    expect(h1.text()).toContain('Developer')
  })

  it('mounts a decorative background image overlay (aria-hidden)', () => {
    const wrapper = mount(Hero, { props: baseProps })
    const bg = wrapper.find('img.hero-bg-image')
    expect(bg.exists()).toBe(true)
    expect(bg.attributes('aria-hidden')).toBe('true')
    expect(bg.attributes('src')).toBe('/hero-bg.webp')
  })

  it('renders the status pill with caption + decorative dot', () => {
    const wrapper = mount(Hero, {
      props: { ...baseProps, status: 'Available for new work' },
    })
    const pill = wrapper.find('.status-pill')
    expect(pill.exists()).toBe(true)
    expect(pill.text()).toContain('Available for new work')
    expect(wrapper.find('.status-dot').exists()).toBe(true)
  })

  it('falls back status text to "Available for new work" when prop omitted', () => {
    const wrapper = mount(Hero, { props: baseProps })
    expect(wrapper.find('.status-pill').text()).toContain('Available for new work')
  })

  it('renders the headline slot content as the visible serif heading', () => {
    const wrapper = mount(Hero, {
      props: baseProps,
      slots: {
        default: 'Building calm, <br><span class="text-primary">accessible systems</span>',
      },
    })
    const headline = wrapper.find('h2.font-serif')
    expect(headline.exists()).toBe(true)
    expect(headline.text()).toContain('Building calm')
    expect(headline.text()).toContain('accessible systems')
    expect(headline.find('span.text-primary').exists()).toBe(true)
  })

  it('renders the lead paragraph with body sizing', () => {
    const wrapper = mount(Hero, {
      props: { ...baseProps, lead: 'A longer pitch sentence that fills the lead column.' },
    })
    const lead = wrapper.find('p.text-body-lg')
    expect(lead.exists()).toBe(true)
    expect(lead.text()).toContain('A longer pitch sentence')
  })

  it('renders two CTAs with the supplied destinations and labels', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects/featured',
        primaryLabel: 'Read case study',
        secondaryTo: 'mailto:hi@example.com',
        secondaryLabel: 'Email me',
      },
    })
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href')).filter(Boolean)
    expect(hrefs).toContain('/projects/featured')
    expect(hrefs).toContain('mailto:hi@example.com')
    expect(wrapper.text()).toContain('Read case study')
    expect(wrapper.text()).toContain('Email me')
  })

  it('emits reveal-up annotations on the cascade cues (≥4)', () => {
    const wrapper = mount(Hero, { props: baseProps })
    expect(wrapper.findAll('.reveal-up.is-revealed').length).toBeGreaterThanOrEqual(4)
  })

  it('mounts the HeroDashboard mockup in the right column on lg+', () => {
    const wrapper = mount(Hero, { props: baseProps })
    expect(wrapper.find('.hidden.lg\\:block').exists()).toBe(true)
    expect(wrapper.find('.perspective-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('portfolio_v2')
  })
})
