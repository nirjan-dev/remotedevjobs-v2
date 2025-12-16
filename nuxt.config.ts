// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/content',
    '@nuxtjs/seo',
    '@nuxt/scripts',
  ],
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

  scripts: {
    registry: {
      clarity: {
        id: 'gezr3qvknq',
      },
      googleAnalytics: {
        id: 'G-QY0M8DZKCN',
      },
    },
  },
  sitemap: {
    sources: [
      '/api/_sitemap-urls',
    ],
  },

})
