import { defineArrayMember, defineField } from 'sanity'

export const simplePortableText = [
  defineArrayMember({
    type: 'block',
    styles: [{ title: 'Normal', value: 'normal' }],
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
