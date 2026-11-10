import { defineField, defineType } from 'sanity'

export const narrativeSection = defineType({
  name: 'narrativeSection',
  title: 'Narrative section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Copy',
      type: 'constrainedRichText',
      validation: (rule) => rule.required().min(1),
    }),
  ],
})
