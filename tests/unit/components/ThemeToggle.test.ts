import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * ThemeToggle (single-button toggle)
 *
 * Replaces the old 2-radio segmented picker. The picker is one
 * `<button data-theme-picker role="switch">` whose icon shows the
 * mode a click will switch TO (moon = currently-light; sun =
 * currently-dark) and whose `aria-label` reads "Switch to {next}
 * theme". No radiogroup, no roving tabindex, no Arrow-key roaming.
 *
 * `System` was already removed in the prior pass; initial visits (or
 * legacy `'system'` storage) lock to `'light'` and the button shows
 * the moon ("click to go dark"). OS preference is no longer
 * consulted at any point.
 *
 * Icon contract: the picker renders EXACTLY one `<svg>` at every
 * state — tests below fingerprint the active path's `d` attribute
 * (moon = starts with `M21 12.79`; sun = starts with `M12 2v2`) so
 * label flips without an icon swap breaks loud.
 */
beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  // Stub the View Transitions API. happy-dom doesn't implement it
  // natively; mock fires the callback synchronously so the underlying
  // set() lands in the same tick as the click.
  ;(document as Document & { startViewTransition?: unknown }).startViewTransition = vi.fn(
    (cb: () => void) => {
      cb()
      return { finished: Promise.resolve() }
    },
  ) as unknown as Document['startViewTransition']
})

afterEach(() => {
  delete (document as Document & { startViewTransition?: unknown }).startViewTransition
})

// Lazy import so the per-test setup above is live when
// `useTheme().onMounted` runs.
const { default: ThemeToggle } = await import(
  '~~/app/components/ui/ThemeToggle.vue'
)

// Moon path "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
// Sun path  "M12 2v2M12 20v2M4.93 4.93l1.41 1.41..."
const MOON_FINGERPRINT = 'M21 12.79'
const SUN_FINGERPRINT = 'M12 2v2'

/**
 * Mount helper. `useTheme`'s `onMounted` may transition `pref` from
 * its module-default value (e.g. `'light'`) to the persisted value
 * via `set('light')`; Vue queues that DOM update for the next tick,
 * so `wrapper.find(...).attributes('aria-checked')` would otherwise
 * read pre-mount state. Awaiting `nextTick` flushes once so every
 * test reads the post-mount DOM regardless of test ordering or
 * whichever state the previous test left `pref` in.
 *
 * Future-tests rule: any ThemeToggle test that asserts `aria-checked`,
 * `data-theme`, or any document-level theme DOM must go through
 * `mountToggle` — bare `mount(ThemeToggle)` will silently race the
 * post-onMounted reactive update and read pre-mount state.
 */
async function mountToggle() {
  const wrapper = mount(ThemeToggle)
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('ThemeToggle (single-button toggle)', () => {
  it('renders ONE switch button (no radiogroup, no two-radio split)', async () => {
    const wrapper = await mountToggle()
    const picker = wrapper.find('[data-theme-picker]')
    expect(picker.exists()).toBe(true)
    expect(picker.element.tagName).toBe('BUTTON')
    expect(picker.attributes('role')).toBe('switch')
    expect(wrapper.findAll('[role="radio"]').length).toBe(0)
  })

  it('defaults to light when storage is empty: moon icon, aria "Switch to dark theme", aria-checked false', async () => {
    const wrapper = await mountToggle()
    const picker = wrapper.find('[data-theme-picker]')
    expect(picker.attributes('aria-label')).toBe('Switch to dark theme')
    expect(picker.attributes('aria-checked')).toBe('false')
    expect(localStorage.getItem('theme-pref')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    // Exactly one svg, and it's the moon icon (path fingerprint).
    expect(picker.findAll('svg')).toHaveLength(1)
    expect(picker.find('svg path').attributes('d')).toContain(MOON_FINGERPRINT)
  })

  it('migrates legacy "system" storage to explicit "light" + moon icon', async () => {
    // `system` is no longer a valid pref; the always-light policy
    // coerces legacy `system` values to the explicit default rather
    // than carry them forward as a phantom mode. Users who actually
    // want dark can still flip the toggle.
    localStorage.setItem('theme-pref', 'system')
    const wrapper = await mountToggle()
    expect(localStorage.getItem('theme-pref')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    const picker = wrapper.find('[data-theme-picker]')
    expect(picker.attributes('aria-label')).toBe('Switch to dark theme')
    expect(picker.attributes('aria-checked')).toBe('false')
    expect(picker.findAll('svg')).toHaveLength(1)
    expect(picker.find('svg path').attributes('d')).toContain(MOON_FINGERPRINT)
  })

  it('clicking the toggle in light state applies dark, flips icon to sun, label to "Switch to light theme"', async () => {
    const wrapper = await mountToggle()
    const picker = wrapper.find('[data-theme-picker]')
    await picker.trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme-pref')).toBe('dark')
    expect(picker.attributes('aria-checked')).toBe('true')
    expect(picker.attributes('aria-label')).toBe('Switch to light theme')
    expect(picker.findAll('svg')).toHaveLength(1)
    expect(picker.find('svg path').attributes('d')).toContain(SUN_FINGERPRINT)
  })

  it('clicking again reverts to light: icon flips back to moon, label back to "Switch to dark theme"', async () => {
    const wrapper = await mountToggle()
    const picker = wrapper.find('[data-theme-picker]')
    await picker.trigger('click')  // → dark (sun)
    await picker.trigger('click')  // → light (moon)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme-pref')).toBe('light')
    expect(picker.attributes('aria-checked')).toBe('false')
    expect(picker.attributes('aria-label')).toBe('Switch to dark theme')
    expect(picker.findAll('svg')).toHaveLength(1)
    expect(picker.find('svg path').attributes('d')).toContain(MOON_FINGERPRINT)
  })

  it('on mount with persisted dark: sun icon, label "Switch to light theme", aria-checked true', async () => {
    localStorage.setItem('theme-pref', 'dark')
    const wrapper = await mountToggle()
    const picker = wrapper.find('[data-theme-picker]')
    expect(picker.attributes('aria-checked')).toBe('true')
    expect(picker.attributes('aria-label')).toBe('Switch to light theme')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(picker.findAll('svg')).toHaveLength(1)
    expect(picker.find('svg path').attributes('d')).toContain(SUN_FINGERPRINT)
  })

  it('on mount with persisted light: moon icon, label "Switch to dark theme", aria-checked false', async () => {
    localStorage.setItem('theme-pref', 'light')
    const wrapper = await mountToggle()
    const picker = wrapper.find('[data-theme-picker]')
    expect(picker.attributes('aria-checked')).toBe('false')
    expect(picker.attributes('aria-label')).toBe('Switch to dark theme')
    expect(picker.findAll('svg')).toHaveLength(1)
    expect(picker.find('svg path').attributes('d')).toContain(MOON_FINGERPRINT)
  })

  it('clicks are wrapped in document.startViewTransition for a smooth crossfade', async () => {
    const wrapper = await mountToggle()
    const picker = wrapper.find('[data-theme-picker]')
    await picker.trigger('click')
    const stub = (document as Document & { startViewTransition?: ReturnType<typeof vi.fn> })
      .startViewTransition
    expect(stub).toHaveBeenCalledTimes(1)
    // Mock fires the cb synchronously, so the theme swap still lands
    // inside the transition callback (data-theme + localStorage both
    // updated, just like a real browser would).
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme-pref')).toBe('dark')
  })

  it('falls back to instant set() when document.startViewTransition is unavailable', async () => {
    // Regression guard: a future refactor that goes through startViewTransition
    // unconditionally would silently break for older Firefox without API support.
    delete (document as Document & { startViewTransition?: unknown }).startViewTransition
    const wrapper = await mountToggle()
    await wrapper.find('[data-theme-picker]').trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme-pref')).toBe('dark')
  })

  it('skips the View Transition crossfade when prefers-reduced-motion: reduce is active', async () => {
    // JS short-circuit (the principal mechanism); the CSS pseudo-element override
    // on ::view-transition-* in main.css is the defence-in-depth floor.
    const origMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia
    try {
      const wrapper = await mountToggle()
      const picker = wrapper.find('[data-theme-picker]')
      await picker.trigger('click')
      const stub = (document as Document & { startViewTransition?: ReturnType<typeof vi.fn> })
        .startViewTransition
      expect(stub).not.toHaveBeenCalled()
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('theme-pref')).toBe('dark')
    } finally {
      // assign-style mock replacements don't go through vi.restoreAllMocks()
      window.matchMedia = origMatchMedia
    }
  })
})
