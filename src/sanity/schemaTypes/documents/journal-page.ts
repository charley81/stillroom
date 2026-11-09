import { defineField, defineType } from 'sanity'

export const journalPage = defineType({
  name: 'journalPage',
  title: 'Journal',
  type: 'document',
  groups: [
    { name: 'introduction', title: 'Introduction', default: true },
    { name: 'featured', title: 'Featured Journal Article' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 3,
      group: 'introduction',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'introduction',
      title: 'Introduction',
      type: 'text',
      rows: 4,
      group: 'introduction',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'introductionArtwork',
      title: 'Introduction artwork',
      type: 'editorialImage',
      group: 'introduction',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featuredJournalArticle',
      title: 'Featured Journal Article',
      type: 'reference',
      to: [{ type: 'journalArticle' }],
      group: 'featured',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO overrides',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: { prepare: () => ({ title: 'Journal' }) },
})
