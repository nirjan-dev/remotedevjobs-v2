<script setup lang="ts">
interface JobLocation {
  location: {
    name: string
    slug: string
  }
}

interface JobTag {
  tag: {
    name: string
    slug: string
  }
}

interface JobBenefit {
  benefit: {
    name: string
    slug: string
  }
}

interface Job {
  id: string
  title: string
  slug: string
  description: string
  salary: string
  postedAt: string | Date
  company: {
    name: string
    logo: string
    slug: string
  }
  locations: JobLocation[]
  duration: {
    name: string
  }
  experienceLevel: {
    name: string
  }
  tags: JobTag[]
  benefits: JobBenefit[]
}

defineProps<{
  job: Job
}>()

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <UCard class="hover:ring-2 hover:ring-primary-500 transition-all duration-200">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Logo -->
      <div class="shrink-0">
        <UAvatar
          :src="job.company.logo || ''"
          :alt="job.company.name"
          size="lg"
          class="bg-neutral-100 dark:bg-neutral-800"
        />
      </div>

      <!-- Content -->
      <div class="grow space-y-2">
        <div class="flex flex-col  items-start gap-4">
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
              <NuxtLink
                :to="`/jobs/${job.slug}`"
                class="hover:underline focus:outline-none"
              >
                {{ job.title }}
              </NuxtLink>
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ job.company.name }}
            </p>
          </div>

          <div class="shrink-0 text-sm text-neutral-400 whitespace-nowrap">
            {{ formatDate(job.postedAt) }}
          </div>
        </div>

        <!-- Meta Info -->
        <div class="flex flex-wrap gap-2 text-sm text-neutral-600 dark:text-neutral-300 items-center">
          <div
            v-if="job.locations?.length"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-heroicons-map-pin"
              class="w-4 h-4"
            />
            <span>{{ job.locations.map(l => l.location.name).join(', ') }}</span>
          </div>

          <span class="hidden sm:inline text-neutral-300">•</span>

          <div class="flex items-center gap-1">
            <UIcon
              name="i-heroicons-clock"
              class="w-4 h-4"
            />
            <span>{{ job.duration.name }}</span>
          </div>

          <span class="hidden sm:inline text-neutral-300">•</span>

          <div class="flex items-center gap-1">
            <UIcon
              name="i-heroicons-briefcase"
              class="w-4 h-4"
            />
            <span>{{ job.experienceLevel.name }}</span>
          </div>

          <span
            v-if="job.salary"
            class="hidden sm:inline text-neutral-300"
          >•</span>

          <div
            v-if="job.salary"
            class="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"
          >
            <UIcon
              name="i-heroicons-currency-dollar"
              class="w-4 h-4"
            />
            <span>{{ job.salary }}</span>
          </div>
        </div>

        <!-- Benefits -->
        <div
          v-if="job.benefits.length > 0"
          class="flex flex-wrap gap-2 mt-3"
        >
          <UBadge
            v-for="b in job.benefits.slice(0, 5)"
            :key="b.benefit.slug"
            color="info"
            variant="soft"
            size="sm"
          >
            {{ b.benefit.name }}
          </UBadge>
          <span
            v-if="job.benefits.length > 5"
            class="text-sm text-neutral-500 self-center"
          >
            +{{ job.benefits.length - 5 }} more
          </span>
        </div>

        <!-- Tags -->
        <div
          v-if="job.tags?.length"
          class="flex flex-wrap gap-2 mt-3"
        >
          <UBadge
            v-for="t in job.tags.slice(0, 5)"
            :key="t.tag.slug"
            color="neutral"
            variant="soft"
            size="sm"
          >
            {{ t.tag.name }}
          </UBadge>
          <span
            v-if="job.tags.length > 5"
            class="text-sm text-neutral-500 self-center"
          >
            +{{ job.tags.length - 5 }} more
          </span>
        </div>
      </div>

      <!-- Action -->
      <div class="shrink-0  sm:self-start mt-2 sm:mt-0">
        <UButton
          :to="`/jobs/${job.slug}`"
          color="primary"
          variant="solid"
          icon="i-heroicons-arrow-right"
          :trailing="true"
        >
          View Job
        </UButton>
      </div>
    </div>
  </UCard>
</template>
