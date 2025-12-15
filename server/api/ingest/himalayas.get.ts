import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { slugify, benefitsParser } from '~~/server/utils/parsers'
import type { HimalayasJob, JobFromAPIs } from '~~/server/types/JobFromAPIs'

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<{ jobs: HimalayasJob[] }>('https://himalayas.app/jobs/api')

    const developerJobs = data.jobs.filter((job) => {
      return job.categories.some(category => category.toLowerCase().includes('developer'))
    }).slice(0, 20)

    const jobsFromAPI = developerJobs.map(job => getAPIJobFromHimalaysJob(job))
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
      message: `Processed ${jobsFromAPI.length} jobs from Himalayas`,
      queuedCount: queuedLinks.length,
      queuedJobs: queuedLinks,
    }
  }
  catch (e) {
    console.error('Failed to fetch jobs from Himalayas', e)
    return {
      message: 'Failed to fetch jobs from Himalayas',
      error: e,
    }
  }
})

const getAPIJobFromHimalaysJob = (job: HimalayasJob): JobFromAPIs => {
  const experienceLevel = getExperienceLevelFromTitle(job.title)
  const role = getRoleFromTitle(job.title)
  const tags = getTagsFromCategories(job.categories)
  const benefits = benefitsParser(job.description)
  // Type definition uses unknown[], casting to string[] based on API behavior
  const locations = getLocations(job.locationRestrictions as string[])

  const duration = 'Full Time'

  return {
    title: job.title,
    description: job.description,
    link: job.applicationLink,
    salary: 'unknown salary',
    postedAt: new Date(job.pubDate * 1000),
    slug: slugify(`${job.title}-${job.companyName}-${job.pubDate}`),
    company: {
      name: job.companyName,
      logo: job.companyLogo,
      slug: slugify(job.companyName),
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

const getExperienceLevelFromTitle = (title: string) => {
  const t = title.toLowerCase()
  if (t.includes('senior')) return 'Senior'
  if (t.includes('mid')) return 'Mid'
  if (t.includes('junior')) return 'Junior'
  if (t.includes('entry')) return 'Entry'
  if (t.includes('intern')) return 'Intern'
  return 'Mid'
}

const getRoleFromTitle = (title: string) => {
  const t = title.toLowerCase()
  if (t.includes('frontend') || t.includes('front-end')) return 'Frontend'
  if (t.includes('backend') || t.includes('back-end')) return 'Backend'
  if (t.includes('fullstack') || t.includes('full-stack')) return 'Fullstack'
  if (t.includes('mobile') || t.includes('ios') || t.includes('android')) return 'Mobile'
  if (t.includes('devops') || t.includes('sre') || t.includes('infrastructure')) return 'DevOps'
  if (t.includes('designer') || t.includes('ui/ux')) return 'Designer'
  if (t.includes('product')) return 'Product'
  if (t.includes('manager') || t.includes('lead')) return 'Manager'
  if (t.includes('qa') || t.includes('test')) return 'QA'
  if (t.includes('data')) return 'Data'
  if (t.includes('security')) return 'Security'
  if (t.includes('support')) return 'Support'
  return 'Developer'
}

const getTagsFromCategories = (categories: string[]) => {
  return categories.map(category => ({
    name: category,
    slug: slugify(category),
  }))
}

const getLocations = (locationRestrictions: string[]) => {
  if (locationRestrictions && locationRestrictions.length > 0) {
    return locationRestrictions.map(location => ({
      name: location,
      slug: slugify(location),
    }))
  }
  return [{
    name: 'Worldwide',
    slug: slugify('Worldwide'),
  }]
}
