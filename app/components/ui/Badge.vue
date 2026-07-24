<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Visual variant. `tech` highlights tech-stack chips; `status-*` mark project lifecycle. */
  variant?: 'default' | 'tech' | 'status-shipped' | 'status-archived'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const variantClasses = {
  default: 'bg-surface text-muted border border-border',
  tech: 'bg-primary-soft text-primary border border-primary/30',
  'status-shipped': 'bg-accent/10 text-accent border border-accent/30',
  'status-archived': 'bg-surface text-muted/70 border border-border',
} as const

const classes = computed(() => [
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium font-mono',
  'leading-none whitespace-nowrap',
  variantClasses[props.variant],
])
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
