import { db } from '~~/server/database/db'
import { roles, locations, tags, experienceLevels, companies } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type')
  const slug = getRouterParam(event, 'slug')

  if (!type || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing type or slug',
    })
  }

  let data = null

  switch (type) {
    case 'role':
      data = await db.query.roles.findFirst({
        where: eq(roles.slug, slug),
        columns: { name: true, slug: true },
      })
      break
    case 'location':
      data = await db.query.locations.findFirst({
        where: eq(locations.slug, slug),
        columns: { name: true, slug: true },
      })
      break
    case 'tag':
      data = await db.query.tags.findFirst({
        where: eq(tags.slug, slug),
        columns: { name: true, slug: true },
      })
      break
    case 'experience':
      data = await db.query.experienceLevels.findFirst({
        where: eq(experienceLevels.slug, slug),
        columns: { name: true, slug: true },
      })
      break
    case 'company':
      data = await db.query.companies.findFirst({
        where: eq(companies.slug, slug),
        columns: { name: true, slug: true, description: true, logo: true },
      })
      break
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid metadata type',
      })
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: `${type} not found`,
    })
  }

  return data
})
