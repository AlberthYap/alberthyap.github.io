<script setup lang="ts">
import Heading from '~~/app/components/ui/Heading.vue'
import LinkButton from '~~/app/components/ui/LinkButton.vue'

interface Props {
  /** Display name shown in the headline. */
  name: string
  /** Role label after the em-dash — painted in `--color-primary`. */
  role: string
  /** Lead paragraph below the headline. */
  lead?: string
  /** Code snippet shown in the terminal card. Default is a developer-flavored CLI output. */
  snippet?: string
  /** Tab/filename label in the terminal card chrome. */
  snippetTitle?: string
}

const DEFAULT_SNIPPET = `$ pnpm run whoami
> github.com/alberthyaputra
> stack: Vue 3 · Nuxt 4 · TS · Tailwind
> status: open to opportunities`

const props = withDefaults(defineProps<Props>(), {
  snippet: DEFAULT_SNIPPET,
  snippetTitle: '~/whoami',
})
</script>

<template>
  <section
    aria-labelledby="hero-heading"
    class="grid items-center gap-12 lg:gap-16 px-6 md:px-12 lg:px-16 py-24 md:py-32 lg:grid-cols-[3fr_2fr] mx-auto max-w-[1440px]"
  >
    <div class="flex flex-col gap-6">
      <Heading id="hero-heading" as="h1">
        <span class="text-text">{{ props.name }}</span>
        <span class="text-muted"> — </span>
        <span class="text-primary">{{ props.role }}</span>
      </Heading>
      <p v-if="props.lead" class="text-lg text-muted max-w-prose leading-relaxed">
        {{ props.lead }}
      </p>
      <div class="flex flex-wrap gap-3 pt-2">
        <LinkButton to="/projects" variant="primary" size="lg">
          See projects
        </LinkButton>
        <LinkButton to="#contact" variant="secondary" size="lg">
          Get in touch
        </LinkButton>
      </div>
    </div>

    <!-- The terminal card is decorative — content is the headline above.
         aria-hidden so screen readers skip the pseudo-CLI noise; sr-only
         caption explains the visual signal. -->
    <div
      class="relative rounded-xl border border-border bg-surface overflow-hidden"
      aria-hidden="true"
    >
      <div class="grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 border-b border-border">
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-danger/70"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-warning/70"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-accent/70"></span>
        </div>
        <span class="font-mono text-xs text-muted truncate">{{ props.snippetTitle }}</span>
      </div>
      <pre class="m-0 overflow-x-auto p-5 font-mono text-sm text-text leading-relaxed"><code>{{ props.snippet }}</code></pre>
    </div>
    <span class="sr-only">
      Decorative developer identity card. The same information is conveyed
      visually and in the headline above this section.
    </span>
  </section>
</template>
