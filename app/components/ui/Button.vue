<script setup lang="ts">
import { computed } from 'vue'

import { buttonClasses } from '~/utils/buttonClasses'

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

const classes = computed(() => buttonClasses(props.variant, props.size))

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
