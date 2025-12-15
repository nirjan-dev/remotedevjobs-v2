<script setup lang="ts">
const { data: options } = await useFetch('/api/filters')

const model = defineModel<{
  locations: string[] | undefined
  roles: string[] | undefined
  tags: string[] | undefined
  experienceLevels: string[] | undefined
}>({ required: true })

const resetFilters = () => {
  model.value = {
    locations: undefined,
    roles: undefined,
    tags: undefined,
    experienceLevels: undefined,
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <USelectMenu
        v-model="model.locations"
        multiple
        :items="options?.locations || []"
        label-key="name"
        value-key="slug"
        placeholder="Location"
        searchable
        searchable-placeholder="Search locations..."
      />

      <USelectMenu
        v-model="model.roles"
        multiple
        :items="options?.roles || []"
        label-key="name"
        value-key="slug"
        placeholder="Role"
        searchable
        searchable-placeholder="Search roles..."
      />

      <USelectMenu
        v-model="model.experienceLevels"
        multiple
        :items="options?.experienceLevels || []"
        label-key="name"
        value-key="slug"
        placeholder="Experience"
      />

      <USelectMenu
        v-model="model.tags"
        :items="options?.tags || []"
        multiple
        label-key="name"
        value-key="slug"
        placeholder="Tag"
        searchable
        searchable-placeholder="Search tags..."
      />
    </div>

    <!-- Clear Filters -->
    <div
      v-if="model.locations || model.roles || model.experienceLevels || model.tags"
      class="flex justify-end"
    >
      <UButton
        icon="i-heroicons-trash"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="resetFilters"
      >
        Clear Filters
      </UButton>
    </div>
  </div>
</template>
