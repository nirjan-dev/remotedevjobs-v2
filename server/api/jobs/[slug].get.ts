import { db } from '~~/server/database/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing slug parameter',
    })
  }

  const job = await db.query.jobs.findFirst({
    where: (jobs, { eq }) => eq(jobs.slug, slug),
    with: {
      company: true,
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
      duration: true,
      role: true,
      experienceLevel: true,
      benefits: {
        with: {
          benefit: true,
        },
      },
    },
  })

  if (!job) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Job not found',
    })
  }

  return job
})
