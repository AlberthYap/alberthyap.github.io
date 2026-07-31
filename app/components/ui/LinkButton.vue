<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import { buttonClasses } from '~/utils/buttonClasses'
import { useMagneticButton } from '~~/app/composables/useMagneticButton'

interface Props {
  /** Destination route for the underlying NuxtLink. */
  to: RouteLocationRaw
  /** Visual variant — mirrors `Button` for cohesive CTA language across actions and nav. */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Size. Large = 48 px (DESIGN.md §7.1 primary button height). */
  size?: 'sm' | 'md' | 'lg'
  /** Override the accessible name when slot content doesn't describe the destination. */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
})

const classes = computed(() => buttonClasses(props.variant, props.size))

// Magnetic hover — subtle cursor-attraction on the link element.
const linkRef = ref<HTMLElement | null>(null)
useMagneticButton(linkRef, 0.25, 80)
</script>

<template>
  <NuxtLink
    ref="linkRef"
    :to="props.to"
    :aria-label="props.ariaLabel"
    :class="classes"
  >
    <slot />
  </NuxtLink>
</template>
