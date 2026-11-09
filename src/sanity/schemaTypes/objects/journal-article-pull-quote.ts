import { defineField, defineType } from 'sanity'

export const journalArticlePullQuote = defineType({
  name: 'journalArticlePullQuote',
  title: 'Pull quote',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'quote', subtitle: 'label' },
  },
})
