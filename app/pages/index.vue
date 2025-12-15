<script setup lang="ts">
// Fetch Jobs
const { data, error, refresh } = await useFetch('/api/jobs', {
  params: {
    limit: 5,
  },
})

// SEO
defineOgImageComponent('Default', {
  title: 'remotedevjobs.net',
  description: 'Browse curated remote software development jobs from top companies worldwide.',
})
useSeoMeta({
  title: 'RemoteDevJobs - Find your next remote developer job',
  description: 'Browse curated remote software development jobs from top companies worldwide.',
})
</script>

<template>
  <div class="py-8 space-y-8">
    <!-- Header -->
    <section class="text-center space-y-4 mb-12">
      <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
        Find your next <span class="text-primary">remote developer</span> job
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        We'll help you find the best remote full stack developer jobs, junior developer jobs, remote programming jobs, remote front-end developer jobs, and more, no matter where you are in the world.
      </p>
    </section>

    <!-- Error State -->
    <div
      v-if="error"
      class="text-center py-12"
    >
      <UIcon
        name="i-heroicons-exclamation-triangle"
        class="w-12 h-12 mx-auto text-red-500 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Something went wrong
      </h3>
      <p class="text-gray-500 mb-4">
        We couldn't load the jobs. Please try again later.
      </p>
      <UButton
        @click="() => refresh()"
      >
        Retry
      </UButton>
    </div>

    <!-- Job List -->
    <div
      v-else-if="data?.data?.length"
      class="space-y-6"
    >
      <div class="flex flex-col md:flex-row justify-between md:items-center">
        <h2 class="text-lg px-2 md:text-2xl font-bold">
          Latest Remote Developer Jobs
        </h2>
        <UButton
          variant="ghost"
          size="md"
          icon="i-heroicons-arrow-right"
          trailing
          to="/jobs"
        >
          View all jobs
        </UButton>
      </div>
      <div class="space-y-4">
        <JobCard
          v-for="job in data.data"
          :key="job.id"
          :job="job"
        />
      </div>

      <UButton
        size="xl"
        icon="i-heroicons-arrow-right"
        trailing
        to="/jobs"
      >
        View all jobs
      </UButton>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700"
    >
      <UIcon
        name="i-heroicons-magnifying-glass"
        class="w-12 h-12 mx-auto text-gray-400 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        No jobs found
      </h3>
    </div>
  </div>
</template>
