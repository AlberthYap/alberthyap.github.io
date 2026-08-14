// Projects index endpoint — content is queried server-side only so the
// in-browser SQLite/WASM runtime is never needed (see content.config.ts).
import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler((event) => {
  return queryCollection(event, 'projects').order('year', 'DESC').all()
})
