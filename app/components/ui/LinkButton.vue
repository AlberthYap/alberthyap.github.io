<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

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

// Visual language intentionally mirrors `Button.vue` so CTA buttons (action or
// navigation) read as a single design system across the surface.
const sizeClasses = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-base',
} as const

const variantClasses = {
  primary:
    'bg-primary text-bg hover:bg-primary/90 active:bg-primary/80 border border-transparent',
  secondary:
    'bg-transparent text-text border border-border-strong hover:border-primary hover:text-primary',
  ghost:
    'bg-transparent text-text hover:bg-surface border border-transparent',
} as const

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-md font-medium',
  'transition-[transform,background-color,border-color,color] duration-[var(--motion-micro)] ease-[var(--motion-easing)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  'hover:-translate-y-px motion-reduce:hover:translate-y-0',
  sizeClasses[props.size],
  variantClasses[props.variant],
])
</script>

<template>
  <NuxtLink
    :to="props.to"
    :aria-label="props.ariaLabel"
    :class="classes"
  >
    <slot />
  </NuxtLink>
</template>
