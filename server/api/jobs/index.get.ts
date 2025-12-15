import { db } from '~~/server/database/db'
import {
  jobs,
  roles,
  experienceLevels,
  locations,
  jobsToLocations,
  tags,
  jobsToTags,
  benefits,
  jobsToBenefits,
} from '~~/server/database/schema'
import { eq, and, sql, inArray, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Strict Input Validation & Parsing
  const page = Math.max(1, parseInt(String(query.page)) || 1)
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit)) || 20))
  const offset = (page - 1) * limit

  const parseSlugs = (input: unknown) => (input ? String(input).split(',').filter(Boolean) : [])

  const locationSlugs = parseSlugs(query.locations)
  const roleSlugs = parseSlugs(query.roles)
  const tagSlugs = parseSlugs(query.tags)
  const experienceLevelSlugs = parseSlugs(query.experienceLevels)
  const benefitSlugs = parseSlugs(query.benefits)

  const whereConditions = []

  if (locationSlugs?.length) {
    whereConditions.push(
      inArray(
        jobs.id,
        db
          .select({ jobId: jobsToLocations.jobId })
          .from(jobsToLocations)
          .innerJoin(locations, eq(jobsToLocations.locationId, locations.id))
          .where(inArray(locations.slug, locationSlugs)),
      ),
    )
  }

  if (roleSlugs?.length) {
    whereConditions.push(
      inArray(
        jobs.roleId,
        db.select({ id: roles.id }).from(roles).where(inArray(roles.slug, roleSlugs)),
      ),
    )
  }

  if (tagSlugs?.length) {
    whereConditions.push(
      inArray(
        jobs.id,
        db
          .select({ jobId: jobsToTags.jobId })
          .from(jobsToTags)
          .innerJoin(tags, eq(jobsToTags.tagId, tags.id))
          .where(inArray(tags.slug, tagSlugs)),
      ),
    )
  }

  if (benefitSlugs?.length) {
    whereConditions.push(
      inArray(
        jobs.id,
        db
          .select({ jobId: jobsToBenefits.jobId })
          .from(jobsToBenefits)
          .innerJoin(benefits, eq(jobsToBenefits.benefitId, benefits.id))
          .where(inArray(benefits.slug, benefitSlugs)),
      ),
    )
  }

  if (experienceLevelSlugs?.length) {
    whereConditions.push(
      inArray(
        jobs.experienceLevelId,
        db
          .select({ id: experienceLevels.id })
          .from(experienceLevels)
          .where(inArray(experienceLevels.slug, experienceLevelSlugs)),
      ),
    )
  }

  const whereClause = and(...whereConditions)

  const [fullJobs, totalResult] = await Promise.all([
    db.query.jobs.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(jobs.postedAt)],
      with: {
        company: true,
        role: true,
        experienceLevel: true,
        duration: true,
        locations: {
          with: {
            location: true,
          },
        },
        tags: {
          with: {
            tag: true,
          },
        },
        benefits: {
          with: {
            benefit: true,
          },
        },
      },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(whereClause),
  ])

  const total = Number(totalResult[0]?.count || 0)

  return {
    data: fullJobs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
