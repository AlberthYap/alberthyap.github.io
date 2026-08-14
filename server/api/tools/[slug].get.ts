import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Tool slug is required' })
  }

  const tool = await queryCollection(event, 'tools')
    .where('slug', '=', slug)
    .first()

  if (!tool) {
    throw createError({ statusCode: 404, statusMessage: 'Tool not found' })
  }

  return tool
})
