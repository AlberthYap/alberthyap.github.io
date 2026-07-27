// https://vitest.dev/config/#setupfiles
import { config } from '@vue/test-utils'

/**
 * Global stubs for Nuxt-specific components used by Phase 3 components.
 *
 * Unit tests run without a Nuxt runtime, so `NuxtLink`, route composables
 * (`useRoute`), and `<NuxtPage>` don't exist. These stubs let Hero/Navbar/
 * Footer/LinkButton mount into the DOM as plain anchors — enough to assert
 * markup, slot content, and class wiring. Full routing/SSR behavior is
 * covered by the future `@nuxt/test-utils` integration suite (Phase 3.x).
 */

const NuxtLink = {
  name: 'NuxtLink',
  props: {
    to: { type: [String, Object] as unknown as () => string | Record<string, unknown>, required: true },
  },
  computed: {
    href(): string {
      if (typeof this.to === 'string') return this.to
      // Object form like `{ path: '/projects/foo' }` → flatten to a path.
      if (this.to && typeof this.to === 'object') {
        const path = (this.to as Record<string, unknown>).path
        if (typeof path === 'string') return path
      }
      return '#'
    },
  },
  template: '<a :href="href"><slot /></a>',
}

const ContentRenderer = {
  name: 'ContentRenderer',
  // Stub for @nuxt/content's <ContentRenderer> — vitest has no Nuxt
  // runtime, so the unresolved tag logs a `[Vue warn] ContentRenderer`.
  // Self-closing matches About.vue's usage (no slot children).
  props: {
    value: { type: [Object, null] as unknown as () => Record<string, unknown> | null, default: null },
  },
  template: '<div data-testid="content-renderer-stub" />',
}

config.global.stubs = {
  NuxtLink,
  ContentRenderer,
}
