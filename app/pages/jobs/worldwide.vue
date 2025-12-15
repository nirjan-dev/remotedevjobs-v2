<script setup lang="ts">
useSeoMeta({
  title: 'Remote Developer Jobs Worldwide - Work from Anywhere in the world',
  description: 'Find remote jobs worldwide and work from anywhere in the globe. Browse opportunities of different experience levels, technology stacks, and job roles.',
  ogTitle: 'Worldwide Remote Jobs - Work from Anywhere | Remote Developer Jobs',
  ogDescription: 'Find remote jobs worldwide and work from anywhere with our comprehensive list of remote developer jobs. Browse opportunities of different experience levels, technology stacks, and job roles. Start your journey towards a more flexible and fulfilling work-life today!',
})

defineOgImageComponent('Default', {
  title: 'Remote Developer Jobs Worldwide',
  description: 'Find remote jobs worldwide and work from anywhere in the globe. Browse opportunities of different experience levels, technology stacks, and job roles.',
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="text-3xl font-bold mb-4">
      Find Remote Developer Jobs where you can work from anywhere
    </h1>

    <div class="prose max-w-[70ch]">
      <p class="mb-6">
        Looking for remote jobs that allow you to work from anywhere in the world? Our job board offers a comprehensive list of worldwide remote jobs that cater to individuals looking for flexibility and work-life balance. From entry-level to senior positions, we have something for everyone.
      </p>
    </div>

    <JobList
      :title="`All Global Remote Developer Jobs`"
      show-filters
      :predefined-filters="{
        locations: ['worldwide'],
      }"
    />
  </UContainer>
</template>
