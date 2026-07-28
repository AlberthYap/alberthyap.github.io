<script setup lang="ts">
/**
 * Theme toggle — single button that flips between Light and Dark.
 *
 * Replaces the segmented 2-radio picker after feedback that having
 * two icons visible at once is noise. The icon shows the mode a
 * click WILL switch to (sun when currently dark = "click → light";
 * moon when currently light = "click → dark") — standard "next
 * action" iconography so the affordance reads as a verb.
 *
 * ARIA: `role="switch"` gives screen readers the same binary on/off reading as the old radiogroup.
 */
import { useTheme } from '~/composables/useTheme'

const { pref, swap } = useTheme()

function toggle(): void {
  swap()
}
</script>

<template>
  <button
    type="button"
    data-theme-picker
    role="switch"
    :aria-label="pref === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
    :aria-checked="pref === 'dark' ? 'true' : 'false'"
    class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors duration-[var(--motion-small)] ease-[var(--motion-easing)] motion-reduce:transition-none"
    @click="toggle"
  >
    <!-- Moon = "click → dark" (currently light) -->
    <svg
      v-if="pref === 'light'"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
    <!-- Sun = "click → light" (currently dark) -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  </button>
</template>
