import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Hero from '~~/app/components/portfolio/Hero.vue'

/**
 * Hero — Organic Professional edition with right-side dashboard.
 *
 * Pieces tested:
 * - Status pill: mono caption + decorative dot, defaults fallback.
 * - Headline (h1, sr-only label) + visible serif heading slot.
 * - Background image overlay (`aria-hidden`, decorative).
 * - Two CTAs with `to` (NuxtLink) destinations.
 * - 2-col grid on lg+ with `HeroDashboard` in the right column;
 *   hidden below lg so mobile readers see only the text column.
 * - Reveal-up cascades (`status pill`, headline, lead, CTA cluster).
 */

describe('Hero (Organic Professional edition)', () => {
  it('renders as a labelled region for screen readers', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'A short pitch sentence.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    const section = wrapper.find('section[aria-labelledby="hero-heading"]')
    expect(section.exists()).toBe(true)
  })

  it('mounts the hero with full-viewport height (min-h-screen)', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    const section = wrapper.find('section[data-section-id="hero"]')
    expect(section.exists()).toBe(true)
    expect(section.classes()).toContain('min-h-screen')
  })

  it('renders an sr-only headline carrying the developer identity', () => {
    const wrapper = mount(Hero, {
      props: {
        name: 'Alberth Yaputra',
        eyebrow: 'Developer',
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    const h1 = wrapper.find('#hero-heading')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Alberth Yaputra')
    expect(h1.text()).toContain('Developer')
  })

  it('mounts an image overlay reference (faint background; aria-hidden)', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    // The image overlay carries the hero-bg-image utility class so
    // the opacity+mask from main.css applies. It's purely decorative
    // (empty alt + aria-hidden) so screen readers skip it.
    const bg = wrapper.find('img.hero-bg-image')
    expect(bg.exists()).toBe(true)
    expect(bg.attributes('aria-hidden')).toBe('true')
    expect(bg.attributes('src')).toBe('/image.png')
  })

  it('renders the status pill with primary-color text', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        status: 'Available for new work',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    const pill = wrapper.find('.status-pill')
    expect(pill.exists()).toBe(true)
    expect(pill.text()).toContain('Available for new work')
    // Status dot is present and decorative.
    expect(wrapper.find('.status-dot').exists()).toBe(true)
  })

  it('falls back status text to "Available for new work" when prop omitted', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    expect(wrapper.find('.status-pill').text()).toContain('Available for new work')
  })

  it('renders the headline slot content as the visible serif heading', () => {
    const wrapper = mount(
      Hero,
      {
        props: {
          lead: 'Lead.',
          primaryTo: '/projects',
          primaryLabel: 'See selected work',
          secondaryTo: '#contact',
          secondaryLabel: 'Get in touch',
        },
        slots: {
          default: 'Building calm, <br><span class="text-primary">accessible systems</span>',
        },
      },
    )
    const headline = wrapper.find('h2.font-serif')
    expect(headline.exists()).toBe(true)
    expect(headline.text()).toContain('Building calm')
    expect(headline.text()).toContain('accessible systems')
    // The headline carries a primary-tinted span for the accent word.
    expect(headline.find('span.text-primary').exists()).toBe(true)
  })

  it('renders the lead paragraph with body sizing', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'A longer pitch sentence that fills the lead column.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
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
    const anchors = wrapper.findAll('a')
    const hrefs = anchors.map((a) => a.attributes('href')).filter(Boolean)
    expect(hrefs).toContain('/projects/featured')
    expect(hrefs).toContain('mailto:hi@example.com')
    expect(wrapper.text()).toContain('Read case study')
    expect(wrapper.text()).toContain('Email me')
  })

  it('emits reveal-up annotations so the intro timeline can collapse cascades', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    // Status pill + headline + lead + CTA cluster = 4 reveal-up cues.
    expect(wrapper.findAll('.reveal-up.is-revealed').length).toBeGreaterThanOrEqual(4)
  })

  it('uses a 2-col grid on lg+ that splits text content from the dashboard', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    // The split happens on `lg`, via Tailwind's `lg:grid-cols-[...]`
    // utility — assert the grid container exists (class-only
    // assertion; full breakpoint testing happens in the browser
    // test pass for visual regression).
    expect(wrapper.find('.grid').exists()).toBe(true)
  })

  it('mounts the HeroDashboard mockup in the right column on lg+', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    // The dashboard wrapper sits in the right column and is hidden
    // below `lg` via `hidden lg:block` so mobile readers see only
    // the text column.
    const dashboardColumn = wrapper.find('.hidden.lg\\:block')
    expect(dashboardColumn.exists()).toBe(true)
    // Inside the dashboard column the perspective-panel mounts.
    expect(wrapper.find('.perspective-panel').exists()).toBe(true)
    // The dashboard carries the portfolio_v2 caption so even
    // when the panel is masked by text, the chrome identity is
    // preserved for AT.
    expect(wrapper.text()).toContain('portfolio_v2')
  })

  it('renders the HeroDashboard Uptime / Latency metric labels', () => {
    const wrapper = mount(Hero, {
      props: {
        lead: 'Lead.',
        primaryTo: '/projects',
        primaryLabel: 'See selected work',
        secondaryTo: '#contact',
        secondaryLabel: 'Get in touch',
      },
    })
    // Source text is "Uptime" / "Latency" — the .dashboard-mock__metric-label
    // CSS class applies `text-transform: uppercase`, so the rendered
    // (visual) glyphs are UPTIME / LATENCY. Source assertions catch the
    // label content; CSS handles presentation.
    expect(wrapper.text()).toContain('Uptime')
    expect(wrapper.text()).toContain('Latency')
  })
})
