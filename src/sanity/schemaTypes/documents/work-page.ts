import { defineField, defineType } from 'sanity'
import { uniqueReferences } from '../validation'

const requiredText = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'text',
    rows: 3,
    validation: (rule) => rule.required(),
  })

export const workPage = defineType({
  name: 'workPage',
  title: 'Work',
  type: 'document',
  groups: [
    { name: 'intro', title: 'Introduction', default: true },
    { name: 'projects', title: 'Work Projects' },
    { name: 'final', title: 'Final invitation' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    { ...requiredText('heading', 'Heading'), group: 'intro' },
    defineField({
      name: 'heroArtwork',
      title: 'Hero artwork',
      type: 'editorialImage',
      group: 'intro',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'workProjects',
      title: 'Canonical Work Project order',
      description:
        'This order controls the Work listing and next-Work-Project journey.',
      type: 'array',
      group: 'projects',
      of: [{ type: 'reference', to: [{ type: 'workProject' }] }],
      validation: (rule) => [
        rule.required().min(1),
        rule.custom((value) => uniqueReferences(value)),
      ],
    }),
    defineField({
      name: 'finalCtaEyebrow',
      title: 'Final invitation eyebrow',
      type: 'string',
      group: 'final',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('finalCtaHeading', 'Final invitation heading'),
      group: 'final',
    },
    defineField({
      name: 'finalCtaLabel',
      title: 'Final invitation link label',
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
  preview: { prepare: () => ({ title: 'Work' }) },
})
