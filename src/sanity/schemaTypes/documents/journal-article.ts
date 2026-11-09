import { defineField, defineType } from 'sanity'
import { PublishedSlugInput } from '../locked-slug-input'
import {
  approvedJournalArticleBody,
  relatedJournalArticles,
} from '../validation'

export const journalArticle = defineType({
  name: 'journalArticle',
  title: 'Journal Article',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'body', title: 'Body' },
    { name: 'related', title: 'Related Journal Articles' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description:
        'Generated from the title. It becomes read-only after first publication.',
      type: 'slug',
      group: 'identity',
      options: { source: 'title', maxLength: 96 },
      components: { input: PublishedSlugInput },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Journal Category',
      type: 'reference',
      to: [{ type: 'journalCategory' }],
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publicationDate',
      title: 'Publication date',
      type: 'date',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'standfirst',
      title: 'Standfirst',
      type: 'text',
      rows: 3,
      group: 'identity',
      validation: (rule) => [
        rule.required(),
        rule.max(220).warning('Long standfirsts may not fit article cards.'),
      ],
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading-time label',
      description:
        'Enter the display label manually, for example “5 min read”.',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      description:
        'The same source image is cropped responsively for cards and the article page.',
      type: 'editorialImage',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      description:
        'Use approved article sections and pull quotes only. Body images and arbitrary blocks are not supported.',
      type: 'array',
      group: 'body',
      of: [
        { type: 'journalArticleSection' },
        { type: 'journalArticlePullQuote' },
      ],
      validation: (rule) => [
        rule.required().min(1),
        rule.custom((value) => approvedJournalArticleBody(value)),
      ],
    }),
    defineField({
      name: 'relatedJournalArticles',
      title: 'Related Journal Articles',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'journalArticle' }] }],
      validation: (rule) => [
        rule.required().length(2),
        rule.custom((value, context) =>
          relatedJournalArticles(value, context.document?._id),
        ),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO overrides',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category.title',
      publicationDate: 'publicationDate',
      media: 'heroImage.asset',
    },
    prepare({ title, category, publicationDate, media }) {
      return {
        title,
        subtitle: [category, publicationDate].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
