<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Semantic HTML tag. Default `h2`. Choose by document outline, not visual size — see DESIGN.md §4.3. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  /** Visual size override. Defaults to match `as`. Override only when visual emphasis differs from semantic role (rare). */
  size?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'h2',
})

const effectiveSize = computed(() => props.size ?? props.as)

const sizeClasses = {
  h1: 'text-5xl sm:text-6xl font-semibold leading-tight tracking-tight',
  h2: 'text-3xl sm:text-4xl font-semibold leading-tight tracking-tight',
  h3: 'text-2xl font-semibold leading-snug',
  h4: 'text-xl font-semibold leading-snug',
  h5: 'text-lg font-medium leading-normal',
  h6: 'text-sm font-semibold uppercase tracking-wider text-muted',
} as const

const classes = computed(() => ['text-text', sizeClasses[effectiveSize.value]])
</script>

<template>
  <component
    :is="props.as"
    :class="classes"
  >
    <slot />
  </component>
</template>
