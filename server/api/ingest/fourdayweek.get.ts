import { marked } from 'marked'
import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { slugify, benefitsParser } from '~~/server/utils/parsers'
import type { FourDayWeekJob, JobFromAPIs } from '~~/server/types/JobFromAPIs'

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<{ jobs: FourDayWeekJob[] }>('https://4dayweek.io/api')

    const latestJobs = data.jobs.slice(0, 20)
    const engineeringJobs = latestJobs.filter(job => job.category === 'Engineering')

    const jobsFromAPI = engineeringJobs.map(job => getApiJobFromFourDayWeekJob(job))
    const queuedLinks: string[] = []

    for (const job of jobsFromAPI) {
      try {
        const result = await db.insert(jobQueues).values({
          jobDetails: job as unknown as object,
          link: job.link,
        }).onConflictDoNothing().returning({ link: jobQueues.link })

        if (result.length > 0) {
          queuedLinks.push(result[0]?.link)
        }
      }
      catch (e) {
        console.error(`Failed to queue job: ${job.link}`, e)
      }
    }

    return {
      message: `Processed ${jobsFromAPI.length} jobs from 4dayweek.io`,
      queuedCount: queuedLinks.length,
      queuedJobs: queuedLinks,
    }
  }
  catch (e) {
    console.error('Failed to fetch jobs from 4dayweek.io', e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch jobs from 4dayweek.io',
      cause: e,
    })
  }
})

const getApiJobFromFourDayWeekJob = (job: FourDayWeekJob): JobFromAPIs => {
  const duration = getDurationFromReducedHoursAndOriginalTitle(job.reduced_hours, job.title_original)
  const experienceLevel = getExperienceLevelFromTitle(job.title)
  const role = job.role
  const tags = getTagsFromFilters(job.filters)

  const descriptionForBenefits = job.company.description ?? job.company.short_description ?? job.description
  const benefits = getBenefitsFromCompanyDescription(descriptionForBenefits)

  const location = getLocationFromLocationFields(job.location_continent, job.location_country)

  return {
    title: job.title,
    description: marked.parse(job.description) as string,
    link: job.url,
    salary: 'unknown salary',
    postedAt: new Date(job.posted * 1000),
    slug: slugify(job.title + '-' + job.company_name + '-' + job.id_str),
    company: {
      name: job.company.name,
      logo: job.company.logo_url,
      slug: slugify(job.company.name),
      description: (job.company.description || job.company.short_description)
        ? (marked.parse(job.company.description ?? job.company.short_description ?? '') as string)
        : '',
    },
    locations: [{
      name: location,
      slug: slugify(location),
    }],
    duration: {
      name: duration,
      slug: slugify(duration),
    },
    experienceLevel: {
      name: experienceLevel,
      slug: slugify(experienceLevel),
    },
    role: {
      name: role,
      slug: slugify(role),
    },
    tags,
    benefits,
  }
}

const getDurationFromReducedHoursAndOriginalTitle = (reducedHours: string, originalTitle?: string) => {
  let duration = 'Full Time'
  if (reducedHours === 'Part time') {
    duration = 'Part Time'
  }

  if (originalTitle?.toLowerCase().includes('contract')) {
    duration = 'Contract'
  }

  return duration
}

const getExperienceLevelFromTitle = (title: string) => {
  const t = title.toLowerCase()
  if (t.includes('senior')) return 'Senior'
  if (t.includes('mid')) return 'Mid'
  if (t.includes('junior')) return 'Junior'
  if (t.includes('entry')) return 'Entry'
  if (t.includes('intern')) return 'Intern'
  return 'Mid'
}

const getTagsFromFilters = (filters: { label: string, value: string }[]) => {
  if (!filters) return []
  return filters.map(filter => ({
    name: filter.label,
    slug: slugify(filter.label),
  }))
}

const getBenefitsFromCompanyDescription = (description: string) => {
  const benefits = benefitsParser(description)

  if (!benefits.some(b => b.name === '4 day work week')) {
    benefits.push({
      name: '4 day work week',
      slug: slugify('4 day work week'),
    })
  }

  return benefits
}

const getLocationFromLocationFields = (locationContinent: string | null, locationCountry: string | null) => {
  let location = 'Worldwide'

  if (locationContinent) {
    location = locationContinent
  }

  if (locationCountry) {
    location = locationCountry
  }

  return location
}
