import { defineArrayMember, defineField, defineType } from 'sanity'
import {
  exactCount,
  uniqueReferences,
  uniqueTrimmedStrings,
} from '../validation'

const requiredText = (name: string, title: string, rows = 3) =>
  defineField({
    name,
    title,
    type: 'text',
    rows,
    validation: (rule) => rule.required(),
  })

const referenceList = ({
  name,
  title,
  to,
  count,
  group,
}: {
  name: string
  title: string
  to: string
  count: number
  group: string
}) =>
  defineField({
    name,
    title,
    type: 'array',
    group,
    of: [defineArrayMember({ type: 'reference', to: [{ type: to }] })],
    validation: (rule) => [
      rule.required(),
      rule.custom((value) => exactCount(value, count, title)),
      rule.custom((value) => uniqueReferences(value)),
    ],
  })

export const homePage = defineType({
  name: 'homePage',
  title: 'Home',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'logos', title: 'Client Logos' },
    { name: 'work', title: 'Featured Work' },
    { name: 'services', title: 'Featured Services' },
    { name: 'sectors', title: 'Sector statement' },
    { name: 'studio', title: 'Studio introduction' },
    { name: 'pointOfView', title: 'Point of view' },
    { name: 'process', title: 'Process' },
    { name: 'journal', title: 'Journal preview' },
    { name: 'final', title: 'Final invitation' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    { ...requiredText('heroHeading', 'Hero heading', 2), group: 'hero' },
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'editorialImage',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroPrimaryCtaLabel',
      title: 'Primary button label',
      description: 'The destination is fixed to Contact.',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroSecondaryCtaLabel',
      title: 'Secondary button label',
      description: 'The destination is fixed to Work.',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    referenceList({
      name: 'clientLogos',
      title: 'Client Logos',
      to: 'clientLogo',
      count: 5,
      group: 'logos',
    }),
    {
      ...requiredText('featuredWorkHeading', 'Featured Work heading', 2),
      group: 'work',
      validation: (rule) => [
        rule.required(),
        rule.max(100).warning('Long headings may not fit the Work layout.'),
      ],
    },
    referenceList({
      name: 'featuredWorkProjects',
      title: 'Featured Work Projects',
      to: 'workProject',
      count: 2,
      group: 'work',
    }),
    defineField({
      name: 'featuredWorkCtaLabel',
      title: 'Featured Work link label',
      description: 'The destination is fixed to Work.',
      type: 'string',
      group: 'work',
      validation: (rule) => rule.required(),
    }),
    referenceList({
      name: 'featuredServices',
      title: 'Featured Services',
      to: 'service',
      count: 4,
      group: 'services',
    }),
    defineField({
      name: 'sectorLabels',
      title: 'Sector labels',
      description: 'Marketing copy displayed in the fixed sector statement.',
      type: 'array',
      group: 'sectors',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => exactCount(value, 4, 'Sector labels')),
        rule.custom((value) => uniqueTrimmedStrings(value)),
      ],
    }),
    { ...requiredText('studioHeading', 'Studio heading', 2), group: 'studio' },
    {
      ...requiredText('studioIntroduction', 'Studio introduction'),
      group: 'studio',
    },
    defineField({
      name: 'studioImage',
      title: 'Studio image',
      type: 'editorialImage',
      group: 'studio',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'studioCtaLabel',
      title: 'Studio link label',
      description: 'The destination is fixed to About.',
      type: 'string',
      group: 'studio',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('pointOfViewHeading', 'Point of view heading', 2),
      group: 'pointOfView',
    },
    {
      ...requiredText('pointOfViewCopy', 'Point of view copy'),
      group: 'pointOfView',
    },
    {
      ...requiredText('processHeading', 'Process heading', 2),
      group: 'process',
      validation: (rule) => [
        rule.required(),
        rule.max(100).warning('Long headings may not fit the process layout.'),
      ],
    },
    defineField({
      name: 'processSteps',
      title: 'Process steps',
      type: 'array',
      group: 'process',
      of: [defineArrayMember({ type: 'processStep' })],
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => exactCount(value, 4, 'Process steps')),
      ],
    }),
    defineField({
      name: 'processCtaLabel',
      title: 'Process link label',
      description: 'The destination is fixed to Services.',
      type: 'string',
      group: 'process',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('journalHeading', 'Journal heading', 2),
      group: 'journal',
      validation: (rule) => [
        rule.required(),
        rule.max(100).warning('Long headings may not fit the Journal layout.'),
      ],
    },
    referenceList({
      name: 'featuredJournalArticles',
      title: 'Featured Journal Articles',
      to: 'journalArticle',
      count: 3,
      group: 'journal',
    }),
    defineField({
      name: 'journalCtaLabel',
      title: 'Journal link label',
      description: 'The destination is fixed to Journal.',
      type: 'string',
      group: 'journal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'finalCtaEyebrow',
      title: 'Final invitation eyebrow',
      type: 'string',
      group: 'final',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('finalCtaHeading', 'Final invitation heading', 2),
      group: 'final',
    },
    defineField({
      name: 'finalCtaLabel',
      title: 'Final invitation button label',
      description: 'The destination is fixed to Contact.',
      type: 'string',
      group: 'final',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO overrides',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Home' }
    },
  },
})
