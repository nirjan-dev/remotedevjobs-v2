<script setup lang="ts">
const colorMode = useColorMode()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const links = [
  { label: 'Jobs', to: '/jobs' },
  { label: 'Work from anywhere', to: '/jobs/worldwide' },
  { label: '4 day week', to: '/jobs/4-day-week' },
  { label: 'Blog', to: '/blog' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
    <UHeader>
      <template #title>
        <NuxtImg
          src="/assets/images/logo.svg"
          alt="Logo"
          class="h-5"
        />
      </template>

      <UNavigationMenu :items="links" />

      <template #right>
        <ClientOnly>
          <UButton
            :icon="colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
            variant="ghost"
            color="neutral"
            aria-label="Theme"
            @click="toggleColorMode"
          />
        </ClientOnly>
      </template>

      <template #body>
        <UNavigationMenu
          :items="links"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <!-- Main Content -->
    <main class="grow">
      <UContainer>
        <slot />
      </UContainer>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-12 bg-gray-50 dark:bg-gray-950 mt-12">
      <UContainer>
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-center md:text-left">
            <NuxtImg
              src="/assets/images/logo.svg"
              alt="Remote Jobs Logo"
              width="150"
              height="30"
              class="mx-auto mb-4 md:mx-0"
            />
            <p class="text-sm text-gray-500 max-w-xs">
              Curated remote jobs for developers, designers, and tech professionals.
            </p>
          </div>

          <div class="flex gap-6 text-sm text-gray-500">
            <NuxtLink
              to="/"
              class="hover:text-primary-500 transition-colors"
            >Jobs</NuxtLink>
            <NuxtLink
              to="/blog"
              class="hover:text-primary-500 transition-colors"
            >Blog</NuxtLink>

            <NuxtLink
              to="/jobs/worldwide"
              class="hover:text-primary-500 transition-colors"
            >Global Jobs</NuxtLink>

            <NuxtLink
              to="/jobs/4-day-week"
              class="hover:text-primary-500 transition-colors"
            >4-Day Week Jobs</NuxtLink>
          </div>
        </div>
        <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-400">
          &copy; {{ new Date().getFullYear() }} RemoteDevJobs. All rights reserved. Made with ❤️ by <a
            href="https://nirjan.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-500 hover:underline"
          >nirjan.dev</a>
        </div>
      </UContainer>
    </footer>
  </div>
</template>
