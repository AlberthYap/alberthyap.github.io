<script setup lang="ts">
/**
 * ThemeImage — theme-aware `<img>`.
 *
 * Swaps between a light- and dark-mode variant of the same screenshot
 * based on the active theme (`useTheme().pref`). Use for product
 * screenshots where a light-mode capture would glare inside dark mode.
 *
 * - `light` is required; `dark` optional. Missing `dark` → the light
 *   variant is shown in both themes (graceful fallback, no broken image).
 * - The swap is instant via the reactive `pref` ref. Only the active
 *   variant is bound to `src`, so the browser decodes one image at a time
 *   (preloading both would waste bandwidth for a hero shot).
 * - SSR: renders the light variant by default (matches the light-first
 *   design system); hydrates to the correct one immediately.
 */
import { computed } from 'vue'

import { useTheme } from '~~/app/composables/useTheme'

interface Props {
  /** Light-mode image source (also the SSR/fallback default). */
  light: string
  /** Optional dark-mode image source. */
  dark?: string
  /** Accessible name — same for both variants (same content, different tone). */
  alt: string
  /** Lazy-load the off-screen variant? Default true for gallery shots. */
  lazy?: boolean
  /** Tailwind classes for the `<img>` element itself. */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  lazy: false,
})

const { pref } = useTheme()

const src = computed(() =>
  props.dark && pref.value === 'dark' ? props.dark : props.light,
)
</script>

<template>
  <img
    :src="src"
    :alt="props.alt"
    :loading="props.lazy ? 'lazy' : 'eager'"
    :class="props.class"
  >
</template>
