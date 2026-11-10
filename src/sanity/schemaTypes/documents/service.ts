import { defineField, defineType } from 'sanity'
import { uniqueTrimmedStrings } from '../validation'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortSummary',
      title: 'Short summary',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Editorial image',
      type: 'editorialImage',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'deliverables',
      title: 'Deliverables',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (rule) => [
        rule.required().min(1),
        rule.custom((value) => uniqueTrimmedStrings(value)),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'shortSummary', media: 'image.asset' },
  },
})
