<script setup lang="ts">
useSeoMeta({
  title: 'Remote Dev Jobs - Find tech, programming & full stack developer jobs',
  description: 'Explore top-quality remote software engineering jobs and web developer roles. Explore our listings and find your perfect software engineer remote job.',
  ogTitle: 'Remote Dev Jobs - Job Board to find software engineer, programming and full stack developer jobs',
  ogDescription: 'Remote Dev Jobs offers top-quality remote software engineering jobs, as well as junior developer and web developer roles. Explore our listings and find your perfect software engineer remote job today!.',
})

defineOgImageComponent('Default', {
  title: 'Remote Dev Jobs',
  description: 'Browse curated remote software development jobs from top companies worldwide.',
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="text-3xl font-bold mb-4">
      Browse and Filter through all our remote developer job posts
    </h1>

    <div class="prose max-w-[70ch]">
      <p class="mb-6">
        Explore hundreds of recent job posts across various industries and experience levels on our job board. Filter by location, tag, role, and experience level to find only the types of jobs you want.
      </p>
    </div>

    <JobList
      :title="`All Remote Developer Jobs`"
      show-filters
    />
  </UContainer>
</template>
