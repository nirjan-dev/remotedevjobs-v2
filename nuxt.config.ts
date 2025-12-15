// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', // '@nuxtjs/seo',
    // '@nuxt/scripts',
    '@nuxt/content', '@nuxtjs/seo'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'RemoteDevJobs',
  },

  content: {
    experimental: { nativeSqlite: true },
  },
  compatibilityDate: '2025-07-15',
  eslint: {
    config: {
      stylistic: true,
    },
  },
  sitemap: {
    sources: [
      '/api/_sitemap-urls',
    ],
  },

  // scripts: {
  //   registry: {
  //     googleAnalytics: {
  //       id: process.env.NUXT_PUBLIC_GA_ID,
  //     },
  //   },
  // },

})
