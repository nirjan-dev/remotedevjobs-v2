import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { slugify, benefitsParser } from '~~/server/utils/parsers'
import type { WorkingNomadsJob, JobFromAPIs } from '~~/server/types/JobFromAPIs'

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<WorkingNomadsJob[]>('https://www.workingnomads.com/api/exposed_jobs/')

    const devJobs = data.filter(job => job.category_name.toLowerCase() === 'development')

    const jobsFromAPI = devJobs.map(job => getApiJobFromWorkingNomadsJob(job))
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
      message: `Processed ${jobsFromAPI.length} jobs from WorkingNomads`,
      queuedCount: queuedLinks.length,
      queuedJobs: queuedLinks,
    }
  }
  catch (e) {
    console.error('Failed to fetch jobs from WorkingNomads', e)
    return {
      message: 'Failed to fetch jobs from WorkingNomads',
      error: e,
    }
  }
})

const getApiJobFromWorkingNomadsJob = (job: WorkingNomadsJob): JobFromAPIs => {
  const experienceLevel = getExperienceLevelFromTitle(job.title)
  const role = getRoleFromTitle(job.title)
  const tags = getTagsFromJobTags(job.tags)
  const benefits = benefitsParser(job.description)
  const locations = job.location.split(',').map(location => ({
    name: location.trim(),
    slug: slugify(location.trim()),
  }))

  return {
    title: job.title,
    description: job.description,
    link: job.url,
    salary: 'unknown salary',
    postedAt: new Date(job.pub_date),
    slug: slugify(`${job.title}-${job.company_name}-${new Date(job.pub_date).getTime()}`),
    company: {
      name: job.company_name,
      description: '',
      logo: '',
      slug: slugify(job.company_name),
    },
    locations,
    duration: {
      name: 'Full Time',
      slug: slugify('Full Time'),
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

const getTagsFromJobTags = (tags: string) => {
  if (!tags) return []
  return tags.split(',').map(tag => ({
    name: tag,
    slug: slugify(tag.replace(/#/g, 'sharp ')),
  }))
}
