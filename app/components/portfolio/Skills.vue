<script setup lang="ts">
/**
 * Skills — Single column, category heading + chips with icons.
 * Uses Simple Icons (simple-icons npm) for authentic brand SVG paths.
 */
import type { SkillGroup } from '~~/shared/types'
import {
  siReact, siTypescript, siVuedotjs, siNuxt, siPhp, siMysql,
  siDjango, siFastapi, siPython, siGo, siDocker, siNginx,
  siApache, siApachespark, siApacheairflow, siDart, siVitest,
} from 'simple-icons'

interface Props {
  groups: readonly SkillGroup[]
}

defineProps<Props>()

/** Map of lowercase tech name → Simple Icons SVG path. */
const iconMap: Record<string, string> = {
  react: siReact.path,
  typescript: siTypescript.path,
  vue: siVuedotjs.path,
  nuxt: siNuxt.path,
  php: siPhp.path,
  mysql: siMysql.path,
  django: siDjango.path,
  fastapi: siFastapi.path,
  python: siPython.path,
  golang: siGo.path,
  go: siGo.path,
  docker: siDocker.path,
  nginx: siNginx.path,
  apache: siApache.path,
  'apache spark': siApachespark.path,
  'apache airflow': siApacheairflow.path,
  dart: siDart.path,
  vitest: siVitest.path,
}

function techIcon(tech: string): string {
  return iconMap[tech.toLowerCase()] ?? 'M8 5v14l11-7z'
}
</script>

<template>
  <section
    id="skills"
    aria-labelledby="skills-heading"
    class="flex flex-col gap-10"
  >
    <header class="text-center flex flex-col gap-3 max-w-[640px] mx-auto">
      <h2
        id="skills-heading"
        data-stagger="0"
        class="font-serif font-bold text-text reveal-up is-revealed text-headline-xl"
      >
        Core <span class="text-primary">Stack</span>
      </h2>
      <p
        data-stagger="1"
        class="font-sans text-body-sm text-muted reveal-up is-revealed"
      >
        Technologies I work with across the stack.
      </p>
    </header>

    <div class="flex flex-col gap-6">
      <div
        v-for="(group, idx) in groups"
        :key="group.category"
        :data-stagger="Math.min(idx + 2, 4)"
        class="flex flex-col gap-3 reveal-up is-revealed"
      >
        <h3
          class="font-mono text-label-sm uppercase tracking-widest text-primary font-semibold"
        >
          {{ group.category }}
        </h3>

        <ul class="flex flex-wrap gap-2">
          <li v-for="item in group.items" :key="item">
            <span class="skill-chip gap-1.5">
              <svg
                class="h-3.5 w-3.5 shrink-0 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="techIcon(item)" />
              </svg>
              <span>{{ item }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
