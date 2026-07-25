<script setup lang="ts">
/**
 * PageContainer — Section outline + content width scaffold.
 *
 * Three max-width tiers follow example.html: `default` (1200 px
 * content column for narrative sections), `narrow` (720 px reading
 * column for case studies + long-form copy), `wide` (1440 px for
 * project grids / wide-data tables). Values are sourced from the
 * CSS tokens in main.css (`--spacing-container` + extras) so a single
 * token change updates every instance.
 */
interface Props {
  /** Render as a different semantic element when needed for document outline. */
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer'
  /** Max-width variant. See DESIGN §5.1. */
  width?: 'default' | 'narrow' | 'wide' | 'full'
}

withDefaults(defineProps<Props>(), {
  as: 'div',
  width: 'default',
})

const widthClasses = {
  default: 'max-w-[1200px]',
  narrow:  'max-w-[720px]',
  wide:    'max-w-[1440px]',
  full:    'max-w-none',
} as const
</script>

<template>
  <component
    :is="as"
    class="mx-auto px-6 md:px-12 lg:px-16"
    :class="widthClasses[width]"
  >
    <slot />
  </component>
</template>
