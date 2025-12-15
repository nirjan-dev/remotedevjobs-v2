import { db } from '~~/server/database/db'
import { jobs, roles, locations, tags, experienceLevels, companies } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = config.public?.siteUrl || 'http://localhost:3000'

  // Fetch all entities
  const [
    allJobs,
    allRoles,
    allLocations,
    allTags,
    allExperienceLevels,
    allCompanies,
  ] = await Promise.all([
    db.select({ slug: jobs.slug, updatedAt: jobs.updatedAt }).from(jobs),
    db.select({ slug: roles.slug }).from(roles),
    db.select({ slug: locations.slug }).from(locations),
    db.select({ slug: tags.slug }).from(tags),
    db.select({ slug: experienceLevels.slug }).from(experienceLevels),
    db.select({ slug: companies.slug }).from(companies),
  ])

  const jobRoutes = allJobs.map(job => ({
    loc: `${siteUrl}/jobs/${job.slug}`,
    lastmod: job.updatedAt,
  }))

  const roleRoutes = allRoles.map(role => ({
    loc: `${siteUrl}/jobs/role/${role.slug}`,
  }))

  const locationRoutes = allLocations.map(location => ({
    loc: `${siteUrl}/jobs/location/${location.slug}`,
  }))

  const tagRoutes = allTags.map(tag => ({
    loc: `${siteUrl}/jobs/tag/${tag.slug}`,
  }))

  const experienceRoutes = allExperienceLevels.map(exp => ({
    loc: `${siteUrl}/jobs/experience/${exp.slug}`,
  }))

  const companyRoutes = allCompanies.map(company => ({
    loc: `${siteUrl}/companies/${company.slug}`,
  }))

  // Note: Blog posts from @nuxt/content
  // In a standard Nuxt setup, the sitemap module often crawls links.
  // However, for explicit inclusion, we would query the content collection here.
  // Since the API for querying collections in server routes for Content v3 is evolving,
  // we will focus on the database-driven job routes which are the primary dynamic content.
  // If blog posts are not automatically discovered via internal linking,
  // they can be added here using 'queryCollection' if available in the server context.

  return [
    ...jobRoutes,
    ...roleRoutes,
    ...locationRoutes,
    ...tagRoutes,
    ...experienceRoutes,
    ...companyRoutes,
  ]
})
