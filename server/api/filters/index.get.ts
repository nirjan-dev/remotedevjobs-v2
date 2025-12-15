import { db } from '~~/server/database/db'
import { locations, roles, experienceLevels, tags } from '~~/server/database/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const [
    allLocations,
    allRoles,
    allExperienceLevels,
    allTags,
  ] = await Promise.all([
    db.select({ name: locations.name, slug: locations.slug }).from(locations).orderBy(asc(locations.name)),
    db.select({ name: roles.name, slug: roles.slug }).from(roles).orderBy(asc(roles.name)),
    db.select({ name: experienceLevels.name, slug: experienceLevels.slug }).from(experienceLevels).orderBy(asc(experienceLevels.name)),
    db.select({ name: tags.name, slug: tags.slug }).from(tags).orderBy(asc(tags.name)),
  ])

  return {
    locations: allLocations,
    roles: allRoles,
    experienceLevels: allExperienceLevels,
    tags: allTags,
  }
})
