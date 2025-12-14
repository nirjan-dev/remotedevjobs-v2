import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { slugify, benefitsParser } from '~~/server/utils/parsers'
import type { RemotiveJob, JobFromAPIs } from '~~/server/types/JobFromAPIs'

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<
      { jobs: RemotiveJob[] }
    >('https://remotive.com/api/remote-jobs?category=software-dev&limit=12')

    const jobsFromAPI = data.jobs.map(job => getAPIJobFromRemotiveJob(job))
    const queuedLinks: string[] = []

    for (const job of jobsFromAPI) {
      try {
        // Drizzle insert with onConflictDoNothing for unique link constraint
        const result = await db.insert(jobQueues).values({
          jobDetails: job as unknown as object, // JSONB handling
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
      message: `Processed ${jobsFromAPI.length} jobs from Remotive`,
      queuedCount: queuedLinks.length,
      queuedJobs: queuedLinks,
    }
  }
  catch (e) {
    console.error('Failed to fetch jobs from Remotive', e)
    return {
      message: 'Failed to fetch jobs from Remotive',
      error: e,
    }
  }
})

const getAPIJobFromRemotiveJob = (job: RemotiveJob): JobFromAPIs => {
  const duration = getDurationFromJobType(job.job_type)
  const experienceLevel = getExperienceLevelFromTitle(job.title)
  const role = getRoleFromTitle(job.title)
  const tags = getTagsFromRemotiveTags(job.tags)
  const benefits = benefitsParser(job.description)

  return {
    title: job.title,
    description: job.description,
    link: job.url,
    salary: job.salary || 'Competitive',
    postedAt: new Date(job.publication_date),
    slug: slugify(`${job.title}-${job.company_name}-${job.id}`),
    company: {
      name: job.company_name,
      logo: job.company_logo_url,
      slug: slugify(job.company_name),
      description: '',
    },
    locations: job.candidate_required_location.split(',').map(loc => ({
      name: loc.trim(),
      slug: slugify(loc),
    })),
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

const getDurationFromJobType = (jobType: string) => {
  if (!jobType) return 'Full Time'
  return jobType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const getExperienceLevelFromTitle = (title: string) => {
  const t = title.toLowerCase()
  if (t.includes('senior')) return 'Senior'
  if (t.includes('mid')) return 'Mid'
  if (t.includes('junior')) return 'Junior'
  if (t.includes('entry')) return 'Entry'
  if (t.includes('intern')) return 'Intern'
  return 'Mid' // Default
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

const getTagsFromRemotiveTags = (tags: string[]) => {
  if (!tags) return []
  return tags.map(tag => ({
    name: tag,
    slug: slugify(tag.replace(/#/g, 'sharp ')),
  }))
}
