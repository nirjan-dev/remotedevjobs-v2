import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { slugify, benefitsParser } from '~~/server/utils/parsers'
import type { DevRemoteJob, JobFromAPIs } from '~~/server/types/JobFromAPIs'

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<{ jobs: DevRemoteJob[] }>('https://devremote.io/api/jobs/filter', {
      method: 'POST',
      body: {
        query: {
          search: '',
          techStack: [],
          date: 'ALL',
          employmentType: 'FULL_TIME',
          removeCompetitiveSalary: false,
          salaryRange: {
            min: 0,
            max: 10000000,
          },
          tags: [],
        },
        pageSize: 30,
        skip: 0,
      },
    })

    const jobsFromAPI = data.jobs.map(job => getAPIJobFromDevRemoteJob(job))
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
      message: `Processed ${jobsFromAPI.length} jobs from DevRemote`,
      queuedCount: queuedLinks.length,
      queuedJobs: queuedLinks,
    }
  }
  catch (e) {
    console.error('Failed to fetch jobs from DevRemote', e)
    return {
      message: 'Failed to fetch jobs from DevRemote',
      error: e,
    }
  }
})

const getAPIJobFromDevRemoteJob = (job: DevRemoteJob): JobFromAPIs => {
  const experienceLevel = getExperienceLevelFromJob(job)
  const role = getRoleFromTitle(job.title)
  const tags = getTagsFromJobTags(job.tags)
  const benefits = benefitsParser(job.description)
  // Note: 'postitionType' typo comes from the API response/Type definition
  const duration = job.postitionType?.toLowerCase() ?? 'Full Time'
  // Logic from v1: if noSalary is true, it constructs the range string (?)
  const salary = job.noSalary ? `${job.salaryLower} - ${job.salaryUpper}` : 'unknown salary'

  return {
    title: job.title,
    description: job.description,
    link: job.applicationLink,
    salary,
    postedAt: new Date(job.createdAt),
    slug: slugify(job.slug),
    company: {
      name: job.company,
      description: '',
      logo: job.companyLogo,
      slug: slugify(job.company),
    },
    locations: [{
      name: 'Worldwide',
      slug: slugify('Worldwide'),
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

const getExperienceLevelFromJob = (job: DevRemoteJob) => {
  if (job.seniority && job.seniority !== 'NOT_STATED') {
    return job.seniority
  }

  const title = job.title.toLowerCase()
  if (title.includes('senior')) return 'Senior'
  if (title.includes('mid')) return 'Mid'
  if (title.includes('junior')) return 'Junior'
  if (title.includes('entry')) return 'Entry'
  if (title.includes('intern')) return 'Intern'

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

const getTagsFromJobTags = (tags: string[]) => {
  if (!tags) return []
  return tags.map(tag => ({
    name: tag,
    slug: slugify(tag.replace(/#/g, 'sharp ')),
  }))
}
