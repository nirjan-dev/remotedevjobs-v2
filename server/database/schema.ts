import { pgTable, uuid, text, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// --- Lookup Tables ---

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const locationsRelations = relations(locations, ({ many }) => ({
  jobs: many(jobsToLocations),
}))

export const durations = pgTable('durations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const durationsRelations = relations(durations, ({ many }) => ({
  jobs: many(jobs),
}))

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const rolesRelations = relations(roles, ({ many }) => ({
  jobs: many(jobs),
}))

export const benefits = pgTable('benefits', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const benefitsRelations = relations(benefits, ({ many }) => ({
  jobs: many(jobsToBenefits),
}))

export const experienceLevels = pgTable('experience_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const experienceLevelsRelations = relations(experienceLevels, ({ many }) => ({
  jobs: many(jobs),
}))

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const tagsRelations = relations(tags, ({ many }) => ({
  jobs: many(jobsToTags),
}))

// --- Main Entities ---

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo').notNull(),
})

export const companiesRelations = relations(companies, ({ many }) => ({
  jobs: many(jobs),
}))

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  slug: text('slug').notNull().unique(),
  link: text('link').notNull().unique(),
  salary: text('salary').notNull(),
  postedAt: timestamp('posted_at').notNull(),

  // Foreign Keys
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  durationId: uuid('duration_id').references(() => durations.id).notNull(),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  experienceLevelId: uuid('experience_level_id').references(() => experienceLevels.id).notNull(),
})

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  duration: one(durations, {
    fields: [jobs.durationId],
    references: [durations.id],
  }),
  role: one(roles, {
    fields: [jobs.roleId],
    references: [roles.id],
  }),
  experienceLevel: one(experienceLevels, {
    fields: [jobs.experienceLevelId],
    references: [experienceLevels.id],
  }),
  locations: many(jobsToLocations),
  benefits: many(jobsToBenefits),
  tags: many(jobsToTags),
}))

export const jobQueues = pgTable('job_queues', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  jobDetails: jsonb('job_details').notNull(),
  link: text('link').notNull().unique(),
})

// --- Join Tables (Many-to-Many) ---

export const jobsToLocations = pgTable('jobs_to_locations', {
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id).notNull(),
}, t => ({
  pk: primaryKey({ columns: [t.jobId, t.locationId] }),
}))

export const jobsToLocationsRelations = relations(jobsToLocations, ({ one }) => ({
  job: one(jobs, {
    fields: [jobsToLocations.jobId],
    references: [jobs.id],
  }),
  location: one(locations, {
    fields: [jobsToLocations.locationId],
    references: [locations.id],
  }),
}))

export const jobsToBenefits = pgTable('jobs_to_benefits', {
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  benefitId: uuid('benefit_id').references(() => benefits.id).notNull(),
}, t => ({
  pk: primaryKey({ columns: [t.jobId, t.benefitId] }),
}))

export const jobsToBenefitsRelations = relations(jobsToBenefits, ({ one }) => ({
  job: one(jobs, {
    fields: [jobsToBenefits.jobId],
    references: [jobs.id],
  }),
  benefit: one(benefits, {
    fields: [jobsToBenefits.benefitId],
    references: [benefits.id],
  }),
}))

export const jobsToTags = pgTable('jobs_to_tags', {
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
}, t => ({
  pk: primaryKey({ columns: [t.jobId, t.tagId] }),
}))

export const jobsToTagsRelations = relations(jobsToTags, ({ one }) => ({
  job: one(jobs, {
    fields: [jobsToTags.jobId],
    references: [jobs.id],
  }),
  tag: one(tags, {
    fields: [jobsToTags.tagId],
    references: [tags.id],
  }),
}))
