import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Project slug is required' })
  }

  const project = await queryCollection(event, 'projects')
    .path(`/projects/${slug}`)
    .first()

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return project
})
