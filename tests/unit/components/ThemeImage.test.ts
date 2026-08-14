import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { nextTick } from 'vue'

/**
 * ThemeImage — theme-aware `<img>`.
 *
 * Renders the light variant by default (SSR), swaps to the dark variant
 * when `useTheme().pref` becomes `'dark'`, and falls back to the light
 * source when no `dark` prop is provided. The `pref` ref is a
 * module-level singleton in `useTheme`, so these tests drive it through
 * the same `set()` path ThemeToggle uses.
 */
// Lazy import so per-test localStorage/DOM setup runs before the
// module-level `pref` singleton is created and `onMounted` fires.
const { default: ThemeImage } = await import(
  '~~/app/components/ui/ThemeImage.vue'
)
const { useTheme } = await import('~~/app/composables/useTheme')

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  // Reset the singleton so tests don't leak dark state into each other.
  useTheme().set('light')
})

describe('ThemeImage (theme-aware screenshot)', () => {
  it('renders an img with the light source and alt by default', () => {
    const wrapper = mount(ThemeImage, {
      props: { light: '/a/light.png', dark: '/a/dark.png', alt: 'Shot' },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/a/light.png')
    expect(img.attributes('alt')).toBe('Shot')
  })

  it('swaps to the dark source when the theme pref is dark', async () => {
    const wrapper = mount(ThemeImage, {
      props: { light: '/a/light.png', dark: '/a/dark.png', alt: 'Shot' },
    })
    useTheme().set('dark')
    await nextTick()
    expect(wrapper.find('img').attributes('src')).toBe('/a/dark.png')
  })

  it('swaps back to light when the theme pref returns to light', async () => {
    useTheme().set('dark')
    const wrapper = mount(ThemeImage, {
      props: { light: '/a/light.png', dark: '/a/dark.png', alt: 'Shot' },
    })
    await nextTick()
    expect(wrapper.find('img').attributes('src')).toBe('/a/dark.png')
    useTheme().set('light')
    await nextTick()
    expect(wrapper.find('img').attributes('src')).toBe('/a/light.png')
  })

  it('falls back to the light source when no dark variant exists', () => {
    useTheme().set('dark')
    const wrapper = mount(ThemeImage, {
      props: { light: '/a/only.png', alt: 'Shot' },
    })
    expect(wrapper.find('img').attributes('src')).toBe('/a/only.png')
  })

  it('applies lazy loading when lazy prop is set', () => {
    const wrapper = mount(ThemeImage, {
      props: { light: '/a/light.png', alt: 'Shot', lazy: true },
    })
    expect(wrapper.find('img').attributes('loading')).toBe('lazy')
  })

  it('defaults to eager loading when lazy is not set', () => {
    const wrapper = mount(ThemeImage, {
      props: { light: '/a/light.png', alt: 'Shot' },
    })
    expect(wrapper.find('img').attributes('loading')).toBe('eager')
  })
})
