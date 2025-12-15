<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data: job, error } = await useFetch(`/api/jobs/${slug}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Job not found',
    fatal: true,
  })
}

// Format Date Helper
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// SEO Metadata
useSeoMeta({
  title: () => job.value ? `${job.value.title} at ${job.value.company.name}` : 'Job Not Found',
  description: () => job.value ? `Apply for the ${job.value.title} position at ${job.value.company.name}. Remote job.` : '',
  ogTitle: () => job.value ? `${job.value.title} at ${job.value.company.name}` : 'Job Not Found',
  ogDescription: () => job.value ? `Apply for the ${job.value.title} position at ${job.value.company.name}. Remote job.` : '',
  ogImage: () => job.value?.company.logo || '',
  twitterCard: 'summary_large_image',
})

// Structured Data (JSON-LD)
useSchemaOrg([
  defineJobPosting({
    title: job.value?.title,
    description: job.value?.description,
    hiringOrganization: {
      name: job.value?.company?.name ?? '',
    },
    datePosted: job.value?.postedAt,

  }),
])
</script>

<template>
  <div
    v-if="job"
    class="py-8"
  >
    <!-- Breadcrumbs -->
    <nav class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
      <NuxtLink
        to="/"
        class="hover:text-primary-500"
      >Jobs</NuxtLink>
      <UIcon
        name="i-heroicons-chevron-right"
        class="w-4 h-4 mx-2"
      />
      <span class="truncate max-w-50">{{ job.company.name }}</span>
      <UIcon
        name="i-heroicons-chevron-right"
        class="w-4 h-4 mx-2"
      />
      <span class="font-medium text-gray-900 dark:text-white truncate">{{ job.title }}</span>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Header -->
        <div class="flex items-start gap-4">
          <UAvatar
            :src="job.company.logo"
            :alt="job.company.name"
            size="2xl"
            class="bg-gray-100 dark:bg-gray-800"
          />
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {{ job.title }}
            </h1>
            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span class="font-medium">{{ job.company.name }}</span>
              <span>•</span>
              <span>{{ formatDate(job.postedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Job Description -->
        <UCard>
          <MDC
            v-if="job.description"
            :value="job.description"
          />
        </UCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Action Card -->
        <UCard>
          <UButton
            :to="job.link"
            target="_blank"
            color="primary"
            size="xl"
            block
            icon="i-heroicons-arrow-top-right-on-square"
          >
            Apply Now
          </UButton>
          <p class="text-xs text-center text-gray-500 mt-2">
            You will be redirected to the company's application page.
          </p>
        </UCard>

        <!-- Details Card -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Job Details
            </h3>
          </template>

          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-map-pin"
                class="w-5 h-5 text-gray-400 mt-0.5"
              />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Locations
                </div>
                <div class="flex flex-wrap gap-1 mt-1">
                  <UBadge
                    v-for="loc in job.locations"
                    :key="loc.location.slug"
                    color="neutral"
                    variant="soft"
                  >
                    {{ loc.location.name }}
                  </UBadge>
                </div>
              </div>
            </div>

            <UDivider />

            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-briefcase"
                class="w-5 h-5 text-gray-400 mt-0.5"
              />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Role
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ job.role.name }}
                </div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-clock"
                class="w-5 h-5 text-gray-400 mt-0.5"
              />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Duration
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ job.duration.name }}
                </div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-academic-cap"
                class="w-5 h-5 text-gray-400 mt-0.5"
              />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Experience
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ job.experienceLevel.name }}
                </div>
              </div>
            </div>

            <div
              v-if="job.salary"
              class="flex items-start gap-3"
            >
              <UIcon
                name="i-heroicons-currency-dollar"
                class="w-5 h-5 text-gray-400 mt-0.5"
              />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Salary
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ job.salary }}
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Tags Card -->
        <UCard v-if="job.tags && job.tags.length">
          <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Tech Stack & Tags
            </h3>
          </template>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="tag in job.tags"
              :key="tag.tag.slug"
              color="neutral"
              variant="solid"
              class="border border-gray-200 dark:border-gray-700"
            >
              {{ tag.tag.name }}
            </UBadge>
          </div>
        </UCard>

        <!-- Benefits Card -->
        <UCard v-if="job.benefits && job.benefits.length">
          <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Benefits
            </h3>
          </template>
          <ul class="space-y-2">
            <li
              v-for="benefit in job.benefits"
              :key="benefit.benefit.slug"
              class="flex items-start gap-2"
            >
              <UIcon
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-green-500 shrink-0"
              />
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ benefit.benefit.name }}</span>
            </li>
          </ul>
        </UCard>
      </div>
    </div>
  </div>
</template>
