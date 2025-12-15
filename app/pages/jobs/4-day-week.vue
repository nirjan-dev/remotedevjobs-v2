<script setup lang="ts">
useSeoMeta({
  title: '4 Day Work Week Jobs for Software Engineers | Remote Tech Jobs',
  description: 'Find 4-day work week jobs and companies offering flexibility for a healthy work-life balance. Discover the perfect job for you.',
  ogTitle: 'Worldwide Remote Jobs - Work from Anywhere | Remote Developer Jobs',
  ogDescription: 'Discover 4-day work week jobs and companies offering flexibility for a healthy work-life balance. Browse our list of 4-day work week tech jobs across various industries, and find the perfect fit for you. Start your journey towards a healthier work-life balance today!',
})

defineOgImageComponent('Default', {
  title: '4 Day Work Week Jobs for Software Engineers',
  description: 'Find 4-day work week jobs and companies offering flexibility for a healthy work-life balance. Discover the perfect job for you.',
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="text-3xl font-bold mb-4">
      Find Remote Developer Jobs with a 4 day work week
    </h1>

    <div class="prose max-w-[70ch]">
      <p class="mb-6">
        Looking for 4-day work week jobs? Our job board offers a comprehensive list of companies across various industries, including tech, that offer flexibility to maintain a healthy work-life relationship. Browse our selection of 4-day work week tech jobs that cater to your interests and preferences.
      </p>
    </div>

    <JobList
      :title="`4-day work week developer jobs`"
      show-filters
      :predefined-filters="{
        benefits: ['4-day-work-week'],
      }"
    />
  </UContainer>
</template>
