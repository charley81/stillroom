import { defineField, defineType } from 'sanity'
import { simplePortableText } from './simple-portable-text'

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
      type: 'array',
      of: simplePortableText,
      validation: (rule) => rule.required().min(1),
    }),
  ],
})
