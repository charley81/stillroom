import { defineField, defineType } from 'sanity'
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

export const servicesPage = defineType({
  name: 'servicesPage',
  title: 'Services',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'services', title: 'Services' },
    { name: 'process', title: 'Process' },
    { name: 'hospitality', title: 'Hospitality' },
    { name: 'final', title: 'Final statement' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    { ...requiredText('heroHeading', 'Hero heading'), group: 'hero' },
    {
      ...requiredText('heroIntroduction', 'Hero introduction'),
      group: 'hero',
    },
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'editorialImage',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroCtaLabel',
      title: 'Hero call-to-action label',
      description: 'The destination is fixed to Contact.',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      group: 'services',
      of: [{ type: 'reference', to: [{ type: 'service' }] }],
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => exactCount(value, 4, 'Services')),
        rule.custom((value) => uniqueReferences(value)),
      ],
    }),
    {
      ...requiredText('processHeading', 'Process heading'),
      group: 'process',
    },
    defineField({
      name: 'processSteps',
      title: 'Process steps',
      type: 'array',
      group: 'process',
      of: [{ type: 'processStep' }],
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => exactCount(value, 4, 'Process steps')),
      ],
    }),
    {
      ...requiredText('hospitalityHeading', 'Hospitality heading'),
      group: 'hospitality',
    },
    defineField({
      name: 'hospitalitySectorLabels',
      title: 'Hospitality sector labels',
      type: 'array',
      group: 'hospitality',
      of: [{ type: 'string' }],
      validation: (rule) => [
        rule.required().min(1),
        rule.custom((value) => uniqueTrimmedStrings(value)),
      ],
    }),
    {
      ...requiredText('hospitalityPointOfView', 'Hospitality point of view'),
      group: 'hospitality',
    },
    defineField({
      name: 'hospitalityImage',
      title: 'Hospitality image',
      type: 'editorialImage',
      group: 'hospitality',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hospitalityCtaLabel',
      title: 'Hospitality link label',
      description: 'The destination is fixed to Work.',
      type: 'string',
      group: 'hospitality',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'finalStatementEyebrow',
      title: 'Final statement eyebrow',
      type: 'string',
      group: 'final',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('finalStatementHeading', 'Final statement heading'),
      group: 'final',
    },
    defineField({
      name: 'seo',
      title: 'SEO overrides',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Services' }
    },
  },
})
