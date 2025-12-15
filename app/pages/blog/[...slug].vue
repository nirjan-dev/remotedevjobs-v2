<script setup lang="ts">
const route = useRoute()

const { data: post } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first()
})

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article not found',
    fatal: true,
  })
}

useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.description,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.description,
  ogImage: () => post.value?.image?.src,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="py-12 max-w-3xl mx-auto">
    <article v-if="post">
      <header class="text-center mb-12 space-y-4">
        <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {{ new Date(post.dateModified ?? post.datePublished).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          }) }}
        </div>

        <h1
          class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight"
        >
          {{ post.title }}
        </h1>

        <p class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
          {{ post.description }}
        </p>
      </header>

      <div
        v-if="post.image"
        class="mb-12 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 aspect-[16/9]"
      >
        <NuxtImg
          :src="post.image.src"
          :alt="post.image.alt"
          class="w-full h-full object-cover"
        />
      </div>

      <div class="prose dark:prose-invert prose-primary prose-lg max-w-none">
        <ContentRenderer :value="post" />
      </div>

      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <UButton
          to="/blog"
          icon="i-heroicons-arrow-left"
          variant="ghost"
          color="neutral"
        >
          Back to Blog
        </UButton>
      </div>
    </article>
  </div>
</template>
