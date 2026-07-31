<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCardTilt } from '~~/app/composables/useCardTilt'

interface Props {
  /** When set, the card renders as an `<a>` and becomes interactive. External `http(s)` URLs get safe link attrs. */
  href?: string
  /** Visual style. */
  variant?: 'default' | 'elevated' | 'bordered'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const isExternal = computed(() => /^https?:\/\//.test(props.href ?? ''))

// External-link safety per code-style.md §10. Internal hrefs stay plain anchors.
const externalAttrs = computed(() => isExternal.value
  ? { target: '_blank', rel: 'noopener noreferrer' }
  : {})

const variantClasses = {
  default: 'border border-border',
  elevated: 'border border-border bg-surface',
  bordered: 'border-2 border-border-strong',
} as const

const baseClasses = computed(() => [
  'block rounded-lg bg-surface overflow-hidden',
  variantClasses[props.variant],
])

const interactiveClasses = 'transition-[transform,border-color] duration-[var(--motion-medium)] ease-[var(--motion-easing)] hover:border-primary/40 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg cursor-pointer'

// 3D tilt + spotlight on interactive cards.
const cardRef = ref<HTMLElement | null>(null)
useCardTilt(cardRef)
</script>

<template>
  <a
    v-if="props.href && props.href.length > 0"
    ref="cardRef"
    :href="props.href"
    v-bind="externalAttrs"
    :class="[baseClasses, interactiveClasses]"
  >
    <slot name="media" />
    <div class="p-6">
      <slot name="header" />
      <slot />
      <slot name="footer" />
    </div>
  </a>
  <article v-else :class="baseClasses">
    <slot name="media" />
    <div class="p-6">
      <slot name="header" />
      <slot />
      <slot name="footer" />
    </div>
  </article>
</template>
