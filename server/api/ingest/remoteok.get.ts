import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { slugify, benefitsParser } from '~~/server/utils/parsers'
import type { RemoteOkJob, JobFromAPIs } from '~~/server/types/JobFromAPIs'

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<RemoteOkJob[]>('https://remoteok.com/api?api=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:108.0) Gecko/20100101 Firefox/108.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Upgrade-Insecure-Requests': '1',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    })

    // Filter logic from v1
    const latestJobs = data.filter((job) => {
      // API sometimes returns legal text as first item without tags
      return job?.tags?.includes('developer') || job?.tags?.includes('engineer')
    }).slice(0, 6)

    const jobsFromAPI = latestJobs.map(job => getApiJobFromRemoteOkJob(job))
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
      message: `Processed ${jobsFromAPI.length} jobs from RemoteOK`,
      queuedCount: queuedLinks.length,
      queuedJobs: queuedLinks,
    }
  }
  catch (e) {
    console.error('Failed to fetch jobs from RemoteOK', e)
    return {
      message: 'Failed to fetch jobs from RemoteOK',
      error: e,
    }
  }
})

const getApiJobFromRemoteOkJob = (job: RemoteOkJob): JobFromAPIs => {
  const duration = 'Full Time'
  const experienceLevel = getExperienceLevelFromPositionAndTags(job.position, job.tags)
  const role = job.position
  const tags = getTagsFromRemoteOkTags(job.tags)
  const benefits = benefitsParser(job.description)
  const locations = getLocationsFromLocationField(job.location)

  return {
    title: job.position,
    description: `<p>${job.description}</p>`,
    link: job.url,
    salary: job.salary_min ? String(job.salary_min) : 'unknown salary',
    postedAt: new Date(job.date),
    slug: slugify(`${job.position}-${job.company}-${job.id}`),
    company: {
      name: job.company,
      logo: job.company_logo,
      slug: slugify(job.company),
      description: '',
    },
    locations,
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

const getExperienceLevelFromPositionAndTags = (position: string, tags: string[]) => {
  let experienceLevel = ''
  const p = position.toLowerCase()

  if (p.includes('senior')) experienceLevel = 'Senior'
  else if (p.includes('mid')) experienceLevel = 'Mid'
  else if (p.includes('junior')) experienceLevel = 'Junior'
  else if (p.includes('entry')) experienceLevel = 'Entry'
  else if (p.includes('intern')) experienceLevel = 'Intern'

  if (!experienceLevel && tags) {
    if (tags.includes('senior')) experienceLevel = 'Senior'
    else if (tags.includes('mid')) experienceLevel = 'Mid'
    else if (tags.includes('junior')) experienceLevel = 'Junior'
    else if (tags.includes('entry')) experienceLevel = 'Entry'
    else if (tags.includes('intern')) experienceLevel = 'Intern'
  }

  return experienceLevel || 'Mid'
}

const getTagsFromRemoteOkTags = (remoteOkTags: string[]) => {
  if (!remoteOkTags) return []
  return remoteOkTags.map(tag => ({
    name: tag,
    slug: slugify(tag),
  }))
}

const getLocationsFromLocationField = (location: string) => {
  if (!location) {
    return [{
      name: 'Probably Worldwide',
      slug: slugify('Probably Worldwide'),
    }]
  }

  const l = location.toLowerCase()
  if (l === 'global' || l === 'worldwide') {
    return [{
      name: 'Worldwide',
      slug: slugify('Worldwide'),
    }]
  }

  return location.split(',').map(loc => ({
    name: loc.trim(),
    slug: slugify(loc.trim()),
  }))
}
