/**
 * Shared tech-icon mapping for Skills.vue and Experience.vue.
 *
 * Simple Icons SVG paths keyed by lowercased tech name. The `techIcon()`
 * lookup returns a fallback play icon for any tech without a mapped path.
 */
import {
  siReact, siTypescript, siVuedotjs, siNuxt, siPhp, siMysql,
  siDjango, siFastapi, siPython, siGo, siDocker, siNginx,
  siApache, siApachespark, siApacheairflow, siApachesuperset,
  siApachehadoop, siApachehive, siApachesolr,
  siDart, siVitest, siTailwindcss, siPostgresql, siMongodb,
  siJavascript, siNextdotjs,
} from 'simple-icons'

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
  'apache http server': siApache.path,
  'apache spark': siApachespark.path,
  'apache airflow': siApacheairflow.path,
  dart: siDart.path,
  vitest: siVitest.path,
  'vue.js': siVuedotjs.path,
  'tailwind css': siTailwindcss.path,
  javascript: siJavascript.path,
  postgresql: siPostgresql.path,
  mongodb: siMongodb.path,
  'apache superset': siApachesuperset.path,
  'apache hadoop': siApachehadoop.path,
  'apache hive': siApachehive.path,
  'apache solr': siApachesolr.path,
  'next.js': siNextdotjs.path,
  // DB2 — No Simple Icon available; custom database cylinder path
  db2: 'M12 2C7.58 2 4 3.79 4 6v12c0 2.21 3.58 4 8 4s8-1.79 8-4V6c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm0 16c-3.87 0-6-1.5-6-2v-3c1.33 1 3.17 1.5 6 1.5s4.67-.5 6-1.5v3c0 .5-2.13 2-6 2zm0-6c-3.87 0-6-1.5-6-2V9c1.33 1 3.17 1.5 6 1.5s4.67-.5 6-1.5v3c0 .5-2.13 2-6 2z',
}

/**
 * Return the SVG path for a tech name, or a fallback play icon.
 */
export function techIcon(tech: string): string {
  return iconMap[tech.toLowerCase()] ?? 'M8 5v14l11-7z'
}
