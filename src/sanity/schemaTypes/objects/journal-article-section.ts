import { defineArrayMember, defineField, defineType } from 'sanity'

const journalPortableText = [
  defineArrayMember({
    type: 'block',
    styles: [
      { title: 'Normal', value: 'normal' },
      { title: 'Subheading', value: 'h2' },
    ],
    lists: [],
    marks: {
      decorators: [
        { title: 'Strong', value: 'strong' },
        { title: 'Emphasis', value: 'em' },
      ],
      annotations: [
        defineField({
          name: 'link',
          title: 'Link',
          type: 'object',
          fields: [
            defineField({
              name: 'href',
              title: 'URL',
              type: 'url',
              validation: (rule) =>
                rule.required().uri({
                  allowRelative: true,
                  scheme: ['http', 'https', 'mailto'],
                }),
            }),
          ],
        }),
      ],
    },
  }),
]

export const journalArticleSection = defineType({
  name: 'journalArticleSection',
  title: 'Article section',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Margin label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: journalPortableText,
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'label' } },
})
