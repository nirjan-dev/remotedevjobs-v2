import 'dotenv/config'
import * as schema from './schema'
import { db } from './db'

const main = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  console.log('🌱 Starting seed...')

  try {
    // Cleanup existing data
    console.log('Cleaning up...')
    await db.delete(schema.jobsToLocations)
    await db.delete(schema.jobsToBenefits)
    await db.delete(schema.jobsToTags)
    await db.delete(schema.jobs)
    await db.delete(schema.companies)
    await db.delete(schema.locations)
    await db.delete(schema.durations)
    await db.delete(schema.roles)
    await db.delete(schema.benefits)
    await db.delete(schema.experienceLevels)
    await db.delete(schema.tags)

    // Insert Lookups
    console.log('Inserting lookups...')

    const [location] = await db.insert(schema.locations).values({ name: 'Remote (Worldwide)', slug: 'remote-worldwide' }).returning()
    const [duration] = await db.insert(schema.durations).values({ name: 'Full-time', slug: 'full-time' }).returning()
    const [role] = await db.insert(schema.roles).values({ name: 'Software Engineer', slug: 'software-engineer' }).returning()
    const [benefit] = await db.insert(schema.benefits).values({ name: '401k', slug: '401k' }).returning()
    const [expLevel] = await db.insert(schema.experienceLevels).values({ name: 'Senior', slug: 'senior' }).returning()
    const [tag] = await db.insert(schema.tags).values({ name: 'Vue.js', slug: 'vuejs' }).returning()

    // Insert Company
    console.log('Inserting company...')
    const [company] = await db.insert(schema.companies).values({
      name: 'NuxtLabs',
      description: 'The company behind Nuxt.',
      slug: 'nuxtlabs',
      logo: 'https://nuxt.com/assets/design-kit/logo/icon-green.png',
    }).returning()

    // Insert Job
    console.log('Inserting job...')
    const [job] = await db.insert(schema.jobs).values({
      title: 'Senior Vue Developer',
      description: 'We are looking for a Senior Vue Developer...',
      slug: 'senior-vue-developer-nuxtlabs',
      link: 'https://nuxt.com/jobs/senior-vue-developer',
      salary: '$120k - $150k',
      postedAt: new Date(),
      companyId: company.id,
      durationId: duration.id,
      roleId: role.id,
      experienceLevelId: expLevel.id,
    }).returning()

    // Insert Relations
    console.log('Linking relations...')
    await db.insert(schema.jobsToLocations).values({ jobId: job.id, locationId: location.id })
    await db.insert(schema.jobsToBenefits).values({ jobId: job.id, benefitId: benefit.id })
    await db.insert(schema.jobsToTags).values({ jobId: job.id, tagId: tag.id })

    console.log('✅ Seed complete!')
    process.exit(0)
  }
  catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

main()
