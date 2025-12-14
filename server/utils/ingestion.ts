import { db } from '~~/server/database/db'

import {
  companies,
  jobs,
  locations,
  durations,
  roles,
  experienceLevels,
  tags,
  benefits,
  jobsToLocations,
  jobsToTags,
  jobsToBenefits,
} from '../database/schema'
import { eq } from 'drizzle-orm'
import type { JobFromAPIs } from '../types/JobFromAPIs'

export const createJobFromAPIJob = async (jobData: JobFromAPIs) => {
  return await db.transaction(async (tx) => {
    // 1. Company
    let companyId: string

    const existingCompany = await tx.query.companies.findFirst({
      where: eq(companies.slug, jobData.company.slug),
    })

    if (existingCompany) {
      companyId = existingCompany.id
    }
    else {
      const [newCompany] = await tx.insert(companies).values({
        name: jobData.company.name,
        description: jobData.company.description || '',
        slug: jobData.company.slug,
        logo: jobData.company.logo || '',
      }).returning()
      companyId = newCompany.id
    }

    // 2. Lookups (Single Relations)

    // Duration
    let durationId: string
    const existingDuration = await tx.query.durations.findFirst({
      where: eq(durations.slug, jobData.duration.slug),
    })
    if (existingDuration) {
      durationId = existingDuration.id
    }
    else {
      const [newDuration] = await tx.insert(durations).values({
        name: jobData.duration.name,
        slug: jobData.duration.slug,
      }).returning()
      durationId = newDuration.id
    }

    // Role
    let roleId: string
    const existingRole = await tx.query.roles.findFirst({
      where: eq(roles.slug, jobData.role.slug),
    })
    if (existingRole) {
      roleId = existingRole.id
    }
    else {
      const [newRole] = await tx.insert(roles).values({
        name: jobData.role.name,
        slug: jobData.role.slug,
      }).returning()
      roleId = newRole.id
    }

    // Experience Level
    let experienceLevelId: string
    const existingExp = await tx.query.experienceLevels.findFirst({
      where: eq(experienceLevels.slug, jobData.experienceLevel.slug),
    })
    if (existingExp) {
      experienceLevelId = existingExp.id
    }
    else {
      const [newExp] = await tx.insert(experienceLevels).values({
        name: jobData.experienceLevel.name,
        slug: jobData.experienceLevel.slug,
      }).returning()
      experienceLevelId = newExp.id
    }

    // 3. Job
    // Check if job exists by link (as unique constraint)
    const existingJob = await tx.query.jobs.findFirst({
      where: eq(jobs.link, jobData.link),
    })

    if (existingJob) {
      return existingJob
    }

    const [newJob] = await tx.insert(jobs).values({
      title: jobData.title,
      description: jobData.description,
      slug: jobData.slug,
      link: jobData.link,
      salary: jobData.salary,
      postedAt: new Date(jobData.postedAt),
      companyId,
      durationId,
      roleId,
      experienceLevelId,
    }).returning()

    // 4. Many-to-Many Relations

    // Locations
    if (jobData.locations && jobData.locations.length > 0) {
      for (const loc of jobData.locations) {
        let locationId: string
        const existingLoc = await tx.query.locations.findFirst({
          where: eq(locations.slug, loc.slug),
        })

        if (existingLoc) {
          locationId = existingLoc.id
        }
        else {
          const [newLoc] = await tx.insert(locations).values({
            name: loc.name,
            slug: loc.slug,
          }).returning()
          locationId = newLoc.id
        }

        await tx.insert(jobsToLocations).values({
          jobId: newJob.id,
          locationId,
        }).onConflictDoNothing()
      }
    }

    // Tags
    if (jobData.tags && jobData.tags.length > 0) {
      for (const tag of jobData.tags) {
        let tagId: string
        const existingTag = await tx.query.tags.findFirst({
          where: eq(tags.slug, tag.slug),
        })

        if (existingTag) {
          tagId = existingTag.id
        }
        else {
          const [newTag] = await tx.insert(tags).values({
            name: tag.name,
            slug: tag.slug,
          }).returning()
          tagId = newTag.id
        }

        await tx.insert(jobsToTags).values({
          jobId: newJob.id,
          tagId,
        }).onConflictDoNothing()
      }
    }

    // Benefits
    if (jobData.benefits && jobData.benefits.length > 0) {
      for (const ben of jobData.benefits) {
        let benefitId: string
        const existingBen = await tx.query.benefits.findFirst({
          where: eq(benefits.slug, ben.slug),
        })

        if (existingBen) {
          benefitId = existingBen.id
        }
        else {
          const [newBen] = await tx.insert(benefits).values({
            name: ben.name,
            slug: ben.slug,
          }).returning()
          benefitId = newBen.id
        }

        await tx.insert(jobsToBenefits).values({
          jobId: newJob.id,
          benefitId,
        }).onConflictDoNothing()
      }
    }

    return newJob
  })
}
