<script setup lang="ts">
const { data: posts } = await useAsyncData('blog', () => {
  return queryCollection('blog').order('datePublished', 'DESC').all()
})

useSeoMeta({
  title: 'Blog - RemoteDevJobs',
  description: 'Articles, tips, and resources for remote developers.',
})
</script>

<template>
  <div class="py-12">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Remote Work Blog
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Insights, guides, and news for the remote developer community.
      </p>
    </div>

    <div
      v-if="posts?.length"
      class="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
    >
      <NuxtLink
        v-for="post in posts"
        :key="post.path"
        :to="post.path"
        class="group block"
      >
        <UCard
          class="h-full hover:ring-2 hover:ring-primary-500 transition-all duration-200 flex flex-col"
          :ui="{ header: { padding: 'p-0 sm:p-0' }, body: { base: 'flex-1' } }"
        >
          <template #header>
            <div class="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
              <NuxtImg
                v-if="post.image"
                :src="post.image.src"
                :alt="post.image.alt"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                <UIcon
                  name="i-heroicons-document-text"
                  class="w-12 h-12"
                />
              </div>
            </div>
          </template>

          <div class="space-y-2 pt-2">
            <h2
              class="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors"
            >
              {{ post.title }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
              {{ post.description }}
            </p>
          </div>

          <template #footer>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>{{ new Date(post.dateModified ?? post.datePublished).toLocaleDateString() }}</span>
              <span class="flex items-center gap-1 text-primary-500 font-medium">
                Read more
                <UIcon
                  name="i-heroicons-arrow-right"
                  class="w-3 h-3"
                />
              </span>
            </div>
          </template>
        </UCard>
      </NuxtLink>
    </div>

    <div
      v-else
      class="text-center py-12"
    >
      <p class="text-gray-500">
        No blog posts found.
      </p>
    </div>
  </div>
</template>
