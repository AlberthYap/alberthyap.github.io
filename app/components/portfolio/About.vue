<script setup lang="ts">
import Heading from '~~/app/components/ui/Heading.vue'

interface Props {
  /** Name displayed above bio paragraph. */
  name: string
  /** Bio paragraph. */
  bio: string
  /** Optional portrait image; falls back to a decorative placeholder tile. */
  portrait?: { src: string; alt: string }
  /** Bulleted highlight list under the bio. */
  highlights?: readonly string[]
}

const props = withDefaults(defineProps<Props>(), {
  highlights: () => [],
})
</script>

<template>
  <section
    id="about"
    aria-labelledby="about-heading"
    class="grid gap-10 md:grid-cols-[1fr_2fr] items-start"
  >
    <div class="flex flex-col gap-3">
      <Heading id="about-heading" as="h2">About</Heading>
      <div
        v-if="props.portrait"
        class="rounded-xl border border-border bg-surface aspect-square overflow-hidden"
      >
        <img
          :src="props.portrait.src"
          :alt="props.portrait.alt"
          class="h-full w-full object-cover"
          loading="lazy"
        >
      </div>
      <div
        v-else
        class="rounded-xl border border-border bg-surface aspect-square flex items-center justify-center text-muted font-mono text-sm"
        aria-hidden="true"
      >
        {{ props.name }}
      </div>
    </div>
    <div class="flex flex-col gap-5">
      <p class="text-lg text-text leading-relaxed">
        {{ props.bio }}
      </p>
      <ul
        v-if="props.highlights.length"
        class="flex flex-col gap-3"
      >
        <li
          v-for="item in props.highlights"
          :key="item"
          class="flex items-start gap-3 text-text"
        >
          <span aria-hidden="true" class="font-mono text-primary shrink-0">—</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
