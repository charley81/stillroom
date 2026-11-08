import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const editorialImage = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
})

const projectNarrative = z.object({
  heading: z.string(),
  copy: z.string(),
})

const projectGalleryBlock = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    image: editorialImage,
  }),
  z.object({
    type: z.literal('pair'),
    brandPanel: z.object({
      title: z.string(),
      statement: z.string(),
      label: z.string(),
    }),
    image: editorialImage,
  }),
])

const workProjects = defineCollection({
  loader: glob({ base: './src/content/work-projects', pattern: '**/*.json' }),
  schema: z.object({
    title: z.string(),
    sector: z.string(),
    summary: z.string(),
    services: z.array(z.string()),
    cardImage: z.string(),
    cardAlt: z.string(),
    order: z.number(),
    detailAvailable: z.boolean().default(true),
    tagline: z.string(),
    introduction: z.string(),
    heroArtwork: editorialImage,
    heroImage: editorialImage,
    challenge: projectNarrative,
    contribution: projectNarrative,
    galleryLabel: z.string(),
    gallery: z.array(projectGalleryBlock),
    outcome: projectNarrative,
  }),
})

const articleContentBlock = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heading'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('paragraph'),
    text: z.string(),
  }),
])

const articleBodyBlock = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('section'),
    label: z.string(),
    content: z.array(articleContentBlock),
  }),
  z.object({
    type: z.literal('pullQuote'),
    label: z.string().optional(),
    quote: z.string(),
  }),
  z.object({
    type: z.literal('image'),
    image: editorialImage,
  }),
])

const journalArticles = defineCollection({
  loader: glob({
    base: './src/content/journal-articles',
    pattern: '**/*.json',
  }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    readTime: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    heroImage: editorialImage,
    order: z.number(),
    featured: z.boolean().default(false),
    detailAvailable: z.boolean().default(true),
    author: z.string().default('Stillroom'),
    authorBio: z.string(),
    body: z.array(articleBodyBlock),
    relatedArticles: z.array(z.string()).length(2),
  }),
})

export const collections = { workProjects, journalArticles }
