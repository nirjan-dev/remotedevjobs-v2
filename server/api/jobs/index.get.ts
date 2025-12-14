import { db } from '~~/server/database/db'

export default defineEventHandler(async () => {
  const allJobs = await db.query.jobs.findMany({
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
    orderBy: (jobs, { desc }) => [desc(jobs.postedAt)],
    limit: 20,
  })

  return allJobs
})
