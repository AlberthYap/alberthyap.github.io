import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HeroDashboard from '~~/app/components/portfolio/HeroDashboard.vue'

/**
 * HeroDashboard — 3D-tilted glass-panel mockup matching example.html's
 * `portfolio_v2` panel.
 *
 * Visual stack (top → bottom):
 *   1. Chrome bar with 3 mac-style dots + `portfolio_v2` caption.
 *   2. Two-card metrics row (Uptime 99.99% / Latency 12ms).
 *   3. Dark inverse code editor with `engine.ts` highlighted tab +
   *      TypeScript snippet demonstrating the engine contract.
 *   4. Infrastructure visual: origin → edge-ring → origin.
 *
 * a11y:
 *   • Decorative dots aria-hidden.
 *   • Metrics carry `role="group"` + `aria-label`.
   * • Editor carries `role="region"` + `aria-label="engine.ts source"`.
 *   • Infrastructure visual carries `role="img"` + `aria-label`.
 */

describe('HeroDashboard', () => {
  it('renders the 3D-tilted glass-panel wrapper', () => {
    const wrapper = mount(HeroDashboard)
    expect(wrapper.find('.perspective-panel').exists()).toBe(true)
    expect(wrapper.find('.dashboard-mock').exists()).toBe(true)
  })

  it('renders the chrome bar with three dots and the system_monitor caption', () => {
    const wrapper = mount(HeroDashboard)
    const chrome = wrapper.find('.dashboard-mock__chrome')
    expect(chrome.exists()).toBe(true)

    // 3 mac-style colour dots, all aria-hidden (decorative).
    const dots = chrome.findAll('.dashboard-mock__dots > span')
    expect(dots.length).toBe(3)
    expect(chrome.find('[aria-hidden="true"]').exists()).toBe(true)

    // portfolio_v2 caption carries the brand line.
    expect(wrapper.find('.dashboard-mock__caption').text()).toBe('portfolio_v2')
  })

  it('renders the two-card metrics row (Uptime + Latency)', () => {
    const wrapper = mount(HeroDashboard)
    const metrics = wrapper.find('[role="group"][aria-label="Build metrics"]')
    expect(metrics.exists()).toBe(true)

    const labels = wrapper.findAll('.dashboard-mock__metric-label')
    expect(labels.map((l) => l.text())).toEqual(['Uptime', 'Latency'])

    // Uptime value stays in primary colour; Latency falls through to
    // the `--default` modifier so the metric block isn't a single
    // tonal speaking line of green.
    const values = wrapper.findAll('.dashboard-mock__metric-value')
    expect(values[0].text()).toBe('99.99%')
    expect(values[1].text()).toBe('12ms')
    expect(values[1].classes()).toContain('dashboard-mock__metric-value--default')
  })

  it('renders the engine.ts editor with highlighted tab + TypeScript snippet', () => {
    const wrapper = mount(HeroDashboard)
    const editor = wrapper.find('[role="region"][aria-label="engine.ts source"]')
    expect(editor.exists()).toBe(true)

    // The `engine.ts` tab carries the active class so it's the
    // visually selected file. Two sibling tabs (main.ts, config.yml)
    // sit at lower contrast.
    const tabs = wrapper.findAll('.dashboard-mock__editor-tab')
    expect(tabs.length).toBe(3)
    expect(tabs[0].text()).toBe('engine.ts')
    expect(tabs[0].classes()).toContain('dashboard-mock__editor-tab--active')

    // The snippet carries the canonical `class Engine { ... }` block
    // and a comment marker.
    const body = wrapper.find('.dashboard-mock__editor-body')
    // Asserted with the trailing `{` so a regression that drops
    // `v-pre` (which would make Vue tokenize `{{` as Mustache and
    // silently render only whitespace between the spans) is caught.
    expect(body.text()).toContain('class Engine {')
    expect(body.text()).toContain('optimize')
    expect(body.text()).toContain('// Deploy to globally distributed edge nodes')
  })

  it('renders the infrastructure visual (origin → edge-ring → origin)', () => {
    const wrapper = mount(HeroDashboard)
    const infra = wrapper.find('[role="img"][aria-label*="Edge node topology"]')
    expect(infra.exists()).toBe(true)

    // 3 nodes total: 2 plain (.dashboard-mock__infra-node) + 1 ringed
    // (.dashboard-mock__infra-node--ring). 2 connecting bars between.
    const nodes = wrapper.findAll('.dashboard-mock__infra-row > span')
      .filter((n) =>
        n.classes().some(
          (cls) => cls === 'dashboard-mock__infra-node'
            || cls === 'dashboard-mock__infra-node--ring',
        ),
      )
    expect(nodes.length).toBe(3)

    const bars = wrapper.findAll('.dashboard-mock__infra-bar')
    expect(bars.length).toBe(2)
  })
})
