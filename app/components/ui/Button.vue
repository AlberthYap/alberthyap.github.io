<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Visual variant. */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Size. `lg` matches DESIGN.md §7.1 48 px primary button height. */
  size?: 'sm' | 'md' | 'lg'
  /** Disabled state — prevents click and dims. */
  disabled?: boolean
  /** Native button type. Use `submit` inside forms; default `button` keeps it inert. */
  type?: 'button' | 'submit' | 'reset'
  /** Override the accessible name. Use only when visible text does not describe the action. */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
})

const emit = defineEmits<{
  /** Fired on activation (mouse click, Enter, or Space). Native `disabled` blocks emission. */
  click: [event: MouseEvent]
}>()

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
  'disabled:cursor-not-allowed disabled:opacity-50',
  // Hover lift per DESIGN.md §7.1; motion-reduce neutralises it for a11y.
  'hover:-translate-y-px motion-reduce:hover:translate-y-0',
  sizeClasses[props.size],
  variantClasses[props.variant],
])

function onClick(event: MouseEvent) {
  emit('click', event)
}
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :aria-label="props.ariaLabel"
    :class="classes"
    @click="onClick"
  >
    <slot />
  </button>
</template>
