<script setup lang="ts">
interface Props {
  /** Render as a different semantic element when needed for document outline. */
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer'
  /** Max-width variant per DESIGN.md §5.1 (`default` = 1200 px content column). */
  width?: 'default' | 'narrow' | 'wide' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  width: 'default',
})

const widthClasses = {
  default: 'max-w-[1200px]',
  narrow: 'max-w-[720px]',
  wide: 'max-w-[1440px]',
  full: 'max-w-none',
} as const
</script>

<template>
  <component
    :is="props.as"
    class="mx-auto px-6 md:px-12 lg:px-16"
    :class="widthClasses[props.width]"
  >
    <slot />
  </component>
</template>
