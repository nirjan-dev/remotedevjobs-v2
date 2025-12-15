import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        datePublished: z.date(),
        dateModified: z.date().optional(),
        image: z.object({
          src: z.string(),
          alt: z.string(),
          width: z.number(),
          height: z.number(),
        }).optional(),
      }),
    }),
  },
})
