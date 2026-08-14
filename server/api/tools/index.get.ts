import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler((event) => {
  return queryCollection(event, 'tools').order('title', 'ASC').all()
})
