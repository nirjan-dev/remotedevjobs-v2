import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { slugify } from '~~/server/utils/parsers'
import type { TrulyRemoteRecord, TrulyRemoteFields, JobFromAPIs } from '~~/server/types/JobFromAPIs'

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<{ records: TrulyRemoteRecord[] }>('https://trulyremote.co/api/getListing', {
      method: 'POST',
      body: {
        category: 'Development',
      },
    })

    const jobsFromAPI = data.records.map(record => getAPIJobFromTrulyRemoteJob(record))
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
      message: `Processed ${jobsFromAPI.length} jobs from TrulyRemote`,
      queuedCount: queuedLinks.length,
      queuedJobs: queuedLinks,
    }
  }
  catch (e) {
    console.error('Failed to fetch jobs from TrulyRemote', e)
    return {
      message: 'Failed to fetch jobs from TrulyRemote',
      error: e,
    }
  }
})

const getAPIJobFromTrulyRemoteJob = (record: TrulyRemoteRecord): JobFromAPIs => {
  const { fields: job } = record

  const experienceLevel = getExperienceLevelFromJob(job)
  const role = getRoleFromJob(job)
  const tags = getTagsFromJob(job)

  const locations = job.useListingRegions === 'Anywhere in the world'
    ? [{
        name: 'Worldwide',
        slug: slugify('Worldwide'),
      }]
    : job.useListingRegions.split(',').map(location => ({
        name: location.trim(),
        slug: slugify(location.trim()),
      }))

  const description = `
  <h2>Apply to the role of ${job.role} at ${job.companyName[0]}</h2>
  <img width="250" height="250" src="${job.companyLogoURL[0]}" alt="${job.companyName[0]} logo" />
    <p>
    ${job.companyName[0]} is a ${job.companyIndustry} company with teams in ${job.companyRegions}
    </p>

    <p>
      This is a fully remote job so you'll be able to work from ${job.useListingRegions}.
    </p>

    <p>
    To apply for the role please visit <a rel="noreferrer noopener" href="${job.roleApplyURL}">the application link.</a>
    </p>
    `.replaceAll('\n', '')

  return {
    title: job.role,
    description,
    link: job.roleApplyURL,
    salary: 'unknown salary',
    postedAt: new Date(job.createdOn),
    slug: slugify(`${job.role}-${job.companyName[0]}-${job.listingID}`),
    company: {
      name: job.companyName[0],
      description: '',
      logo: job.companyLogoURL[0],
      slug: slugify(job.companyName[0]),
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
    benefits: [{
      name: 'Flexible',
      slug: slugify('Flexible'),
    }],
  }
}

const getExperienceLevelFromJob = (job: TrulyRemoteFields) => {
  const title = job.role.toLowerCase()

  if (title.includes('senior')) return 'Senior'
  if (title.includes('mid')) return 'Mid'
  if (title.includes('junior')) return 'Junior'
  if (title.includes('entry')) return 'Entry'
  if (title.includes('intern')) return 'Intern'

  return 'Mid'
}

const getRoleFromJob = (job: TrulyRemoteFields) => {
  const t = job.role.toLowerCase()
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

const getTagsFromJob = (job: TrulyRemoteFields) => {
  const tags = []

  if (job.roleCategory && job.roleCategory[0]) {
    tags.push(job.roleCategory[0])
  }
  if (job.companyIndustry && job.companyIndustry[0]) {
    tags.push(job.companyIndustry[0])
  }

  return tags.map(tag => ({
    name: tag,
    slug: slugify(tag),
  }))
}
