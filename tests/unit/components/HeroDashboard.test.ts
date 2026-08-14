import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// Mock useCountUp so metrics render at their final values immediately.
vi.mock('~~/app/composables/useCountUp', () => ({
  useCountUp: (target: number, _duration?: number, _decimals?: number) => ({
    count: ref(target),
    animate: vi.fn(),
    reset: vi.fn(),
    isAnimating: ref(false),
  }),
}))

import HeroDashboard from '~~/app/components/portfolio/HeroDashboard.vue'

// HeroDashboard — 3D-tilted glass-panel mockup matching example.html's
// `portfolio_v2` panel. Stack: chrome bar (3 dots + caption), metrics
// row (Uptime / Latency), code editor (`engine.ts` tab), infra visual
// (origin → ring → origin). All decorative elements carry aria-hidden;
// meaningful regions carry role + aria-label.

describe('HeroDashboard', () => {
  it('renders the 3D-tilted glass-panel wrapper', () => {
    const wrapper = mount(HeroDashboard)
    expect(wrapper.find('.perspective-panel').exists()).toBe(true)
    expect(wrapper.find('.dashboard-mock').exists()).toBe(true)
  })

  it('renders the chrome bar with three decorative dots and the portfolio_v2 caption', () => {
    const wrapper = mount(HeroDashboard)
    const chrome = wrapper.find('.dashboard-mock__chrome')
    expect(chrome.exists()).toBe(true)
    expect(chrome.findAll('.dashboard-mock__dots > span')).toHaveLength(3)
    expect(chrome.find('[aria-hidden="true"]').exists()).toBe(true)
    expect(wrapper.find('.dashboard-mock__caption').text()).toBe('portfolio_v2')
  })

  it('renders the two-card metrics row (Uptime + Latency)', () => {
    const wrapper = mount(HeroDashboard)
    const metrics = wrapper.find('[role="group"][aria-label="Build metrics"]')
    expect(metrics.exists()).toBe(true)
    const labels = wrapper.findAll('.dashboard-mock__metric-label')
    expect(labels.map((l) => l.text())).toEqual(['Uptime', 'Latency'])
    const values = wrapper.findAll('.dashboard-mock__metric-value')
    expect(values[0].text()).toBe('99.99%')
    expect(values[1].text()).toBe('12ms')
    expect(values[1].classes()).toContain('dashboard-mock__metric-value--default')
  })

  it('renders the engine.ts editor with highlighted tab + TypeScript snippet', () => {
    const wrapper = mount(HeroDashboard)
    expect(wrapper.find('[role="region"][aria-label="engine.ts source"]').exists()).toBe(true)
    const tabs = wrapper.findAll('.dashboard-mock__editor-tab')
    expect(tabs.length).toBe(3)
    expect(tabs[0].text()).toBe('engine.ts')
    expect(tabs[0].classes()).toContain('dashboard-mock__editor-tab--active')
    const body = wrapper.find('.dashboard-mock__editor-body')
    // Trailing `{` catches a regression that drops `v-pre` (which
    // would make Vue tokenize `{{` as Mustache and silently render
    // whitespace between the spans).
    expect(body.text()).toContain('class Engine {')
    expect(body.text()).toContain('optimize')
    expect(body.text()).toContain('// Deploy to globally distributed edge nodes')
  })

  it('renders the infrastructure visual (origin → edge-ring → origin)', () => {
    const wrapper = mount(HeroDashboard)
    expect(wrapper.find('[role="img"][aria-label*="Edge node topology"]').exists()).toBe(true)
    const nodes = wrapper.findAll('.dashboard-mock__infra-row > span').filter((n) =>
      n.classes().some(
        (cls) => cls === 'dashboard-mock__infra-node'
          || cls === 'dashboard-mock__infra-node--ring',
      ),
    )
    expect(nodes.length).toBe(3)
    expect(wrapper.findAll('.dashboard-mock__infra-bar').length).toBe(2)
  })
})
