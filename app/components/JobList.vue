<script setup lang="ts">
const props = defineProps<{
  title?: string
  showFilters?: boolean
  predefinedFilters?: {
    locations?: string[]
    roles?: string[]
    tags?: string[]
    experienceLevels?: string[]
    benefits?: string[]
  }
}>()

const route = useRoute()
const router = useRouter()

// Helper to safely get single query param
const getQueryParam = (param: string | undefined) => {
  return param ? param.split(',') : undefined
}

// Reactive state initialized from URL
const page = ref(Number(route.query.page) || 1)
const limit = 20

const filters = ref({
  locations: getQueryParam(route.query.locations as string),
  roles: getQueryParam(route.query.roles as string),
  tags: getQueryParam(route.query.tags as string),
  experienceLevels: getQueryParam(route.query.experienceLevels as string),
})
const combinedFilters = computed(() => {
  // merge predefined filters if defined with filters from URL
  const combinedLocations = []
  const combinedRoles = []
  const combinedTags = []
  const combinedExperienceLevels = []
  const combinedBenefits = []

  if (props.predefinedFilters?.locations) {
    combinedLocations.push(...props.predefinedFilters.locations)
  }
  if (filters.value.locations) {
    combinedLocations.push(...filters.value.locations)
  }

  if (props.predefinedFilters?.roles) {
    combinedRoles.push(...props.predefinedFilters.roles)
  }
  if (filters.value.roles) {
    combinedRoles.push(...filters.value.roles)
  }

  if (props.predefinedFilters?.tags) {
    combinedTags.push(...props.predefinedFilters.tags)
  }
  if (filters.value.tags) {
    combinedTags.push(...filters.value.tags)
  }

  if (props.predefinedFilters?.experienceLevels) {
    combinedExperienceLevels.push(...props.predefinedFilters.experienceLevels)
  }
  if (filters.value.experienceLevels) {
    combinedExperienceLevels.push(...filters.value.experienceLevels)
  }

  if (props.predefinedFilters?.benefits) {
    combinedBenefits.push(...props.predefinedFilters.benefits)
  }

  return {
    locations: combinedLocations,
    roles: combinedRoles,
    tags: combinedTags,
    experienceLevels: combinedExperienceLevels,
    benefits: combinedBenefits,
  }
})

// Sync URL with State
watch([filters, page], () => {
  const filtersObject = filters.value
  const newSearchParams = new URLSearchParams()

  // Add filters to query
  Object.entries(filtersObject).forEach(([key, value]) => {
    if (value) {
      newSearchParams.set(key, value.join(','))
    }
  })

  // Add page if > 1
  if (page.value > 1) {
    newSearchParams.set('page', page.value.toString())
  }

  const newQuery = Object.fromEntries(newSearchParams.entries())
  router.push({ query: newQuery })
}, { deep: true })

// Reset page when filters change
watch(filters, () => {
  page.value = 1
}, { deep: true })

// Fetch Jobs
const { data, status, error, refresh } = await useFetch('/api/jobs', {
  query: computed(() => ({
    page: page.value,
    limit,
    ...combinedFilters.value,
  })),
  watch: [page],
})

// Scroll to top on pagination
watch(page, () => {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
})
</script>

<template>
  <div class="space-y-8 py-8">
    <!-- Header -->
    <section
      v-if="title"
      class="text-center space-y-4 mb-8"
    >
      <h2
        v-if="title"
        class="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl"
      >
        {{ title }}
      </h2>
    </section>

    <!-- Filters -->
    <JobFilters
      v-if="showFilters !== false"
      v-model="filters"
    />

    <!-- Loading State -->
    <div
      v-if="status === 'pending'"
      class="space-y-4"
    >
      <div
        v-for="i in 5"
        :key="i"
      >
        <UCard>
          <div class="flex items-center space-x-4">
            <USkeleton class="h-12 w-12 rounded-full" />
            <div class="space-y-2 flex-1">
              <USkeleton class="h-4 w-62.5" />
              <USkeleton class="h-4 w-50" />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
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
        color="neutral"
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
      <div class="space-y-4">
        <JobCard
          v-for="job in data.data"
          :key="job.id"
          :job="job"
        />
      </div>

      <!-- Pagination -->
      <div class="flex justify-center pt-8 border-t border-gray-200 dark:border-gray-800">
        <UPagination
          v-model:page="page"
          :items-per-page="limit"
          :total="data.meta.total"
        />
      </div>
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
      <p class="text-gray-500 mb-6">
        Try adjusting your search criteria or clear filters to see more results.
      </p>
      <UButton
        variant="outline"
        @click="filters = { locations: undefined, roles: undefined, tags: undefined, experienceLevels: undefined }"
      >
        Clear Filters
      </UButton>
    </div>
  </div>
</template>
